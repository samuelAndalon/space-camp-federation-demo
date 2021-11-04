import { ApolloLink, FetchResult, fromError, Observable, Operation } from 'apollo-link';
import {
  checkFetcher,
  createSignalIfSupported, fallbackHttpConfig,
  HttpOptions, parseAndCheckHttpResponse,
  selectHttpOptionsAndBody, serializeFetchParameter
} from 'apollo-link-http-common';
import { GraphQLRequestContext } from 'apollo-server-types';
import { CustomOperationBatcher } from './custom-operation-batcher';

export namespace CustomBatchHttpLink {
  export interface Options extends HttpOptions {
    /**
     * callback that passes the request context of request and should return the CustomOperationBatcher
     */
    getOperationBatcher: (requestContext: GraphQLRequestContext) => CustomOperationBatcher
  }
}

export class CustomBatchHttpLink extends ApolloLink {
  private batchHandler: (operations: Operation[]) => Observable<FetchResult[]>;
  private getOperationBatcher: (requestContext: GraphQLRequestContext) => CustomOperationBatcher

  constructor(fetchParams?: CustomBatchHttpLink.Options) {
    super();

    // use default global fetch if nothing is passed in
    const fetcher = fetchParams?.fetch ? fetchParams.fetch : fetch;

    let {
      includeExtensions,
      getOperationBatcher,
      ...requestOptions
    } = fetchParams || ({} as CustomBatchHttpLink.Options);

    // dev warnings to ensure fetch is present
    checkFetcher(fetcher);

    const linkConfig = {
      http: { includeExtensions },
      options: requestOptions.fetchOptions,
      credentials: requestOptions.credentials,
      headers: requestOptions.headers
    };

    this.getOperationBatcher = getOperationBatcher;
    this.batchHandler = (operations: Operation[]): Observable<FetchResult[]> => {
      const context = operations[0].getContext();
      const chosenURI = context.url;

      const clientAwarenessHeaders = new Map<string, any>();
      if (context.clientAwareness) {
        const { name, version } = context.clientAwareness;
        if (name) {
          clientAwarenessHeaders.set('apollographql-client-name', name);
        }
        if (version) {
          clientAwarenessHeaders.set('apollographql-client-version', version);
        }
      }

      const contextConfig = {
        http: context.http,
        options: context.fetchOptions,
        credentials: context.credentials,
        headers: { ...clientAwarenessHeaders, ...context.headers },
      };

      //uses fallback, link, and then context to build options
      const optsAndBody = operations.map(operation =>
        selectHttpOptionsAndBody(
          operation,
          fallbackHttpConfig,
          linkConfig,
          contextConfig,
        ),
      );

      const loadedBody = optsAndBody.map(({ body }) => body);
      const options = optsAndBody[0].options;

      // There's no spec for using GET with batches.
      if (options.method === 'GET') {
        return fromError<FetchResult[]>(
          new Error('apollo-link-batch-http does not support GET requests'),
        );
      }

      if (!chosenURI) {
        return fromError<FetchResult[]>(
          new Error('apollo-link-batch-http needs a URL'),
        );
      }

      try {
        (options as any).body = serializeFetchParameter(loadedBody, 'Payload');
      } catch (parseError) {
        return fromError<FetchResult[]>(parseError);
      }

      let controller;
      if (!(options as any).signal) {
        const { controller: _controller, signal } = createSignalIfSupported();
        controller = _controller;
        if (controller) (options as any).signal = signal;
      }

      return new Observable<FetchResult[]>(observer => {
        fetcher(chosenURI, options)
          .then(response => {
            operations.forEach(operation => operation.setContext({ response }));
            return response;
          })
          .then(parseAndCheckHttpResponse(operations))
          .then(result => {
            observer.next(result);
            observer.complete();
            return result;
          })
          .catch(err => {
            if (err.name === 'AbortError') return;
            if (err.result && err.result.errors && err.result.data) {
              observer.next(err.result);
            }

            observer.error(err);
          });

        return () => {
          // XXX support canceling this request
          // https://developers.google.com/web/updates/2017/09/abortable-fetch
          if (controller) controller.abort();
        };
      });
    };
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    const operationBatcher = this.getOperationBatcher(operation.getContext().operationContext);
    if(!operationBatcher) {
      return null;
    }
    return operationBatcher.enqueue({ operation }, this.batchHandler);
  }
}
import { ApolloLink, FetchResult, fromError, Observable, Operation } from 'apollo-link';
import {
  Body, checkFetcher,
  fallbackHttpConfig,
  HttpConfig, HttpOptions, parseAndCheckHttpResponse,
  selectHttpOptionsAndBody, serializeFetchParameter
} from 'apollo-link-http-common';
import { GraphQLRequestContext } from 'apollo-server-types';
import { CustomOperationBatcher } from './custom-operation-batcher';

export namespace CustomBatchHttpLink {
  export interface Options extends HttpOptions {
    /**
     * name of the service used to create this batchHttpLink
     */
    serviceName: string;
    /**
     * callback that passes the request context of request and should return the CustomOperationBatcher
     */
    getOperationBatcher: (requestContext: GraphQLRequestContext) => CustomOperationBatcher
  }
}

export class CustomBatchHttpLink extends ApolloLink {
  private serviceName: string;
  private batchHandler: (operations: Operation[]) => Observable<FetchResult[]>;
  private getOperationBatcher: (requestContext: GraphQLRequestContext) => CustomOperationBatcher

  constructor(fetchParams: CustomBatchHttpLink.Options) {
    super();

    // use default global fetch if nothing is passed in
    const fetcher = fetchParams?.fetch ? fetchParams.fetch : fetch;

    let {
      serviceName,
      uri,
      includeExtensions,
      getOperationBatcher,
      ...requestOptions
    } = fetchParams;

    // dev warnings to ensure fetch is present
    checkFetcher(fetcher);

    this.serviceName = serviceName;
    this.getOperationBatcher = getOperationBatcher;
    this.batchHandler = (operations: Operation[]): Observable<FetchResult[]> => {
      const context = operations[0].getContext();
      const chosenURI = uri || context.url;

      const linkConfig = {
        http: { includeExtensions },
        options: requestOptions.fetchOptions,
        credentials: requestOptions.credentials,
        headers: requestOptions.headers
      };

      const contextConfig = {
        http: context.http,
        options: context.fetchOptions,
        credentials: context.credentials,
        headers: { ...context.headers },
      };

      const optionsAndBody: {
        options: HttpConfig & Record<string, any>,
        body: Body
       }[] = operations.map((operation: Operation) =>
        selectHttpOptionsAndBody(operation, fallbackHttpConfig, linkConfig, contextConfig),
      );

      const loadedBody: Body[] = optionsAndBody.map(({ body }) => body);
      const options: HttpConfig & Record<string, any> = optionsAndBody[0].options;

      if (!chosenURI) {
        return fromError<FetchResult[]>(
          new Error('apollo-link-batch-http needs a URL'),
        );
      }

      try {
        options.body = serializeFetchParameter(loadedBody, 'Payload');
      } catch (parseError) {
        return fromError<FetchResult[]>(parseError);
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
      });
    };
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    const operationBatcher = this.getOperationBatcher(operation.getContext().operationContext);
    if(!operationBatcher) {
      return null;
    }
    return operationBatcher.enqueue(
      { 
        operation,
        serviceName: this.serviceName
      }, 
      this.batchHandler
    );
  }
}
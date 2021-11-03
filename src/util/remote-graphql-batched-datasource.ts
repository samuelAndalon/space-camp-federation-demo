import { GraphQLDataSourceProcessOptions, RemoteGraphQLDataSource, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSourceRequestKind } from '@apollo/gateway/dist/datasources/types';
import { ApolloLink } from 'apollo-link';
import { GraphQLResponse, GraphQLRequestContext } from 'apollo-server-types';
import { CustomBatchHttpLink } from './custom-apollo-link-batch';
import { HttpContext } from './http-context';
import { execute, makePromise, GraphQLRequest } from 'apollo-link';
import { parse } from 'graphql';
import { BatchableRequest } from 'apollo-link-batch';
import { HttpOptions } from 'apollo-link-http-common';
import fetch from 'cross-fetch';

export class RemoteGraphQLBatchedDataSource extends RemoteGraphQLDataSource<HttpContext> {

  link: ApolloLink;

  constructor(
    getQueue: (requestContext: GraphQLRequestContext) => BatchableRequest[],
    serviceEndpointDefinition: ServiceEndpointDefinition,
    links: ApolloLink[]
  ) {
    super(serviceEndpointDefinition);
    this.link = ApolloLink.from([
      ...links, 
      new CustomBatchHttpLink({
        getQueue,
        fetch
      })
    ]);
  }

  async process(
    options: GraphQLDataSourceProcessOptions<HttpContext>
  ): Promise<GraphQLResponse> {
    if (options.kind === GraphQLDataSourceRequestKind.INCOMING_OPERATION) {
      // console.log(`gateway query planner request: ${JSON.stringify(options.request, null, 2)}`);
      const request = options.request;
      const query = request.query;

      if (!query) {
        return Promise.resolve({});
      }

      const context: Record<string, any> & HttpOptions = {
        operationContext: options.incomingRequestContext,
        url: this.url,
        headers: request?.http?.headers,
        fetchOptions: {
          method: request?.http?.method || 'POST'
        }
      };

      const operation: GraphQLRequest = {
        context,
        extensions: request.extensions,
        operationName: request.operationName,
        query: parse(query),
        variables: request.variables
      };

      return makePromise(execute(this.link, operation));
    } else {
      return super.process(options);
    }
  }
}
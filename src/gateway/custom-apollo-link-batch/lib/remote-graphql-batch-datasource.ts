import { GraphQLDataSourceProcessOptions, RemoteGraphQLDataSource, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSourceRequestKind } from '@apollo/gateway/dist/datasources/types';
import { ApolloLink, execute, GraphQLRequest, makePromise } from 'apollo-link';
import { HttpOptions } from 'apollo-link-http-common';
import { GraphQLResponse } from 'apollo-server-types';
import { parse } from 'graphql';
import { HttpContext } from './http-context';

export class RemoteGraphQLBatchDataSource extends RemoteGraphQLDataSource<HttpContext> {

  private readonly link: ApolloLink;

  constructor(
    serviceEndpointDefinition: ServiceEndpointDefinition,
    links: ApolloLink[]
  ) {
    super(serviceEndpointDefinition);
    this.link = ApolloLink.from(links);
  }

  async process(
    options: GraphQLDataSourceProcessOptions<HttpContext>
  ): Promise<GraphQLResponse> {
    if (options.kind === GraphQLDataSourceRequestKind.INCOMING_OPERATION) {
      //console.log(`Query planner request: ${JSON.stringify(options.request, null, 2)}`);
      const request = options.request;
      const query = request.query;

      if (!query) {
        return Promise.resolve({});
      }

      const context: Record<string, any> & HttpOptions = {
        url: this.url,
        headers: request?.http?.headers,
        fetchOptions: {
          method: request?.http?.method || 'POST'
        },
        operationContext: options.incomingRequestContext
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
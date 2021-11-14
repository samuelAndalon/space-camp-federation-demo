import { RemoteGraphQLDataSource, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSourceProcessOptions, GraphQLDataSourceRequestKind } from '@apollo/gateway/dist/datasources/types';
import { GraphQLResponse } from 'apollo-server-types';
import { HttpContext } from './http-context';

export class RemoteGraphQLDataSourceDecorator extends RemoteGraphQLDataSource<HttpContext> {

  constructor(serviceEndpointDefinition: ServiceEndpointDefinition) {
    super(serviceEndpointDefinition);
  }

  async process(options: GraphQLDataSourceProcessOptions<HttpContext>): Promise<GraphQLResponse> {
    if (options.kind === GraphQLDataSourceRequestKind.INCOMING_OPERATION) {
      console.log(`request from query planner: ${JSON.stringify(options.request, null, 2)}`);
      return super.process(options);
    }
    return super.process(options);
  }
}
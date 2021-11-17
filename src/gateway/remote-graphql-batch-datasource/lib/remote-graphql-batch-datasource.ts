import { RemoteGraphQLDataSource, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSourceProcessOptions, GraphQLDataSourceRequestKind } from '@apollo/gateway/dist/datasources/types';
import { GraphQLResponse } from 'apollo-server-types';
import { HttpContext } from './http-context';

export class RemoteGraphQLDataSourceDecorator extends RemoteGraphQLDataSource<HttpContext> {

  private serviceEndpointDefinition: ServiceEndpointDefinition;

  constructor(serviceEndpointDefinition: ServiceEndpointDefinition) {
    super(serviceEndpointDefinition);
    this.serviceEndpointDefinition = serviceEndpointDefinition;
  }

  async process(options: GraphQLDataSourceProcessOptions<HttpContext>): Promise<GraphQLResponse> {
    if (options.kind === GraphQLDataSourceRequestKind.INCOMING_OPERATION) {
      // console.log(`request from query planner to service ${this.serviceEndpointDefinition.name}: ${JSON.stringify(options.request)}`);
      const request = options.context.graphQLOperationsBatcher.enqueue(
        this.serviceEndpointDefinition,
        options
      );
      return request.deferred.promise;
    }
    return super.process(options);
  }
}
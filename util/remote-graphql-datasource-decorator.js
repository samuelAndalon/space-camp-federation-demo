const { RemoteGraphQLDataSource } = require("@apollo/gateway");
const { GraphQLDataSourceRequestKind } = require('@apollo/gateway/dist/datasources/types');

module.exports = class RemoteGraphQLDataSourceDecorator extends RemoteGraphQLDataSource {

  constructor(serviceEndpointDefinition) {
    super(serviceEndpointDefinition);
    this.serviceEndpointDefinition = serviceEndpointDefinition;
  }

  async process(options) {
    if (options.kind === GraphQLDataSourceRequestKind.INCOMING_OPERATION) {
      console.log(`request from gateway: ${JSON.stringify(options.request, null, 2)}`);
      const request = options.context.graphQLOperationsQueue.enqueue(
        this.serviceEndpointDefinition,
        options
      );
      return request.deferred.promise;
    }
    return super.process(options);
  }
}
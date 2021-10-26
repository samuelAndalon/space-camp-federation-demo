const { RemoteGraphQLDataSource } = require("@apollo/gateway");
const { GraphQLDataSourceRequestKind } = require('@apollo/gateway/dist/datasources/types');

module.exports = class RemoteGraphQLDataSourceDecorator extends RemoteGraphQLDataSource {
  async process(options) {
    if (options.kind === GraphQLDataSourceRequestKind.LOADING_SCHEMA) {
      return super.process(options);
    } else {
      console.log(`request from gateway: ${JSON.stringify(options.request, null, 2)}`);
      const request = options.context.graphQLOperationsQueue.enqueue(
        options, 
        (options) => super.process(options) 
      );
      return request.deferred.promise;
    }
  }
}
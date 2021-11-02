const queueMicrotask = require('queue-microtask');
const Deferred = require('./deferred');
const RemoteGraphQLBatchedDataSource = require('./remote-graphql-batched-datasource');

module.exports = class GraphQLOperationsQueue {
  constructor() {
    this.queue = [];
    this.remoteGraphQLBatchedDataSource = new RemoteGraphQLBatchedDataSource();
  }

  enqueue(serviceEndpointDefinition, options) {
    const operation = {
      serviceEndpointDefinition,
      options,
      deferred: new Deferred(),
    }
    this.queue.push(operation);
  
    if (this.queue.length === 1) {
      queueMicrotask(async () => {
        console.log(`queue length: ${this.queue.length}`);

        // Should i reduce by 
        // operation.serviceEndpointDefinition.{name,url} or 
        // operation.options.incomingRequestContext.queryHash
        //
        // theorically the query planner is the one that decides how to resolve data
        // so we need to keep in mind that RemoteGraphQLDataSourceDecorator is created by graphQL services
        // so when a RemoteGraphQLDataSourceDecorator instance enqueues its already know that that query can be served
        // from that graphQL service, otherwise it would not be enqueued from there.

        const operationsByEndpointDefinition = this.queue.reduce((acc, operation) => {
          if (!acc.hasOwnProperty(operation.serviceEndpointDefinition.name)) {
            acc[operation.serviceEndpointDefinition.name] = [];
          }
          acc[operation.serviceEndpointDefinition.name].push(operation);
          return acc;
        }, {});

        this.queue.length = 0;
  
        console.log(
          `dispatch requestsQueue, and resolve promises: ${JSON.stringify(Object.keys(operationsByEndpointDefinition).map((key) => [`key: ${key}`, `# operations: ${operationsByEndpointDefinition[key].length}`]), null, 2)}`
        );

        for(const serviceName in operationsByEndpointDefinition) {
          //for (const operation of operationsByEndpointDefinition[serviceName]) {
          //  const result = await operation.process(operation.options);
          //  operation.deferred.resolve(result);
          //}
          if (operationsByEndpointDefinition[serviceName].length > 0) {
            const batchedOperationsResult = await this.remoteGraphQLBatchedDataSource.process(
              operationsByEndpointDefinition[serviceName][0].serviceEndpointDefinition,
              operationsByEndpointDefinition[serviceName].map((operation) => operation.options)
            );
            operationsByEndpointDefinition[serviceName].forEach((operation, index) => {
              operation.deferred.resolve(batchedOperationsResult[index]);
            });
          }
        }
      });
    }
    return operation;
  }
}
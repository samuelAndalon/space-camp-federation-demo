import { GraphQLDataSourceProcessOptions, ServiceEndpointDefinition } from '@apollo/gateway';
import { Deferred } from './deferred';
import { RemoteGraphQLBatchedDataSource } from './remote-graphql-batched-datasource';
import { GraphQLResponse } from 'apollo-server-types';
import queueMicrotask from 'queue-microtask';

interface OperationsByServiceName {
  [serviceDefinitionName: string]: OperationQueueElement[]
}

export interface OperationQueueElement {
  serviceEndpointDefinition: ServiceEndpointDefinition,
  options: GraphQLDataSourceProcessOptions,
  deferred: Deferred<GraphQLResponse>
}

export class GraphQLOperationsQueue {

  queue: OperationQueueElement[];
  remoteGraphQLBatchedDataSource: RemoteGraphQLBatchedDataSource;

  constructor() {
    this.queue = [];
    this.remoteGraphQLBatchedDataSource = new RemoteGraphQLBatchedDataSource();
  }

  enqueue(
    serviceEndpointDefinition: ServiceEndpointDefinition, 
    options: GraphQLDataSourceProcessOptions
  ): OperationQueueElement {
    const operation: OperationQueueElement = {
      serviceEndpointDefinition,
      options,
      deferred: new Deferred<GraphQLResponse>(),
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

        const operationsByEndpointDefinition: OperationsByServiceName = this.queue.reduce(
          (acc: OperationsByServiceName, operation: OperationQueueElement) => {
            if (!acc.hasOwnProperty(operation.serviceEndpointDefinition.name)) {
              acc[operation.serviceEndpointDefinition.name] = [];
            }
            acc[operation.serviceEndpointDefinition.name].push(operation);
            return acc;
          }, 
          {} as OperationsByServiceName
        );

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
            const batchedOperationsResult: GraphQLResponse[] = await this.remoteGraphQLBatchedDataSource.process(
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
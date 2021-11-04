import { GraphQLDataSourceProcessOptions, ServiceEndpointDefinition } from '@apollo/gateway';
import { Deferred } from './deferred';
import { GraphQLResponse } from 'apollo-server-types';
import queueMicrotask from 'queue-microtask';
import { HttpContext } from './http-context';
import { GraphQLOperationBatchHandler } from './graphql-operation-batch-handler';

export interface BatcheableOperation {
  serviceEndpointDefinition: ServiceEndpointDefinition,
  options: GraphQLDataSourceProcessOptions<HttpContext>,
  deferred: Deferred<GraphQLResponse>
}

export class GraphQLOperationsBatcher {

  queue: BatcheableOperation[] = [];
  graphqlOperationBatchHandler: GraphQLOperationBatchHandler = new GraphQLOperationBatchHandler();

  public enqueue(
    serviceEndpointDefinition: ServiceEndpointDefinition, 
    options: GraphQLDataSourceProcessOptions<HttpContext>
  ): BatcheableOperation {
    const operation: BatcheableOperation = {
      serviceEndpointDefinition,
      options,
      deferred: new Deferred<GraphQLResponse>(),
    }
    this.queue.push(operation);
  
    if (this.queue.length === 1) {
      queueMicrotask(async () => {
        await this.consumeQueue();
      });
    }
    return operation;
  }

  public async consumeQueue() {
    console.log(`queue length: ${this.queue.length}`);

    // theorically the query planner is the one that decides how to resolve data
    // so we need to keep in mind that RemoteGraphQLDataSource is created by graphQL services
    // so when a RemoteGraphQLDataSourceDecorator instance enqueues its already know that that query can be served
    // from that graphQL service, otherwise it would not be enqueued from there.
    const associatedRequests: Map<string, BatcheableOperation[]> = this.queue.reduce(
      (acc: Map<string, BatcheableOperation[]>, operation: BatcheableOperation) => {
        if (!acc.has(operation.serviceEndpointDefinition.name)) {
          acc.set(operation.serviceEndpointDefinition.name, []);
        }
        acc.get(operation.serviceEndpointDefinition.name)?.push(operation);
        return acc;
      }, 
      new Map<string, BatcheableOperation[]>()
    );

    this.queue.length = 0;

    console.log('dispatching requestsQueue');
    Array.from(associatedRequests.entries()).forEach(entry => console.log(`key: ${entry[0]}, # operations: ${entry[1].length}`));

    /*
    // Can improve this to resolve batches concurrently instead of sequentially.
    for(const [serviceName, operations] of associatedRequests) {
      const batchedOperationsResult: GraphQLResponse[] = await this.graphqlOperationBatchHandler.handle(
        operations[0].serviceEndpointDefinition,
        operations.map((operation) => operation.options)
      );
      operations.forEach((operation, index) => {
        operation.deferred.resolve(batchedOperationsResult[index]);
      });
    }
    */

    let promises: Promise<GraphQLResponse[]>[] = [];

    for (const [serviceName, operations] of associatedRequests) {
      promises = [
        ...promises, 
        this.graphqlOperationBatchHandler.handle(
          operations[0].serviceEndpointDefinition,
          operations.map((operation) => operation.options)
        )
      ];
    }

    const operations = ([] as BatcheableOperation[]).concat(...Array.from(associatedRequests.values()));
    const responses = ([] as GraphQLResponse[]).concat(...await Promise.all(promises));

    operations.forEach((operation: BatcheableOperation, index: number) => {
      operation.deferred.resolve(responses[index]);
    });
  }
}
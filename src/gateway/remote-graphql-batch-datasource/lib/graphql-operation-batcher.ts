import { GraphQLDataSourceProcessOptions, ServiceEndpointDefinition } from '@apollo/gateway';
import { Deferred } from './deferred';
import { GraphQLResponse } from 'apollo-server-types';
import queueMicrotask from 'queue-microtask';
import { HttpContext } from './http-context';
import { GraphQLOperationBatchHandler } from './graphql-operation-batch-handler';

export interface BatcheableOperation {
  options: GraphQLDataSourceProcessOptions<HttpContext>,
  deferred: Deferred<GraphQLResponse>
}

export class GraphQLOperationsBatcher {

  batcheableOperationsQueue: Map<string, BatcheableOperation[]> = new Map();
  graphqlOperationBatchHandler: GraphQLOperationBatchHandler = new GraphQLOperationBatchHandler();

  public enqueue(
    serviceEndpointDefinition: ServiceEndpointDefinition, 
    options: GraphQLDataSourceProcessOptions<HttpContext>
  ): BatcheableOperation {
    const operation: BatcheableOperation = {
      options,
      deferred: new Deferred<GraphQLResponse>(),
    }

    if (!this.batcheableOperationsQueue.has(serviceEndpointDefinition.name)) {
      this.batcheableOperationsQueue.set(serviceEndpointDefinition.name, []);
    }
    this.batcheableOperationsQueue.get(serviceEndpointDefinition.name)?.push(operation);
  
    // setup microtask only after we add the first request for a particular service into the queue
    // this will execute the callback when no callbacks are left in the global execution context
    // and before executing the callback queue
    if (this.batcheableOperationsQueue.get(serviceEndpointDefinition.name)?.length === 1) {
      queueMicrotask(async () => {
        await this.consumeQueue(serviceEndpointDefinition);
      });
    }
    return operation;
  }

  public async consumeQueue(serviceEndpointDefinition: ServiceEndpointDefinition) {

    const operations: BatcheableOperation[] | undefined = 
      this.batcheableOperationsQueue.has(serviceEndpointDefinition.name) ? 
        this.batcheableOperationsQueue.get(serviceEndpointDefinition.name) : 
        [];

    if (!operations) {
      return;
    }

    this.batcheableOperationsQueue.set(serviceEndpointDefinition.name, []);

    console.log(`dispatching queue of service ${serviceEndpointDefinition.name} with ${operations.length} operations`);

    const responses: GraphQLResponse[] = await this.graphqlOperationBatchHandler.handle(
      serviceEndpointDefinition,
      operations.map((operation) => operation.options)
    )

    operations.forEach((operation: BatcheableOperation, index: number) => {
      operation.deferred.resolve(responses[index]);
    });
  }
}
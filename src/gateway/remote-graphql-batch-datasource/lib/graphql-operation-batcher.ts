import { GraphQLDataSourceProcessOptions, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSourceRequestKind } from '@apollo/gateway/dist/datasources/types';
import { Deferred } from './deferred';
import { GraphQLResponse } from 'apollo-server-types';
import queueMicrotask from 'queue-microtask';
import { HttpContext } from './http-context';
import { GraphQLBatchHttpClient } from './graphql-batch-http-client';

export interface BatcheableOperation {
  options: GraphQLDataSourceProcessOptions<HttpContext>,
  deferred: Deferred<GraphQLResponse>
}

export class GraphQLOperationsBatcher {

  operationsRegistry: Map<string, BatcheableOperation[]> = new Map();
  graphqlBatchHttpClient: GraphQLBatchHttpClient = new GraphQLBatchHttpClient();

  public enqueue(
    serviceEndpointDefinition: ServiceEndpointDefinition, 
    options: GraphQLDataSourceProcessOptions<HttpContext>
  ): BatcheableOperation {
    const operation: BatcheableOperation = {
      options,
      deferred: new Deferred<GraphQLResponse>(),
    }

    if (!this.operationsRegistry.has(serviceEndpointDefinition.name)) {
      this.operationsRegistry.set(serviceEndpointDefinition.name, []);
    }
    this.operationsRegistry.get(serviceEndpointDefinition.name)?.push(operation);
  
    // setup microtask only after we add the first request for a particular service into the queue
    // this will execute the callback when no callbacks are left in the global execution context
    // and before executing the callback queue
    if (this.operationsRegistry.get(serviceEndpointDefinition.name)?.length === 1) {
      queueMicrotask(async () => {
        await this.consumeQueue(serviceEndpointDefinition);
      });
    }
    return operation;
  }

  public async consumeQueue(serviceEndpointDefinition: ServiceEndpointDefinition) {

    const operations: BatcheableOperation[] | undefined = 
      this.operationsRegistry.has(serviceEndpointDefinition.name) ? 
        this.operationsRegistry.get(serviceEndpointDefinition.name) : 
        [];

    if (!operations) {
      return;
    }

    this.operationsRegistry.set(serviceEndpointDefinition.name, []);

    //console.log(`dispatching queue of service ${serviceEndpointDefinition.name} with ${operations.length} operations`);

    if (operations[0].options.kind == GraphQLDataSourceRequestKind.INCOMING_OPERATION) {
      operations[0].options.incomingRequestContext.context.subgraphsRequestCount[serviceEndpointDefinition.name]++;
    }
    const responses: GraphQLResponse[] = await this.graphqlBatchHttpClient.sendBatchRequest(
      serviceEndpointDefinition,
      operations.map((operation) => operation.options)
    )

    operations.forEach((operation: BatcheableOperation, index: number) => {
      operation.deferred.resolve(responses[index]);
    });
  }
}
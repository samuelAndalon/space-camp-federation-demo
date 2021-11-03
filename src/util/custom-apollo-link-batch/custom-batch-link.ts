import { ServiceEndpointDefinition } from '@apollo/gateway';
import { ApolloLink, FetchResult, NextLink, Observable, Operation } from 'apollo-link';
import { BatchHandler, BatchableRequest } from 'apollo-link-batch';
import { CustomOperationBatcher } from './custom-batching';
import { GraphQLRequestContext } from 'apollo-server-types';

export namespace CustomBatchLink {
  export interface Options {
    /**
     * The handler that should execute a batch of operations.
     */
    batchHandler: BatchHandler;

     /**
     * callback that passes the request context of request and should return a queue
     */
    getQueue: (context: GraphQLRequestContext) => BatchableRequest[]
  }
}

export class CustomBatchLink extends ApolloLink {
  private getQueue: (context) => BatchableRequest[]
  private batcher: CustomOperationBatcher;

  constructor(fetchParams: CustomBatchLink.Options) {
    super();

    const {
      batchHandler, 
      getQueue
    } = fetchParams;

    this.getQueue = getQueue;
    this.batcher = new CustomOperationBatcher({
      batchHandler
    });
  }

  public request(
    operation: Operation,
    forward?: NextLink,
  ): Observable<FetchResult> | null {
    return this.batcher.enqueueRequest(
      { operation, forward },
      this.getQueue(operation.getContext().operationContext)
    );
  }
}
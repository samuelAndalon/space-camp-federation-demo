import { ApolloLink, FetchResult, NextLink, Observable, Operation } from 'apollo-link';
import { BatchHandler, BatchableRequest } from 'apollo-link-batch';
import { CustomOperationBatcher } from './custom-batching';

export namespace CustomBatchLink {
  export interface Options {
    /**
     * The handler that should execute a batch of operations.
     */
    batchHandler?: BatchHandler;

     /**
     * callback that passes the request context of request and should return a queue
     */
    getQueueCallback: (context: any) => BatchableRequest[]

    /**
     * creates the key for a batch
     */
    batchKey?: (operation: Operation) => string;
  }
}

export class CustomBatchLink extends ApolloLink {
  private getQueueCallback: (context) => BatchableRequest[]
  private batcher: CustomOperationBatcher;

  constructor(fetchParams: CustomBatchLink.Options) {
    super();

    const {
      batchHandler = () => null, 
      getQueueCallback,
      batchKey = (operation: Operation) => operation.getContext()?.serviceEndpointDefinition?.name || '',
    } = fetchParams;

    this.getQueueCallback = getQueueCallback;
    this.batcher = new CustomOperationBatcher({
      batchHandler,
      batchKey
    });
  }

  public request(
    operation: Operation,
    forward?: NextLink,
  ): Observable<FetchResult> | null {
    return this.batcher.enqueueRequest(
      {
        operation,
        forward
      },
      this.getQueueCallback(operation.getContext().requestContext)
    );
  }
}
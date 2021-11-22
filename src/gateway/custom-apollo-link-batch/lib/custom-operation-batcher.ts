import { FetchResult, Observable, Operation } from 'apollo-link';
import { BatchableRequest, BatchHandler } from './types';
import queueMicrotask from 'queue-microtask';

export class CustomOperationBatcher {
  private batcheableRequestsQueue: Map<string, BatchableRequest[]> = new Map();

  public enqueue(
    request: BatchableRequest, 
    batchHandler: BatchHandler
  ): Observable<FetchResult> {

    const requestCopy = {
      ...request,
    };

    requestCopy.observable = new Observable<FetchResult>(observer => {
      if (!this.batcheableRequestsQueue.has(request.serviceName)) {
        this.batcheableRequestsQueue.set(request.serviceName, []);
      }
      this.batcheableRequestsQueue.get(request.serviceName)?.push(requestCopy);

      requestCopy.next = observer.next.bind(observer);
      requestCopy.error = observer.error.bind(observer);
      requestCopy.complete = observer.complete.bind(observer);

      if (this.batcheableRequestsQueue.get(request.serviceName)?.length === 1) {
        queueMicrotask(() => {
          this.consumeQueue(request.serviceName, batchHandler);
        });
      }
    });

    return requestCopy.observable;
  }

  public consumeQueue(serviceName: string, batchHandler: BatchHandler) {
    const requests: BatchableRequest[] | undefined = this.batcheableRequestsQueue.get(serviceName);
    if (!requests) {
      return;
    }
    
    this.batcheableRequestsQueue.delete(serviceName);

    console.log(`dispatching queue of service ${serviceName} with ${requests.length} operations`);

    const operations: Operation[] = requests.map((request: BatchableRequest) => request.operation);
  
    const nexts: Array<(result: FetchResult) => void> = [];
    const errors: Array<(error: Error) => void> = [];
    const completes: Array<() => void> = [];

    requests.forEach((request: BatchableRequest) => {
      const { next, error, complete } = request;
      if (next) {
        nexts.push(next);
      }
      if (error) {
        errors.push(error);
      }
      if (complete) {
        completes.push(complete);
      }
    });
    
    const batchResultsObservable: Observable<FetchResult[]> = batchHandler(operations);

    const onError = e => {
      errors.forEach(error => {
        error(e)
      });
    };

    batchResultsObservable.subscribe({
      error: onError,
      next: (results: FetchResult[]) => {
        if (nexts.length !== results.length) {
          const error = new Error(
            `server returned results with length ${
              results.length
            }, expected length of ${nexts.length}`,
          );
          (error as any).result = results;
          return onError(error);
        }
        results.forEach((result, index) => {
          if (nexts[index]) {
            nexts[index](result);
          }
        });
      },
      complete: () => {
        completes.forEach(complete => {
          complete();
        });
      },
    });
  }
}
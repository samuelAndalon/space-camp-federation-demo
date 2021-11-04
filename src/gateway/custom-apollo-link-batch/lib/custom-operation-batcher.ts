import { FetchResult, Observable, Operation } from 'apollo-link';
import { BatchableRequest, BatchHandler } from 'apollo-link-batch';
import queueMicrotask from 'queue-microtask';

export class CustomOperationBatcher {
  private batchHandlers: Map<string, BatchHandler> = new Map();
  private batcheableRequestsQueue: BatchableRequest[] = [];

  private addBatchHandler(batchHandler: BatchHandler, name?: string) {
    if (name && !this.batchHandlers.has(name)) {
      this.batchHandlers.set(name, batchHandler);
    }
  }

  public enqueue(
    request: BatchableRequest, 
    batchHandler: BatchHandler
  ): Observable<FetchResult> {
    this.addBatchHandler(batchHandler, request.operation.getContext().url);

    const requestCopy = {
      ...request,
    };
    let queued = false;

    if (!requestCopy.observable) {
      requestCopy.observable = new Observable<FetchResult>(observer => {
        if (!queued) {
          this.batcheableRequestsQueue.push(requestCopy);
          queued = true;
        }

        //called for each subscriber, so need to save all listeners(next, error, complete)
        requestCopy.next = requestCopy.next || [];
        if (observer.next) requestCopy.next.push(observer.next.bind(observer));

        requestCopy.error = requestCopy.error || [];
        if (observer.error)
          requestCopy.error.push(observer.error.bind(observer));

        requestCopy.complete = requestCopy.complete || [];
        if (observer.complete)
          requestCopy.complete.push(observer.complete.bind(observer));

        if (this.batcheableRequestsQueue.length === 1) {
          queueMicrotask(() => {
            this.consumeQueue();
          });
        }
      });
    }

    return requestCopy.observable;
  }

  public consumeQueue() {
    if (!this.batcheableRequestsQueue) {
      return;
    }

    const associatedRequests: Map<string, BatchableRequest[]> = 
      this.batcheableRequestsQueue.reduce((accumulator: Map<string, BatchableRequest[]>, request: BatchableRequest) => {
        const key = request.operation.getContext().url;
        if (!accumulator.has(key)) {
          accumulator.set(key, []);
        }
        accumulator.get(key)?.push(request);
        return accumulator;
      }, new Map<string, BatchableRequest[]>());

    this.batcheableRequestsQueue.length = 0;

    console.log('dispatching requestsQueue');
    Array.from(associatedRequests.entries()).forEach(entry => console.log(`key: ${entry[0]}, # operations: ${entry[1].length}`));
    
    for (const [name, requests] of associatedRequests) {
      const operations: Operation[] = requests.map((request: BatchableRequest) => request.operation);
  
      const nexts: Array<(result: FetchResult) => void>[] = [];
      const errors: Array<(error: Error) => void>[] = [];
      const completes: Array<() => void>[] = [];

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
      
      const batchHandler: BatchHandler | undefined = this.batchHandlers.get(name);
      const batchResultsObservable = batchHandler?.(operations) || Observable.of();
  
      const onError = error => {
        //each callback list in batch
        errors.forEach(rejecters => {
          if (rejecters) {
            //each subscriber to request
            rejecters.forEach(e => e(error));
          }
        });
      };
  
      batchResultsObservable.subscribe({
        next: (results: FetchResult[]) => {
          if (!Array.isArray(results)) {
            results = [results];
          }
  
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
              nexts[index].forEach(next => next(result));
            }
          });
        },
        error: onError,
        complete: () => {
          completes.forEach(complete => {
            if (complete) {
              //each subscriber to request
              complete.forEach(c => c());
            }
          });
        },
      });
    }
  }
}
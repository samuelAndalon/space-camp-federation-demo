import { FetchResult, Observable, Operation } from 'apollo-link';

export class CustomOperationBatcher<TRequest, TResponse> {
  private queue: TRequest[]

  constructor() {
    this.queue = [];
  }

  public enqueue(request: TRequest): Observable<TResponse> {
    return Observable.of();
  }

}
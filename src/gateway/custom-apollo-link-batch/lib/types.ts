import { Observable, Operation, FetchResult } from 'apollo-link';

export type BatchHandler = (operations: Operation[]) => Observable<FetchResult[]>;

export interface BatchableRequest {
  operation: Operation;
  serviceName: string;
  observable?: Observable<FetchResult>;
  next?: (result: FetchResult) => void;
  error?: (error: Error) => void;
  complete?: () => void;
}
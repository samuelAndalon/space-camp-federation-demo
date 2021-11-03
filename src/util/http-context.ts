import { BatchableRequest } from 'apollo-link-batch';

export interface HttpContext {
  batcheableRequestsQueue: BatchableRequest[]
}
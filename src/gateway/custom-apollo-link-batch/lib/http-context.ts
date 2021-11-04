import { CustomOperationBatcher } from './custom-operation-batcher';

export interface HttpContext {
  operationBatcher: CustomOperationBatcher
}
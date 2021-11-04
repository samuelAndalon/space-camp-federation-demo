import { CustomOperationBatcher } from './custom-apollo-link-batch';

export interface HttpContext {
  operationBatcher: CustomOperationBatcher
}
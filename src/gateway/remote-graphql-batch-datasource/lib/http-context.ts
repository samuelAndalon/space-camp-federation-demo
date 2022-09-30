import { GraphQLOperationsBatcher } from "./graphql-operation-batcher";

export interface HttpContext {
  graphQLOperationsBatcher: GraphQLOperationsBatcher,
  subgraphsRequestCount: { [subgaphName: string]: number }
}
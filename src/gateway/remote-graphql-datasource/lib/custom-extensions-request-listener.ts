import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base';
import { GraphQLRequestContextWillSendResponse } from 'apollo-server-types';
import { HttpContext } from './http-context';

export class CustomExtensionServerPlugin implements ApolloServerPlugin<HttpContext> {
  async requestDidStart(): Promise<GraphQLRequestListener<HttpContext> | void> {
    return new CustomExtensionRequestListener();
  }
}

class CustomExtensionRequestListener implements GraphQLRequestListener<HttpContext> {
  [key: string]: any;

  public async willSendResponse(
    requestContext: GraphQLRequestContextWillSendResponse<HttpContext>
  ): Promise<void> {
    if (requestContext.request?.http?.headers?.get('apollo-query-plan-experimental') === '1') {
      requestContext.response.extensions = {
        ...requestContext.response.extensions,
        '__queryPlanExperimentalMermaid': (requestContext.context as any).queryPlan
      };
    }
    for (const subgraphName in (requestContext.context as any).subgraphsRequestCount) {
      requestContext.response.http?.headers.set(`__request_count_${subgraphName}`, (requestContext.context as any).subgraphsRequestCount[subgraphName])
    }
  }
}
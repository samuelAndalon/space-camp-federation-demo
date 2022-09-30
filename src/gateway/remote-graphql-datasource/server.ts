import { ApolloGateway, ServiceEndpointDefinition } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import { CustomExtensionServerPlugin, getQueryPlanDiagram, HttpContext, RemoteGraphQLDataSourceDecorator } from './lib';

const port = 8080;

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'astronauts', url: 'http://localhost:4001' },
    { name: 'missions', url: 'http://localhost:4002' }
  ],
  buildService: (definition: ServiceEndpointDefinition) => new RemoteGraphQLDataSourceDecorator(definition),
  experimental_didResolveQueryPlan: (options) => {
    if (
      options.requestContext.operationName !== 'IntrospectionQuery' &&
      options.requestContext.request?.http?.headers?.get('apollo-query-plan-experimental') === '1'
    ) {
      options.requestContext.context.queryPlan = getQueryPlanDiagram(options.queryPlan);
    }
  }
});

const server = new ApolloServer({
  gateway,
  plugins: [ ApolloServerPluginLandingPageGraphQLPlayground(), new CustomExtensionServerPlugin() ],
  context: (_: ExpressContext): HttpContext => ({
    subgraphsRequestCount: {
      astronauts: 0,
      missions: 0 
    }
  })
});

server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
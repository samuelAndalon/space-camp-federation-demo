import { ApolloGateway, ServiceEndpointDefinition } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import { GraphQLRequestContext } from 'apollo-server-types';
import { CustomBatchHttpLink, CustomOperationBatcher, getDefaultLinks, getServiceFetch, HttpContext } from './lib';
import { RemoteGraphQLBatchDataSource } from './lib/remote-graphql-batch-datasource';

const port = 4000; 

const gateway = new ApolloGateway({ 
  serviceList: [
    { name: 'astronauts', url: 'http://localhost:4001' }, 
    { name: 'missions', url: 'http://localhost:4002' }
  ],
  buildService: (definition: ServiceEndpointDefinition) => new RemoteGraphQLBatchDataSource(
    definition,
    [
      ...getDefaultLinks(definition),
      new CustomBatchHttpLink({
        getOperationBatcher: (requestContext: GraphQLRequestContext): CustomOperationBatcher => requestContext.context.operationBatcher,
        fetch: getServiceFetch(definition)
      })
    ]
  )
});

const server = new ApolloServer({
  gateway,
  context: (_: ExpressContext): HttpContext => ({
    operationBatcher: new CustomOperationBatcher()
  })
});

server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

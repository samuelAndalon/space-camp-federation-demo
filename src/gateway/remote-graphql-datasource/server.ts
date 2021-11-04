import { ApolloGateway, ServiceEndpointDefinition } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import { HttpContext, RemoteGraphQLDataSourceDecorator } from './lib';

const port = 4000; 

const gateway = new ApolloGateway({ 
  serviceList: [
    { name: 'astronauts', url: 'http://localhost:4001' }, 
    { name: 'missions', url: 'http://localhost:4002' }
  ],
  buildService: (definition: ServiceEndpointDefinition) => new RemoteGraphQLDataSourceDecorator(definition)
});

const server = new ApolloServer({
  gateway,
  context: (_: ExpressContext): HttpContext => ({})
});

server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

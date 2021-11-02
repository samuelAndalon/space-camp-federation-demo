import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import { GraphQLOperationsQueue, RemoteGraphQLDataSourceDecorator } from './util';

const port = 4000;

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'astronauts', url: 'http://localhost:4001' }, 
    { name: 'missions', url: 'http://localhost:4002' }
  ],
  buildService: (serviceEndpointDefinition) => new RemoteGraphQLDataSourceDecorator(serviceEndpointDefinition)
});

const server = new ApolloServer({
  gateway,
  context: ({ req }) => ({
    graphQLOperationsQueue: new GraphQLOperationsQueue()
  })
});

server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

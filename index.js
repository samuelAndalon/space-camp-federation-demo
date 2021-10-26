const { ApolloServer } = require('apollo-server');
const { ApolloGateway } = require('@apollo/gateway');
const RemoteGraphQLDataSourceDecorator = require('./util/remote-graphql-datasource-decorator');
const GraphQLOperationsQueue = require('./util/graphql-operations-queue');

const port = 4000;

const server = new ApolloServer({
  subscriptions: false,
  gateway: new ApolloGateway({
    serviceList: [
      { name: 'astronauts', url: 'http://localhost:4001' }, 
      { name: 'missions', url: 'http://localhost:4002' }
    ],
    buildService: (serviceEndpointDefinition) => new RemoteGraphQLDataSourceDecorator(serviceEndpointDefinition)
  }),
  context: ({ req }) => ({
    graphQLOperationsQueue: new GraphQLOperationsQueue()
  })
});

server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

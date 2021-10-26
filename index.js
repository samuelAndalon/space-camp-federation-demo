const { ApolloServer } = require('apollo-server');
const { ApolloGateway } = require('@apollo/gateway');
const RemoteGraphQLDataSourceDecorator = require('./util/remote-graphql-datasource-decorator');
const GraphQLOperationsQeue = require('./util/graphql-operations-queue');

const port = 4000;

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'astronauts', url: 'http://localhost:4001' }, 
    { name: 'missions', url: 'http://localhost:4002' }
  ],
  buildService: ({ name, url }) => new RemoteGraphQLDataSourceDecorator({ url })
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  context: ({ req }) => ({
    graphQLOperationsQueue: new GraphQLOperationsQeue()
  })
});

server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

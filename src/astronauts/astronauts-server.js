const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');
const AstronautsDataSource = require('./astronauts-datasource');

const port = 4001;
const astronautsDataSource = new AstronautsDataSource();

const typeDefs = gql`
  extend type Query {
    astronaut(id: ID!): Astronaut
    astronauts(ids: [ID!]): [Astronaut]
  }

  type Astronaut @key(fields: "id") {
    id: ID!
    name: String
  }
`;

const resolvers = {
  Query: {
    astronaut: (_, { id }, context) => astronautsDataSource.getAstronaut(id, context),
    astronauts: (_, { ids }, context) => astronautsDataSource.getAstronauts(ids, context)
  },
  Astronaut: {
    __resolveReference: (reference, context) => astronautsDataSource.getAstronaut(reference.id, context)
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  plugins: [ ApolloServerPluginLandingPageGraphQLPlayground() ],
  context: ({ req }) => {
    console.log(`Request into astronauts graphQL server: \n ${JSON.stringify(req.body, null, 2)}`);
    return {
      dataLoaderRegistry: {
        ...astronautsDataSource.getDataLoaders()
      }
    }
  }
});

server.listen({ port }).then(({ url }) => {
  console.log(`Astronauts graphQL service ready at ${url}`);
});

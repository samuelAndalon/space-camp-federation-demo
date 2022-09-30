const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
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
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  plugins: [ ApolloServerPluginLandingPageGraphQLPlayground() ],
  context: ({ req }) => {
    const query = JSON.stringify(req.body, null, 2)
    if (!query.includes('sdl')) {
      console.log(`Request into astronauts subgraph: \n ${query}`);
    }
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

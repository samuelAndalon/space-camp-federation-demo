const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const AstronautsService = require("./astronauts-service");
const DataLoader = require("dataloader");
const { ApolloServerPluginLandingPageGraphQLPlayground } = require("apollo-server-core");

const port = 4001;
const astronautsService = new AstronautsService();

const typeDefs = gql`
  type Astronaut @key(fields: "id") {
    id: ID!
    name: String
  }

  extend type Query {
    astronaut(id: ID!): Astronaut
    astronauts(ids: [ID!]): [Astronaut]
  }
`;

const resolvers = {
  Query: {
    astronaut: (_, { id }, context) => {
      return context.dataLoaderRegistry.astronautByIdDataLoader.load(id);
      // return astronautsService.getAstronaut(id)
    },
    astronauts: (_, { ids }) => {
      return astronautsService.getAstronauts(ids);
    }
  },
  Astronaut: {
    __resolveReference: (ref, context) => {
      return context.dataLoaderRegistry.astronautByIdDataLoader.load(ref.id);
      //return astronautsService.getAstronaut(ref.id);
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  plugins: [ ApolloServerPluginLandingPageGraphQLPlayground() ],
  context: ({ req }) => {
    console.log(`Request into astronauts graphQL server: \n ${JSON.stringify(req.body, null, 2)}`);
    return {
      dataLoaderRegistry: {
        astronautByIdDataLoader: new DataLoader(ids => astronautsService.getAstronautsByIds(ids))
      }
    }
  }
});

server.listen({ port }).then(({ url }) => {
  console.log(`Astronauts graphQL service ready at ${url}`);
});

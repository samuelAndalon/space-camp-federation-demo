const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const AstronautsService = require("./astronauts-service");

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
    astronaut: (_, { id }) => astronautsService.getAstronaut(id),
    astronauts: () => astronautsService.getAstronauts()
  },
  Astronaut: {
    __resolveReference: (ref, context) => {
      return context.loaders.astronautsDataLoader.load(ref.id);
      //return astronautsService.getAstronaut(ref.id);
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  context: ({ req }) => {
    // console.log(`Request into astronauts graphQL server: \n ${JSON.stringify(req.body, null, 2)}`);
    return {
      loaders: {
        astronautsDataLoader: astronautsService.getAstronautsDataLoader()
      }
    }
  }
});

server.listen({ port }).then(({ url }) => {
  console.log(`Astronauts graphQL service ready at ${url}`);
});

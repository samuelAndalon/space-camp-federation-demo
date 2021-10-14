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
    astronauts: [Astronaut]
  }
`;

const resolvers = {
  Astronaut: {
    __resolveReference(ref) {
      return astronautsService.getAstronaut(ref.id);
    }
  },
  Query: {
    astronaut(_, { id }) {
      return astronautsService.getAstronaut(id);
    },
    astronauts() {
      return astronautsService.getAstronauts();
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }])
});

server.listen({ port }).then(({ url }) => {
  console.log(`Astronauts graphQL service ready at ${url}`);
});

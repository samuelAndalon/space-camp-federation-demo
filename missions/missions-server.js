const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const MissionsService = require("./missions-service");

const port = 4002;
const missionsService = new MissionsService();

const typeDefs = gql`
  type Mission {
    id: ID!
    crew: [Astronaut]
    designation: String!
    startDate: String
    endDate: String
  }

  extend type Astronaut @key(fields: "id") {
    id: ID! @external
    missions: [Mission]
  }

  extend type Query {
    mission(id: ID!): Mission
    missions(ids: [ID!]): [Mission]
  }
`;

const resolvers = {
  Query: {
    mission: (_, { id }) => missionsService.getMission(id),
    missions: (_, { ids }) => missionsService.getMissions(ids ? ids : [])
  },
  Astronaut: {
    missions: (astronaut, _, context) => {
      return context.loaders.missionsDataLoader.load(astronaut.id);
      //return missionsService.getMissionsByAstronautId(astronaut.id)
    }
  },
  Mission: {
    crew: (mission) => mission.crew.map(id => ({ __typename: "Astronaut", id }))
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  context: ({ req }) => {
    console.log(`Request into missions graphQL server: \n ${JSON.stringify(req.body, null, 2)}`);
    return {
      loaders: {
        missionsDataLoader: missionsService.getMissionsDataLoader()
      }
    }
  }
});

server.listen({ port }).then(({ url }) => {
  console.log(`Missions graphQL service ready at ${url}`);
});

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
    missions: [Mission]
  }
`;

const resolvers = {
  Astronaut: {
    missions(astronaut) {
      return missionsService.getAstronautMissions(astronaut)
    }
  },
  Mission: {
    crew(mission) {
      return mission.crew.map(id => ({ __typename: "Astronaut", id }));
    }
  },
  Query: {
    mission(_, { id }) {
      return missionsService.getMission(id);
    },
    missions() {
      return missionsService.getMissions();
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }])
});

server.listen({ port }).then(({ url }) => {
  console.log(`Missions graphQL service ready at ${url}`);
});

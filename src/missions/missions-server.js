const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const MissionsDataSource = require("./missions-datasource");
const DataLoader = require("dataloader");
const { ApolloServerPluginLandingPageGraphQLPlayground } = require("apollo-server-core");

const port = 4002;
const missionsDataSource = new MissionsDataSource();

const typeDefs = gql`
  extend type Query {
    mission(id: ID!): Mission
    missions(ids: [ID!]): [Mission]
  }
  
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
`;

const resolvers = {
  Query: {
    mission: (_, { id }, context) => missionsDataSource.getMission(id, context),
    missions: (_, { ids }, context) => missionsDataSource.getMissions(ids, context)
  },
  Astronaut: {
    missions: (astronaut, _, context) => missionsDataSource.getMissionsByAstronaut(astronaut.id, context)
  },
  Mission: {
    crew: (mission) => mission.crew.map(id => ({ __typename: "Astronaut", id }))
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  plugins: [ ApolloServerPluginLandingPageGraphQLPlayground() ],
  context: ({ req }) => {
    console.log(`Request into missions graphQL server: \n ${JSON.stringify(req.body, null, 2)}`);
    return {
      dataLoaderRegistry: {
        missionByIdDataLoader: new DataLoader(ids => missionsDataSource.service.getMissions(ids)),
        missionByAstronautIdDataLoader: new DataLoader(ids => missionsDataSource.service.getMissionsByAstronauts(ids))
      }
    }
  }
});

server.listen({ port }).then(({ url }) => {
  console.log(`Missions graphQL service ready at ${url}`);
});

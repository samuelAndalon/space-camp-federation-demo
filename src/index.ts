import { ApolloGateway, ServiceEndpointDefinition } from '@apollo/gateway';
import { ApolloLink } from 'apollo-link';
import { BatchableRequest } from 'apollo-link-batch';
import { ApolloServer } from 'apollo-server';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import { HttpContext, RemoteGraphQLBatchedDataSource } from './util';
import { GraphQLRequestContext } from 'apollo-server-types';

const port = 4000;

const gateway = new ApolloGateway({ 
  serviceList: [
    { name: 'astronauts', url: 'http://localhost:4001' }, 
    { name: 'missions', url: 'http://localhost:4002' }
  ],
  buildService: (definition: ServiceEndpointDefinition) => new RemoteGraphQLBatchedDataSource(
    (requestContext: GraphQLRequestContext): BatchableRequest[] => requestContext.context.batcheableRequestsQueue,
    definition,
    [
      new ApolloLink((operation, forward) => {
        operation.setContext({ start: new Date() });
        return forward(operation);
      }),
      new ApolloLink((operation, forward) => {
        return forward(operation).map((data) => {
          const start = operation.getContext().start as Date;
          const now = new Date();
          const time = now.getTime() - start.getTime();
          // console.log(`operation ${operation.query.loc?.source?.body} : ${JSON.stringify(operation.variables)} took ${time} ms to complete`);
          return data;
        })
      })
    ]
  )
});

const server = new ApolloServer({
  gateway,
  context: (_: ExpressContext): HttpContext => ({
    batcheableRequestsQueue: []
  })
});

server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

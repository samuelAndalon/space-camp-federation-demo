import { ServiceEndpointDefinition } from '@apollo/gateway';
import { ApolloLink } from 'apollo-link';
import fetch from 'cross-fetch';

export const getDefaultLinks = (
  serviceEndpointDefinition: ServiceEndpointDefinition
): ApolloLink[] => [
  new ApolloLink((operation, forward) => {
    operation.setContext({ start: new Date() });
    return forward(operation);
  }),
  new ApolloLink((operation, forward) => {
    return forward(operation).map((data) => {
      const start = operation.getContext().start as Date;
      const now = new Date();
      const time = now.getTime() - start.getTime();
      // console.log(`operation ${operation.query.loc?.source?.body}: ${JSON.stringify(operation.variables)} to service: ${serviceEndpointDefinition.name} took ${time} ms to complete`);
      return data;
    })
  })
];

export const getServiceFetch = (
  serviceEndpointDefinition: ServiceEndpointDefinition
): (input: RequestInfo, init?: RequestInit) => Promise<Response> =>
  (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    // do custom stuff for service
    return fetch(input, init)
  }

import { ServiceEndpointDefinition } from '@apollo/gateway';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { GraphQLRequestContext } from 'apollo-server-types';
import fetch from 'cross-fetch';
import { CustomBatchHttpLink } from './custom-batch-http-link';
import { CustomOperationBatcher } from './custom-operation-batcher';

const getDefaultLinks = (
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
      console.log(`operation ${operation.query.loc?.source?.body}: ${JSON.stringify(operation.variables)} to service: ${serviceEndpointDefinition.name} took ${time} ms to complete`);
      return data;
    })
  })
];

const getTerminatingLink = (
  serviceEndpointDefinition: ServiceEndpointDefinition
): ApolloLink => {
  let terminatingLink: ApolloLink;

  if (serviceEndpointDefinition.name === 'none') {
    terminatingLink = new HttpLink({
      uri: serviceEndpointDefinition.url,
      fetch: getServiceFetch(serviceEndpointDefinition)
    })
  } else {
    terminatingLink = new CustomBatchHttpLink({
      serviceName: serviceEndpointDefinition.name,
      uri: serviceEndpointDefinition.url,
      getOperationBatcher: (requestContext: GraphQLRequestContext): CustomOperationBatcher => requestContext.context.operationBatcher,
      fetch: getServiceFetch(serviceEndpointDefinition)
    })
  };

  return terminatingLink;
}

export const getLinks = (
  serviceEndpointDefinition: ServiceEndpointDefinition
): ApolloLink[] => [
  ...getDefaultLinks(serviceEndpointDefinition), 
  getTerminatingLink(serviceEndpointDefinition)
];

export const getServiceFetch = (
  serviceEndpointDefinition: ServiceEndpointDefinition
): (input: RequestInfo, init?: RequestInit) => Promise<Response> =>
  (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    // do custom stuff for service
    return fetch(input, init)
  }

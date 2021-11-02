import { GraphQLDataSourceProcessOptions, ServiceEndpointDefinition } from '@apollo/gateway';
import { fetch } from 'apollo-server-env';
import { GraphQLResponse } from 'apollo-server-types';
import { HttpContext } from './http-context';

export class RemoteGraphQLBatchedDataSource {

  fetcher: typeof fetch = fetch;

  async process(
    serviceEndpointDefinition: ServiceEndpointDefinition, 
    options: GraphQLDataSourceProcessOptions<HttpContext>[]
  ): Promise<GraphQLResponse[]> {
    const { url } = serviceEndpointDefinition;
    if(!url) {
      return Promise.resolve([]);
    }
    const fetchResponse = await this.fetcher(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options.map((option: GraphQLDataSourceProcessOptions<HttpContext>) => option.request))
    });
    const body = await fetchResponse.json();
    return body;
  }
  // requests: GraphQLRequest[]
  // returns Promise<GraphQLResponse[]>
  // async sendRequest(requests) { 
  // }
}
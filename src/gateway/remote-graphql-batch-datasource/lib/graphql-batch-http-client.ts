import { GraphQLDataSourceProcessOptions, ServiceEndpointDefinition } from '@apollo/gateway';
import { HttpContext } from './http-context';
import { GraphQLResponse } from 'apollo-server-types';
import fetch from 'cross-fetch';

export class GraphQLBatchHttpClient {

  fetcher: typeof fetch = fetch;

  public async sendBatchRequest(
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
      body: JSON.stringify(
        options.map((option: GraphQLDataSourceProcessOptions<HttpContext>) => option.request)
      )
    });
    const body = await fetchResponse.json();
    return body;
  }
}
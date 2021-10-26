const { fetch } = require('apollo-server-env');

module.exports = class RemoteGraphQLBatchedDataSource {

  constructor() {
    this.fetcher = fetch;
  }

  // serviceEndpointDefinition: ServiceEndpointDefinition 
  // options: GraphQLDataSourceProcessOptions<TContext>[],
  // returns Promise<GraphQLResponse[]>
  async process(serviceEndpointDefinition, options) {
    const fetchResponse = await this.fetcher(
      serviceEndpointDefinition.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options.map((option) => option.request))
      }
    );
    const body = await fetchResponse.json();
    return body;
  }

  // requests: GraphQLRequest[]
  // returns Promise<GraphQLResponse[]>
  // async sendRequest(requests) { 
  // }
}
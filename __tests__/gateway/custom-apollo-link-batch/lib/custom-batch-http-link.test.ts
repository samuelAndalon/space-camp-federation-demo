import { execute } from 'apollo-link';
import fetchMock from 'fetch-mock';
import { GraphQLRequestContext } from 'apollo-server-types';
import gql from 'graphql-tag';
import { CustomBatchHttpLink, CustomOperationBatcher } from '../../../../src/gateway/custom-apollo-link-batch/lib';

describe('BatchHttpLink', () => {

  const sampleQuery = gql`
    query SampleQuery {
        stub {
          id
        }
      }
  `;

  beforeAll(() => {
    jest.resetModules();
  });

  const batchData1 = { data: { hello: 'world1' } };
  const batchData2 = { data: { hello: 'world2' } };
  const batchData3 = { data: { hello: 'world3' } };
  const roflData1 = { data: { haha: 'hehe1' } };
  const roflData2 = { data: { haha: 'hehe2' } };
  const lawlData1 = { data: { tehe: 'haaa1' } };

  const makePromise = response =>
    new Promise((resolve, _) =>
      setTimeout(() => {
        resolve({ body: response })
      }),
    );

  beforeEach(() => {
    fetchMock.restore();
    fetchMock.post('begin:/batch', makePromise([batchData1, batchData2, batchData3]));
    fetchMock.post('begin:/rofl', makePromise([roflData1, roflData2]));
    fetchMock.post('begin:/lawl', makePromise([lawlData1]));
  });

  it.only('handles batched requests to same service', (done) => {
    const link = new CustomBatchHttpLink({
      uri: '/batch',
      getOperationBatcher: (requestContext: GraphQLRequestContext): CustomOperationBatcher => {
        return requestContext.context.operationBatcher
      }
    });

    let nextCalls = 0;
    let completions = 0;

    const next = expectedData => data => {
      expect(data).toEqual(expectedData);
      nextCalls++;
    };

    const complete = () => {
      const calls = fetchMock.calls('begin:/batch');
      expect(calls.length).toBe(1);
      expect(nextCalls).toBe(3);
      completions++;
      if (completions === 3) {
        done();
      }
    };

    const error = error => {
      done(error);
    };

    const customOperationBatcher = new CustomOperationBatcher();

    const incomingRequestContext = {
      context: {
        operationBatcher: customOperationBatcher,
      }
    };

    execute(link, {
      query: sampleQuery,
      context: {
        url: '/batch',
        operationContext: incomingRequestContext
      },
    }).subscribe(
      next(batchData1), 
      error, 
      complete
    );
    execute(link, {
      query: sampleQuery,
      context: { 
        url: '/batch',
        operationContext: incomingRequestContext
      },
    }).subscribe(
      next(batchData2), 
      error, 
      complete
    );
    execute(link, {
      query: sampleQuery,
      context: { 
        url: '/batch',
        operationContext: incomingRequestContext
      },
    }).subscribe(
      next(batchData3), 
      error, 
      complete
    );
  });

  it('handles batched requests to multiple services', (done) => {
    const getOperationBatcher = (requestContext: GraphQLRequestContext): CustomOperationBatcher => {
      return requestContext.context.operationBatcher
    };
    const linkServiceA = new CustomBatchHttpLink({ uri: '/batch', getOperationBatcher });
    const linkServiceB = new CustomBatchHttpLink({ uri: '/rofl', getOperationBatcher });
    const linkServiceC = new CustomBatchHttpLink({ uri: '/lawl', getOperationBatcher });

    const nextCalls = {
      serviceA: 0,
      serviceB: 0,
      serviceC: 0
    }

    let completions = 0;

    const next = (expectedData, serviceName) => data => {
      expect(data).toEqual(expectedData);
      nextCalls[serviceName]++;
    };

    const completeServiceA = () => {
      const callsServiceA = fetchMock.calls('begin:/batch');
      expect(callsServiceA.length).toBe(1);
      expect(nextCalls['serviceA']).toBe(3);
      completions++;
      if (completions === 6) {
        done();
      }
    };
    const completeServiceB = () => {
      const callsServiceB = fetchMock.calls('begin:/rofl');
      expect(callsServiceB.length).toBe(1);
      expect(nextCalls['serviceB']).toBe(2);
      completions++;
      if (completions === 6) {
        done();
      }
    };
    const completeServiceC = () => {
      const callsServiceC = fetchMock.calls('begin:/lawl');
      expect(callsServiceC.length).toBe(1);
      expect(nextCalls['serviceC']).toBe(1);
      completions++;
      if (completions === 6) {
        done();
      }
    };

    const error = error => {
      done(error);
    };

    const customOperationBatcher = new CustomOperationBatcher();
    const incomingRequestContext = {
      context: {
        operationBatcher: customOperationBatcher,
      }
    };

    const graphQLRequestServiceA = { 
      query: sampleQuery,
      context: { 
        url: '/batch',
        operationContext: incomingRequestContext
      }
    };
    const graphQLRequestServiceB = { 
      query: sampleQuery,
      context: { 
        url: '/rofl',
        operationContext: incomingRequestContext
      }
    };
    const graphQLRequestServiceC = { 
      query: sampleQuery,
      context: { 
        url: '/lawl',
        operationContext: incomingRequestContext
      }
    };

    execute(linkServiceA, graphQLRequestServiceA)
      .subscribe(next(batchData1, 'serviceA'), error, completeServiceA);
    execute(linkServiceA, graphQLRequestServiceA)
      .subscribe(next(batchData2, 'serviceA'), error, completeServiceA);
    execute(linkServiceA, graphQLRequestServiceA)
      .subscribe(next(batchData3, 'serviceA'), error, completeServiceA);

    execute(linkServiceB, graphQLRequestServiceB)
      .subscribe(next(roflData1, 'serviceB'), error, completeServiceB);
    execute(linkServiceB, graphQLRequestServiceB)
      .subscribe(next(roflData2, 'serviceB'), error, completeServiceB);

    execute(linkServiceC, graphQLRequestServiceC)
      .subscribe(next(lawlData1, 'serviceC'), error, completeServiceC);
  });

  it('errors on an incorrect number of results for a batch', (done) => {
    const link = new CustomBatchHttpLink({
      uri: '/batch',
      getOperationBatcher: (requestContext: GraphQLRequestContext): CustomOperationBatcher => {
        return requestContext.context.operationBatcher
      }
    });

    let errors = 0;
    const next = (_) => {
      done('next should not have been called');
    };

    const complete = () => {
      done('complete should not have been called');
    };

    const error = (error) => {
      errors++;
      if (errors === 3) {
        done();
      }
    };

    const customOperationBatcher = new CustomOperationBatcher();

    const incomingRequestContext = {
      context: {
        operationBatcher: customOperationBatcher,
      }
    };

    const graphQLRequest = { 
      query: sampleQuery,
      context: { 
        url: '/batch',
        operationContext: incomingRequestContext
      }
    };

    execute(link, graphQLRequest).subscribe(next, error, complete);
    execute(link, graphQLRequest).subscribe(next, error, complete);
    execute(link, graphQLRequest).subscribe(next, error, complete);
    execute(link, graphQLRequest).subscribe(next, error, complete);
  });
});



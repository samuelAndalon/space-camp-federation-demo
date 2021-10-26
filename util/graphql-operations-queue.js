const queueMicrotask = require('queue-microtask');
const Deferred = require('./deferred');

module.exports = class GraphQLOperationsQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(options, process) {
    const request = {
      options,
      process,
      deferred: new Deferred(),
    }
    this.queue.push(request);
  
    if (this.queue.length === 1) {
      queueMicrotask(async () => {
        console.log(`queue length: ${this.queue.length}`);

        const operationsByHash = this.queue.reduce((acc, operation) => {
          if (!acc.hasOwnProperty(operation.options.incomingRequestContext.queryHash)) {
            acc[operation.options.incomingRequestContext.queryHash] = [];
          }
          acc[operation.options.incomingRequestContext.queryHash].push(operation);
          return acc;
        }, {});

        this.queue.length = 0;
  
        console.log(`dispatch requestsQueue, and resolve promises: ${Object.keys(operationsByHash)}`);

        for(const operationHash in operationsByHash) {
          for (const operation of operationsByHash[operationHash]) {
            const result = await operation.process(operation.options);
            operation.deferred.resolve(result);
          }
        }
      });
    }
    return request;
  }
}
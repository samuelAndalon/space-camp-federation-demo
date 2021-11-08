import queueMicrotask from 'queue-microtask';

describe('queueMicrotask', () => {
  const processMessagesMockFn = jest.fn().mockImplementation(json => {
    return new Promise((resolve, _) => {
      setTimeout(() => {
        resolve(json);
      }, 500);
    });
  });

  const messageQueue: any[] = [];
  const sendMessage = (message: any) => {
    messageQueue.push(message);

    if (messageQueue.length === 1) {
      queueMicrotask(async () => {
        const json = JSON.stringify(messageQueue);
        messageQueue.length = 0;
        await processMessagesMockFn(json);
      });
    }

  }

  test('should process messages', (done) => {

    sendMessage({ message: 'foo' });
    sendMessage({ message: 'bar' });

    queueMicrotask(async () => {
      expect(processMessagesMockFn).toHaveBeenCalledTimes(1);
      expect(processMessagesMockFn).toHaveBeenCalledWith(`[{"message":"foo"},{"message":"bar"}]`);
      expect(await processMessagesMockFn.mock.results[0].value).toBe(`[{"message":"foo"},{"message":"bar"}]`);
      done();
    });
  });
});
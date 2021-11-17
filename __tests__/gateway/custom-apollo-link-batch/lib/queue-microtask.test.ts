import queueMicrotask from 'queue-microtask';

describe('queueMicrotask', () => {
  const processMessagesMockFn = jest.fn().mockImplementation(json =>
    new Promise((resolve, _) => {
      setTimeout(() => {
        resolve(json);
      }, 2000);
    })
  );

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

    sendMessage({ message: 'hello' });
    sendMessage({ message: 'world' });

    queueMicrotask(async () => {
      expect(processMessagesMockFn).toHaveBeenCalledTimes(1);
      expect(processMessagesMockFn).toHaveBeenCalledWith(`[{"message":"hello"},{"message":"world"}]`);
      expect(await processMessagesMockFn.mock.results[0].value).toBe(`[{"message":"hello"},{"message":"world"}]`);
      done();
    });
  });

  test.only('microtask queue processed async', (done) => {
    queueMicrotask(async () => {
      await processMessagesMockFn(`{"foo": "bar"}`);
    });
    queueMicrotask(async () => {
      await processMessagesMockFn(`{"foo2": "bar2"}`);
    });

    queueMicrotask(async () => {
      expect(processMessagesMockFn).toHaveBeenCalledTimes(2);
      expect(processMessagesMockFn).toHaveBeenNthCalledWith(1, `{"foo": "bar"}`);
      expect(processMessagesMockFn).toHaveBeenNthCalledWith(2, `{"foo2": "bar2"}`);

      expect(await processMessagesMockFn.mock.results[0].value).toBe(`{"foo": "bar"}`);
      expect(await processMessagesMockFn.mock.results[1].value).toBe(`{"foo2": "bar2"}`);
      done();
    })
  });
});
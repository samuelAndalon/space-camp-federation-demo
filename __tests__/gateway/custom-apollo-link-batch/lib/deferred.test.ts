class Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    })
  }
}

class ChainedDeferred<TInput, TOutput> {
  value: TOutput
  promise: Promise<TInput>;
  resolve: (value: TInput) => void;
  reject: (reason?: any) => void;

  constructor(
    resolveTransformer: (value: TInput) => TOutput,
    chainedPromise: Promise<any>
    ) {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    
    chainedPromise.then((value) => {
      console.log(`resolved chained promise with ${value}, transforming value`);
      this.value = resolveTransformer(value);
    });
  }
}

describe('deferred', () => {
  test('deferred', () => {
    const deferred = new Deferred<string>();
    const deferred1 = new ChainedDeferred<string, string>((input: string) => 'output', deferred.promise);
    const deferred2 = new ChainedDeferred<string, number>((input: string) => 1, deferred1.promise);
    const deferred3 = new ChainedDeferred<number, boolean>((input: number) => true, deferred2.promise);
    
    const deferreds = [deferred1, deferred2, deferred3];

    deferred.resolve('jejeje');
  
    expect(deferreds.length).toBe(3);
  })
});
import { Observable } from 'apollo-link';

const observable1 = new Observable(observer => {
  let timer = setTimeout(() => {
    observer.next([1, 2, 3]);
    observer.complete();
  }, 5000);
  return () => clearTimeout(timer);
});

const observable2 = new Observable(observer => {
  let timer = setTimeout(() => {
    observer.next([4, 5, 6]);
    observer.complete();
  }, 5000);
  return () => clearTimeout(timer);
});

observable1.subscribe(x => {
  console.log(`${new Date().getTime()}: ${x}`);
});
observable2.subscribe(x => {
  console.log(`${new Date().getTime()}: ${x}`);
});

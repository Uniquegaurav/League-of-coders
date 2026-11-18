// Tiny stale-while-revalidate cache for GET requests. Pages show the last answer instantly while a fresh one
// loads, and identical requests made at the same time share one network call.
const store = new Map(); // key -> { data, at, promise, gen }
let generation = 0; // bumped by invalidate(); answers from older requests are not written back

export const peek = (key) => store.get(key)?.data;

export function load(key, fetcher, { ttl = 60000 } = {}) {
  const entry = store.get(key);
  if (entry?.promise) return entry.promise;
  if (entry && 'data' in entry && Date.now() - entry.at < ttl) return Promise.resolve(entry.data);
  const gen = generation;
  const promise = fetcher()
    .then((data) => {
      if (gen === generation) store.set(key, { data, at: Date.now() });
      else if (store.get(key)?.promise === promise) store.delete(key);
      return data;
    })
    .catch((err) => {
      if (store.get(key)?.promise === promise) {
        if (gen === generation && entry && 'data' in entry) store.set(key, { data: entry.data, at: entry.at });
        else store.delete(key);
      }
      throw err;
    });
  store.set(key, { ...(gen === generation ? entry : {}), promise });
  if (store.size > 300) store.delete(store.keys().next().value);
  return promise;
}

/** Drops cached answers whose key starts with `prefix`, so the next load fetches again. */
export function invalidate(prefix = '') {
  generation += 1;
  for (const key of [...store.keys()]) if (key.startsWith(prefix)) store.delete(key);
}

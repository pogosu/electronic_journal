const cache = new Map();

export function getCache(key) {
  const item = cache.get(key);
  if (!item) return undefined;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return undefined;
  }
  return item.value;
}

export function setCache(key, value, ttlMs = 300000) {
  cache.set(key, { value, expiry: Date.now() + ttlMs });
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

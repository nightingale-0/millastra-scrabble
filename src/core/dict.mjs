/**
 * 词典：分桶 + O(1) 查询。
 *
 * 为什么要分桶：千星沙箱单张节点图约 3000 节点上限，一个几万词的词表
 * 塞不进一张图。分桶后每桶一张图，主逻辑按 hash 路由。
 * 这里的 bucketOf() 必须和节点图侧的路由函数完全一致，所以单独成函数。
 */

export const DEFAULT_BUCKETS = 16;

/** 稳定 hash（FNV-1a 32bit）。节点图侧用整数运算可复现。 */
export function hashWord(w) {
  let h = 0x811c9dc5;
  for (let i = 0; i < w.length; i++) {
    h ^= w.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function bucketOf(word, buckets = DEFAULT_BUCKETS) {
  return hashWord(word) % buckets;
}

export function normalize(w) {
  return String(w).trim().toUpperCase();
}

/** 把词表切成 buckets 个桶 */
export function buildBuckets(words, buckets = DEFAULT_BUCKETS) {
  const out = Array.from({ length: buckets }, () => []);
  const seen = new Set();
  for (const raw of words) {
    const w = normalize(raw);
    if (!w || seen.has(w)) continue;
    seen.add(w);
    out[bucketOf(w, buckets)].push(w);
  }
  for (const b of out) b.sort();
  return out;
}

/** 本地查询用的词典对象 */
export function makeDictionary(words, buckets = DEFAULT_BUCKETS) {
  const bs = buildBuckets(words, buckets);
  const sets = bs.map((b) => new Set(b));
  return {
    buckets: bs,
    size: sets.reduce((n, s) => n + s.size, 0),
    has(word) {
      const w = normalize(word);
      return sets[bucketOf(w, buckets)].has(w);
    },
  };
}

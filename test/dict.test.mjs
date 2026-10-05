import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDictionary, buildBuckets, bucketOf, hashWord, DEFAULT_BUCKETS } from '../src/core/dict.mjs';

test('查询命中与未命中', () => {
  const d = makeDictionary(['cat', 'Dog', ' BIRD ']);
  assert.ok(d.has('CAT'));
  assert.ok(d.has('cat'), '应大小写无关');
  assert.ok(d.has('bird'), '应自动 trim');
  assert.equal(d.has('FISH'), false);
});

test('去重后总数正确', () => {
  const d = makeDictionary(['a', 'A', ' a ', 'b']);
  assert.equal(d.size, 2);
});

test('hash 稳定（跨进程可复现）', () => {
  assert.equal(hashWord('CAT'), hashWord('CAT'));
  assert.equal(hashWord('CAT'), 1229878055);
});

test('分桶覆盖全部词且互不重叠', () => {
  const words = Array.from({ length: 500 }, (_, i) => 'W' + i);
  const bs = buildBuckets(words, DEFAULT_BUCKETS);
  assert.equal(bs.length, DEFAULT_BUCKETS);
  assert.equal(bs.flat().length, 500);
  assert.equal(new Set(bs.flat()).size, 500);
  for (let i = 0; i < bs.length; i++)
    for (const w of bs[i]) assert.equal(bucketOf(w, DEFAULT_BUCKETS), i);
});

test('分桶大致均匀（最大桶不超过均值的 2 倍）', () => {
  const words = Array.from({ length: 4000 }, (_, i) => 'WORD' + i);
  const bs = buildBuckets(words, 16);
  const avg = 4000 / 16;
  const max = Math.max(...bs.map((b) => b.length));
  assert.ok(max < avg * 2, `最大桶 ${max} 超出预期（均值 ${avg}）`);
});

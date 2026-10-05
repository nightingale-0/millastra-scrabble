import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBag, makeRng, shuffle, EN_TILES } from '../src/core/tiles.mjs';

test('英文牌堆共 100 张，总分 187', () => {
  const bag = makeBag();
  assert.equal(bag.length, 100);
  assert.equal(bag.reduce((n, t) => n + t.score, 0), 187);
});

test('空白牌 2 张且 0 分', () => {
  const blanks = makeBag().filter((t) => t.blank);
  assert.equal(blanks.length, 2);
  assert.ok(blanks.every((t) => t.score === 0));
});

test('同种子洗牌结果可复现', () => {
  const a = shuffle(makeBag(), makeRng(42)).map((t) => t.ch).join('');
  const b = shuffle(makeBag(), makeRng(42)).map((t) => t.ch).join('');
  assert.equal(a, b);
  const c = shuffle(makeBag(), makeRng(43)).map((t) => t.ch).join('');
  assert.notEqual(a, c);
});

test('shuffle 必须显式传 rng（防止意外引入不可复现的随机）', () => {
  assert.throws(() => shuffle(makeBag()), /需要显式传入 rng/);
});

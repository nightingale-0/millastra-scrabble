import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEmptyBoard } from '../src/core/board.mjs';
import { validateGeometry, extractWords, cloneWith } from '../src/core/words.mjs';

const P = (r, c, ch, score = 1) => ({ r, c, ch, score });
/** 在棋盘上直接摆一串已有的牌 */
const put = (b, r, c, word, horizontal = true) => {
  [...word].forEach((ch, i) => {
    const rr = horizontal ? r : r + i, cc = horizontal ? c + i : c;
    b[rr][cc] = { ch, score: 1 };
  });
  return b;
};

test('首手必须覆盖中心格', () => {
  const b = makeEmptyBoard();
  assert.equal(validateGeometry(b, [P(0,0,'A'), P(0,1,'B')], true).reason,
    'FIRST_MOVE_MUST_COVER_CENTER');
  assert.equal(validateGeometry(b, [P(7,7,'A'), P(7,8,'B')], true).ok, true);
});

test('首手单张牌不算成词', () => {
  const b = makeEmptyBoard();
  assert.equal(validateGeometry(b, [P(7,7,'A')], true).reason, 'FIRST_MOVE_TOO_SHORT');
});

test('落子不能既不同行又不同列', () => {
  const b = put(makeEmptyBoard(), 7, 7, 'CAT');
  assert.equal(validateGeometry(b, [P(6,7,'A'), P(8,8,'B')], false).reason, 'NOT_IN_LINE');
});

test('落子之间不能有空洞', () => {
  const b = put(makeEmptyBoard(), 7, 7, 'CAT');
  // 在第 6 行放 c=7 和 c=10，中间 8,9 是空的
  assert.equal(validateGeometry(b, [P(6,7,'A'), P(6,10,'B')], false).reason, 'GAP');
});

test('已有牌可以填补空洞', () => {
  const b = makeEmptyBoard();
  put(b, 7, 7, 'CAT');            // c=7,8,9
  // 在同一行 c=6 和 c=10 落子，中间由 CAT 填满 -> 合法
  const g = validateGeometry(b, [P(7,6,'S'), P(7,10,'S')], false);
  assert.equal(g.ok, true);
  assert.equal(g.dir, 'H');
});

test('非首手必须与已有牌相邻', () => {
  const b = put(makeEmptyBoard(), 7, 7, 'CAT');
  assert.equal(validateGeometry(b, [P(0,0,'A'), P(0,1,'B')], false).reason, 'NOT_CONNECTED');
});

test('不能落在已占用的格子上', () => {
  const b = put(makeEmptyBoard(), 7, 7, 'CAT');
  assert.equal(validateGeometry(b, [P(7,7,'X')], false).reason, 'OCCUPIED');
});

test('提取主词', () => {
  const b = makeEmptyBoard();
  const pl = [P(7,7,'C'), P(7,8,'A'), P(7,9,'T')];
  const words = extractWords(b, pl, 'H');
  assert.equal(words.length, 1);
  assert.equal(words[0].word, 'CAT');
});

test('提取主词 + 交叉词', () => {
  const b = makeEmptyBoard();
  put(b, 7, 7, 'CAT');                    // 横向 CAT @ (7,7..9)
  // 在 (6,7) 放 S，(8,7) 放 R -> 纵向 S C R? 我们改用更清晰的例子：
  const b2 = makeEmptyBoard();
  put(b2, 7, 7, 'CAT');
  // 纵向落 'A''T' 在 (8,7),(9,7)，与 C 组成 CAT（纵向）
  const words = extractWords(b2, [P(8,7,'A'), P(9,7,'T')], 'V');
  const set = words.map((w) => w.word).sort();
  assert.deepEqual(set, ['CAT']);
});

test('平行贴靠时每个新牌都生成一个交叉词', () => {
  const b = makeEmptyBoard();
  put(b, 7, 7, 'CAT');                     // (7,7)C (7,8)A (7,9)T
  // 在下一行紧贴放 'AT' 于 (8,8),(8,9)
  const words = extractWords(b, [P(8,8,'A'), P(8,9,'T')], 'H');
  const got = words.map((w) => w.word).sort();
  // 主词 AT；交叉词 AA (7,8 A + 8,8 A)、TT (7,9 T + 8,9 T)
  assert.deepEqual(got, ['AA', 'AT', 'TT']);
});

test('单字母不成词（不会被误当作长度1的词）', () => {
  const b = makeEmptyBoard();
  const words = extractWords(b, [P(7,7,'A')], 'H');
  assert.equal(words.length, 0);
});

test('cloneWith 不修改原棋盘', () => {
  const b = makeEmptyBoard();
  const b2 = cloneWith(b, [P(7,7,'A')]);
  assert.equal(b[7][7], null);
  assert.equal(b2[7][7].ch, 'A');
});

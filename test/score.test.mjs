import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreWord, scoreTurn } from '../src/core/score.mjs';
import { BONUS_MAP, BONUS } from '../src/core/board.mjs';

const cell = (r, c, ch, score, fresh = true) => ({ r, c, ch, score, fresh });

test('无加成格：直接求和', () => {
  // (7,8),(7,9) 都是普通格
  assert.equal(BONUS_MAP[7][8], BONUS.NONE);
  assert.equal(scoreWord([cell(7,8,'A',1), cell(7,9,'B',3)]), 4);
});

test('中心格双单词生效', () => {
  // 首手 CAT 覆盖中心 (7,7)=DW, (7,8) 普通, (7,9) 普通
  const s = scoreWord([cell(7,7,'C',3), cell(7,8,'A',1), cell(7,9,'T',1)]);
  assert.equal(s, (3 + 1 + 1) * 2);
});

test('三倍字母只加在该字母上', () => {
  assert.equal(BONUS_MAP[5][5], BONUS.TL);
  const s = scoreWord([cell(5,5,'Q',10), cell(5,6,'I',1)]);
  assert.equal(s, 10 * 3 + 1);
});

test('两个单词加成相乘，且路径上的三倍字母同时生效', () => {
  // 第 1 行: c=1 DW, c=5 TL, c=9 TL, c=13 DW
  assert.equal(BONUS_MAP[1][1], BONUS.DW);
  assert.equal(BONUS_MAP[1][13], BONUS.DW);
  assert.equal(BONUS_MAP[1][5], BONUS.TL);
  assert.equal(BONUS_MAP[1][9], BONUS.TL);
  const cells = [];
  for (let c = 1; c <= 13; c++) cells.push(cell(1, c, 'A', 1));
  // 字母和 = 11*1 + 3 + 3 = 17；词倍率 = 2 * 2 = 4
  assert.equal(scoreWord(cells), 17 * 4);
});

test('旧牌不再享受加成', () => {
  const fresh = scoreWord([cell(7,7,'C',3), cell(7,8,'A',1)]);
  const stale = scoreWord([cell(7,7,'C',3,false), cell(7,8,'A',1)]);
  assert.equal(fresh, 8);   // (3+1)*2
  assert.equal(stale, 4);   // 无倍率
});

test('空白牌 0 分且不受字母加成影响', () => {
  assert.equal(scoreWord([cell(5,5,'E',0), cell(5,6,'X',8)]), 0 * 3 + 8);
});

test('一次用完 7 张触发 bingo +50', () => {
  const words = [{ word: 'ABCDEFG', cells: [cell(7,8,'A',1)] }];
  const r = scoreTurn(words, 7);
  assert.equal(r.bingo, true);
  assert.equal(r.total, 1 + 50);
  const r6 = scoreTurn(words, 6);
  assert.equal(r6.bingo, false);
  assert.equal(r6.total, 1);
});

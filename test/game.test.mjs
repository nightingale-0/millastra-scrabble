import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, play, pass, current, PHASE } from '../src/core/game.mjs';
import { makeDictionary } from '../src/core/dict.mjs';

const dict = makeDictionary(['CAT', 'CATS', 'AT', 'AS', 'TO', 'SO']);

/** 直接把想要的牌塞进当前玩家手里，方便构造确定性场景 */
function setRack(state, letters) {
  current(state).rack = [...letters].map((ch) => ({ ch, score: 1, blank: false }));
}

test('2-4 人可开局，人数越界报错', () => {
  for (const n of [2, 3, 4]) assert.equal(newGame({ players: n }).players.length, n);
  assert.throws(() => newGame({ players: 1 }));
  assert.throws(() => newGame({ players: 5 }));
});

test('开局每人 7 张，牌堆剩余正确', () => {
  const s = newGame({ players: 4 });
  assert.ok(s.players.every((p) => p.rack.length === 7));
  assert.equal(s.bag.length, 100 - 28);
});

test('打出手牌里没有的字母会被拒绝', () => {
  const s = newGame({ players: 2, dictionary: dict });
  setRack(s, 'CAT');
  const r = play(s, [{ r: 7, c: 7, ch: 'Z', score: 10 }, { r: 7, c: 8, ch: 'Z', score: 10 }]);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'TILE_NOT_IN_RACK');
});

test('非法单词被词典拦下且不改变棋盘', () => {
  const s = newGame({ players: 2, dictionary: dict });
  setRack(s, 'XQZ');
  const before = JSON.stringify(s.board);
  const r = play(s, [
    { r: 7, c: 7, ch: 'X', score: 8 },
    { r: 7, c: 8, ch: 'Q', score: 10 },
  ]);
  assert.equal(r.ok, false);
  assert.match(r.reason, /^INVALID_WORD/);
  assert.equal(JSON.stringify(s.board), before, '非法落子不得写入棋盘');
  assert.equal(s.turn, 0, '非法落子不得推进回合');
});

test('合法落子：计分、补牌、换手', () => {
  const s = newGame({ players: 2, dictionary: dict });
  setRack(s, 'CATXXXX');
  const r = play(s, [
    { r: 7, c: 7, ch: 'C', score: 1 },
    { r: 7, c: 8, ch: 'A', score: 1 },
    { r: 7, c: 9, ch: 'T', score: 1 },
  ]);
  assert.equal(r.ok, true);
  assert.equal(r.score, 6);                 // (1+1+1) * 2 中心双词
  assert.equal(s.players[0].score, 6);
  assert.equal(s.players[0].rack.length, 7, '应补满手牌');
  assert.equal(s.turn, 1, '应轮到下一位');
  assert.equal(s.isFirstMove, false);
});

test('全员连续过牌两轮后结束并给出排名', () => {
  const s = newGame({ players: 2, dictionary: dict });
  for (let i = 0; i < 4; i++) pass(s);
  assert.equal(s.phase, PHASE.ENDED);
  assert.equal(s.endReason, 'ALL_PASSED');
  assert.equal(s.ranking.length, 2);
});

test('同种子开局完全可复现', () => {
  const a = newGame({ players: 3, seed: 777 });
  const b = newGame({ players: 3, seed: 777 });
  assert.deepEqual(
    a.players.map((p) => p.rack.map((t) => t.ch)),
    b.players.map((p) => p.rack.map((t) => t.ch)),
  );
});

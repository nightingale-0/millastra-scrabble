/**
 * 回合状态机。服务端权威：所有裁决都在这里，客户端只提交意图。
 */
import { makeEmptyBoard } from './board.mjs';
import { makeBag, shuffle, drawTo, makeRng, RACK_SIZE } from './tiles.mjs';
import { validateGeometry, extractWords, cloneWith } from './words.mjs';
import { scoreTurn } from './score.mjs';

export const PHASE = Object.freeze({ PLAYING: 'PLAYING', ENDED: 'ENDED' });

export function newGame({ players = 2, seed = 12345, dictionary } = {}) {
  if (players < 2 || players > 4) throw new Error('players must be 2..4');
  const rng = makeRng(seed);
  const bag = shuffle(makeBag(), rng);
  const state = {
    phase: PHASE.PLAYING,
    board: makeEmptyBoard(),
    bag,
    rng,
    dictionary,
    turn: 0,
    isFirstMove: true,
    consecutivePasses: 0,
    players: Array.from({ length: players }, (_, i) => ({
      id: i, score: 0, rack: [], passed: false,
    })),
    log: [],
  };
  for (const p of state.players) drawTo(state.bag, p.rack);
  return state;
}

export const current = (s) => s.players[s.turn % s.players.length];

/** 从手牌里扣掉本次用掉的牌 */
function consumeFromRack(rack, placements) {
  const copy = rack.slice();
  for (const p of placements) {
    const key = p.blank ? '?' : p.ch;
    const i = copy.findIndex((t) => (p.blank ? t.blank : t.ch === key));
    if (i === -1) return null; // 手牌里没有这张
    copy.splice(i, 1);
  }
  return copy;
}

/**
 * 提交一次落子。
 * @returns {{ok:true, score:number, words:object[], bingo:boolean} | {ok:false, reason:string}}
 */
export function play(state, placements) {
  if (state.phase !== PHASE.PLAYING) return { ok: false, reason: 'GAME_ENDED' };
  const p = current(state);

  const rackAfter = consumeFromRack(p.rack, placements);
  if (!rackAfter) return { ok: false, reason: 'TILE_NOT_IN_RACK' };

  const geo = validateGeometry(state.board, placements, state.isFirstMove);
  if (!geo.ok) return { ok: false, reason: geo.reason };

  const words = extractWords(state.board, placements, geo.dir);
  if (!words.length) return { ok: false, reason: 'NO_WORD_FORMED' };

  if (state.dictionary) {
    const bad = words.find((w) => !state.dictionary.has(w.word));
    if (bad) return { ok: false, reason: `INVALID_WORD:${bad.word}` };
  }

  const { total, detail, bingo } = scoreTurn(words, placements.length);

  // 提交
  state.board = cloneWith(state.board, placements);
  p.rack = rackAfter;
  drawTo(state.bag, p.rack);
  p.score += total;
  state.isFirstMove = false;
  state.consecutivePasses = 0;
  state.log.push({ turn: state.turn, player: p.id, words: detail, score: total, bingo });

  advance(state);
  return { ok: true, score: total, words: detail, bingo };
}

export function pass(state) {
  if (state.phase !== PHASE.PLAYING) return { ok: false, reason: 'GAME_ENDED' };
  state.consecutivePasses++;
  state.log.push({ turn: state.turn, player: current(state).id, pass: true });
  advance(state);
  return { ok: true };
}

function advance(state) {
  const p = current(state);
  // 结束条件 1：牌堆空且某人手牌清空
  if (state.bag.length === 0 && p.rack.length === 0) return finish(state, 'RACK_EMPTY');
  // 结束条件 2：全员连续过牌两轮
  if (state.consecutivePasses >= state.players.length * 2) return finish(state, 'ALL_PASSED');
  state.turn++;
}

function finish(state, reason) {
  // 手牌剩余分从自己分数里扣，并加给清空手牌的人（标准规则）
  let bonus = 0;
  for (const p of state.players) {
    const left = p.rack.reduce((n, t) => n + t.score, 0);
    if (left > 0) { p.score -= left; bonus += left; }
  }
  const out = state.players.find((p) => p.rack.length === 0);
  if (out) out.score += bonus;
  state.phase = PHASE.ENDED;
  state.endReason = reason;
  state.ranking = state.players.slice().sort((a, b) => b.score - a.score).map((p) => ({ id: p.id, score: p.score }));
  return state;
}

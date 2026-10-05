#!/usr/bin/env node
/**
 * 端到端演示：用样例词典跑一局，确认整条链路通。
 * 这也是将来"AI 假人对手"的雏形 —— 换掉 pickMove 就是一个 bot。
 */
import fs from 'node:fs';
import { newGame, play, pass, current, PHASE } from '../src/core/game.mjs';
import { makeDictionary } from '../src/core/dict.mjs';
import { SIZE } from '../src/core/board.mjs';

const words = fs.readFileSync('data/words/en.sample.txt', 'utf8')
  .split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
const dict = makeDictionary(words);

const state = newGame({ players: 2, seed: 2026, dictionary: dict });
console.log(`开局：${state.players.length} 人，词典 ${dict.size} 词，牌堆剩 ${state.bag.length}`);

/** 极简 bot：穷举手上字母能拼出的词，挑第一处能放下的位置 */
function pickMove(s) {
  const p = current(s);
  const have = p.rack.map((t) => t.ch);
  const canSpell = (w) => {
    const pool = have.slice();
    for (const ch of w) { const i = pool.indexOf(ch); if (i === -1) return false; pool.splice(i, 1); }
    return true;
  };
  const candidates = words.map((w) => w.toUpperCase()).filter((w) => w.length >= 2 && canSpell(w));
  for (const w of candidates) {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c + w.length <= SIZE; c++) {
      const pl = [...w].map((ch, i) => {
        const t = p.rack.find((x) => x.ch === ch);
        return { r, c: c + i, ch, score: t ? t.score : 1 };
      });
      const snapshot = JSON.stringify(s.board);
      const res = play(s, pl);
      if (res.ok) return { word: w, at: [r, c], res };
      if (JSON.stringify(s.board) !== snapshot) throw new Error('失败的落子污染了棋盘！');
    }
  }
  return null;
}

let guard = 0;
while (state.phase === PHASE.PLAYING && guard++ < 40) {
  const who = current(state).id;
  const mv = pickMove(state);
  if (mv) {
    console.log(`  P${who} 打出 ${mv.word} @${mv.at}  +${mv.res.score}${mv.res.bingo ? ' (BINGO!)' : ''}`);
  } else {
    pass(state);
    console.log(`  P${who} 过牌`);
  }
}

console.log('\n最终比分：');
for (const p of state.players) console.log(`  P${p.id}: ${p.score}`);
console.log(`结束原因：${state.endReason ?? '达到演示步数上限'}`);

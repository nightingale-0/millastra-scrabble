/**
 * 计分：字母加成只对"本回合新落的牌"生效，单词加成同理，且多个单词加成相乘。
 */
import { BONUS, BONUS_MAP } from './board.mjs';
import { BINGO_BONUS, RACK_SIZE } from './tiles.mjs';

/** 单个单词得分 */
export function scoreWord(cells) {
  let sum = 0;
  let mult = 1;
  for (const cell of cells) {
    const b = cell.fresh ? BONUS_MAP[cell.r][cell.c] : BONUS.NONE;
    let ls = cell.score;
    if (b === BONUS.DL) ls *= 2;
    else if (b === BONUS.TL) ls *= 3;
    else if (b === BONUS.DW) mult *= 2;
    else if (b === BONUS.TW) mult *= 3;
    sum += ls;
  }
  return sum * mult;
}

/** 一回合总分 = 所有新词之和 (+ bingo) */
export function scoreTurn(words, placedCount) {
  let total = 0;
  const detail = [];
  for (const w of words) {
    const s = scoreWord(w.cells);
    detail.push({ word: w.word, score: s });
    total += s;
  }
  const bingo = placedCount >= RACK_SIZE;
  if (bingo) total += BINGO_BONUS;
  return { total, detail, bingo };
}

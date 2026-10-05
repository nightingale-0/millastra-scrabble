/**
 * 棋盘：15x15 标准布局 + 加成格。
 * 纯数据 + 纯函数，不依赖任何运行时（Node / 节点图 / 未来的 Lua 都能用）。
 */

export const SIZE = 15;
export const CENTER = 7; // 0-indexed, H8

/** 加成类型 */
export const BONUS = Object.freeze({
  NONE: 0,
  DL: 1, // double letter 双字母
  TL: 2, // triple letter 三字母
  DW: 3, // double word   双单词
  TW: 4, // triple word   三单词
});

/** 对称展开：给定右下1/4象限之外的完整坐标表（标准 Scrabble 布局） */
const TW = [[0,0],[0,7],[0,14],[7,0],[7,14],[14,0],[14,7],[14,14]];
const DW = [
  [1,1],[2,2],[3,3],[4,4],[10,10],[11,11],[12,12],[13,13],
  [1,13],[2,12],[3,11],[4,10],[10,4],[11,3],[12,2],[13,1],
  [7,7], // 中心星位，首手按双单词计
];
const TL = [
  [1,5],[1,9],[5,1],[5,5],[5,9],[5,13],
  [9,1],[9,5],[9,9],[9,13],[13,5],[13,9],
];
const DL = [
  [0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],
  [6,2],[6,6],[6,8],[6,12],[7,3],[7,11],
  [8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],
  [12,6],[12,8],[14,3],[14,11],
];

/** @returns {number[][]} bonus[row][col] */
export function makeBonusMap() {
  const m = Array.from({ length: SIZE }, () => new Array(SIZE).fill(BONUS.NONE));
  for (const [r, c] of DL) m[r][c] = BONUS.DL;
  for (const [r, c] of TL) m[r][c] = BONUS.TL;
  for (const [r, c] of DW) m[r][c] = BONUS.DW;
  for (const [r, c] of TW) m[r][c] = BONUS.TW;
  return m;
}

export const BONUS_MAP = makeBonusMap();

/** 空棋盘：null 表示空格，否则为 {ch, score, blank} */
export function makeEmptyBoard() {
  return Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
}

export const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

/** 扁平索引 <-> 行列。节点图里用一维数组更省事，这里统一口径。 */
export const rcToIdx = (r, c) => r * SIZE + c;
export const idxToRc = (i) => [Math.floor(i / SIZE), i % SIZE];

/** 导出为一维加成数组，方便喂给节点图 / HTML 生成器 */
export function bonusFlat() {
  const out = new Array(SIZE * SIZE);
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) out[rcToIdx(r, c)] = BONUS_MAP[r][c];
  return out;
}

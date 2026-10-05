/**
 * 牌堆：字母分值与数量分布。
 * 英文经典版分布（共100张）。中文词语版见 CJK_PRESET，作为占位/示例。
 */

/** @type {Record<string,{n:number,s:number}>} n=数量, s=分值 */
export const EN_TILES = Object.freeze({
  A:{n:9,s:1},  B:{n:2,s:3},  C:{n:2,s:3},  D:{n:4,s:2},  E:{n:12,s:1},
  F:{n:2,s:4},  G:{n:3,s:2},  H:{n:2,s:4},  I:{n:9,s:1},  J:{n:1,s:8},
  K:{n:1,s:5},  L:{n:4,s:1},  M:{n:2,s:3},  N:{n:6,s:1},  O:{n:8,s:1},
  P:{n:2,s:3},  Q:{n:1,s:10}, R:{n:6,s:1},  S:{n:4,s:1},  T:{n:6,s:1},
  U:{n:4,s:1},  V:{n:2,s:4},  W:{n:2,s:4},  X:{n:1,s:8},  Y:{n:2,s:4},
  Z:{n:1,s:10},
  '?':{n:2,s:0}, // 空白牌 blank
});

export const RACK_SIZE = 7;
export const BINGO_BONUS = 50; // 一次用完7张的额外奖励

/** 生成牌堆（未洗） */
export function makeBag(preset = EN_TILES) {
  const bag = [];
  for (const [ch, { n, s }] of Object.entries(preset)) {
    for (let i = 0; i < n; i++) bag.push({ ch, score: s, blank: ch === '?' });
  }
  return bag;
}

export function letterScore(ch, preset = EN_TILES) {
  return preset[ch]?.s ?? 0;
}

/**
 * 确定性伪随机（xorshift32）。节点图里没有可播种的随机源时，
 * 用同一套算法可以让本地模拟和局内表现完全对齐，便于复现 bug。
 */
export function makeRng(seed = 1) {
  let x = seed >>> 0 || 1;
  return function next() {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;  x >>>= 0;
    return x / 0x100000000;
  };
}

/**
 * Fisher-Yates，就地洗牌。
 * rng 必须显式传入 —— 不提供默认时钟种子，否则会破坏可复现性，
 * 也会让核心依赖宿主时钟而无法移植（见 tools/port-check.mjs）。
 */
export function shuffle(arr, rng) {
  if (typeof rng !== 'function') throw new TypeError('shuffle() 需要显式传入 rng，用 makeRng(seed) 创建');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 从牌堆补牌至满手 */
export function drawTo(bag, rack, size = RACK_SIZE) {
  while (rack.length < size && bag.length > 0) rack.push(bag.pop());
  return rack;
}

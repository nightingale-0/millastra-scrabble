/**
 * 落子合法性 + 从本回合落子中提取所有新形成的单词。
 * 这是整个游戏最容易写错的一块，所以单独成模块并重点测试。
 */
import { SIZE, inBounds, CENTER } from './board.mjs';

/**
 * @typedef {{r:number,c:number,ch:string,score:number,blank?:boolean}} Placement
 * @typedef {({ch:string,score:number,blank?:boolean}|null)[][]} Board
 */

/** 本回合落子的几何合法性检查（不查词典） */
export function validateGeometry(board, placements, isFirstMove) {
  if (!placements.length) return { ok: false, reason: 'EMPTY' };

  for (const p of placements) {
    if (!inBounds(p.r, p.c)) return { ok: false, reason: 'OUT_OF_BOUNDS' };
    if (board[p.r][p.c]) return { ok: false, reason: 'OCCUPIED' };
  }
  // 不能重复占同一格
  const seen = new Set();
  for (const p of placements) {
    const k = p.r * SIZE + p.c;
    if (seen.has(k)) return { ok: false, reason: 'DUPLICATE_CELL' };
    seen.add(k);
  }

  const rows = new Set(placements.map((p) => p.r));
  const cols = new Set(placements.map((p) => p.c));
  if (rows.size > 1 && cols.size > 1) return { ok: false, reason: 'NOT_IN_LINE' };
  const dir = rows.size === 1 ? 'H' : 'V';

  // 该行/列上，落子之间不能有空洞（已有旧牌可以填补空洞）
  const tmp = cloneWith(board, placements);
  if (dir === 'H') {
    const r = placements[0].r;
    const cs = placements.map((p) => p.c).sort((a, b) => a - b);
    for (let c = cs[0]; c <= cs[cs.length - 1]; c++) if (!tmp[r][c]) return { ok: false, reason: 'GAP' };
  } else {
    const c = placements[0].c;
    const rs = placements.map((p) => p.r).sort((a, b) => a - b);
    for (let r = rs[0]; r <= rs[rs.length - 1]; r++) if (!tmp[r][c]) return { ok: false, reason: 'GAP' };
  }

  if (isFirstMove) {
    if (!placements.some((p) => p.r === CENTER && p.c === CENTER))
      return { ok: false, reason: 'FIRST_MOVE_MUST_COVER_CENTER' };
    if (placements.length < 2) return { ok: false, reason: 'FIRST_MOVE_TOO_SHORT' };
  } else {
    // 必须与已有牌相邻
    const touches = placements.some((p) =>
      [[1,0],[-1,0],[0,1],[0,-1]].some(([dr, dc]) => {
        const r = p.r + dr, c = p.c + dc;
        return inBounds(r, c) && board[r][c];
      })
    );
    if (!touches) return { ok: false, reason: 'NOT_CONNECTED' };
  }

  return { ok: true, dir };
}

/** 返回叠加了本回合落子的新棋盘（不修改原棋盘） */
export function cloneWith(board, placements) {
  const b = board.map((row) => row.slice());
  for (const p of placements) b[p.r][p.c] = { ch: p.ch, score: p.score, blank: !!p.blank };
  return b;
}

/**
 * 提取本回合新形成的所有单词（主词 + 所有交叉词）。
 * @returns {{word:string, cells:{r:number,c:number,ch:string,score:number,fresh:boolean}[]}[]}
 */
export function extractWords(board, placements, dir) {
  const b = cloneWith(board, placements);
  const fresh = new Set(placements.map((p) => p.r * SIZE + p.c));
  const out = [];
  const pushRun = (cells) => {
    if (cells.length < 2) return;
    if (!cells.some((x) => fresh.has(x.r * SIZE + x.c))) return; // 必须含新牌
    const key = cells.map((x) => `${x.r},${x.c}`).join('|');
    if (out.some((w) => w.key === key)) return;
    out.push({ key, word: cells.map((x) => x.ch).join(''), cells });
  };
  const runAt = (r, c, horizontal) => {
    let sr = r, sc = c;
    while (inBounds(horizontal ? sr : sr - 1, horizontal ? sc - 1 : sc) &&
           b[horizontal ? sr : sr - 1][horizontal ? sc - 1 : sc]) {
      if (horizontal) sc--; else sr--;
    }
    const cells = [];
    let cr = sr, cc = sc;
    while (inBounds(cr, cc) && b[cr][cc]) {
      cells.push({ r: cr, c: cc, ch: b[cr][cc].ch, score: b[cr][cc].score, fresh: fresh.has(cr * SIZE + cc) });
      if (horizontal) cc++; else cr++;
    }
    return cells;
  };

  // 主词
  const p0 = placements[0];
  pushRun(runAt(p0.r, p0.c, dir === 'H'));
  // 每个新牌的垂直方向交叉词
  for (const p of placements) pushRun(runAt(p.r, p.c, dir !== 'H'));

  return out.map(({ word, cells }) => ({ word, cells }));
}

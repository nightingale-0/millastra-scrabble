#!/usr/bin/env node
/**
 * 15x15 棋盘 HTML 生成器。
 *
 * 目的：Ayaya_Miliastra_Editor 支持「以 HTML 作为 UI 源码并导出为 .gil」，
 * 所以 225 个格子用循环生成，而不是在编辑器里手工摆 225 次。
 *
 * 即使不走那条路，这个文件也能直接在浏览器里打开，用来核对加成布局配色、
 * 格子尺寸和手牌栏比例 —— 属于零风险的前期设计验证。
 *
 * 用法：node tools/gen-board-html.mjs [--out dist/board.html] [--cell 40]
 */
import fs from 'node:fs';
import path from 'node:path';
import { SIZE, BONUS, BONUS_MAP } from '../src/core/board.mjs';
import { RACK_SIZE } from '../src/core/tiles.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i === -1 ? d : argv[i + 1]; };
const outFile = arg('out', 'dist/board.html');
const cell = Number(arg('cell', 40));

const CLS = { [BONUS.NONE]: 'n', [BONUS.DL]: 'dl', [BONUS.TL]: 'tl', [BONUS.DW]: 'dw', [BONUS.TW]: 'tw' };
const LABEL = { [BONUS.NONE]: '', [BONUS.DL]: '双字', [BONUS.TL]: '三字', [BONUS.DW]: '双词', [BONUS.TW]: '三词' };

let cells = '';
for (let r = 0; r < SIZE; r++) {
  for (let c = 0; c < SIZE; c++) {
    const b = BONUS_MAP[r][c];
    const center = r === 7 && c === 7;
    cells += `<div class="cell ${CLS[b]}${center ? ' center' : ''}" data-r="${r}" data-c="${c}" data-i="${r * SIZE + c}" data-bonus="${b}">` +
             `<span class="bl">${center ? '★' : LABEL[b]}</span></div>`;
  }
}

let rack = '';
for (let i = 0; i < RACK_SIZE; i++) rack += `<div class="slot" data-slot="${i}"></div>`;

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>拼词棋盘布局</title>
<style>
  :root{
    --cell:${cell}px; --gap:2px;
    --bg:#1b1a17; --fg:#e8e4d9; --line:#3a382f;
    --n:#2b2924; --dl:#3d6b8f; --tl:#2f4f79; --dw:#8f5a4a; --tw:#a8443a;
    --slot:#4a4437;
  }
  *{box-sizing:border-box}
  body{margin:0;padding:24px;background:var(--bg);color:var(--fg);
       font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
  h1{font-size:16px;font-weight:600;margin:0 0 4px}
  p.sub{margin:0 0 16px;font-size:12px;opacity:.6}
  .board{display:grid;grid-template-columns:repeat(${SIZE},var(--cell));
         gap:var(--gap);background:var(--line);padding:var(--gap);
         width:max-content;border-radius:4px}
  .cell{width:var(--cell);height:var(--cell);display:flex;align-items:center;
        justify-content:center;background:var(--n);border-radius:2px;
        font-size:calc(var(--cell)/4.5);cursor:pointer;user-select:none;
        transition:outline-color .08s}
  .cell:hover{outline:2px solid #d8c88a;outline-offset:-2px}
  .cell.dl{background:var(--dl)} .cell.tl{background:var(--tl)}
  .cell.dw{background:var(--dw)} .cell.tw{background:var(--tw)}
  .cell.center{background:var(--dw);font-size:calc(var(--cell)/2.2)}
  .bl{opacity:.75;pointer-events:none}
  .cell.filled{background:#d9cfae;color:#1b1a17;font-weight:700;
               font-size:calc(var(--cell)/2)}
  .rack{display:flex;gap:6px;margin-top:20px}
  .slot{width:var(--cell);height:var(--cell);background:var(--slot);
        border-radius:3px;display:flex;align-items:center;justify-content:center}
  .legend{display:flex;gap:14px;margin-top:16px;font-size:12px;flex-wrap:wrap}
  .legend i{display:inline-block;width:12px;height:12px;border-radius:2px;
            margin-right:5px;vertical-align:-1px}
</style></head><body>
<h1>拼词棋盘 15 × 15</h1>
<p class="sub">由 tools/gen-board-html.mjs 生成 · 加成布局与 src/core/board.mjs 同源，改代码即改布局</p>
<div class="board">${cells}</div>
<div class="rack">${rack}</div>
<div class="legend">
  <span><i style="background:var(--tw)"></i>三倍单词</span>
  <span><i style="background:var(--dw)"></i>双倍单词</span>
  <span><i style="background:var(--tl)"></i>三倍字母</span>
  <span><i style="background:var(--dl)"></i>双倍字母</span>
  <span><i style="background:var(--n)"></i>普通</span>
</div>
<script>
  // 仅用于布局自检：点一下填字母，再点清除。真正的交互在局内由节点图驱动。
  document.querySelectorAll('.cell').forEach(function(el){
    el.addEventListener('click', function(){
      if (el.classList.contains('filled')) {
        el.classList.remove('filled');
        el.querySelector('.bl').textContent = el.dataset.bonus === '0' ? '' :
          ({'1':'双字','2':'三字','3':'双词','4':'三词'})[el.dataset.bonus];
        if (el.classList.contains('center')) el.querySelector('.bl').textContent = '★';
      } else {
        el.classList.add('filled');
        el.querySelector('.bl').textContent = 'A';
      }
    });
  });
</script>
</body></html>`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
console.log(`✓ 棋盘已生成 -> ${outFile}  (${SIZE}x${SIZE} = ${SIZE * SIZE} 格, cell=${cell}px)`);
console.log(`  用浏览器打开即可核对配色与比例；点击格子可模拟落子。`);

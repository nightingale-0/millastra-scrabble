#!/usr/bin/env node
/**
 * 可移植性检查：确保 src/core/ 没有偷偷依赖 Node 或浏览器专有能力。
 *
 * 为什么需要它：核心将来要移植到节点图，也可能移植到客户端脚本（Lua）。
 * "核心保持纯净"如果只写在文档里，迟早会破。这里用机器强制。
 *
 * 用法：node tools/port-check.mjs      （CI / 提交前跑）
 */
import fs from 'node:fs';
import path from 'node:path';

const CORE = 'src/core';

/** 这些一旦出现在 core 里，就说明核心被污染了 */
const BANNED = [
  { re: /\bimport\s+.*\bfrom\s+['"]node:/,      why: '引入了 Node 内置模块' },
  { re: /\brequire\s*\(/,                        why: '使用了 CommonJS require' },
  { re: /\bprocess\./,                           why: '使用了 process' },
  { re: /\b(globalThis|window|document|navigator)\b/, why: '使用了宿主全局对象' },
  { re: /\bfetch\s*\(/,                          why: '发起了网络请求' },
  { re: /\bMath\.random\s*\(/,                   why: '使用了不可复现的随机源（应改用 makeRng）' },
  { re: /\bconsole\.(log|warn|error|info)\s*\(/, why: '核心不应打日志（交给调用方）' },
  { re: /\bDate\.now\s*\(/,                      why: '依赖真实时钟会破坏可复现性' },
  { re: /\bnew\s+Date\b/,                        why: '依赖真实时钟会破坏可复现性' },
];

/** 这些能用但移植到 Lua/节点图时要手工改写，只提醒不报错 */
const WARN = [
  { re: /\bnew\s+(Set|Map)\b/,        why: 'Set/Map → Lua 里用 table，节点图里用字典变量' },
  { re: /\.(map|filter|reduce|find|some|every|flat)\s*\(/, why: '数组高阶方法 → Lua 需手写循环' },
  { re: /\.\.\./,                     why: '展开/剩余语法 → Lua 需改写' },
  { re: /\?\?|\?\./,                  why: '空值合并/可选链 → Lua 需改写' },
  { re: /`[^`]*\$\{/,                 why: '模板字符串 → Lua 用 .. 拼接' },
];

const files = fs.readdirSync(CORE).filter((f) => f.endsWith('.mjs'));
let errors = 0;
const warnByRule = new Map();

for (const f of files) {
  const src = fs.readFileSync(path.join(CORE, f), 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');           // 去掉行注释
    if (/^\s*\*/.test(line) || /^\s*\/\*/.test(line)) return; // 跳过块注释
    for (const b of BANNED) {
      if (b.re.test(code)) {
        console.error(`✗ ${CORE}/${f}:${i + 1}  ${b.why}`);
        console.error(`    ${line.trim()}`);
        errors++;
      }
    }
    for (const w of WARN) {
      if (w.re.test(code)) warnByRule.set(w.why, (warnByRule.get(w.why) || 0) + 1);
    }
  });
}

console.log(`检查了 ${files.length} 个核心文件：${files.join(', ')}`);

if (warnByRule.size) {
  console.log('\n移植提示（不是错误，是搬去 Lua / 节点图时要手工处理的地方）：');
  for (const [why, n] of [...warnByRule].sort((a, b) => b[1] - a[1]))
    console.log(`  · ${String(n).padStart(3)} 处  ${why}`);
}

if (errors) {
  console.error(`\n✗ 可移植性检查失败：${errors} 处违规。核心必须保持纯净。`);
  process.exit(1);
}
console.log('\n✓ 核心是可移植的：无 Node / 浏览器专有依赖，无不可复现的随机与时钟。');

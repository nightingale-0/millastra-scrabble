#!/usr/bin/env node
/**
 * 编译期词典分桶生成器。
 *
 * 输入：data/words/<name>.txt（每行一个词）
 * 输出：dist/dict/bucket-NN.json  + dist/dict/manifest.json
 *
 * 用法：
 *   node tools/build-dict.mjs --in data/words/en.sample.txt --buckets 16 --min 2 --max 15
 *
 * 为什么要这一步：单张节点图约 3000 节点上限，几万词的表塞不进一张图。
 * 分桶后每桶一张图，主逻辑用同一个 hash 路由过去。bucketOf() 与运行时必须一致。
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildBuckets, bucketOf, normalize, DEFAULT_BUCKETS } from '../src/core/dict.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i === -1 ? d : argv[i + 1]; };

const inFile  = arg('in', 'data/words/en.sample.txt');
const outDir  = arg('out', 'dist/dict');
const buckets = Number(arg('buckets', DEFAULT_BUCKETS));
const minLen  = Number(arg('min', 2));
const maxLen  = Number(arg('max', 15));

if (!fs.existsSync(inFile)) {
  console.error(`✗ 找不到词表: ${inFile}`);
  console.error(`  把你的词表放到 data/words/ 下，每行一个词，然后重跑。`);
  process.exit(1);
}

const raw = fs.readFileSync(inFile, 'utf8').split(/\r?\n/);
const stats = { read: raw.length, tooShort: 0, tooLong: 0, badChar: 0, kept: 0 };
const words = [];
for (const line of raw) {
  const w = normalize(line);
  if (!w || w.startsWith('#')) continue;
  if (w.length < minLen) { stats.tooShort++; continue; }
  if (w.length > maxLen) { stats.tooLong++; continue; }
  if (!/^[A-Z]+$/.test(w)) { stats.badChar++; continue; } // 连字符/撇号/专有名词一律剔除
  words.push(w);
}

const bs = buildBuckets(words, buckets);
stats.kept = bs.reduce((n, b) => n + b.length, 0);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const sizes = [];
bs.forEach((b, i) => {
  const name = `bucket-${String(i).padStart(2, '0')}.json`;
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(b));
  sizes.push({ bucket: i, count: b.length, file: name });
});

const manifest = {
  generatedAt: new Date().toISOString(),
  source: inFile,
  buckets,
  minLen, maxLen,
  totalWords: stats.kept,
  hash: 'fnv1a32',
  note: '运行时路由必须使用同一 hash：bucket = fnv1a32(word) % buckets',
  sizes,
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const counts = sizes.map((s) => s.count);
const max = Math.max(...counts), min = Math.min(...counts);
const avg = (stats.kept / buckets).toFixed(1);

console.log(`✓ 词典已生成 -> ${outDir}`);
console.log(`  读取 ${stats.read} 行，保留 ${stats.kept} 词（去重后）`);
console.log(`  剔除：过短 ${stats.tooShort} / 过长 ${stats.tooLong} / 含非法字符 ${stats.badChar}`);
console.log(`  分 ${buckets} 桶，均值 ${avg}，最小 ${min}，最大 ${max}`);
if (max > avg * 1.5) console.log(`  ⚠ 桶分布偏斜，考虑增加桶数`);
// 抽样自检：随机挑几个词，确认路由一致
const sample = words.slice(0, 5);
for (const w of sample) {
  const b = bucketOf(w, buckets);
  if (!bs[b].includes(w)) { console.error(`✗ 路由自检失败: ${w}`); process.exit(1); }
}
console.log(`  路由自检通过（抽样 ${sample.length} 词）`);

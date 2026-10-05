# Wonderland Scrabble

为《原神·千星奇域》(Miliastra Wonderland) 做的 2–4 人拼词游戏。单人项目。

**架构原则：规则核心与运行时完全解耦。**
`src/core/` 是零依赖纯逻辑，不知道节点图、不知道 Lua、不知道 HTML。
所有面向具体运行时的产物都在 `src/adapters/` 和 `tools/` 里生成。
这样无论官方将来开放什么（节点图扩展、脚本语言、新 UI 系统），核心一行都不用改。

## 快速开始

```bash
node --version          # 需要 >= 20
npm test                # 可移植性检查 + 39 项测试，无需 npm install（零依赖）
npm run portcheck       # 单独跑可移植性检查
npm run dict            # 生成分桶词典 -> dist/dict/
npm run board           # 生成棋盘 HTML -> dist/board.html（浏览器打开可看）
npm run demo            # 跑一局完整对局，验证链路
```

没有 `npm install` 这一步 —— 整个核心零依赖，只用 Node 内置的 `node:test`。

## 目录

```
src/core/       纯规则引擎（零依赖，可移植到任何运行时）
  board.mjs       15x15 棋盘与加成格布局
  tiles.mjs       牌堆、分值、可复现的洗牌
  words.mjs       落子几何校验 + 新词提取（最易错，重点测试）
  score.mjs       计分（字母/单词加成、bingo）
  game.mjs        回合状态机（服务端权威）
  dict.mjs        词典分桶与 O(1) 查询
src/adapters/   面向具体运行时的输出层（见其 README）
tools/          编译期脚本：词典生成、棋盘 HTML 生成、对局演示、可移植性检查
data/words/     词表源文件（大词表不入库）
docs/           研究结论、决策记录、待验证清单、路线图
gsts/           genshin-ts 工程位（见其 README）
test/           38 项测试
```

## 先读这几篇

| 文档 | 作用 |
|---|---|
| [docs/04-roadmap.md](docs/04-roadmap.md) | **从这里开始** —— 分阶段的执行顺序 |
| [docs/03-verify-in-editor.md](docs/03-verify-in-editor.md) | 进编辑器第一件事：把未知项一次性验掉 |
| [docs/00-decisions.md](docs/00-decisions.md) | 待拍板的决策 + 已定的决策记录 |
| [docs/05-compliance.md](docs/05-compliance.md) | 合规风险分档 —— 动工具链前必读 |
| [docs/01-research.md](docs/01-research.md) | 平台调研结论与出处 |
| [docs/02-editor-boundary.md](docs/02-editor-boundary.md) | 什么必须在编辑器做、什么能用代码做 |

## 当前状态

- [x] 规则核心（棋盘/牌堆/取词/计分/回合机）+ 39 项测试
- [x] 词典分桶生成器（解决单图 ~3000 节点上限）
- [x] 棋盘 HTML 生成器（225 格用循环生成，不手摆）
- [x] 端到端对局演示（也是 AI 假人对手的雏形）
- [x] 核心可移植性由 `tools/port-check.mjs` 机器强制（为可能的 Lua 移植铺路）
- [ ] **7.1（9-23 上线）实测客户端脚本能力 —— 见 `docs/03` 的 P0-0，现在是第一优先级**
- [ ] 进编辑器验证 `docs/03-verify-in-editor.md` 的其余未知项
- [ ] 接 genshin-ts，把 `src/core` 的逻辑编译成节点图
- [ ] UI 落地

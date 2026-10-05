# genshin-ts 工程位

本目录留给 [genshin-ts](https://github.com/josStorer/genshin-ts) 子工程。
**阶段 3 之前不用动它。**

## 初始化（阶段 3 开始时再做）

```bash
cd gsts
npm create genshin-ts@latest
npm install
```

然后把 `src/core/` 的逻辑按 `../src/adapters/README.md` 的改写清单移植到 `gsts/src/`。

## 注入配置示例

```ts
import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'China',
    playerId: 1,
    mapId: 0, // TODO: 换成你自己的地图 ID        // npm run maps 可列出最近保存的地图
    nodeGraphId: 0,
  },
}
export default config
```

## 关键约束速查

| 约束 | 说明 |
|---|---|
| 顶层作用域 | **编译期**，可读文件、用 npm 库、预计算 ← 词典分桶靠这条 |
| 节点图作用域 | 只支持 TS 子集 |
| 数值类型 | `number` = 浮点，`bigint` = 整数；取模/位运算必须 `bigint` |
| 列表索引 | 用 `bigint` 时要包 `idx(...)` |
| 容器 | 列表/字典必须同质；空数组用 `list('int', [])`；`dict()` 只读 |
| 不支持 | 递归、`async/await`、Promise、`Object.*`、`JSON.*` |
| 循环 | `while(true)` 有上限；`setInterval <= 100ms` 触发性能警告 |
| 变量 | 可变字典必须用节点图变量（`variables` + `f.get`/`f.set`） |
| 注入安全 | 目标图必须为空或名字以 `_GSTS` 开头；新建图后必须先保存地图 |
| 图模式 | 默认 `beyond`（超限，节点能力更全），`classic` 能力更窄 |

## 常用命令

```bash
npm run build      # 全量编译
npm run dev        # 增量编译 + 自动注入
npm run maps       # 列出最近保存的地图（找 mapId）
npm run backup     # 打开备份目录
npm run typecheck  # 类型检查
npm run lint       # 自定义 ESLint 规则，能提前暴露节点图语义约束
```

**先 `npm run lint` 再编译** —— 它内置的自定义规则专门用来提前暴露节点图的隐性约束。

## 合规提醒

`inject` 属于 🟡 档（直接写本地存档）。如果你在 `docs/00-decisions.md` 里选了 🟢 档，
就只用 `npm run build` 产出 `.gia`，然后走游戏内官方的「资产导入导出」手动导入。

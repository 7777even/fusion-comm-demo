# 融合通信 Demo 产品化落地（阶段一：demo 贴近系统）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 demo 仓引入签名适配器与服务层，把 9 个页面共 38 处 `fcPost` 直连收口到 `services/communication`，保持 B3 包络语义与 mock/real 双模式不变，为回流脚手架/后端做同构准备。

**Architecture:** 新增 `src/adapters/fcSignature.ts` 承载申讯签名并声明「回流后由后端代理生成、浏览器零密钥」边界；`src/services/communication.ts` 封装 `fcPost`，保留 4 种返回消费形态（`rows`/`row`/`data`/忽略返回值）；页面改为调用服务方法，不再直接 `import { fcPost }`。本阶段不改 `src/api/client.ts` 的签名协议、不改后端、不改平台契约。

**Tech Stack:** Vue 3 + TypeScript strict + Vite 5 + Pinia + Element Plus；纯函数测试用 Node 24 `--experimental-strip-types` + `node:assert`（已探针验证可行，零新增依赖），页面实证用已装 playwright。

## Global Constraints

- 本阶段只改 `d:/gkproject/fusion-comm-demo`；不碰脚手架与后端仓（阶段二/三须另开 Change 并各自过 L4）。
- 契约参照 `communication.openapi.json`，包络语义：成功取 `data`/`rows`/`row`，`code!==0` 抛可识别错误，不得静默返回。
- 申讯签名协议 `sha256(secretId&timestamp&secretKey)` 保留在 adapter，但必须有声明「回流后由后端代理生成、浏览器零密钥」的边界注释；密钥不进 mock 分支。
- 页面现有 4 种消费形态必须保真：`{rows,total}`、`{row}`（queryTerminals 单数）、`{data}`（标量/对象）、忽略返回值。
- `__scene__/*` 字面量路径（enterprises/cameras/patchTasks）纳入 services 封装，页面不得直连 mock。
- 测试脚本导入的 TS 文件不得含 `@/` 别名（Node 无法解析别名）；服务层把可测纯函数放 `src/services/envelope.ts`，以相对路径导入。
- 提交格式 `type(scope): 单行中文描述`，scope ∈ {screen, mgmt, mobile, shared, docs, chore, contract, ci}，body 为空。本阶段用 `shared`（服务层/适配器）与 `screen`（页面）。

---

### Task 1: 新增可测纯函数 `envelope.ts`

**Files:**
- Create: `d:/gkproject/fusion-comm-demo/src/services/envelope.ts`
- Test: `d:/gkproject/fusion-comm-demo/scripts/test-envelope.mjs`

**Interfaces:**
- Consumes: 无（零依赖）
- Produces:
  - `unwrapBody<T>(res: Envelope): T` — `code!==0` 抛 `Error(msg)`，`data` 缺失抛 `Error('EMPTY_BODY')`
  - `unwrapRows<T>(res: Envelope): { rows: T[]; total: number }` — 兼容 `rows` 与 `row`（单数）
  - `export interface Envelope { code: number; msg: string; data?: unknown; rows?: unknown[]; row?: unknown[]; total?: number; [key: string]: unknown }`

- [ ] **Step 1: 写失败测试**

```js
// scripts/test-envelope.mjs
import assert from 'node:assert/strict'
import { unwrapBody, unwrapRows } from '../src/services/envelope.ts'

assert.equal(unwrapBody({ code: 0, msg: 'ok', data: { url: 'u' } }).url, 'u')
assert.throws(() => unwrapBody({ code: 1, msg: 'bad' }), /bad/)
assert.throws(() => unwrapBody({ code: 0, msg: 'ok' }), /EMPTY_BODY/)
assert.deepEqual(
  unwrapRows({ code: 0, msg: 'ok', rows: [1, 2], total: 2 }),
  { rows: [1, 2], total: 2 }
)
assert.deepEqual(
  unwrapRows({ code: 0, msg: 'ok', row: [3], total: 1 }),
  { rows: [3], total: 1 }
)
console.log('envelope OK')
```

- [ ] **Step 2: 确认测试失败**

Run: `cd /d d:\gkproject\fusion-comm-demo && node --experimental-strip-types scripts/test-envelope.mjs`
Expected: FAIL（`Cannot find module .../src/services/envelope.ts`）

- [ ] **Step 3: 实现 envelope 纯函数**

```ts
// src/services/envelope.ts
export interface Envelope {
  code: number
  msg: string
  data?: unknown
  rows?: unknown[]
  row?: unknown[]
  total?: number
  [key: string]: unknown
}

export function unwrapBody<T>(res: Envelope): T {
  if (res.code !== 0) throw new Error(res.msg || `API_ERROR_${res.code}`)
  if (res.data === undefined || res.data === null) throw new Error('EMPTY_BODY')
  return res.data as T
}

export function unwrapRows<T>(res: Envelope): { rows: T[]; total: number } {
  if (res.code !== 0) throw new Error(res.msg || `API_ERROR_${res.code}`)
  const rows = ((res.rows ?? res.row ?? []) as T[])
  const total = res.total ?? rows.length
  return { rows, total }
}
```

- [ ] **Step 4: 确认测试通过**

Run: `cd /d d:\gkproject\fusion-comm-demo && node --experimental-strip-types scripts/test-envelope.mjs`
Expected: `envelope OK`（忽略 ExperimentalWarning）

- [ ] **Step 5: 提交**

```bash
cd /d d:\gkproject\fusion-comm-demo
git add src/services/envelope.ts scripts/test-envelope.mjs
git commit -m "feat(shared): 新增 B3 包络解包纯函数与测试"
```

---

### Task 2: 新增签名适配器 `fcSignature.ts`

**Files:**
- Create: `d:/gkproject/fusion-comm-demo/src/adapters/fcSignature.ts`
- Test: `d:/gkproject/fusion-comm-demo/scripts/test-fc-signature.mjs`

**Interfaces:**
- Consumes: `src/api/sign.ts` 的 `buildAuthHeaders`（现有实现，零 `@/` 依赖）
- Produces:
  - `boundaryNote: string` — 固定边界声明，含「后端代理」字样
  - `createProxyAwareSigner(opts: { secretId: string; secretKey: string; useProxy: boolean }): { headers(): Promise<Record<string,string>>; boundaryNote: string }`

- [ ] **Step 1: 写失败测试**

```js
// scripts/test-fc-signature.mjs
import assert from 'node:assert/strict'
import { createProxyAwareSigner, boundaryNote } from '../src/adapters/fcSignature.ts'

const signer = createProxyAwareSigner({ secretId: 'sid', secretKey: 'skey', useProxy: false })
const h = await signer.headers()
assert.equal(h['X-CR-SecretId'], 'sid')
assert.match(h['X-CR-Timestamp'], /^\d{10}$/)
assert.match(h['X-CR-Signature'], /^[0-9a-f]{64}$/)
assert.match(boundaryNote, /后端代理/)
assert.equal(signer.boundaryNote, boundaryNote)
const proxied = createProxyAwareSigner({ secretId: 'sid', secretKey: 'skey', useProxy: true })
assert.deepEqual(await proxied.headers(), {})
console.log('fcSignature OK')
```

- [ ] **Step 2: 确认测试失败**

Run: `cd /d d:\gkproject\fusion-comm-demo && node --experimental-strip-types scripts/test-fc-signature.mjs`
Expected: FAIL（`Cannot find module .../fcSignature.ts`）

- [ ] **Step 3: 实现适配器**

```ts
// src/adapters/fcSignature.ts
import { buildAuthHeaders } from '../api/sign'

/** 回流边界：产品化后申讯签名由后端代理生成，浏览器不再持有密钥。 */
export const boundaryNote =
  '产品化回流后：X-CR-Signature 由后端代理生成，浏览器零密钥；本地 demo 仅在 REAL 演示态保留直连签名。'

export interface FcSignerOptions {
  secretId: string
  secretKey: string
  /** true 表示签名交由平台后端代理；本地 demo 传 false 走演示态直连。 */
  useProxy: boolean
}

export interface FcSigner {
  headers(): Promise<Record<string, string>>
  readonly boundaryNote: string
}

/** useProxy=true 时不读浏览器密钥，返回空头，由后端代理补签（本阶段 demo 不触发）。 */
export function createProxyAwareSigner(opts: FcSignerOptions): FcSigner {
  return {
    async headers(): Promise<Record<string, string>> {
      if (opts.useProxy) return {}
      return buildAuthHeaders(opts.secretId, opts.secretKey)
    },
    boundaryNote
  }
}
```

- [ ] **Step 4: 确认测试通过**

Run: `cd /d d:\gkproject\fusion-comm-demo && node --experimental-strip-types scripts/test-fc-signature.mjs`
Expected: `fcSignature OK`

- [ ] **Step 5: 类型检查仍绿**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: `BUILD SUCCESS`（含 `vue-tsc -b`）

- [ ] **Step 6: 提交**

```bash
cd /d d:\gkproject\fusion-comm-demo
git add src/adapters/fcSignature.ts scripts/test-fc-signature.mjs
git commit -m "feat(shared): 新增申讯签名适配器并声明后端代理回流边界"
```

---

### Task 3: 新增服务层 `communication.ts`

**Files:**
- Create: `d:/gkproject/fusion-comm-demo/src/services/communication.ts`
- Modify: 无
- Test: 复用 `scripts/test-envelope.mjs`（Task 1），本任务只做类型层封装

**Interfaces:**
- Consumes: `src/api/client.ts` 的 `fcPost` 与 `ApiResponse<T>`；`src/api/endpoints.ts` 的 `EP`；`src/services/envelope.ts` 的 `unwrapBody`/`unwrapRows`
- Produces（`communicationApi` 对象方法名，页面依赖）:
  - 查询：`queryRegions(p?)`、`queryTerminals(p)`、`cameras(p?)`、`previewUrl(p)`、`recordsQuery(p?)`、`recordAsr(p)`、`recordStartSummary(p)`、`recordGetSummaryStatus(p)`、`syncBroadcastGroup(p?)`、`syncBroadcastTerminals(p?)`、`syncSmsTemplateList()`
  - 场景 mock：`sceneEnterprises()`、`sceneCameras()`、`scenePatchTasks()`
  - 操作：`terminalOperator(p)`、`linkTaskSend(p)`、`sosAdd(p)`、`sosConfirm(p)`、`broadcastCommand(ep,p)`、`appEventReport(p)`、`eventSubscription(p)`、`eventUnSubscription(p)`
  - 所有方法返回 `Promise<ApiResponse<T>>`，保持原包络，由页面按需取 `res.rows`/`res.row`/`res.data` 或忽略

- [ ] **Step 1: 实现服务层封装**

```ts
// src/services/communication.ts
import { fcPost, type ApiResponse } from '../api/client'
import { EP } from '../api/endpoints'
export { unwrapBody, unwrapRows } from './envelope'

type Params = Record<string, unknown>

export const communicationApi = {
  // 组织 / 通讯录
  queryRegions: (p: Params = {}) => fcPost(EP.queryRegions, p),
  queryTerminals: (p: Params) => fcPost(EP.queryTerminals, p),
  // 视频
  cameras: (p: Params = {}) => fcPost(EP.cameras, p),
  previewUrl: (p: Params) => fcPost(EP.previewUrl, p),
  // 录音 / 转写 / 摘要
  recordsQuery: (p: Params = {}) => fcPost(EP.recordsQuery, p),
  recordAsr: (p: Params) => fcPost(EP.recordAsr, p),
  recordStartSummary: (p: Params) => fcPost(EP.recordStartSummary, p),
  recordGetSummaryStatus: (p: Params) => fcPost(EP.recordGetSummaryStatus, p),
  // 广播
  syncBroadcastGroup: (p: Params = {}) => fcPost(EP.syncBroadcastGroup, p),
  syncBroadcastTerminals: (p: Params = {}) => fcPost(EP.syncBroadcastTerminals, p),
  syncSmsTemplateList: () => fcPost(EP.syncSmsTemplateList, {}),
  broadcastCommand: (ep: string, p: Params) => fcPost(ep, p),
  // 电话 / 会议（受控下行业务入口，回流后由后端代理签名）
  terminalOperator: (p: Params) => fcPost(EP.terminalOperator, p),
  // 联动通知
  linkTaskSend: (p: Params) => fcPost(EP.linkTaskSend, p),
  // 报警联动
  sosAdd: (p: Params) => fcPost(EP.sosAdd, p),
  sosConfirm: (p: Params) => fcPost(EP.sosConfirm, p),
  // App
  appEventReport: (p: Params) => fcPost(EP.appEventReport, p),
  // 事件订阅
  eventSubscription: (p: Params) => fcPost(EP.eventSubscription, p),
  eventUnSubscription: (p: Params) => fcPost(EP.eventUnSubscription, p),
  // 场景拟真数据（mock 专用路径，回流时替换为后端端点）
  sceneEnterprises: () => fcPost('__scene__/enterprises', {}),
  sceneCameras: () => fcPost('__scene__/cameras', {}),
  scenePatchTasks: () => fcPost('__scene__/patchTasks', {})
} as const
```

- [ ] **Step 2: 类型检查**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: `BUILD SUCCESS`

- [ ] **Step 3: 提交**

```bash
cd /d d:\gkproject\fusion-comm-demo
git add src/services/communication.ts
git commit -m "feat(shared): 新增融合通信服务层收口页面直连接口"
```

---

### Task 4: 页面改造——4 个基础能力页

**Files:**
- Modify: `src/views/Phone.vue`, `src/views/Broadcast.vue`, `src/views/InfoPublish.vue`, `src/views/Emergency.vue`

**Interfaces:**
- Consumes: Task 3 的 `communicationApi`
- Produces: 页面不再 `import { fcPost }`，行为与返回值消费不变

- [ ] **Step 1: 全局替换 import 与调用前缀（4 文件）**

对 `Phone.vue` / `Broadcast.vue` / `InfoPublish.vue` / `Emergency.vue` 逐一：
- 删除 `import { fcPost } from '@/api/client'`
- 新增 `import { communicationApi as api } from '@/services/communication'`
- 把所有 `fcPost(` 替换为 `api.<对应方法>(`，映射规则：

| 原调用 | 替换为 |
|---|---|
| `fcPost(EP.queryRegions` | `api.queryRegions(` |
| `fcPost(EP.queryTerminals` | `api.queryTerminals(` |
| `fcPost(EP.syncBroadcastGroup` | `api.syncBroadcastGroup(` |
| `fcPost(EP.syncBroadcastTerminals` | `api.syncBroadcastTerminals(` |
| `fcPost(EP.startTtsTask/stopTask/setVolume/incVolume/decVolume` 等动态 `ep` | `api.broadcastCommand(ep, ` |
| `fcPost(EP.linkTaskSend` | `api.linkTaskSend(` |
| `fcPost(EP.appEventReport` | `api.appEventReport(` |
| `fcPost(EP.sosAdd` | `api.sosAdd(` |
| `fcPost(EP.sosConfirm` | `api.sosConfirm(` |
| `fcPost(EP.recordsQuery` | `api.recordsQuery(` |
| `fcPost(EP.recordAsr` | `api.recordAsr(` |
| `fcPost(EP.recordStartSummary` | `api.recordStartSummary(` |
| `fcPost(EP.recordGetSummaryStatus` | `api.recordGetSummaryStatus(` |

- 若文件仍 `import { EP }`（仅 `Broadcast.vue` 动态 ep 需要），保留其余删除；`EP` 只用于取路径常量时改为 `api.broadcastCommand(EP.xxx, {...})`。
- 返回值消费表达式（`res.rows` / `res.row` / `res.data` / 忽略）**一律不动**。

- [ ] **Step 2: 确认无遗漏直连**

Run: `cd /d d:\gkproject\fusion-comm-demo && findstr /n /s "fcPost" src\views\Phone.vue src\views\Broadcast.vue src\views\InfoPublish.vue src\views\Emergency.vue`
Expected: 仅输出空或注释行，无实际 `fcPost(` 调用

- [ ] **Step 3: 类型检查**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: `BUILD SUCCESS`

- [ ] **Step 4: 提交**

```bash
cd /d d:\gkproject\fusion-comm-demo
git add src/views/Phone.vue src/views/Broadcast.vue src/views/InfoPublish.vue src/views/Emergency.vue
git commit -m "feat(screen): 基础能力页改走通信服务层"
```

---

### Task 5: 页面改造——5 个场景页

**Files:**
- Modify: `src/views/scenarios/Scene01Meeting.vue`, `Scene02Patrol.vue`, `Scene03Report.vue`, `Scene04Consult.vue`, `Scene05Gis.vue`

**Interfaces:**
- Consumes: Task 3 的 `communicationApi`
- Produces: 场景页不再 `import { fcPost }`，`Promise.all` 并发语义保留，4 种返回消费形态不变

- [ ] **Step 1: 逐文件替换 import 与调用**

对每个场景页：删除 `import { fcPost } from '@/api/client'`（若 `EP` 不再使用则一并删除），新增 `import { communicationApi as api } from '@/services/communication'`。调用映射：

| 文件 | 原调用 | 替换为 |
|---|---|---|
| Scene01Meeting | `fcPost(EP.terminalOperator` (×2) | `api.terminalOperator(` |
| Scene01Meeting | `fcPost('__scene__/enterprises'` | `api.sceneEnterprises()` |
| Scene02Patrol | `fcPost(EP.previewUrl` | `api.previewUrl(` |
| Scene02Patrol | `fcPost(EP.terminalOperator` | `api.terminalOperator(` |
| Scene02Patrol | `fcPost('__scene__/cameras'` / `'__scene__/patchTasks'`（`Promise.all` 内） | `api.sceneCameras()` / `api.scenePatchTasks()` |
| Scene03Report | `fcPost(EP.sosAdd` | `api.sosAdd(` |
| Scene03Report | `fcPost(EP.cameras` / `EP.previewUrl` | `api.cameras(` / `api.previewUrl(` |
| Scene03Report | `fcPost(EP.linkTaskSend` (×2) | `api.linkTaskSend(` |
| Scene04Consult | `fcPost(EP.terminalOperator` (×2) | `api.terminalOperator(` |
| Scene04Consult | `fcPost(EP.cameras` / `EP.previewUrl` | `api.cameras(` / `api.previewUrl(` |
| Scene04Consult | `fcPost('__scene__/enterprises'` | `api.sceneEnterprises()` |
| Scene05Gis | `fcPost(EP.queryTerminals` | `api.queryTerminals(` |
| Scene05Gis | `fcPost(EP.terminalOperator` | `api.terminalOperator(` |
| Scene05Gis | `fcPost(EP.previewUrl` | `api.previewUrl(` |

- `Scene02Patrol.vue` 的 `Promise.all([...])` 保持两方法并发，不得改串行。
- `res.row`（queryTerminals 单数）消费保持原样（服务层不改写包络）。

- [ ] **Step 2: 确认无遗漏直连**

Run: `cd /d d:\gkproject\fusion-comm-demo && findstr /n /s "fcPost" src\views\scenarios\*.vue`
Expected: 无 `fcPost(` 调用

- [ ] **Step 3: 类型检查 + 构建**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: `BUILD SUCCESS`

- [ ] **Step 4: 提交**

```bash
cd /d d:\gkproject\fusion-comm-demo
git add src/views/scenarios/
git commit -m "feat(screen): 业务场景页改走通信服务层"
```

---

### Task 6: 全仓守门测试与浏览器实证

**Files:**
- Test: `scripts/test-envelope.mjs`, `scripts/test-fc-signature.mjs`
- Evidence: `engineering/qa/2026-11-18-fusion-comm-productization.md`（本阶段验收记录）

**Interfaces:**
- Consumes: Task 1-5 全部产出
- Produces: 验收结论文档

- [ ] **Step 1: 跑纯函数测试**

Run: `cd /d d:\gkproject\fusion-comm-demo && node --experimental-strip-types scripts/test-envelope.mjs && node --experimental-strip-types scripts/test-fc-signature.mjs`
Expected: 依次输出 `envelope OK`、`fcSignature OK`

- [ ] **Step 2: 跑全量断言扫描**

Run: `cd /d d:\gkproject\fusion-comm-demo && findstr /n /s "fcPost(" src\views\*.vue src\views\scenarios\*.vue`
Expected: 无输出（所有页面直连已收口）

- [ ] **Step 3: 类型检查 + 生产构建**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: `BUILD SUCCESS`

- [ ] **Step 4: 浏览器实证**

启动 dev server（`npm run dev`，记实际端口），用 playwright 走：
- 10 项导航逐项点击，零页面错误
- 场景 01-05 各走一遍「业务流程」页签关键交互（发起会议、点播、接报、会商、调度），观察「角色动作」页签 LIVE 行出现
- 截图存 `engineering/qa/`（被 .gitignore 忽略，不入库）

- [ ] **Step 5: 写验收记录**

新建 `engineering/qa/2026-11-18-fusion-comm-productization.md`，记录：测试命令与输出、build 结果、浏览器实证结论、遗留项（阶段二/三未在本仓执行）。

- [ ] **Step 6: 提交**

```bash
cd /d d:\gkproject\fusion-comm-demo
git add scripts/test-envelope.mjs scripts/test-fc-signature.mjs engineering/qa/2026-11-18-fusion-comm-productization.md
git commit -m "docs: 记录融合通信产品化阶段一验收"
```

---

### Task 7: 四件套归档（阶段一验收通过后）

**Files:**
- Modify: `openspec/changes/2026-11-18-fusion-comm-productization/tasks.md`（勾选阶段零/一）
- Create: `openspec/specs/fusion-comm-demo/spec.md`（从 `spec-delta.md` 回填）
- Move: `openspec/changes/2026-11-18-fusion-comm-productization/` → `openspec/archive/2026-11-18-fusion-comm-productization/`

**Interfaces:**
- Consumes: Task 1-6 全部通过
- Produces: 已归档 Change 与回填 spec

- [ ] **Step 1: 勾选 tasks.md 阶段零与阶段一的完成项**，阶段二/三保留未勾（另开 Change）。

- [ ] **Step 2: 回填 spec**，把 `spec-delta.md` 的 ADDED Requirements 写入 `openspec/specs/fusion-comm-demo/spec.md`，用 WHEN/THEN 同构格式。

- [ ] **Step 3: 归档 Change**

```bash
cd /d d:\gkproject\fusion-comm-demo
mkdir openspec\archive
git mv openspec\changes\2026-11-18-fusion-comm-productization openspec\archive\2026-11-18-fusion-comm-productization
git add -A
git commit -m "docs: 归档融合通信产品化阶段一变更并回填规格"
```

- [ ] **Step 4: 写复盘**，新建 `engineering/retro/2026-11-18-fusion-comm-productization.md`，记录阶段一经验与阶段二/三交接事项。

---

## 阶段二/三交接（不在本计划执行）

- **阶段二（脚手架）**：另开 Change，`docs/api/communication.openapi.json` 扩端点 → 契约先绿先推 → `gen:api-types` → `subapps/fm-communication` 迁入场景工作区 → `build:subapps`。详见提案 `design.md` §契约改造范围。
- **阶段三（后端，L4）**：另开 Change，Communication Controller/Service/DTO + 受控下行白名单（不放宽 `HardControlPaths`）+ 三方言迁移 + 权限种子 + jacoco ≥0.80。须先过白名单端点清单的人工确认。

## Self-Review 对照

- `proposal.md` Capabilities `fusion-comm-demo` → Task 1-5 实现、Task 6 验证。
- `spec-delta.md` 三条 ADDED → Task 1（包络）、Task 2（签名边界）、Task 4-5（页面收口）与阶段二/三交接段。
- 类型一致性：`unwrapBody`/`unwrapRows`/`communicationApi` 方法名在 Task 1/3/4/5 完全一致。



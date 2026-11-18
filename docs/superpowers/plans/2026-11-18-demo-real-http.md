# Demo 默认真实 HTTP 调用 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 demo 的 `/openapi/*` 调用从默认 mock 切换为默认真实 `fetch` + V1.3 签名，3 个 `__scene__/*` 伪端点映射到真实接口并适配字段，保留 `VITE_FC_MOCK=true` 显式回退。

**Architecture:** `config.ts` 是模式单一真源（仅 `VITE_FC_MOCK==='true'` 启用 mock）；`client.ts` 的 `fcPost` 按模式分发到 mock 或 `fetch` + `buildAuthHeaders`，真实分支校验 HTTP 状态与业务 `code`；`services/communication.ts` 把 3 个场景调用改为真实端点 + 字段适配层，使页面字段访问零改动。`sign.ts` 签名逻辑不动。

**Tech Stack:** Vue 3 + TypeScript + Vite 5 + Element Plus + Pinia；无新增依赖；申讯 OpenAPI V1.3（HTTP POST + JSON + `X-CR-*` 签名）。

## Global Constraints

- 默认真实模式：`mock` 仅由 `VITE_FC_MOCK === 'true'` 决定，不从 `VITE_FC_BASE_URL` 推断。
- 签名协议不变：`X-CR-Signature = sha256(secretId + '&' + timestamp + '&' + secretKey)`，秒级时间戳，每次请求重算。
- 所有 34 个 `/openapi/*` 端点保持 `fcPost` 调用形态；页面不改调用名（`sceneEnterprises/sceneCameras/scenePatchTasks` 保留）。
- 映射字段必须满足 `src/types/scenario.ts` 的 `Enterprise` / `PatchTask` 与 `Scene02Patrol.vue` 内联 camera 类型，页面字段访问零改动。
- `.env.local` 必须保持 gitignore（已确认 `.gitignore:4`）；`.env.example` 不含真实值。
- 提交格式遵循 demo 仓惯例：`docs:` / `feat:` / `fix:` 无 scope，单行中文 message，body 为空。
- 完成后即刻写 `engineering/qa/` 与 `engineering/retro/`，不攒到最后补。

---

### Task 1: 运行模式反转与配置模板

**Files:**
- Modify: `src/api/config.ts:16-30`
- Modify: `src/env.d.ts:9-14`
- Create: `.env.example`

**Interfaces:**
- Consumes: 无（首任务）
- Produces: `FC_CONFIG.mock: boolean`（默认 false，仅 `VITE_FC_MOCK==='true'` 为 true）；`FC_CONFIG.baseUrl/wsUrl/secretId/secretKey` 不变

- [ ] **Step 1: 改 config.ts 的 mock 判定**

把 `src/api/config.ts` 中：
```ts
  mock: !import.meta.env.VITE_FC_BASE_URL,
```
改为：
```ts
  mock: import.meta.env.VITE_FC_MOCK === 'true',
```
并把顶部注释块中「MOCK 模式（默认）」「REAL 模式：改为环境变量」改为「默认真实模式；显式 `VITE_FC_MOCK=true` 回退本地模拟」。

- [ ] **Step 2: 改 env.d.ts 增加类型**

在 `ImportMetaEnv` 接口中新增一行：
```ts
  readonly VITE_FC_MOCK?: string
```

- [ ] **Step 3: 创建 .env.example**

新建 `.env.example`，内容：
```
# 复制为 .env.local 后填写；.env.local 已被 gitignore，请勿提交真实密钥
# 是否启用本地 mock（默认真实模式，不设此项即真实）
VITE_FC_MOCK=false
# 申讯融合平台地址，例如 http://192.168.1.100:8080
VITE_FC_BASE_URL=
# 事件推送 WebSocket 地址（本 demo 暂用定时器模拟，可留空）
VITE_FC_WS_URL=
# 平台申请的鉴权密钥
VITE_FC_SECRET_ID=
VITE_FC_SECRET_KEY=
```

- [ ] **Step 4: 验证构建**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: BUILD 成功（type-check 通过）；此时页面默认真实态，无 env 时运行会请求失败（预期行为）。

- [ ] **Step 5: 提交**

```bash
git add src/api/config.ts src/env.d.ts .env.example
git commit -m "feat: Demo 默认走真实 HTTP 并保留显式 mock 回退"
```

---

### Task 2: 真实分支业务错误码校验

**Files:**
- Modify: `src/api/client.ts:20-37`

**Interfaces:**
- Consumes: `buildAuthHeaders`（sign.ts）、`FC_CONFIG`（config.ts）、`mockRequest`（mock/handler.ts）
- Produces: `fcPost` 真实分支在 `code !== 0` 时抛 `Error`，错误信息含 `msg` 与 `code`

- [ ] **Step 1: 改 fcPost 真实分支校验**

把 `src/api/client.ts` 的 `fcPost` 函数体替换为：
```ts
export async function fcPost<T = unknown>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<ApiResponse<T>> {
  if (FC_CONFIG.mock) {
    return mockRequest(path, params) as Promise<ApiResponse<T>>
  }
  const headers = await buildAuthHeaders(FC_CONFIG.secretId, FC_CONFIG.secretKey)
  const resp = await fetch(`${FC_CONFIG.baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  })
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
  }
  const body = (await resp.json()) as ApiResponse<T>
  if (body.code !== 0) {
    throw new Error(body.msg || `API_ERROR_${body.code}`)
  }
  return body
}
```

- [ ] **Step 2: 验证构建**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: BUILD 成功。

- [ ] **Step 3: 提交**

```bash
git add src/api/client.ts
git commit -m "fix: 真实模式响应业务码非0时抛出可读错误"
```

---

### Task 3: 场景端点映射真实接口

**Files:**
- Modify: `src/services/communication.ts:12-45`
- Modify: `src/api/mock/handler.ts:214-227`（仅加注释标注 mock 回退态专用）

**Interfaces:**
- Consumes: `fcPost`（client.ts）、`EP`（endpoints.ts）、`ApiResponse`（client.ts）
- Produces: `communicationApi.sceneEnterprises/sceneCameras/scenePatchTasks` 仍返回 `Promise<ApiResponse>`，`rows` 分别为 `Enterprise[]` / Camera[] / `PatchTask[]`

- [ ] **Step 1: 改 communication.ts 引入类型并新增适配函数**

在文件顶部 import 后新增：
```ts
import type { Enterprise, PatchTask } from '../types/scenario.ts'
import type { Region, CallRecordItem } from '../types/index.ts'
```
（`../types/index.ts` 只导出 `Region` / `CallRecordItem`，不导出 `Camera`；监控点用下方内联类型 `CameraRow = { camIndex?: string; name?: string; status?: number; linkType?: number }`。）

在 `communicationApi` 定义之前新增三个适配函数：
```ts
const CALL_TYPE: Record<number, string> = {
  0: '电话录音', 1: '呼入未接', 2: '呼入已接', 3: '呼出通话', 4: 'MCU 接续', 5: '断线通话'
}

function toEnterprise(r: Region): Enterprise {
  const terminals = String((r as unknown as { terminals?: string }).terminals ?? '')
  return {
    id: r.regionId,
    name: r.regionName,
    hasTerminal: Number(r.totalTerminals ?? 0) > 0,
    contact: '—',
    phone: terminals.split(',')[0] || r.regionId,
    lng: 0,
    lat: 0,
    status: '未通知'
  }
}

type CameraRow = { camIndex?: string; name?: string; status?: number; linkType?: number }
function toCamera(c: CameraRow) {
  return { cameraId: c.camIndex ?? '', name: c.name ?? '', status: c.status ?? c.linkType ?? 0 }
}

function toPatchTask(r: CallRecordItem, i: number): PatchTask {
  return {
    id: r.url || `${r.callerNum}-${r.destination}-${r.startTime}-${i}`,
    type: CALL_TYPE[r.callType] ?? '通话记录',
    location: `${r.callerNum}→${r.destination}`,
    owner: r.callerNum,
    monitor: r.destination,
    status: '待核查',
    evidence: false
  }
}
```

- [ ] **Step 2: 改三个场景方法的实现**

把 `communicationApi` 中：
```ts
  sceneEnterprises: () => fcPost('__scene__/enterprises', {}),
  sceneCameras: () => fcPost('__scene__/cameras', {}),
  scenePatchTasks: () => fcPost('__scene__/patchTasks', {})
```
替换为：
```ts
  sceneEnterprises: async () => {
    const res = await fcPost(EP.queryRegions, { pageNum: 1, pageSize: 50 })
    return { ...res, rows: ((res.rows ?? []) as Region[]).map(toEnterprise) }
  },
  sceneCameras: async () => {
    const res = await fcPost(EP.cameras, { pageNum: 1, pageSize: 50 })
    return { ...res, rows: ((res.rows ?? []) as CameraRow[]).map(toCamera) }
  },
  scenePatchTasks: async () => {
    const res = await fcPost(EP.recordsQuery, { pageNum: 1, pageSize: 50 })
    return { ...res, rows: ((res.rows ?? []) as CallRecordItem[]).map(toPatchTask) }
  }
```

同时把文件头注释「场景拟真数据（mock 专用路径，回流时替换为后端端点）」改为「场景数据：真实接口 + 字段适配（mock 回退态由 handler.ts 提供 __scene__/*）」。

- [ ] **Step 3: mock 分发器标注**

在 `src/api/mock/handler.ts` 的 `__scene__/enterprises` / `__scene__/cameras` / `__scene__/patchTasks` 三个 case 前加注释：
```ts
    // 仅 mock 回退态（VITE_FC_MOCK=true）使用；真实态由 services/communication.ts 映射真实端点
```

- [ ] **Step 4: 验证构建**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: BUILD 成功，无 type 错误。

- [ ] **Step 5: 提交**

```bash
git add src/services/communication.ts src/api/mock/handler.ts
git commit -m "feat: 场景数据改由真实接口映射并提供字段适配"
```

---

### Task 4: 场景页面字段消费核对与 README 更新

**Files:**
- Verify: `src/views/scenarios/Scene01Meeting.vue`、`Scene02Patrol.vue`、`Scene04Consult.vue`
- Modify: `README.md:70-90`

**Interfaces:**
- Consumes: `communicationApi.sceneEnterprises/sceneCameras/scenePatchTasks`（Task 3 产出）
- Produces: 页面字段访问与映射一致；README 运行说明反映默认真实 + mock 回退

- [ ] **Step 1: 核对 Scene01/Scene04 字段**

读取两个页面，确认 `Enterprises` 只访问 `id/name/hasTerminal/phone/contact`（`Scene01Meeting.vue:34,37,47,78,84`；`Scene04Consult.vue:19`）。若发现访问 `lng/lat/status` 之外字段，按 `Enterprise` 类型补映射；否则零改动。

- [ ] **Step 2: 核对 Scene02 字段**

确认 `Scene02Patrol.vue:25-26,35,97` 中 camera 只访问 `cameraId/name/status`，PatchTask 只访问 `id/type/location/monitor/status/evidence`。若一致则零改动。

- [ ] **Step 3: 更新 README 运行说明**

把 `README.md` 中「`config.ts` 检测到 `VITE_FC_BASE_URL` 后自动进入真实模式」相关段落改为：
```
默认进入真实模式，`fcPost` 以 fetch + V1.3 签名直连 `VITE_FC_BASE_URL`。
无真实平台时，在 `.env.local` 设 `VITE_FC_MOCK=true` 回退本地模拟，顶栏角标显示 MOCK。
复制 `.env.example` 为 `.env.local` 后填写地址与密钥；`.env.local` 已被 gitignore。
```

- [ ] **Step 4: 验证构建**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: BUILD 成功。

- [ ] **Step 5: 提交**

```bash
git add README.md
git commit -m "docs: 更新 README 说明默认真实模式与 mock 回退"
```
（若 Step 1/2 发现页面需改，把对应 .vue 一并加入本次提交并在 message 中说明。）

---

### Task 5: 守门、QA 与归档

**Files:**
- Create: `engineering/qa/2026-11-18-demo-real-http.md`
- Create: `engineering/retro/2026-11-18-demo-real-http.md`
- Modify: `openspec/specs/fusion-comm-demo/spec.md`
- Move: `openspec/changes/2026-11-18-demo-real-http/*` → `openspec/archive/2026-11-18-demo-real-http/`

**Interfaces:**
- Consumes: Task 1-4 全部产出
- Produces: 归档后的 Change、回填后的 spec、QA/retro 记录

- [ ] **Step 1: 全量守门**

Run: `cd /d d:\gkproject\fusion-comm-demo && npm run build`
Expected: BUILD 成功。

- [ ] **Step 2: mock 回退态可启动验证**

Run: `cd /d d:\gkproject\fusion-comm-demo && set VITE_FC_MOCK=true && npm run dev`
Expected: dev server 启动，浏览器访问根路径可见侧边栏 LIVE/MOCK 角标为 MOCK，场景页有数据（本地 mock）。验证后关掉进程。

- [ ] **Step 3: 写 QA 记录**

新建 `engineering/qa/2026-11-18-demo-real-http.md`，记录：分支、目标、模式反转/错误码/端点映射/页面字段核对的完成情况，`npm run build` 结果，mock 回退态启动验证结果，未做真实平台实证的原因（无 env/无地址密钥），遗留项（真实 WS 事件订阅、真实写端点副作用验证）。

- [ ] **Step 4: 写 retro 记录**

新建 `engineering/retro/2026-11-18-demo-real-http.md`，记录：做对了什么（先四件套再实现、字段映射对照类型定义避免页面缺字段）、踩坑与修正（设计初稿字段不全，自审补全）、遗留与交接。

- [ ] **Step 5: 回填 spec**

在 `openspec/specs/fusion-comm-demo/spec.md` 按 `spec-delta.md` 的 ADDED/MODIFIED Requirements 回填：默认真实 HTTP 调用链、显式 mock 回退、场景数据映射真实接口。保持原有 Requirement 结构风格。

- [ ] **Step 6: 归档 Change**

```bash
git mv openspec/changes/2026-11-18-demo-real-http openspec/archive/2026-11-18-demo-real-http
git add engineering/qa/2026-11-18-demo-real-http.md engineering/retro/2026-11-18-demo-real-http.md openspec/specs/fusion-comm-demo/spec.md
git commit -m "docs: 归档 Demo 真实 HTTP 调用变更并回填规格与复盘"
```

---

## Self-Review

- **Spec coverage**：proposal 的 5 项 What Changes 全部有对应 Task（1/2/3/4/5）；spec-delta 的 3 个 ADDED Scenario 对应 Task 3；默认真实 + mock 回退对应 Task 1；错误码对应 Task 2。
- **Placeholder scan**：无 TBD/TODO；所有代码步骤均给出完整代码或明确命令。
- **Type consistency**：`toEnterprise` 返回 `Enterprise`（id/name/hasTerminal/contact/phone/lng/lat/status）；`toCamera` 返回 `{cameraId,name,status}` 与 Scene02 内联类型一致；`toPatchTask` 返回 `PatchTask`（id/type/location/owner/monitor/status/evidence）；三个方法名与页面调用名一致。

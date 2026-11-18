# 场景驱动导航重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 侧边栏改为纯场景主线（平时 2 + 战时 3 共 5 场景），删除"基础能力"并列分组；5 个基础能力 view 改造为场景页"支撑能力"页签的内嵌组件，旧页面与路由彻底删除。

**Architecture:** `ScenarioMeta.capabilities` 是场景→能力映射的单一真源（`scenes/meta.ts`）；`ScenarioShell` 新增第 6 页签按该字段用 `<component :is>` 动态渲染 `src/components/capabilities/*`；能力组件由原 view 经 `git mv` 改造而来（保留 script/store/service 逻辑，仅删页面级 `page-head`）。共享 `useCommStore`，调用链与签名不变。

**Tech Stack:** Vue 3 + TypeScript + Vite 5 + Element Plus + Pinia + ECharts；无新增依赖。

## Global Constraints

- 侧边栏只保留 2 组场景（平时·日常管理 2 项 + 战时·应急指挥 3 项），不再有"基础能力"分组。
- 默认首页 `/` 与通配兜底统一指向 `/scene/01-meeting`；旧的 5 条能力路由全部删除。
- 能力组件内嵌后保持原交互（store/service/mock 逻辑不变），只删页面级 `page-head` 外壳。
- 场景→能力映射以 `scenes/meta.ts` 的 `capabilities` 字段为真源，映射值：01→phone；02→emergency；03→emergency+publish；04→phone+emergency；05→overview+emergency+broadcast。
- 不补场景 06-08、不加"事后"分组、不改签名/调用链/接口映射、保留 mock 回退。
- 提交格式：demo 仓 `docs:`/`feat:`/`fix:` 无 scope，单行中文 message，body 空。
- 完成后即刻写 `engineering/qa/` 与 `engineering/retro/`，不攒到最后补。
- shell 环境注意：本仓库 git/npm 命令在某些 shell 上下文报"系统找不到指定的路径"，统一用 `git -C "d:\gkproject\fusion-comm-demo"` 绝对路径形式；npm 用 `cd d:\gkproject\fusion-comm-demo; npm run build`。

---

### Task 1: 能力组件抽取（git mv + 删 page-head）

**Files:**
- Rename: `src/views/Dashboard.vue` → `src/components/capabilities/OverviewBoard.vue`
- Rename: `src/views/Phone.vue` → `src/components/capabilities/PhoneDispatch.vue`
- Rename: `src/views/Broadcast.vue` → `src/components/capabilities/BroadcastAudio.vue`
- Rename: `src/views/InfoPublish.vue` → `src/components/capabilities/InfoPublish.vue`
- Rename: `src/views/Emergency.vue` → `src/components/capabilities/EmergencyLink.vue`

**Interfaces:**
- Consumes: 原 view 的全部 script 逻辑、`useCommStore`、`services/communication`、`api/mock/data`
- Produces: 5 个无 props 的自包含能力组件，默认导出，模板根为 `<div>` 且仅含能力内容（无 page-head）

- [ ] **Step 1: 建 capabilities 目录并 git mv 五个文件**

```bash
mkdir "d:\gkproject\fusion-comm-demo\src\components\capabilities"
git -C "d:\gkproject\fusion-comm-demo" mv src/views/Dashboard.vue src/components/capabilities/OverviewBoard.vue
git -C "d:\gkproject\fusion-comm-demo" mv src/views/Phone.vue src/components/capabilities/PhoneDispatch.vue
git -C "d:\gkproject\fusion-comm-demo" mv src/views/Broadcast.vue src/components/capabilities/BroadcastAudio.vue
git -C "d:\gkproject\fusion-comm-demo" mv src/views/InfoPublish.vue src/components/capabilities/InfoPublish.vue
git -C "d:\gkproject\fusion-comm-demo" mv src/views/Emergency.vue src/components/capabilities/EmergencyLink.vue
```
Expected: 5 个文件移动成功（git 识别为 rename）。

- [ ] **Step 2: 删除每个组件的 page-head 块**

对每个新文件，删除 template 内 `<div class="page-head"> ... </div>` 整块（含内部 h1.page-title、p.page-desc、endpoint-note/系统状态标签），保留外层 `<div>` 与其后的能力内容。精确删除范围：

`OverviewBoard.vue`（原 Dashboard.vue:74-80）：
```html
    <div class="page-head">
      <div>
        <h1 class="page-title">态势总览</h1>
        <p class="page-desc">融合通信资源实时状态 · 电话 / 广播 / 对讲 / 应急联动</p>
      </div>
      <el-tag type="success" effect="dark"><span class="dot green" />系统运行正常</el-tag>
    </div>
```

`PhoneDispatch.vue`（原 Phone.vue:90-96）：
```html
    <div class="page-head">
      <div>
        <h1 class="page-title">电话调度</h1>
        <p class="page-desc">一键直通 · 多方会议 · 分级调度（强插 / 强拆 / 监听）</p>
      </div>
      <div class="endpoint-note">POST /openapi/dispatchComm/terminalOperator</div>
    </div>
```

`BroadcastAudio.vue`（原 Broadcast.vue:77-83）：
```html
    <div class="page-head">
      <div>
        <h1 class="page-title">扩音广播</h1>
        <p class="page-desc">指定广播设备或区域进行扩音通讯 · TTS 文字转语音 · 音量控制</p>
      </div>
      <div class="endpoint-note">POST /openapi/broadcast/startTtsTask</div>
    </div>
```

`InfoPublish.vue`（原 InfoPublish.vue:118-124）：
```html
    <div class="page-head">
      <div>
        <h1 class="page-title">信息发布</h1>
        <p class="page-desc">短信推送 · 未回复自动语音升级 · 移动端公告指定范围</p>
      </div>
      <div class="endpoint-note">POST /openapi/linkTask/send · rule 2/3/4/7</div>
    </div>
```

`EmergencyLink.vue`（原 Emergency.vue:93-99）：
```html
    <div class="page-head">
      <div>
        <h1 class="page-title">应急联动与检索</h1>
        <p class="page-desc">一键报警联动 · 全流程录音存储 · 时间戳与关键词快速检索</p>
      </div>
      <div class="endpoint-note">sosLinkage/add · records/query · record/asr</div>
    </div>
```

- [ ] **Step 3: 验证构建**

Run: `cd d:\gkproject\fusion-comm-demo; npm run build`
Expected: **FAIL**（预期，因 router 仍引用已移走的 view 路径）——这是 RED 证据，确认组件抽取与旧引用脱节。若意外 PASS，检查 router 是否已被改动。

- [ ] **Step 4: 提交**

```bash
git -C "d:\gkproject\fusion-comm-demo" add -A src/components/capabilities src/views
git -C "d:\gkproject\fusion-comm-demo" commit -m "feat: 抽出五个基础能力组件到 capabilities 目录"
```

---

### Task 2: 类型与场景元数据（capabilities 字段）

**Files:**
- Modify: `src/types/scenario.ts:33-45`（ScenarioMeta 接口）
- Modify: `src/scenes/meta.ts:1-220`（5 个场景对象各加 capabilities）

**Interfaces:**
- Consumes: Task 1 产出的 5 个组件键名
- Produces: `CapabilityKey` 类型与 `ScenarioMeta.capabilities?: CapabilityKey[]`；`SCENES` 5 项各带 capabilities 数组

- [ ] **Step 1: 在 types/scenario.ts 增加 CapabilityKey 与字段**

在 `export interface ScenarioMeta {` 之前插入：
```ts
export type CapabilityKey = 'overview' | 'phone' | 'broadcast' | 'publish' | 'emergency'
```
在 `ScenarioMeta` 接口内 `boundary` 字段之前插入：
```ts
  capabilities?: CapabilityKey[]
```

- [ ] **Step 2: 在 scenes/meta.ts 导入类型并给 5 场景配 capabilities**

文件顶部 import 行改为（假设当前为 `import type { ScenarioMeta } from '@/types/scenario'`，按实际调整）：
```ts
import type { ScenarioMeta, CapabilityKey } from '@/types/scenario'
```
（若 CapabilityKey 未被直接用作注解，可不 import，用字面量即可；但为可读性与类型约束，建议 import。）

在 `SCENES` 数组的 5 个场景对象里，各在 `stage` 字段之后插入一行：
- 场景 01（`no: '01'`，约 line 5）：`capabilities: ['phone'],`
- 场景 02（`no: '02'`，约 line 56）：`capabilities: ['emergency'],`
- 场景 03（`no: '03'`，约 line 109）：`capabilities: ['emergency', 'publish'],`
- 场景 04（`no: '04'`，约 line 162）：`capabilities: ['phone', 'emergency'],`
- 场景 05（`no: '05'`，约 line 214）：`capabilities: ['overview', 'emergency', 'broadcast'],`

- [ ] **Step 3: 验证构建**

Run: `cd d:\gkproject\fusion-comm-demo; npm run build`
Expected: 仍 FAIL（router 旧引用未删，同 Task 1）；但不应出现 `capabilities` 相关 type 错误。若有 type 错误，修正后再继续。

- [ ] **Step 4: 提交**

```bash
git -C "d:\gkproject\fusion-comm-demo" add src/types/scenario.ts src/scenes/meta.ts
git -C "d:\gkproject\fusion-comm-demo" commit -m "feat: 场景元数据新增支撑能力映射字段"
```

---

### Task 3: ScenarioShell 新增"支撑能力"页签

**Files:**
- Modify: `src/components/scenario/ScenarioShell.vue:1-20`（script）、`:37-111`（tabs）、`:115-124`（style）

**Interfaces:**
- Consumes: Task 2 的 `meta.capabilities: CapabilityKey[]`；Task 1 的 5 个能力组件
- Produces: 第 6 个页签"支撑能力"，按 capabilities 动态渲染对应组件

- [ ] **Step 1: script 增加组件映射与标题**

把 `<script setup>` 块替换为（在原内容基础上增加 import 和映射）：
```ts
import { computed, ref } from 'vue'
import { useCommStore } from '@/stores/comm'
import type { ScenarioMeta, CapabilityKey } from '@/types/scenario'
import OverviewBoard from '@/components/capabilities/OverviewBoard.vue'
import PhoneDispatch from '@/components/capabilities/PhoneDispatch.vue'
import BroadcastAudio from '@/components/capabilities/BroadcastAudio.vue'
import InfoPublish from '@/components/capabilities/InfoPublish.vue'
import EmergencyLink from '@/components/capabilities/EmergencyLink.vue'

const props = defineProps<{ meta: ScenarioMeta }>()
const store = useCommStore()
const active = ref('story')

const capabilityComponents: Record<CapabilityKey, { comp: unknown; title: string }> = {
  overview: { comp: OverviewBoard, title: '态势总览' },
  phone: { comp: PhoneDispatch, title: '电话调度' },
  broadcast: { comp: BroadcastAudio, title: '扩音广播' },
  publish: { comp: InfoPublish, title: '信息发布' },
  emergency: { comp: EmergencyLink, title: '应急联动与检索' }
}
const capabilityList = computed(() =>
  (props.meta.capabilities ?? []).map((key) => ({ key, ...capabilityComponents[key] }))
)

const stageTag: Record<ScenarioMeta['stage'], string> = {
  '平时·日常管理': 'primary',
  '战时·应急指挥': 'danger'
}

const roleRows = computed(() => {
  const base = props.meta.roles.map((r) => ({ ...r, live: false }))
  const live = store.sceneRoleLog.map((r) => ({ ...r, live: true }))
  return [...live, ...base]
})
```

- [ ] **Step 2: 在 tabs 末尾增加第 6 个页签**

在 `</el-tabs>` 之前（"依赖功能"页签之后）插入：
```html
      <el-tab-pane label="支撑能力" name="capabilities">
        <div v-if="capabilityList.length === 0" class="panel">
          <p class="mini muted">本场景无内嵌支撑能力（接口与能力映射见"依赖功能"页签）。</p>
        </div>
        <div v-for="cap in capabilityList" :key="cap.key" class="panel capability-block">
          <h3 class="panel-title">{{ cap.title }}</h3>
          <component :is="cap.comp" />
        </div>
      </el-tab-pane>
```

- [ ] **Step 3: 增加样式**

在 `<style scoped>` 末尾追加：
```css
.capability-block + .capability-block { margin-top: var(--space-md); }
```

- [ ] **Step 4: 验证类型（聚焦 vue-tsc）**

Run: `cd d:\gkproject\fusion-comm-demo; npx vue-tsc -b --noEmit 2>&1 | Select-String -Pattern "ScenarioShell|capabilit|error TS"`
Expected: 无 ScenarioShell/capabilities 相关 type 错误（router 旧引用是 runtime import，不影响 vue-tsc 对组件本身的类型检查）。

- [ ] **Step 5: 提交**

```bash
git -C "d:\gkproject\fusion-comm-demo" add src/components/scenario/ScenarioShell.vue
git -C "d:\gkproject\fusion-comm-demo" commit -m "feat: 场景页新增支撑能力页签并动态渲染能力组件"
```

---

### Task 4: 侧边栏与路由切换为场景主线

**Files:**
- Modify: `src/App.vue:4-8`（icon import）、`:18-44`（groups）、`:46-48`（currentTitle）
- Modify: `src/router/index.ts:1-18`

**Interfaces:**
- Consumes: 无新增（场景路由已存在）
- Produces: 纯场景导航 + 首页指向场景 01 + 旧能力路由删除

- [ ] **Step 1: App.vue 精简 icon import**

把 line 4-8 的 import 改为：
```ts
import {
  Connection, Bell, ArrowDown, Calendar, Location, WarningFilled, VideoCamera, MapLocation
} from '@element-plus/icons-vue'
```
（删除 DataBoard/Phone/VideoPlay/Promotion/Warning——只被"基础能力"分组使用。）

- [ ] **Step 2: App.vue groups 删除基础能力分组**

把 `const groups = [` 到 `]`（line 18-44）替换为只有两组：
```ts
const groups = [
  {
    title: '平时·日常管理',
    items: [
      { path: '/scene/01-meeting', title: '园区多企业远程会议', icon: Calendar },
      { path: '/scene/02-patrol', title: '移动巡检与特殊作业联防', icon: Location }
    ]
  },
  {
    title: '战时·应急指挥',
    items: [
      { path: '/scene/03-report', title: '多渠道接报与应急响应启动', icon: WarningFilled },
      { path: '/scene/04-consult', title: '跨网异构多方视频会商', icon: VideoCamera },
      { path: '/scene/05-gis', title: '二三维GIS融合调度', icon: MapLocation }
    ]
  }
]
```

- [ ] **Step 3: App.vue 默认标题兜底改为场景 01**

把 line 46-48 的 `currentTitle` 改为：
```ts
const currentTitle = computed(() =>
  route.meta.title as string ?? SCENE_BY_PATH[route.path]?.title ?? '园区多企业远程会议'
)
```

- [ ] **Step 4: router/index.ts 删除旧路由并改跳转**

把整个 `routes` 数组替换为：
```ts
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/scene/01-meeting' },
  { path: '/scene/01-meeting', name: 'scene01', component: () => import('@/views/scenarios/Scene01Meeting.vue'), meta: { title: '园区多企业远程会议' } },
  { path: '/scene/02-patrol', name: 'scene02', component: () => import('@/views/scenarios/Scene02Patrol.vue'), meta: { title: '移动巡检与特殊作业联防' } },
  { path: '/scene/03-report', name: 'scene03', component: () => import('@/views/scenarios/Scene03Report.vue'), meta: { title: '多渠道接报与应急响应启动' } },
  { path: '/scene/04-consult', name: 'scene04', component: () => import('@/views/scenarios/Scene04Consult.vue'), meta: { title: '跨网异构多方视频会商' } },
  { path: '/scene/05-gis', name: 'scene05', component: () => import('@/views/scenarios/Scene05Gis.vue'), meta: { title: '二三维GIS融合调度' } },
  { path: '/:pathMatch(.*)*', redirect: '/scene/01-meeting' }
]
```

- [ ] **Step 5: 验证构建（GREEN）**

Run: `cd d:\gkproject\fusion-comm-demo; npm run build`
Expected: **PASS**（Task 1-4 全部完成后，旧 view 引用清除、组件引用正确、`✓ built in ...`）。若仍有 './views/XXX.vue' 找不到，全局搜 `@/views/Dashboard` 等残留引用并清理（各场景 workspace 若有 import 旧 view，改为 import 对应能力组件）。

- [ ] **Step 6: 提交**

```bash
git -C "d:\gkproject\fusion-comm-demo" add src/App.vue src/router/index.ts
git -C "d:\gkproject\fusion-comm-demo" commit -m "feat: 侧边栏与路由改为纯场景主线"
```

---

### Task 5: README 更新

**Files:**
- Modify: `README.md:3`（简介）、`:20-27`（导航表）、`:100-130`（目录结构）

**Interfaces:**
- Consumes: Task 1-4 产出
- Produces: README 反映场景主线导航 + 能力内嵌

- [ ] **Step 1: 更新简介（line 3）**

把"覆盖应急融合通信的 **5 个基础能力页**与《化工园区八大业务场景建设方案》中**前 5 个业务场景页**（平时 2 个 + 战时 3 个）"改为：
"按《化工园区八大业务场景建设方案》的**前 5 个业务场景**组织（平时 2 个 + 战时 3 个），**基础能力作为场景内"支撑能力"页签**内嵌呈现"

- [ ] **Step 2: 更新导航表（line 20-27）**

把"基础能力 | 态势总览、电话调度..."那一行删除，只保留"平时·日常管理"和"战时·应急指挥"两行（内容不变）。

- [ ] **Step 3: 更新目录结构（line 100-130）**

把 `(5 个基础能力页)` 那一行改为 `components/capabilities/  五个支撑能力组件（内嵌到场景页）`，并在 `views/` 下只列 `scenarios/`（5 场景）。

- [ ] **Step 4: 提交**

```bash
git -C "d:\gkproject\fusion-comm-demo" add README.md
git -C "d:\gkproject\fusion-comm-demo" commit -m "docs: README 更新为场景主线导航说明"
```

---

### Task 6: 守门、浏览器实证与归档

**Files:**
- Create: `engineering/qa/2026-11-18-scenario-driven-nav.md`
- Create: `engineering/retro/2026-11-18-scenario-driven-nav.md`
- Create: `openspec/changes/2026-11-18-scenario-driven-nav/{proposal,design,tasks,spec-delta}.md`（补建四件套，design 引用 `docs/superpowers/specs/2026-11-18-scenario-driven-nav-design.md`）
- Modify: `openspec/specs/fusion-comm-demo/spec.md`（回填场景主线导航）

**Interfaces:**
- Consumes: Task 1-5 全部产出
- Produces: 归档后的 Change、QA/retro、回填 spec

- [ ] **Step 1: 全量构建守门**

Run: `cd d:\gkproject\fusion-comm-demo; npm run build`
Expected: PASS。

- [ ] **Step 2: 浏览器实证（playwright）**

确保 dev server 运行中（`http://localhost:5173/`，mock 态）。写脚本 `engineering/qa/evidence/scenario-nav-check.mjs`（若目录被 gitignore 则放 `.git/sdd/`）：
```js
import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'load' })
await page.waitForTimeout(1200)
const body = await page.locator('body').innerText()
const hasBaseGroup = body.includes('基础能力')
const sceneCount = ['园区多企业远程会议','移动巡检与特殊作业联防','多渠道接报与应急响应启动','跨网异构多方视频会商','二三维GIS融合调度'].filter(s => body.includes(s)).length
console.log(JSON.stringify({ hasBaseGroup, sceneCount, urlAfterRoot: page.url(), errors }))
// 逐场景验证支撑能力页签
for (const [path, caps] of [
  ['/scene/01-meeting', ['电话调度']],
  ['/scene/02-patrol', ['应急联动与检索']],
  ['/scene/03-report', ['应急联动与检索','信息发布']],
  ['/scene/04-consult', ['电话调度','应急联动与检索']],
  ['/scene/05-gis', ['态势总览','应急联动与检索','扩音广播']]
]) {
  await page.goto('http://localhost:5173/#' + path, { waitUntil: 'load' })
  await page.waitForTimeout(600)
  await page.getByText('支撑能力', { exact: true }).click()
  await page.waitForTimeout(600)
  const capBody = await page.locator('body').innerText()
  const missing = caps.filter(c => !capBody.includes(c))
  console.log(JSON.stringify({ path, expected: caps, missing, errors: errors.slice(-2) }))
}
await browser.close()
```
Run: `cd d:\gkproject\fusion-comm-demo; node <脚本路径>`
Expected: `hasBaseGroup=false`、`sceneCount=5`、`errors=[]`、每个场景 `missing=[]`。

- [ ] **Step 3: 写 QA 记录**

新建 `engineering/qa/2026-11-18-scenario-driven-nav.md`，记录：分支/基线/目标、Task 1-6 完成情况、`npm run build` 结果、浏览器实证 JSON 结果、未做真实平台实证原因、遗留项（场景 06-08 与事后分组不在范围、能力组件复用共享 store 的观察）。

- [ ] **Step 4: 写 retro 记录**

新建 `engineering/retro/2026-11-18-scenario-driven-nav.md`，记录：做对了什么（先四件套/设计三段确认/场景能力映射为真源）、踩坑（Task 1 RED 构建预期失败确认组件与旧引用脱节、shell 路径问题用 `git -C` 绝对路径解决）、遗留与交接。

- [ ] **Step 5: 补建四件套并回填 spec**

`openspec/changes/2026-11-18-scenario-driven-nav/` 下建四件套：
- `proposal.md`：Why（两套并行导航不符合场景主线）+ What Changes（侧边栏删分组、能力拆组件内嵌、旧页面路由删除）+ Impact
- `design.md`：写"设计见 `docs/superpowers/specs/2026-11-18-scenario-driven-nav-design.md`（已批准）"+ 关键决策摘要（映射表、删除策略）
- `tasks.md`：勾选 Task 1-6 + 提交号
- `spec-delta.md`：MODIFIED Requirement（导航从能力+场景并行改为纯场景主线；基础能力改为场景内嵌）

然后回填 `openspec/specs/fusion-comm-demo/spec.md`：追加"场景驱动导航"Requirement 与 Scenario（纯场景分组、支撑能力页签、旧路由删除）。

- [ ] **Step 6: 归档 Change**

```bash
git -C "d:\gkproject\fusion-comm-demo" mv openspec/changes/2026-11-18-scenario-driven-nav openspec/archive/2026-11-18-scenario-driven-nav
git -C "d:\gkproject\fusion-comm-demo" add -A engineering/qa/2026-11-18-scenario-driven-nav.md engineering/retro/2026-11-18-scenario-driven-nav.md openspec/specs/fusion-comm-demo/spec.md openspec/archive/2026-11-18-scenario-driven-nav
git -C "d:\gkproject\fusion-comm-demo" commit -m "docs: 归档场景驱动导航重构并回填规格与复盘"
```

---

## Self-Review

- **Spec coverage**：设计文档每个要点都有任务——纯场景导航（Task 4）、能力拆组件（Task 1）、映射真源（Task 2）、第 6 页签渲染（Task 3）、README（Task 5）、QA/retro/spec/归档（Task 6）；广播并入场景 05 落在 Task 2 映射；删除旧页面路由在 Task 1+4。
- **Placeholder scan**：无 TBD/TODO；每个代码步骤给出完整代码；浏览器脚本完整。
- **Type consistency**：`CapabilityKey` 在 Task 2 定义为 `'overview'|'phone'|'broadcast'|'publish'|'emergency'`；Task 3 的 `capabilityComponents` 覆盖全部 5 个键；Task 2 的 5 场景 capabilities 数组只用这些键；组件名（OverviewBoard/PhoneDispatch/BroadcastAudio/InfoPublish/EmergencyLink）在 Task 1 与 Task 3 一致。

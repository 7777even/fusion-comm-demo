# 设计：场景驱动导航重构（基础能力并入场景）

## 背景与目标

当前 demo 侧边栏是两套并行结构：`基础能力`（态势/电话/广播/信息发布/应急 5 页，按 OpenAPI 能力域组织，建仓初始骨架）+ `平时·日常管理`（场景 01/02）+ `战时·应急指挥`（场景 03/04/05）。用户指出正确产品逻辑是"按建设方案场景搭建、结合 OpenAPI 接口实现"——基础能力应作为场景的支撑能力，不应与场景平级并列。

目标：侧边栏改为纯场景主线（只保留平时 2 + 战时 3 共 5 个场景），5 个基础能力从独立页面/路由改造为场景页内"支撑能力"页签的内嵌组件。不补场景 06-08、不加"事后"分组、不改调用链/签名/接口映射。

## 架构与数据流

```
侧边栏(纯场景 2 组 5 项) → 场景路由 /scene/01..05
  → ScenarioShell(meta)
      ├─ 原 5 页签：场景故事/卡片/流程/角色动作/依赖功能
      └─ 新增第 6 页签"支撑能力"：按 meta.capabilities 动态渲染内嵌能力组件
           ├─ OverviewBoard / PhoneDispatch / BroadcastAudio / InfoPublish / EmergencyLink
           └─ 共享 useCommStore（事件/SMS 状态），service/mock 调用链不变
```

- `src/components/capabilities/*` 是自包含能力组件（保留原 view 的 script 逻辑与 store/service 依赖），由场景页按需组合。
- 单一真源：`scenes/meta.ts` 的 `ScenarioMeta.capabilities` 决定每个场景内嵌哪些能力组件；`ScenarioShell` 只按此字段渲染，不硬编码场景→组件映射。
- 页面级外壳（`page-head` 标题/endpoint-note）由场景页统一提供，能力组件只负责能力区块内容。

## 组件职责与场景映射

| 组件（新路径） | 来源 view | 内嵌到场景 |
|---|---|---|
| `OverviewBoard.vue` | Dashboard.vue | 05 GIS |
| `PhoneDispatch.vue` | Phone.vue | 01 会议、04 会商 |
| `BroadcastAudio.vue` | Broadcast.vue | 05 GIS |
| `InfoPublish.vue` | InfoPublish.vue | 03 接报 |
| `EmergencyLink.vue` | Emergency.vue | 02 巡检、03 接报、04 会商、05 GIS |

映射理由：会议/会商依赖话务控制（电话调度）；巡检/接报/GIS 依赖 SOS 联动与录音检索（应急联动）；接报要通知（信息发布）；GIS 调度含扩音喊话（广播）与全局态势（态势总览）。广播无全局入口（旧页面已删），并入场景 05。

## 导航与路由变更

- `App.vue`：删除 `groups[0]`（基础能力），默认首页由 `/dashboard` 改为 `/scene/01-meeting`；侧边栏仅剩两组场景。
- `router/index.ts`：删除 `/dashboard` `/phone` `/broadcast` `/publish` `/emergency` 五条路由；根路径 `/` 与旧默认跳转统一指向 `/scene/01-meeting`。
- 删除五个 view 文件（git mv 到 `components/capabilities/` 保留历史，再改造为组件）。
- `README.md`：目录结构、导航说明、"基础能力"表述改为"场景内支撑能力"。

## 类型变更

`src/types/scenario.ts` 的 `ScenarioMeta` 新增：
```ts
capabilities?: CapabilityKey[]   // CapabilityKey = 'overview'|'phone'|'broadcast'|'publish'|'emergency'
```
`scenes/meta.ts` 的 5 个场景对象各配 `capabilities` 数组（按上表映射）。

## 错误处理

能力组件内嵌后，原 `ElMessage` 提示、store 共享、service 调用链（mock 本地 / 真实签名 fetch）全部不变；无新增错误路径。场景切换时组件卸载/重建，ECharts 组件须保留 `onBeforeUnmount` 销毁逻辑（原 Dashboard.vue 已有），避免多次初始化泄漏。

## 测试与验收

- `npm run build`（vue-tsc -b && vite build）通过——本仓唯一守门，无单测框架。
- playwright 浏览器实证：
  - 侧边栏只有 2 组（平时/战时）共 5 场景，无"基础能力"分组
  - 默认进入场景 01
  - 逐个场景切到"支撑能力"页签，渲染出对应组件（01 电话调度、02 应急联动、03 应急联动+信息发布、04 电话调度+应急联动、05 态势+应急联动+广播），无 pageerror
- 无真实平台实证（无密钥），mock 态验证（`.env.local` 的 `VITE_FC_MOCK=true` 保持）。

## 范围边界

- 不做：场景 06-08、"事后·总结提升"分组、调用链/签名/接口映射改动（上一个 Change 已交付）。
- 保留：mock 回退模式、5 个场景的其余 5 个页签与工作区交互、`types/scenario.ts` 其他字段。
- 风险：删除 view + 拆组件是破坏性改动；缓解措施为 git mv 保留历史 + build + 浏览器实证 + 整支审查。

## 人工确认关卡（设计阶段已逐节确认）

- [x] 侧边栏改为纯场景主线，去掉基础能力并列分组
- [x] 基础能力合并进场景页"支撑能力"页签（内嵌组件方式）
- [x] 只重构现有 5 场景，不补 06-08
- [x] 场景→能力按建议映射，广播并入场景 05，不设全局入口
- [x] 彻底删除旧 5 个 view 与路由，逻辑拆进内嵌组件

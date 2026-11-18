# 设计：场景驱动导航重构

> 完整设计见 `docs/superpowers/specs/2026-11-18-scenario-driven-nav-design.md`（用户三段逐段确认后定稿、已批准）。本文只记录关键决策摘要，供归档对照。

## 架构与数据流

```
App.vue 侧边栏（2 组 5 场景）
  → /scene/0X-* 路由 → Scene0X*.vue → ScenarioShell（6 页签）
      ├─ 前 5 页签：原有场景内容（story/roles/... 不变）
      └─ 第 6 页签“支撑能力”：meta.capabilities → <component :is> → components/capabilities/*
                                                                      → 共享 useCommStore → services/communication（原调用链）
```

- `scenes/meta.ts` 的 `ScenarioMeta.capabilities?: CapabilityKey[]` 是场景→能力映射的单一真源；`ScenarioShell` 只按该字段渲染，不按场景号硬编码。
- `CapabilityKey = 'overview' | 'phone' | 'broadcast' | 'publish' | 'emergency'`，与 `components/capabilities/` 下 5 个组件一一对应。

## 组件职责

- `src/components/capabilities/*.vue`：由原 5 个 view `git mv` 改造，自包含、无 props，仅删页面级 `page-head`；ECharts/store/service/mock 逻辑保留。
- `src/types/scenario.ts`：新增 `CapabilityKey` 与 `ScenarioMeta.capabilities`。
- `src/components/scenario/ScenarioShell.vue`：新增第 6 页签，`capabilityComponents` 映射表 + `capabilityList` computed 动态渲染，空映射显示提示文案。
- `src/App.vue`：groups 从 3 组删为 2 组，清理无用 icon import，`currentTitle` 兜底改场景 01。
- `src/router/index.ts`：删 5 条旧能力路由，`/` 与 `/:pathMatch(.*)*` 重定向到 `/scene/01-meeting`。
- `README.md`：场景主线导航说明 + 范围边界。

## 关键决策

- **场景→能力映射单一真源**：映射集中在 `meta.ts`，避免 shell 里散落场景号判断。反对项：在 shell 按 `$route` 写死，被否（难维护、易漂移）。
- **能力组件内嵌而非 iframe/跳转**：用户选"新增页签内嵌组件"，零 iframe、无跳转，交互最自然，能力组件与场景共享 store。
- **旧 view/路由彻底删除**：按用户"彻底删除"决策，不保留兼容重定向；广播因此没有全局入口，并入场景 05 GIS。

## 错误处理

- 无能力映射的场景：`capabilityList.length === 0` 时显示提示文案（本轮 5 场景均配置能力，属防御性处理）。
- 无新增端点/错误码，沿用既有调用链错误处理。

## 测试与验收

- `npm run build`（vue-tsc -b && vite build）通过；Task 1-3 因旧引用 RED，Task 4 后 GREEN。
- playwright chromium headless 实证：无"基础能力"分组、5 场景齐全、根路径重定向到场景 01、5 场景"支撑能力"页签能力齐全、零 pageerror。
- 无真实平台地址，mock 态实证；真实请求行为沿用 `2026-11-18-demo-real-http` 变更，未重验。

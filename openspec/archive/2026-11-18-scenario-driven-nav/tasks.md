# 任务清单：场景驱动导航重构

> tasks.md 是唯一任务真源。单条 ≤2h。动手前须过 proposal 人工确认关卡（当前已全勾）。

## 0. 人工确认（阻塞门）— 2026-11-18 全部通过

- [x] 侧边栏纯场景主线，去掉"基础能力"分组。
- [x] 基础能力合并进场景页"支撑能力"页签，不再单独成页。
- [x] 只重构现有 5 场景，不补 06-08、不加"事后"分组。
- [x] 新增页签内嵌组件（零 iframe、无跳转）。
- [x] 能力映射按建议（广播并入场景 05，无全局入口）。
- [x] 彻底删除旧页面与路由。

## 1. 能力组件抽取（git mv + 删 page-head）— 提交 `85a229e`

- [x] 建 `src/components/capabilities/`，5 个 view `git mv` 为 OverviewBoard / PhoneDispatch / BroadcastAudio / InfoPublish / EmergencyLink（rename 94-96%）。
- [x] 逐组件删除页面级 `page-head`（标题/描述/endpoint-note/状态标签），保留 script/store/service/mock 逻辑。
- [x] 验证构建 RED（router 仍引用旧 view，计划内）。
- [x] 提交 `85a229e`（初提交 `refactor:` 被 reviewer 判 Important，amend 为 `feat:` 后生成的新号）。

## 2. 类型与场景元数据 — 提交 `51d2ae7`

- [x] `src/types/scenario.ts`：新增 `CapabilityKey` 与 `ScenarioMeta.capabilities?: CapabilityKey[]`。
- [x] `src/scenes/meta.ts`：5 场景各配 capabilities（01 phone；02 emergency；03 emergency+publish；04 phone+emergency；05 overview+emergency+broadcast）。
- [x] 验证构建仍 RED（旧路由未删），无 capabilities 相关 type 错误。
- [x] 提交 `51d2ae7`。

## 3. ScenarioShell 新增"支撑能力"页签 — 提交 `871622d`

- [x] script 增加 5 个能力组件 import、`capabilityComponents` 映射、`capabilityList` computed。
- [x] tabs 末尾新增第 6 页签"支撑能力"，`v-for` + `<component :is>` 动态渲染，空映射显示提示。
- [x] 追加 `.capability-block + .capability-block` 间距样式。
- [x] vue-tsc 聚焦校验无 ScenarioShell/capabilities type 错误。
- [x] 提交 `871622d`。

## 4. 侧边栏与路由切换为场景主线 — 提交 `b01cfc2`

- [x] `App.vue`：icon import 精简，groups 3 组→2 组，`currentTitle` 兜底改场景 01。
- [x] `router/index.ts`：删 5 条旧能力路由，`/` 与通配兜底→`/scene/01-meeting`。
- [x] 验证构建 **GREEN**（`✓ built in ...`）。
- [x] 提交 `b01cfc2`。

## 5. README 更新 — 提交 `35b4d9b`

- [x] 简介改场景主线导航，导航表删"基础能力"行，目录结构增 `components/capabilities/`。
- [x] 路由说明改 5 场景路由 + 首页/兜底重定向；默认模式表述对齐（真实 + 显式 mock 回退）。
- [x] 提交 `35b4d9b`。

## 6. 守门、浏览器实证与归档 — 本提交

- [x] `npm run build` 通过（最终 `✓ built in 18.07s`，EXIT=0）。
- [x] playwright 实证：无基础能力分组、5 场景齐全、根路径重定向、5 场景"支撑能力"页签能力齐全、零 error。
- [x] 写 `engineering/qa/` 与 `engineering/retro/` 记录。
- [x] 补建四件套并回填 `openspec/specs/fusion-comm-demo/spec.md`。
- [x] 归档 Change 到 `openspec/archive/`，提交。

## 附：计划修正与审查

- `bbbb43b`：修正实施计划 Task 1 提交类型 refactor→feat，并补 mkdir 步骤与归档路径。
- 5 个任务全部 review Approved：Task 1 1 Important（提交类型，已 amend）+ Task 2 1 Minor（报告措辞，已修），Task 3/4/5 零 finding。

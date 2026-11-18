# QA：场景驱动导航重构

- 分支：`feature/scenario-driven-nav`，基线 `1d9b2db`。
- 目标：侧边栏改为纯场景主线（平时 2 + 战时 3 共 5 场景），删除"基础能力"并列分组；5 个基础能力改造成场景页"支撑能力"页签的内嵌组件，旧页面与路由彻底删除。

## 变更摘要

| 任务 | 提交 | 内容 |
|---|---|---|
| Task 1 | `85a229e` | 5 个 view git mv 到 `components/capabilities/`（rename 94-96%），删 page-head；构建 RED（router 旧引用，计划内） |
| Task 2 | `51d2ae7` | `CapabilityKey` 类型 + `ScenarioMeta.capabilities`，5 场景配映射 |
| Task 3 | `871622d` | ScenarioShell 第 6 页签"支撑能力"，按 meta.capabilities 动态渲染能力组件 |
| Task 4 | `b01cfc2` | 侧边栏 3 组→2 组，删 5 条旧路由，首页/兜底→场景 01；构建 **GREEN** |
| Task 5 | `35b4d9b` | README 场景主线导航说明 |
| Task 6 | 本提交 | 守门、浏览器实证、QA/retro、spec 回填、归档 |

另有计划修正提交 `bbbb43b`（Task 1 提交类型 refactor→feat，与全局约束对齐）。

## 守门结果

- `npm run build`（vue-tsc -b && vite build）：**通过**，`✓ built in 18.07s`（最终），EXIT=0。RED→GREEN 闭环：Task 1-3 因旧 view 引用为 RED，Task 4 清除后转 GREEN。
- 任务级审查：5 个任务全部 review，均 Approved；Task 1 有 1 Important（提交类型与全局约束冲突，已 amend + 修计划），Task 2 有 1 Minor（报告措辞，已修），Task 3/4/5 零 finding。
- 浏览器实证（playwright chromium headless，mock 态，dev server :5173）：
  - 根路径 `http://localhost:5173/` → 重定向到 `http://localhost:5173/#/scene/01-meeting` ✅
  - `hasBaseGroup=false`（无"基础能力"分组）、`sceneCount=5`（5 场景齐全）✅
  - 5 个场景切到"支撑能力"页签，各自渲染出预期能力组件，全部 `missing=[]`：
    - 01 会议 → 电话调度
    - 02 巡检 → 应急联动与检索
    - 03 接报 → 应急联动与检索 + 信息发布
    - 04 会商 → 电话调度 + 应急联动与检索
    - 05 GIS → 态势总览 + 应急联动与检索 + 扩音广播
  - 全程 `errorCount=0`，无 pageerror / console error ✅

## 关键决策落地

- 场景→能力映射以 `scenes/meta.ts` 的 `capabilities` 字段为单一真源，`ScenarioShell` 纯数据驱动渲染，无硬编码场景号判断。
- 5 个能力组件由 view git mv 而来（rename 保留历史），script/store/service 逻辑零改动，只删页面级 `page-head`；共享 `useCommStore`，内嵌后行为与原页面一致。
- 广播无全局入口（旧页面已删），并入场景 05 GIS 调度。

## 未做 / 遗留

1. **真实平台实证**：无 `.env.local` 地址/密钥，本轮 mock 态验证；场景内支撑能力组件真实请求行为沿用上一变更（真实 HTTP + 签名），未重验。
2. **场景 06-08 与"事后·总结提升"分组**：不在本次范围（用户确认只重构现有 5 场景）；README 与 spec 已说明。
3. **ECharts 组件内嵌**：OverviewBoard 在场景 05"支撑能力"页签内渲染，原 `onBeforeUnmount` 销毁逻辑保留；页签切换时组件重建，浏览器实证无 error，未见内存泄漏迹象（未做长时间多次切换压力测试）。
4. **旧能力路由的可达性**：`/dashboard` 等 5 条路由已删除，旧书签/外部链接访问会经通配兜底回到场景 01（不保留兼容重定向，按用户"彻底删除"决策）。

## 证据

- 浏览器实证脚本：`.git/sdd/scenario-nav-check.mjs`（git 内部临时文件，不入库），输出见上文。
- 各任务 review 包与报告：`.git/sdd/nav-review-*.diff`、`.git/sdd/nav-task-*-report.md`（不入库）。

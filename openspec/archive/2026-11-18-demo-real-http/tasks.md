# 任务清单：Demo 默认走真实 HTTP 调用

> tasks.md 是唯一任务真源。单条 ≤2h。动手前须过 proposal 人工确认关卡（当前已全勾）。

## 0. 人工确认（阻塞门）— 2026-11-18 全部通过

- [x] 默认真实 + 显式 `VITE_FC_MOCK=true` 回退。
- [x] 三个 `__scene__/*` 映射真实接口 `queryRegions` / `queryCameras` / `recordsQuery`。
- [x] `.env.local` 由使用者后续填写，本轮只改代码 + 构建验证。

## 1. 运行模式反转与配置模板

- [x] `src/api/config.ts`：`mock` 改为 `import.meta.env.VITE_FC_MOCK === 'true'`，默认 false。（提交 `6223aed`）
- [x] `src/env.d.ts`：新增 `VITE_FC_MOCK?: string` 类型声明。（`6223aed`）
- [x] 新增 `.env.example`：列出 `VITE_FC_MOCK` / `VITE_FC_BASE_URL` / `VITE_FC_WS_URL` / `VITE_FC_SECRET_ID` / `VITE_FC_SECRET_KEY`，不含真实值。（`6223aed`）
- [x] 确认 `.gitignore` 已忽略 `.env.local`（`.gitignore:4` 已忽略，未改动）。（`6223aed`）

## 2. 调用链业务错误校验

- [x] `src/api/client.ts`：真实分支在 `resp.json()` 后校验 `code !== 0` 抛错，错误信息优先 `msg`、为空时 `API_ERROR_<code>` 兜底；保留 mock 分支与现有 HTTP 非 2xx 校验。（提交 `6d85ab3`）

## 3. 场景端点映射真实接口

- [x] `src/services/communication.ts`：`sceneEnterprises` 调 `queryRegions({pageNum:1,pageSize:50})` 并映射为完整 `Enterprise`（`regionId→id`、`regionName→name`、`totalTerminals>0→hasTerminal`、`terminals[0]→phone` 否则 `regionId`、`contact='—'`、`lng/lat=0`、`status='未通知'`）。（提交 `1da3082`）
- [x] `src/services/communication.ts`：`sceneCameras` 调 `queryCameras({pageNum:1,pageSize:50})` 并映射 `camIndex→cameraId`、`name→name`、`status??linkType→status`。（`1da3082`）
- [x] `src/services/communication.ts`：`scenePatchTasks` 调 `recordsQuery({pageNum:1,pageSize:50})` 并映射为完整 `PatchTask`（`url→id` 否则拼接、`callType 文案→type`、`callerNum+'→'+destination→location`、`callerNum→owner`、`destination→monitor`、`status='待核查'`、`evidence=false`）。（`1da3082`）
- [x] mock 分发器 `handler.ts` 保留 `__scene__/*` case 作为历史兼容（真实态与 mock 回退态均改走 EP.*，不再抵达），标注"保留兼容旧调用"；`toCamera` 兼容 mock handler 返回的 `cameraId` 字段。（修复提交 `e15bfc9`）

## 4. 场景页面字段消费对齐

- [x] `Scene01Meeting.vue` / `Scene04Consult.vue`：确认消费 `Enterprise[]` 的 `id/name/hasTerminal/phone/contact` 与映射一致。
- [x] `Scene02Patrol.vue`：确认消费 camera 的 `cameraId/name/status` 与 `PatchTask` 的 `id/type/location/monitor/status/evidence` 与映射一致。
- [x] 映射字段已与页面/类型定义完全一致，页面零改动（映射层已对齐；reviewer 逐字段核实确认）。（提交 `35cde26` 仅改 README）

## 5. 守门与归档

- [x] `npm run build`（vue-tsc -b && vite build）通过（多次复跑 `✓ built in 11-14s`，无 type 错误）。
- [x] 显式 mock 回退态可本地启动（playwright 实证角标 MOCK、场景页有数据、零 pageerror；不实证真实平台）。
- [x] 完成后即刻写 `engineering/qa/` 与 `engineering/retro/` 记录。（提交 `8f88368`）
- [x] 归档 Change 到 `openspec/archive/`，回填 `openspec/specs/fusion-comm-demo/spec.md`，更新 README 运行说明。（`8f88368`；README 在 `35cde26`）

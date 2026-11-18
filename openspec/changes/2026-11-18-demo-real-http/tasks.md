# 任务清单：Demo 默认走真实 HTTP 调用

> tasks.md 是唯一任务真源。单条 ≤2h。动手前须过 proposal 人工确认关卡（当前已全勾）。

## 0. 人工确认（阻塞门）— 2026-11-18 全部通过

- [x] 默认真实 + 显式 `VITE_FC_MOCK=true` 回退。
- [x] 三个 `__scene__/*` 映射真实接口 `queryRegions` / `queryCameras` / `recordsQuery`。
- [x] `.env.local` 由使用者后续填写，本轮只改代码 + 构建验证。

## 1. 运行模式反转与配置模板

- [ ] `src/api/config.ts`：`mock` 改为 `import.meta.env.VITE_FC_MOCK === 'true'`，默认 false。
- [ ] `src/env.d.ts`：新增 `VITE_FC_MOCK?: string` 类型声明。
- [ ] 新增 `.env.example`：列出 `VITE_FC_MOCK` / `VITE_FC_BASE_URL` / `VITE_FC_WS_URL` / `VITE_FC_SECRET_ID` / `VITE_FC_SECRET_KEY`，不含真实值。
- [ ] 确认 `.gitignore` 已忽略 `.env.local`（如未忽略则补上；禁止把真实密钥入库）。

## 2. 调用链业务错误校验

- [ ] `src/api/client.ts`：真实分支在 `resp.json()` 后校验 `code !== 0` 抛错，错误信息带 `msg` 与 `code`；保留 mock 分支与现有 HTTP 非 2xx 校验。

## 3. 场景端点映射真实接口

- [ ] `src/services/communication.ts`：`sceneEnterprises` 调 `queryRegions({pageNum:1,pageSize:50})` 并映射为完整 `Enterprise`（`regionId→id`、`regionName→name`、`totalTerminals>0→hasTerminal`、`terminals[0]→phone` 否则 `regionId`、`contact='—'`、`lng/lat=0`、`status='未通知'`）。
- [ ] `src/services/communication.ts`：`sceneCameras` 调 `queryCameras({pageNum:1,pageSize:50})` 并映射 `camIndex→cameraId`、`name→name`、`status??linkType→status`。
- [ ] `src/services/communication.ts`：`scenePatchTasks` 调 `recordsQuery({pageNum:1,pageSize:50})` 并映射为完整 `PatchTask`（`url→id` 否则拼接、`callType 文案→type`、`callerNum+'→'+destination→location`、`callerNum→monitor`、`status='待核查'`、`evidence=false`）。
- [ ] mock 分发器 `handler.ts` 保留 `__scene__/*` case 但标注"仅 mock 回退态使用"；真实态不再抵达。

## 4. 场景页面字段消费对齐

- [ ] `Scene01Meeting.vue` / `Scene04Consult.vue`：确认消费 `Enterprise[]` 的 `id/name/hasTerminal/phone/contact` 与映射一致。
- [ ] `Scene02Patrol.vue`：确认消费 camera 的 `cameraId/name/status` 与 `PatchTask` 的 `id/type/location/monitor/status` 与映射一致。
- [ ] 若映射字段已与页面/类型定义完全一致，则页面无需改动（在 tasks 勾选时注明"零改动，映射层已对齐"）。

## 5. 守门与归档

- [ ] `npm run build`（vue-tsc -b && vite build）通过。
- [ ] 显式 mock 回退态可本地启动（不实证真实平台）。
- [ ] 完成后即刻写 `engineering/qa/` 与 `engineering/retro/` 记录。
- [ ] 归档 Change 到 `openspec/archive/`，回填 `openspec/specs/fusion-comm-demo/spec.md`，更新 README 运行说明。

# 提案：Demo 默认走真实 HTTP 调用

## Why

demo 当前默认走本地 mock（`mock: !VITE_FC_BASE_URL`），`__scene__/*` 三个伪端点只存在于 mock 分发器，浏览器请求无法打到真实申讯平台，无法验证"按 V1.3 文档签名 + 真实 fetch 调接口"的调用链。用户 2026-11-18 要求切换为默认真实 HTTP 调用：34 个 `/openapi/*` 端点走 `fetch` + 每次重算 `X-CR-*` 签名头，3 个场景伪端点映射到真实接口并适配字段；无真实平台时通过显式 `VITE_FC_MOCK=true` 回退本地模拟，保证仓库仍可离线演示。

## What Changes

- 运行模式反转：`config.ts` 默认 `mock: false`，仅显式 `VITE_FC_MOCK=true` 才启用 mock；新增 `.env.example` 模板列出 `VITE_FC_BASE_URL` / `VITE_FC_WS_URL` / `VITE_FC_SECRET_ID` / `VITE_FC_SECRET_KEY`。
- 调用链：`client.ts` 的 `fcPost` 在真实模式下用 `fetch` POST + 每次调用 `buildAuthHeaders` 重算签名；增加响应 `code !== 0` 的统一业务错误抛出（补齐当前只判 HTTP 非 2xx 的缺口）。
- 场景端点映射：`services/communication.ts` 把 `sceneEnterprises` / `sceneCameras` / `scenePatchTasks` 从 `__scene__/*` 改为分别调用 `queryRegions` / `queryCameras` / `recordsQuery`，并新增适配函数把真实字段映射到页面期望结构；`api/mock/handler.ts` 保留 `__scene__/*` case 仅供 mock 回退态使用。
- 场景页面（Scene01 / Scene02 / Scene04）调整字段消费以匹配映射后结构，不动交互流程。
- 事件推送 `eventStream.ts`：真实模式保留定时器模拟，真实 WebSocket 订阅列为后续增量。

## Capabilities

### Added Capabilities

- 无新增能力域，改造 `fusion-comm-demo` 既有调用链能力。

### Modified Capabilities

- `fusion-comm-demo`：调用链从"默认 mock + 环境推断真实"改为"默认真实 + 显式 mock 回退"；场景拟真数据改为真实接口映射。

## Impact

- 只改 demo 仓，不碰脚手架/后端；不改任何平台契约与迁移。
- `.env.example` 不含真实密钥；`.env.local` 由使用者本地填写，须确认其被 gitignore。
- 真实下行写（广播/电话/通知/SOS）连真平台会产生实际业务副作用；本变更只切换调用方式，不对真实平台做写操作实证，除非使用者明确确认环境可写。
- 无 env 时 demo 可构建但运行时请求打到 dev server 返回 404；这是"默认真实"的预期行为，离线演示须显式开 mock。

## 人工确认关卡（动手前须过）

- [x] 默认真实 + 显式 `VITE_FC_MOCK=true` 回退（用户 2026-11-18 确认）。
- [x] 三个 `__scene__/*` 映射到真实接口 `queryRegions` / `queryCameras` / `recordsQuery`（用户 2026-11-18 确认）。
- [x] `.env.local` 由使用者后续填写，本轮只改代码 + 构建验证（用户 2026-11-18 确认）。

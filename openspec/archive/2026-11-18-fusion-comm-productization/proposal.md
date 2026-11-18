# 提案：融合通信 Demo 产品化落地

## Why

demo 跑通 5 基础能力页 + 前 5 场景，但仍是独立 Demo：直连申讯 V1.3、浏览器持密钥、mock 兜底，与平台脚手架的服务分层、契约真源、零下行控制与后端硬控体系均未对齐，无法回流。用户 2026-11-18 拍板：从系统抽一部分做成贴近系统规范的融合通讯 demo 案例，验证成功后再返回系统。本轮只出方案与改造范围评估，不写实现。

## What Changes

- 契约：以平台 `communication.openapi.json` 为参照，为 demo 补 B3 包络适配层，冻结 `EP` 全表端点字段契约；真实模式签名改由服务端代理，浏览器不再持密钥。
- 服务分层：demo 新增 `services` / `adapter`，对齐平台 `services/<domain>.ts` + `unwrapBody` 调用形态。
- 硬控评估：梳理呼叫/会控、广播、短信语音通知、SOS 下发撞 `HardControlPaths` 的端点，给出受控下行白名单方案（服务端持密钥 + RBAC 权限码 + 二次确认 + 审计）。
- 回流映射：列清 demo 页面/服务/契约到脚手架 `fm-communication` 子应用与后端 Controller / Migration 的逐项对接点。

## Capabilities

### Added Capabilities

- `fusion-comm-demo`：贴近平台契约与硬控规范的融合通信案例能力。

### Modified Capabilities

- 无（demo 仓首次建立 openspec 基线）。

## Impact

- 本轮只在 demo 仓写四件套，不改实现代码；后端不新增端点、不改 `HardControlPaths`。
- 改造范围以评估结论交付；回流脚手架/后端须各自另开 Change 并过人工确认。
- 零下行控制红线不解除，受控下行走独立白名单；B3 包络与令牌内存态不变。

## 人工确认关卡（L4 须过）

- [ ] 范围与「demo 贴近系统、成功后回流」定位一致，不越界改平台实现。
- [ ] 受控下行 + 独立白名单方案确认（L4）。
- [ ] 契约适配层与双库回流路径确认。

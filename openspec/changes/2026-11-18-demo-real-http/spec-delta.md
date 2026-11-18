# Spec Delta：Demo 默认走真实 HTTP 调用

> 描述本变更对 `openspec/specs/fusion-comm-demo/spec.md` 的增量。

## ADDED Requirements

### Requirement: Demo 默认真实 HTTP 调用链

Demo 的 `/openapi/*` 接口调用默认走真实 HTTP，按申讯 V1.3 文档每次请求生成签名头；本地 mock 仅在显式开关下作为回退。

#### Scenario: 默认真实模式

- **WHEN** 未设置 `VITE_FC_MOCK=true`
- **THEN** `fcPost` 以 `fetch` POST 到 `VITE_FC_BASE_URL + path`，每次请求重算 `X-CR-Signature`，响应 `code !== 0` 时抛错

#### Scenario: 显式 mock 回退

- **WHEN** 设置 `VITE_FC_MOCK=true`
- **THEN** 请求走本地 mock 分发器，页面角标显示 MOCK，仓库可离线演示

### Requirement: 场景拟真数据映射到真实接口

原本 `__scene__/*` 伪端点提供的企业/摄像头/工单列表，须由真实 `/openapi/*` 接口经字段适配提供，页面调用名保持不变。

#### Scenario: 企业列表来自区域查询

- **WHEN** 场景页调用 `sceneEnterprises()`
- **THEN** 服务层调 `queryRegions()` 并把 `regionId/regionName/totalTerminals` 映射为页面期望的 `id/name/scale`

#### Scenario: 摄像头列表来自监控点查询

- **WHEN** 场景页调用 `sceneCameras()`
- **THEN** 服务层调 `queryCameras()` 并把 `camIndex/name/linkType` 映射为页面期望的 `id/name/status`

#### Scenario: 工单列表来自通话记录查询

- **WHEN** 场景页调用 `scenePatchTasks()`
- **THEN** 服务层调 `recordsQuery()` 并把通话记录映射为页面期望的 `{id,title,time}`（语义近似，通话记录当工单流展示）

## MODIFIED Requirements

### Requirement: 融合通信案例贴近系统契约规范

（原 spec 中该 Requirement 的真实模式描述「签名由后端代理生成、浏览器零密钥」在 demo 仓以"声明"形式存在。）本变更明确：demo 仓的 REAL 演示态仍在浏览器直连签名（demo 用于验证调用链，非产品化部署），后端代理签名的职责声明保留在 `adapters/fcSignature.ts` 与 design 中，产品化实现由平台脚手架/后端仓承担。

## REMOVED Requirements

无。

## 关联 Spec

- 目标 spec 文件：`openspec/specs/fusion-comm-demo/spec.md`。
- 参照：申讯 OpenAPI V1.3 文档（鉴权 / queryRegions / queryCameras / recordsQuery）。

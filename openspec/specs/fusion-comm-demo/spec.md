# Capability: fusion-comm-demo

融合通信 Demo 贴近平台契约与硬控规范的能力基线。本 spec 由 `2026-11-18-fusion-comm-productization` 变更回填，覆盖阶段一（demo 仓）已落地的三条需求；阶段二/三（脚手架契约、后端受控下行）在各自 Change 中扩展。

> 阶段状态说明：下列场景逐字沿用已批准的 `spec-delta.md`，未收紧前提、未改变 acceptance。阶段一（demo 仓）只完成服务层收口与签名边界声明；「浏览器零密钥」与「端到端统一解包」为阶段二/三目标，当前尚未满足，详见各 Scenario 的阶段标注。

## ADDED Requirements

### Requirement: 融合通信案例贴近系统契约规范

Demo 的能力须以平台 `communication.openapi.json` 为契约参照组织服务层；真实模式的申讯签名不得由浏览器持有密钥完成，须声明为后端代理职责。

#### Scenario: 服务层按 B3 包络解包

- **WHEN** 页面经 `services/communication` 调用任一能力且响应 `code=0`
- **THEN** 服务层返回 `data` 载荷，`code!=0` 时 `unwrapBody`/`unwrapRows` 提供可识别错误路径
- **阶段状态**：阶段一服务层原样返回包络、页面仍读 `res.rows/res.row/res.data`；`unwrap*` 提供错误路径但端到端接入在阶段二随 generated types 统一完成。

#### Scenario: 真实模式不外泄密钥

- **WHEN** demo 处于 real 演示态
- **THEN** 浏览器请求头不含 `secretId/secretKey`，申讯签名由后端代理生成
- **阶段状态**：阶段一仅以 `fcSignature.ts` 的 `boundaryNote` 声明该回流边界；真实模式当前仍由 `client.ts` 走 `sign.ts` 直连签名，零密钥由阶段三的后端代理实现。

### Requirement: 受控下行白名单与消防硬控隔离

融合通信的下行写能力须走独立受控白名单，不放宽消防硬控单一真源；每个放行端点须同时具备 RBAC 权限、二次确认与审计。

#### Scenario: 受控端点放行

- **WHEN** 已授权用户对白名单内通信端点发起下行写请求
- **THEN** 后端以服务端密钥签名转发申讯，记录操作人/目标/动作/时间审计，并返回结果

#### Scenario: 消防硬控不被放宽

- **WHEN** 任一请求命中 `HardControlPaths.SUFFIXES`
- **THEN** 仍按既有硬控拦截器拒绝，本变更不修改该名单

### Requirement: 契约与迁移跨库一致性

回流阶段的契约变更须先绿先推，三方言迁移同版本注册，新增权限码须显式登记。

#### Scenario: 契约 strict 对拍

- **WHEN** 脚手架契约扩展后运行校验与后端 strict 对拍
- **THEN** 路由与 schema 漂移为 0，契约侧先行推送

#### Scenario: 新增权限码可访问

- **WHEN** 迁移登记新 `perm_code` 到 `sys_menu` 并授权 ADMIN/授权角色
- **THEN** 持有角色的用户可访问对应写端点，不出现 V33 快照导致的 403

## 阶段交接

- 阶段一（本仓）：服务层 + 签名边界 + 9 页收口，已落地验收。
- 阶段二（脚手架）：契约扩端点、生成类型、`fm-communication` 子应用迁入——另开 Change。
- 阶段三（后端，L4）：受控下行白名单、三方言迁移、权限种子——另开 Change，须先过白名单端点清单人工确认。

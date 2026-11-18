# Spec Delta：融合通信 Demo 产品化落地

> 描述本变更对 `openspec/specs/` 的增量。demo 仓首次建 openspec 基线，目标 spec 文件 `openspec/specs/fusion-comm-demo/spec.md`（归档时新建）。

## ADDED Requirements

### Requirement: 融合通信案例贴近系统契约规范

Demo 的能力须以平台 `communication.openapi.json` 为契约参照组织服务层；真实模式的申讯签名不得由浏览器持有密钥完成，须声明为后端代理职责。

#### Scenario: 服务层按 B3 包络解包

- **WHEN** 页面经 `services/communication` 调用任一能力且响应 `code=0`
- **THEN** 服务层返回 `data` 载荷，`code!=0` 时抛出可识别错误，页面不直接处理原始包络

#### Scenario: 真实模式不外泄密钥

- **WHEN** demo 处于 real 演示态
- **THEN** 浏览器请求不含 `secretId/secretKey`，申讯签名由后端代理生成的声明在 design 中可追溯

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

## MODIFIED Requirements

无（demo 仓首次建立 openspec 基线，无既有 spec 可改）。

## REMOVED Requirements

无。

## 关联 Spec

- 目标 spec 文件：`openspec/specs/fusion-comm-demo/spec.md`（本变更归档时新建）。
- 平台参照：`communication.openapi.json`（脚手架契约真源）、`HardControlPaths`（后端硬控单一真源）。
- 与 `proposal.md` Capabilities、`tasks.md` 验收标准一一对应。

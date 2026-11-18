# Spec Delta：场景驱动导航重构

> 描述本变更对 `openspec/specs/fusion-comm-demo/spec.md` 的增量。

## ADDED Requirements

### Requirement: 场景驱动导航与场景内支撑能力

demo 的导航须以方案场景为唯一主线；原"基础能力"不再作为独立导航/页面，改为场景页内嵌的支撑能力，能力→场景映射以场景元数据为单一真源。（原"基础能力 + 场景并列"的导航组织此前未形式化为 Requirement，故以新增需求表达替换。）

#### Scenario: 纯场景主线导航

- **WHEN** 用户打开 demo 并查看侧边栏
- **THEN** 只有"平时·日常管理"与"战时·应急指挥"两组共 5 个场景入口，不出现"基础能力"分组；根路径 `/` 与未知路径统一重定向到 `/scene/01-meeting`

#### Scenario: 场景内嵌支撑能力

- **WHEN** 用户在任一场景页切到"支撑能力"页签
- **THEN** 按 `scenes/meta.ts` 的 `capabilities` 映射渲染对应能力组件（01→电话调度；02→应急联动与检索；03→应急联动+信息发布；04→电话调度+应急联动；05→态势总览+应急联动+扩音广播），无 iframe、无跳转，与原整页行为一致

#### Scenario: 旧能力路由删除

- **WHEN** 访问 `/dashboard` 等 5 条旧能力路由
- **THEN** 由通配兜底重定向到场景 01，不保留旧能力页面；广播无全局入口，并入场景 05

## MODIFIED Requirements

### Requirement: 融合通信案例贴近系统契约规范

（原 spec 中该 Requirement 描述 Demo 能力按服务层契约组织，导航与页面组织为"基础能力页 + 场景页"并列 3 组共 10 项。）本变更明确：能力组织改为纯场景主线，5 个能力以组件形式内嵌到场景页"支撑能力"页签，不再有独立页面与路由；调用链、签名、接口映射不变。

## REMOVED Requirements

- 移除"基础能力作为独立导航分组与独立页面"的组织方式（5 个能力 view 与 5 条路由删除；能力逻辑以组件形式保留在场景内）。

## 关联 Spec

- 目标 spec 文件：`openspec/specs/fusion-comm-demo/spec.md`。
- 参照：`docs/superpowers/specs/2026-11-18-scenario-driven-nav-design.md`（已批准）。

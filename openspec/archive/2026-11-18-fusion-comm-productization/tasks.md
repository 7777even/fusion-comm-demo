# 任务清单：融合通信 Demo 产品化落地

> 本清单是全量实现任务的唯一真源，覆盖 demo 贴近系统与回流平台两阶段。四件套已过人工确认，阶段一已执行完毕并验收；阶段二/三待另开 Change。单条 ≤2h，标 [TDD] 的先红后绿。

## 阶段零：本轮提案（已完成）

- [x] 只读核查两端仓库现状（脚手架 openspec/契约/子应用、后端契约/硬控/迁移）。
- [x] 建齐四件套 `proposal.md` / `design.md` / `tasks.md` / `spec-delta.md` 与 `.openspec.yaml`。
- [x] 产出契约改造范围评估（design §契约改造范围）与硬控改造范围评估（design §硬控改造范围）。
- [x] 人工确认关卡三项通过（2026-11-18 用户确认「没问题」，范围/受控下行白名单/双库路径均通过）。

## 阶段一：demo 贴近系统规范（本仓，已执行）

- [x] 新增 `src/services/communication.ts`，消费统一 client，按 B3 包络 `unwrapBody` 形态组织；保留 mock 适配器分支。
- [x] [TDD] 写包络解包单测：`scripts/test-envelope.mjs`（包络解包、`code!=0` 抛错、`EMPTY_BODY`、rows/row 双形态）；服务层为薄封装，TDD 落在可测纯函数 `envelope.ts`。
- [x] 新增 `src/adapters/fcSignature.ts`，把 `sign.ts` 的申讯签名从浏览器直连路径迁出，声明为回流后后端代理职责，demo 仅在 real 演示态沿用。
- [x] [TDD] 写签名与代理边界单测，断言真实模式 `useProxy=true` 返回空头、不读浏览器密钥。
- [x] 5 个基础能力页 + 5 个场景页改走 `services/communication`，去除页面内直接 `fcPost`（9 页 38 处，零残留）。
- [ ] 契约对齐：按 design 表格为 demo mock 返回补平台字段形状，标注与 `communication.openapi.json` 的差异点。**移交阶段二**：契约真源在脚手架仓，本仓不做字段形状改造；差异点已在 `design.md` §契约改造范围列表记录。
- [x] 守门：`npm run build`（含 vue-tsc）通过，Playwright 走通 10 项导航与 5 场景关键路径（LIVE 行 1/2/3/3/4，零页面错误）。

## 阶段二：回流脚手架（另开 Change，本仓任务仅作映射）

- [ ] 脚手架侧开 Change：`docs/api/communication.openapi.json` 扩端点，逐 operation 补中文 description/example。
- [ ] 契约守门：`validate-api-contracts.mjs` + 后端 `check-api-contract.mjs --strict` 0 漂移，契约先绿先推。
- [ ] `npm run gen:api-types` 生成类型，`src/services/communication.ts` 改消费 generated types。
- [ ] `subapps/fm-communication` 迁入 5 场景工作区与 `ScenarioShell`，复用 `/production/communication` 路由。
- [ ] `SUBAPP_NO_EMPTY=1 npm run build:subapps` 重建产物，截图取证。

## 阶段三：回流后端（另开 Change，L4）

- [ ] 人工确认硬控白名单具体端点清单（#TODO-确认）。
- [ ] 新增 Communication Controller/Service/DTO/Entity/Mapper，写端点带 `@RequireAuth(perm=...)`。
- [ ] 申讯签名代理：服务端持密钥，按 V1.3 生成 `X-CR-Signature`，浏览器零密钥。
- [ ] 新增通信受控下行白名单真源 + 二次确认 + 审计表，不放宽 `HardControlPaths`。
- [ ] 三方言 Flyway 迁移（下一可用版本）：新表带 `deleted` + 审计字段；`sys_menu` + `sys_role_menu` 注册新权限码。
- [ ] [TDD] Controller/Service 单测 + 三方言 IT（H2/PG/达梦），`jacoco` 覆盖率 ≥0.80。
- [ ] `check-endpoint-authz.mjs` 全约束、`check-api-contract.mjs --strict` 0 漂移。

## 验收标准（Definition of Done）

- [x] 人工确认三项通过，阶段一任务逐项勾选（阶段二/三保留未勾，另开 Change）。
- [x] demo `npm run build` 通过，浏览器实证零页面错误（10 项导航 + 5 场景 LIVE 行）。
- [ ] 契约 strict 0 漂移；写端点全带 `@RequireAuth`；硬控白名单经 L4 确认。**阶段二/三**。
- [ ] 三方言 IT 通过；新增权限码 ADMIN/授权角色可访问。**阶段三**。
- [x] spec 回填到 `openspec/specs/fusion-comm-demo/spec.md` 后归档 Change，`engineering/qa/` + `engineering/retro/` 即刻补齐。
- [x] 提交按 scope 拆分（`shared` → `screen` → `docs`），单行中文 message、body 为空；阶段二/三的 `contract`/`mgmt` 提交待各自 Change。

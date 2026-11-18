# 设计文档：融合通信 Demo 产品化落地

> 本轮交付物是「方案 + 改造范围评估」，不含实现代码。demo 是抽取出来贴近系统规范的实现案例，验证成功后回流平台。两端仓库现状已只读核查（2026-11-18）。

## 目标与约束

- 可验证目标：产出契约与后端硬控改造范围评估，使 demo 具备逐项回流脚手架/后端的可执行映射；本仓新增四件套过 hygiene 校验。
- 硬约束：
  - 平台 §3 API 契约七铁律——零下行控制（前端只监不控）、B3 包络 `unwrapBody`（`code=0` 取 data）、20 位 MDM 编码、生产 HMAC-SHA256 防重放、令牌仅内存/Cookie、services 与 adapter 分层、跨库四同步且契约先绿先推。
  - 后端硬控单一真源 `HardControlPaths.SUFFIXES`，改名单属 L4。
  - demo 当前浏览器直持 `secretId/secretKey` 与 SHA-256 签名，是回流必须消除的偏差。

## 架构与方案

### 分层与落点（回流目标态，本轮不实现）

- 契约真源：脚手架 `docs/api/communication.openapi.json`（现仅 devices / records 4 端点），扩展为覆盖 demo 所用端点；经 `npm run gen:api-types` 生成 `src/types/generated/communication.ts`，禁止手改。
- 服务层：`src/services/communication.ts` 只消费 generated types，经 `http.ts` 的 `unwrapBody` 解包；不改 `http.ts` 拦截器（触碰即 L4 二次关卡）。
- UI 载体：复用既有 `subapps/fm-communication` 与 `/production/communication` 二级隐藏路由（现挂 `ops:view`），不新建子应用、不动 `wujieBridge` / `subappRouter`。
- 后端：在既有 communication 域扩展 Controller / Service / DTO，沿用 `Result<T>` 包络、`@RequireAuth(perm=...)`、Flyway 三方言迁移与 `sys_menu` + `sys_role_menu` 权限种子。

### 契约改造范围评估（demo `EP` 全表 → 平台契约）

| 分组 | demo 端点（`/openapi/...`） | 平台契约现状 | 回流处置 |
|---|---|---|---|
| 只读查询 | `queryRegions` `queryTerminals` `cameras/*` `records/query` `record/asr` `syncSmsTemplateList` | devices/records 部分覆盖 | 扩 `communication.openapi.json` 对应 GET 端点，字段按 demo 返回示例补中文 description/example |
| 普通业务写 | `linkTask/send` `sosLinkage/confirm` `sms/template` | 无 | 新增 POST 端点，带 `@RequireAuth(perm)`，走后端签名转发 |
| 受控下行 | `terminalOperator`(1/6/7/10-16)、`broadcast/startTtsTask` `startTask` `setVolume` 等、`sosLinkage/add` | 无，且部分撞硬控名单 | 见「硬控评估」，走独立白名单 + 二次确认 |
| 订阅/事件 | `eventService/subscription`、`app/eventReport` | 无 | 复用平台 WS `RealtimeBroadcastService`，不新增长连接协议 |

- 签名协议差异：demo `X-CR-Signature = sha256(secretId&timestamp&secretKey)` 是申讯直连协议；平台的 HMAC 防重放头为 `X-Timestamp/X-Nonce/X-Signature`（payload `ts\nnonce\nmethod\nuri`）。回流后浏览器只带平台令牌，**申讯签名在后端代理侧生成**，两边协议不混用。
- 契约严格对拍：新增端点后 `node scripts/validate-api-contracts.mjs` 与后端 `check-api-contract.mjs --strict` 须 0 漂移；契约侧先绿先推，避免 CI 竞态与 schema 漂移误报。

### 后端硬控改造范围评估（已拍板：受控下行 + 独立白名单）

- 冲突点：`HardControlPaths.SUFFIXES` 现含 `broadcast/issue|force|cut|power`、`emergency/trigger`、`devices/cmd|control` 等；demo 的广播喊话、强插强拆、`sosLinkage/add` 下发与之同类。硬控拦截器对命中路径的写操作直接 503。
- 方案：不删除、不放宽消防硬控名单；新增**通信受控下行白名单**（新真源，与 `HardControlPaths` 并列），仅放行经评审的通信端点，且必须同时满足：
  1. 服务端持申讯密钥签名转发（浏览器零密钥）；
  2. 每个端点 `@RequireAuth(perm=...)`，权限码经 `sys_menu` + `sys_role_menu` 注册（V33 ADMIN 快照坑：新增权限必须补迁移登记）；
  3. 二次确认（危险动作需前端确认态 + 服务端确认令牌/审计字段）；
  4. 全量审计（操作人、目标设备、动作、时间入审计表）。
- 落地约束：白名单变更属 L4，须再次人工确认；`check-endpoint-authz.mjs` 要求所有写端点带 `@RequireAuth` 或进带理由的 ALLOWLIST。
- 三方言迁移：按下一个可用版本（V134 已被 water-system 提案占用时为 V135）在 `db/migration/{h2,postgresql,dameng}` 同号注册，新表带 `deleted` + 审计字段，删除走 `deleteById`。

### 数据流（目标态）

`子应用页面 → services/communication.ts → http.ts(unwrapBody, 平台令牌) → 平台 Controller(@RequireAuth) → Service → 申讯代理签名 → 申讯 OpenAPI V1.3`；实时事件经平台 WS 回推，不经浏览器直连申讯 WS。

## 决策记录（ADR）

- ADR-1 采用「抽取案例 → 贴近系统 → 回流」三阶段，而非直接改平台 — 理由：用户明确 demo 成功后才返回系统；反对项：直接改平台会绕过 demo 验证且叠加 L4 风险。
- ADR-2 受控下行走独立白名单，不放宽 `HardControlPaths` — 理由：保住消防硬控红线与单一真源语义；反对项：全量开放（已否决，风险最高）。
- ADR-3 复用 `fm-communication` 子应用与既有路由，不新建子应用 — 理由：减少 wujie 壳改动与 L4 关卡；反对项：新建独立子应用（无必要）。
- ADR-4 申讯签名放后端代理，浏览器零密钥 — 理由：消除密钥暴露与 CORS 风险；反对项：沿用 demo 直连（不可产品化）。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 契约 strict 漂移 | CI contract-guard 失败 | 契约先绿先推，两端 openspec 同步 |
| 硬控白名单误放 | 下行失控 | 白名单逐端点评审 + 二次确认 + 审计，L4 再确认 |
| V33 权限快照坑 | ADMIN 也 403 | 新权限码补 `sys_menu` + `sys_role_menu` 迁移 |
| 三方言不一致 | 达梦真机失败 | 同版本注册 + parity 脚本 + 真机 IT |
| 逻辑删除失效 | 数据残留 | 走 `deleteById`，不用 `setDeleted` + `updateById` |

## 依赖

- 上游：本轮人工确认关卡三项；平台 AGENTS.md §0.3/§3/§7、后端 AGENTS.md §契约四同步。
- 下游（回流阶段）：脚手架 Change（契约 + 子应用 + 服务层）、后端 Change（端点 + 迁移 + 权限 + 硬控白名单）。
- 待确认 `#TODO-确认`：契约端点是否全量纳入或按 5 场景裁剪；受控白名单具体端点清单；V134/V135 版本号以回流时平台实际占用为准。

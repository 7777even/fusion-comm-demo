# 复盘：融合通信 Demo 产品化落地（阶段一）

- 日期：2026-11-18
- 分支：`feature/fusion-comm-productization`，基线 `7a4a83f`，7 次任务提交至 `6da6da3`
- 定位：从平台抽一部分能力做成贴近系统规范的 demo 案例，验证成功后回流系统。本阶段只做 demo 仓的「贴近系统」部分。

## 做对了什么

1. **先四件套后实现**：proposal/design/tasks/spec-delta 过人工确认才动手，契约与硬控改造范围在设计阶段就评估清楚（design §契约改造范围表 + §硬控改造范围），避免边做边改方向。
2. **TDD 零新增依赖**：Node 24 类型剥离 + `node:assert` 跑纯函数测试，探针先验证命令可行再写计划，不引入 vitest。
3. **SDD 纪律保留**：本环境只有只读 subagent，无法派实现 agent，改由本会话实现 + 每任务独立提交 + 只读 reviewer 逐任务审查（spec ✅ + quality approved ×7），未跳过审查关卡。
4. **浏览器实证发现真问题**：首轮 2 项断言失败，用 systematic-debugging 先取证（列出真实按钮文案）再归因，确认是测试脚本关键词/前置步骤问题而非产品 bug，修脚本后复验全绿。没有把脚本问题误报为产品缺陷。
5. **提交原子化**：每任务一条 `type(scope)` 单行提交，body 为空；归档提交把无关的 scenario.ts 注释修改 unstage 出去。

## 踩坑与修正

1. **Node ESM 相对导入必须带 `.ts`**：计划参考代码写 `from '../api/sign'`，Node 类型剥离报 `ERR_MODULE_NOT_FOUND`；改 `../api/sign.ts`（项目 `allowImportingTsExtensions: true` 已开）后通过。后续计划模板应默认写扩展名。
2. **`noUnusedLocals` 下冗余 type 导入编译失败**：服务层参考代码导入 `type ApiResponse` 未使用，TS6133；删除后通过。
3. **CMD 吞特殊字符**：`=>` 的 `>` 被当重定向、`%ae` 被当环境变量、`head` 命令不存在。改用文件工具写脚本、Python 处理文本。
4. **截图目录未被 gitignore**：验收截图散落未跟踪目录；移入既有被忽略的 `engineering/qa/evidence/` 子目录，未改 .gitignore。
5. **纯函数测试与「服务层单测」的措辞差**：tasks 写「services/communication 单测」，实际 TDD 落在 envelope 纯函数（服务层是薄封装）。归档时如实标注，不虚报。

## 遗留与交接

1. **阶段二（脚手架，另开 Change）**：扩 `docs/api/communication.openapi.json` 端点（只读查询/普通写/受控下行分组见 design）→ 契约先绿先推 → `gen:api-types` → `subapps/fm-communication` 迁入场景工作区 → `build:subapps`。契约端点是否全量纳入或按前 5 场景裁剪需确认。
2. **阶段三（后端，L4，另开 Change）**：Communication Controller/Service/DTO + 受控下行白名单（不放宽 `HardControlPaths`）+ 三方言迁移 V135+（V134 被 water-system 提案占用）+ 权限种子（`sys_menu` + `sys_role_menu`，避开 V33 快照坑）+ jacoco ≥0.80。**白名单具体端点清单须先过人工确认**。
3. **技术债**：`code!==0` 端到端不抛错（改造前后一致，回流契约对拍时统一治理）；4 处列表消费靠 `as unknown as Xxx[]` 双重断言，泛型移除后类型校验减弱，阶段二用 generated types 替换。
4. **未提交改动**：`src/types/scenario.ts` 注释「八大→前 5 个」为上一轮修订，仍在分支工作区未提交，与本次产品化无关，交用户决定处置。

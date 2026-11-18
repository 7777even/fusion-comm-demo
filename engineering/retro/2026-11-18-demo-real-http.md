# Retro：Demo 默认走真实 HTTP 调用

- 分支：`feature/demo-real-http`，基线 `35e5720`。
- 规模：5 个任务；开发提交 `6223aed`~`8f88368`（含 1 个修复 `e15bfc9`），整支审查后补 1 个文档修复 `b613089`（基线 `35e5720` 不计入）；任务级 review 5 次（Task 3 复审 1 次）+ 整支审查 1 次。

## 做对了什么

1. **先四件套再实现**：proposal/design/tasks/spec-delta 建齐并过人工确认关卡（默认真实+显式 mock 回退、场景映射真实接口、.env.local 后填）后才动手；未出现"先实现后补提案"。
2. **spec self-review 拦下字段映射缺陷**：设计初稿的 Enterprise/Camera/PatchTask 映射字段与页面实际消费不符，在写计划前对照 `types/scenario.ts` 补全，避免实施后大面积页面缺字段返工。
3. **计划 self-review 修掉笔误**：Task 3 代码块 import 了不存在的 `Camera` 类型、Files 段漏列 `handler.ts`，派发前修正，implementer 无歧义。
4. **任务级审查抓到 mock 态回归**：Task 3 `toCamera` 只读 `camIndex`，`camIndex ?? cameraId` 兜底由 reviewer 发现（本仓无单测覆盖此路径），修复后复审 Approved。
5. **浏览器实证兜住配置陷阱**：`set "VITE_FC_MOCK=true"` 与 `set VITE_FC_MOCK=true &&` 的尾随空格差异，靠检查 Vite 编译产物 `import.meta.env` 与 playwright 角标断言才发现，避免"以为在 mock 实为真实"的误判。

## 踩坑与修正

1. **cmd 环境变量尾随空格**：`set VAR=value && cmd` 的 value 带尾随空格，`=== 'true'` 失配；用 `set "VAR=value"` 修正。写进 QA 与 spec Scenario，避免复犯。
2. **mock handler 字段双形态**：真实 `EP.cameras` 返回 `camIndex`，mock 返回 `cameraId`；适配层必须同时兼容，否则回退态功能退化。这类"同一端点两形态"在本 demo 里普遍存在（queryRegions/recordsQuery 的 mock 与真实字段也有差异），映射层应统一做兼容而非假设单一形态。
3. **工具链限制降级**：subagent-driven 要求 general-purpose 实现 subagent，但当前工具集只有只读 `code-explorer`；降级为"会话内实现 + code-explorer 任务级审查 + 整支审查"，质量门（spec + quality review）保持不变。

## 遗留与交接

1. 真实平台地址/密钥由使用者填 `.env.local`；填后按 README 切 LIVE 即可。
2. 真实 WS 事件订阅、下行写端点副作用验证、14 个未实现接口——见 QA 遗留清单。
3. 分支尚未合并/推送；按用户意图走 finishing flow。

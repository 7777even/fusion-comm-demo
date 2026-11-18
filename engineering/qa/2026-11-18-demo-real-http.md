# QA：Demo 默认走真实 HTTP 调用

- 分支：`feature/demo-real-http`，基线 `35e5720`，末提交见下。
- 目标：34 个 `/openapi/*` 默认走真实 fetch + V1.3 签名；3 个 `__scene__/*` 伪端点映射到真实接口并适配字段；保留 `VITE_FC_MOCK=true` 显式回退。

## 变更摘要

| 任务 | 提交 | 内容 |
|---|---|---|
| Task 1 | `6223aed` | `config.ts` 默认真实（mock 仅 `VITE_FC_MOCK==='true'`）、`env.d.ts` 加类型、`.env.example` |
| Task 2 | `6d85ab3` | `client.ts` 真实分支 `code!==0` 抛可读错 |
| Task 3 | `1da3082` + 修复 `e15bfc9` | 3 场景方法改真实接口 + 适配函数；`toCamera` 兼容 `cameraId` |
| Task 4 | `35cde26` | 页面字段核对（零改动）+ README 更新 |
| Task 5 | 本提交 | QA/retro/spec 回填、归档 |

## 守门结果

- `npm run build`（vue-tsc -b && vite build）：**通过**，多次复跑均 `✓ built in 11-14s`，无 type 错误。chunk >500kB 警告为既存（Dashboard 两个 chunk），非本次引入。
- 任务级审查：5 个任务全部 review。Task 1/2/4 Approved；Task 3 首轮 needs fixes（1 Important + 2 Minor），修复后复审 Approved。所有 finding 已闭环，无遗留 Critical/Important。
- mock 回退态浏览器实证（playwright chromium headless）：
  - `VITE_FC_MOCK=true` 下 dev server 启动，访问 `/` 角标为 MOCK（LIVE=false），场景导航可见，`errorCount=0`、无 pageerror。
  - `/scene/01` 渲染出企业/参会名单内容（`scene01Len=544`），无 console error。

## 实施中发现并修复的真实问题

1. **Task 3 camera 字段回归（Important）**：`toCamera` 初版只读真实接口的 `camIndex`，但 mock handler 的 `EP.cameras` 返回 `cameraId`，导致 mock 回退态摄像头 id 为空、点播链接取不到 cameraId。修复：`CameraRow` 增加 `cameraId?`，`toCamera` 用 `c.camIndex ?? c.cameraId ?? ''` 兜底。单测无法覆盖（本仓无单测），由任务审查发现。
2. **设计初稿字段映射不全（spec self-review）**：初稿把 Enterprise 映射为 `{id,name,scale}`、Camera 用 `id`、PatchTask 为 `{id,title,time}`，与页面实际消费的 `hasTerminal/phone/contact`、`cameraId`、`type/location/monitor/status/evidence` 不符，实施后会页面缺字段。在写计划前对照 `types/scenario.ts` 补全映射。
3. **cmd 环境变量尾随空格（环境陷阱）**：`set VITE_FC_MOCK=true && ...` 会把尾随空格带进变量（`VITE_FC_MOCK: "true "`），导致 `=== 'true'` 判定为 false、mock 没生效。改用 `set "VITE_FC_MOCK=true"` 后实证通过。

## 未做 / 遗留

1. **真实平台请求实证**：无 `.env.local`、无真实 baseUrl/密钥，本轮只验证构建 + mock 回退态，未对真实申讯平台发请求。使用者填 `.env.local` 后可按 README 切 LIVE。
2. **真实事件推送**：`eventStream.ts` 在真实态仍为定时器模拟，真实 WebSocket 订阅（文档 `ws://<ip>:11926`）列为后续增量。
3. **下行写端点副作用**：广播/电话/通知/SOS 是真实写操作，连真平台会产生业务副作用，本轮未实证；需在可写环境单独验证。
4. **文档 48 个接口中 demo 34 个已覆盖，14 个未实现**（音乐/播放列表管理、任务历史明细/删除、事件订阅管理/查询、App 下载/推流）——按用户确认的范围（切调用方式，不扩接口面）不在本次范围。
5. **计划内 Minor（triage 记录）**：task-2 brief 的 "Produces" 措辞"含 msg 与 code"与代码块的 `msg || API_ERROR_<code>` 有歧义，以代码块为准，报告已注明；不影响交付。

## 证据

- 浏览器实证脚本：`.git/sdd/verify-mock-mode.mjs`（git 内部临时文件，不入库）。
- 各任务 review 包与报告：`.git/sdd/review-*.diff`、`.git/sdd/task-*-report.md`（不入库）。

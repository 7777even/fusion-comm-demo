# 融合通信指挥 Demo

基于**上海申讯融合通信平台 OpenAPI V1.3** 的可演示 Demo，覆盖应急融合通信的 **5 个基础能力页**与《化工园区八大业务场景建设方案》中**前 5 个业务场景页**（平时 2 个 + 战时 3 个）。视觉规范对齐大屏端 UI 规范（深色玻璃面板 / 科技青 / 单一 token 真源）。默认 **Mock 模式**，无需真实平台即可完整演示；填入地址密钥后可切换 **真实平台模式**。

## 快速启动

```bash
cd D:/gkproject/fusion-comm-demo
npm install
npm run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5188`，端口被占用时 Vite 自动顺延，以实际输出为准）。

> 生产构建：`npm run build`（已通过 TS 严格模式类型检查 + Vite 构建）。项目无单元测试脚本，验收以构建 + Playwright 浏览器实证为准。

## 页面总览

侧边栏分 3 组共 10 项：

| 分组 | 页面 |
|---|---|
| 基础能力 | 态势总览、电话调度、扩音广播、信息发布、应急联动与检索 |
| 平时·日常管理 | 01 园区多企业远程会议、02 移动巡检与特殊作业联防 |
| 战时·应急指挥 | 03 多渠道接报与应急响应启动、04 跨网异构多方视频会商、05 二三维GIS融合调度 |

## 基础能力页与对应接口

| 页面 | 功能 | 对应接口 |
|---|---|---|
| 态势总览 | 资源状态、活动趋势、实时事件流 | — |
| 电话调度 | 组织架构通讯录、一键直通、多方会议、强插/强拆/监听、通话状态推送 | `queryRegions` `queryTerminals` `terminalOperator` |
| 扩音广播 | 广播组/区域选择、TTS 喊话、音量控制、状态回推 | `syncBroadcastGroup` `startTtsTask` `setVolume` 等 |
| 信息发布 | 短信推送 + 未回复自动语音升级、移动端公告指定范围 | `linkTask/send` rule 2/3/4/7 |
| 应急联动与检索 | 一键报警联动+确认、录音查询/转写/摘要/关键词检索 | `sosLinkage/add` `confirm` `records/query` `asr` |

## 业务场景（前 5 个）

每个场景页以 5 个页签呈现建设方案内容：**场景故事 / 场景卡片 / 业务流程 / 角色动作 / 依赖功能**，其中「业务流程」页签提供可交互工作区，操作会调用接口或触发模拟，并实时写入「角色动作」页签的 LIVE 行。合同边界与验收建议不在页面展示，可从 `docs/superpowers/specs/2026-11-18-eight-scenarios-design.md` 查阅（该设计文档覆盖全部 8 个场景，本 Demo 仅实现前 5 个）。

| # | 场景 | 核心交互 | 接口支撑 |
|---|---|---|---|
| 01 | 园区多企业远程会议 | 13 家企业勾选、接入方式分配、发起会议、会控 | `terminalOperator` 10-16 真实；会议管理模拟 |
| 02 | 移动巡检与特殊作业联防 | 越界告警、模拟地图轨迹、监控点播、点呼、作业票整改闭环 | `cameras/*` `terminalOperator` 真实；定位/工单模拟 |
| 03 | 多渠道接报与应急响应启动 | 接报登记、视频核实、响应定级、一键通知、未确认重呼 | `sosLinkage/add` `linkTask/send` 真实；事件/指挥体系模拟 |
| 04 | 跨网异构多方视频会商 | 参会对象选择、多画面、视频入会、会控、纪要归档 | `terminalOperator` 10-16 + `getPreviewUrl` 真实；MCU/白板模拟 |
| 05 | 二三维GIS融合调度 | 模拟平面图、标绘警戒区、圈选终端、分类调度、视频分发 | `queryTerminals` `cameras/*` 真实；GIS/三维/路径模拟 |

> 有接口的能力统一走 `fcPost`；无接口的能力用拟真数据 + 本地状态机模拟，页面均带 `【模拟】` 或 `【需对接】` 标注。能力边界与待确认清单见 `docs/superpowers/specs/2026-11-18-eight-scenarios-design.md`。

## UI 规范

样式采用单一 token 真源 + 分层覆盖，4 层文件按序引入 `src/main.ts`：

| 文件 | 职责 |
|---|---|
| `src/styles/tokens.css` | 唯一视觉真源：色彩 / 字号 / 间距 / 圆角 / 渐变 / 玻璃 / 布局 / 层级 / 图表 token |
| `src/styles/global.css` | body 深蓝渐变背景、细滚动条、`.glass-panel`、`.panel-title` 青色竖条 |
| `src/styles/element-dark.css` | Element Plus 组件深色覆盖 |
| `src/styles/main.css` | Demo 布局与组件样式，全部走 `var(--token)` |

组件禁止硬编码颜色/字号/字体；ECharts 通过 `getComputedStyle` 读取 token 色值，并把 CSS Color 4 的 `rgb(r g b / a)` 规范化为 `rgba()` 以适配 zrender。

## 鉴权实现

`src/api/sign.ts` 严格按文档实现：

```
X-CR-Signature = sha256(secretId + "&" + timestamp + "&" + secretKey)
```

三个 Header（`X-CR-SecretId` / `X-CR-Timestamp` / `X-CR-Signature`）放请求头，每次请求重新生成。用浏览器原生 Web Crypto，无第三方依赖。

## 连接平台（默认真实模式）

默认进入真实模式，`fcPost` 以 fetch + V1.3 签名直连 `VITE_FC_BASE_URL`，顶栏角标显示 `LIVE`。在项目根目录复制 `.env.example` 为 `.env.local` 并填写：

```ini
VITE_FC_MOCK=false
VITE_FC_BASE_URL=http://<平台IP>:<端口>
VITE_FC_WS_URL=ws://<平台IP>:11926
VITE_FC_SECRET_ID=your-secret-id
VITE_FC_SECRET_KEY=your-secret-key
```

无真实平台时，设 `VITE_FC_MOCK=true` 回退本地模拟（角标显示 `MOCK`，可离线演示完整场景）。`.env.local` 已被 gitignore，请勿提交真实密钥。

> **上线前必读**：浏览器直连平台会有 CORS 跨域限制，且鉴权密钥暴露在前端有安全风险。生产环境应由**后端服务**统一做签名与转发，前端只调自家后端。当前 REAL 模式仅用于演示调用链。

## 能力边界（需向厂家确认的缺口）

1. **短信回复跟踪 / 上行回执**：文档无上行短信接口，demo 用状态机模拟（未回复 → rule=7 电话呼叫升级）。
2. **移动端公告下发**：文档仅 App 上报接口（`eventReport`），主动下发通道不明确，demo 以 rule=4 消息推送模拟。
3. **无线对讲频道**：文档无独立对讲接口，以终端类型 4 + 组呼（`BG#`）实现。
4. **组织/应急小组写入**：文档只有查询接口，分组设定需平台后台操作。
5. **关键词检索**：`records/query` 只支持号码+时间，关键词通过 `record/asr` 转写文本后本地检索。
6. **广播任务模块**：需确认平台已授权；强插/强拆需权限与等级；录音需硬件+开启 PBX 录音开关。
7. **八大场景无接口能力**：短信独立收发/回执、GIS 地图与空间分析、PDT 集群对讲、视频会议 MCU 会控、三维演练/预案推演、车辆轨迹回放、报告自动生成等均无 OpenAPI 接口，demo 以模拟状态机演示业务闭环，不能视为已具备真实平台能力。

## 目录结构

```
src/
├─ api/
│  ├─ config.ts          模式切换配置
│  ├─ sign.ts            SHA-256 鉴权签名
│  ├─ client.ts          统一 HTTP 客户端
│  ├─ endpoints.ts       接口路径与常量枚举
│  └─ mock/
│     ├─ data.ts         拟真数据（含场景企业/作业票/演练计划）
│     ├─ handler.ts      接口模拟分发（含场景专用 case）
│     └─ eventStream.ts  事件推送 + 短信状态机
├─ components/scenario/
│  └─ ScenarioShell.vue  场景通用壳（5 页签）
├─ scenes/meta.ts        前 5 个场景的结构化元数据
├─ styles/
│  ├─ tokens.css         视觉 token 唯一真源
│  ├─ global.css         全局样式与通用类
│  ├─ element-dark.css   Element Plus 深色覆盖
│  └─ main.css           布局与组件样式
├─ stores/comm.ts        全局状态（事件流/短信任务/场景角色动作）
├─ types/
│  ├─ index.ts           基础领域类型
│  └─ scenario.ts        场景领域类型
├─ views/
│  ├─ (5 个基础能力页)
│  └─ scenarios/         前 5 个场景交互工作区
└─ router/index.ts       10 条路由 + 兜底重定向
```

## 相关文档

- 大屏端 UI 规范对齐设计：`docs/superpowers/specs/2026-11-18-screen-ui-token-alignment-design.md`
- 八大场景设计：`docs/superpowers/specs/2026-11-18-eight-scenarios-design.md`
- 八大场景实施计划：`docs/superpowers/plans/2026-11-18-eight-scenarios.md`
- 视觉验收记录：`engineering/qa/2026-11-18-screen-ui-token-alignment.md`、`engineering/qa/2026-11-18-eight-scenarios.md`

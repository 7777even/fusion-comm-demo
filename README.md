# 融合通信指挥 Demo

基于**上海申讯融合通信平台 OpenAPI V1.3** 实现的可行 demo,覆盖应急融合通信的 4 大模块。默认 **Mock 模式**,无需真实平台即可完整演示;填入地址密钥后可切换 **真实平台模式**。

## 快速启动

```bash
cd D:/gkproject/fusion-comm-demo
npm install
npm run dev
```

浏览器打开 `http://localhost:5188`。

> 生产构建:`npm run build`(已通过 TS 严格模式类型检查)。

## 已实现模块

| 模块 | 功能 | 对应接口 |
|---|---|---|
| 态势总览 | 资源状态、活动趋势、实时事件流 | — |
| 电话调度 | 组织架构通讯录、一键直通、多方会议、强插/强拆/监听、通话状态推送 | `queryRegions` `queryTerminals` `terminalOperator` |
| 扩音广播 | 广播组/区域选择、TTS 喊话、音量控制、状态回推 | `syncBroadcastGroup` `startTtsTask` `setVolume` 等 |
| 信息发布 | 短信推送 + 未回复自动语音升级、移动端公告指定范围 | `linkTask/send` rule 2/3/4/7 |
| 应急联动与检索 | 一键报警联动+确认、录音查询/转写/摘要/关键词检索 | `sosLinkage/add` `confirm` `records/query` `asr` |

## 鉴权实现

`src/api/sign.ts` 严格按文档实现:

```
X-CR-Signature = sha256(secretId + "&" + timestamp + "&" + secretKey)
```

三个 Header(`X-CR-SecretId` / `X-CR-Timestamp` / `X-CR-Signature`)放请求头,每次请求重新生成。用浏览器原生 Web Crypto,无第三方依赖。

## 切换到真实平台

在项目根目录建 `.env.local`:

```ini
VITE_FC_BASE_URL=http://<平台IP>:<端口>
VITE_FC_WS_URL=ws://<平台IP>:11926
VITE_FC_SECRET_ID=your-secret-id
VITE_FC_SECRET_KEY=your-secret-key
```

`config.ts` 检测到 `VITE_FC_BASE_URL` 后自动进入真实模式,顶栏角标从 `MOCK` 变为 `LIVE`。

> **上线前必读**:浏览器直连平台会有 CORS 跨域限制,且鉴权密钥暴露在前端有安全风险。生产环境应由**后端服务**统一做签名与转发,前端只调自家后端。当前 REAL 模式仅用于演示调用链。

## 能力边界(需向厂家确认的缺口)

1. **短信回复跟踪 / 上行回执**:文档无上行短信接口,demo 用状态机模拟(未回复→ rule=7 电话呼叫升级)。
2. **移动端公告下发**:文档仅 App 上报接口(`eventReport`),主动下发通道不明确,demo 以 rule=4 消息推送模拟。
3. **无线对讲频道**:文档无独立对讲接口,以终端类型 4 + 组呼(`BG#`)实现。
4. **组织/应急小组写入**:文档只有查询接口,分组设定需平台后台操作。
5. **关键词检索**:`records/query` 只支持号码+时间,关键词通过 `record/asr` 转写文本后本地检索。
6. **广播任务模块**:需确认平台已授权;强插/强拆需权限与等级;录音需硬件+开启 PBX 录音开关。

## 目录结构

```
src/
├─ api/
│  ├─ config.ts        模式切换配置
│  ├─ sign.ts          SHA-256 鉴权签名
│  ├─ client.ts        统一 HTTP 客户端
│  ├─ endpoints.ts     接口路径与常量枚举
│  └─ mock/
│     ├─ data.ts       拟真数据
│     ├─ handler.ts    接口模拟分发
│     └─ eventStream.ts事件推送 + 短信状态机
├─ stores/comm.ts      全局状态(事件流/短信任务)
├─ views/              5 个页面
└─ router/             路由
```

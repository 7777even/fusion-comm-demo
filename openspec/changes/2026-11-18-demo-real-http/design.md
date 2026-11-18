# 设计：Demo 默认走真实 HTTP 调用

## 架构与数据流

```
场景页/基础页 → services/communication (api)
  → api/client.ts fcPost
      ├─ mock=true（显式 VITE_FC_MOCK）→ mock/handler.ts（本地分发）
      └─ mock=false（默认）→ buildAuthHeaders(secretId,secretKey) → fetch POST(baseUrl+path) → 校验 code
```

- `config.ts` 是模式单一真源：`mock` 仅由 `VITE_FC_MOCK === 'true'` 决定，不再从 `VITE_FC_BASE_URL` 推断。
- `buildAuthHeaders` 保持每次请求生成秒级时间戳 + `sha256(secretId&timestamp&secretKey)`，与文档「鉴权」章节一致；不改协议、不新增第三方库。
- 真实模式缺少 baseUrl/密钥时不抛构造期异常，请求自然失败（fetch 相对路径 404 / 签名空密钥被平台拒绝），由 `client.ts` 统一抛出可读错误。

## 组件职责

- `src/api/config.ts`：模式与连接配置单一真源；新增 `VITE_FC_MOCK` 字段到 `env.d.ts`。
- `src/api/client.ts`：`fcPost` 统一分发；真实分支做 `resp.ok` 与 `code !== 0` 双重校验，错误带上 `code/msg`。
- `src/api/sign.ts`：签名纯函数，不改实现。
- `src/services/communication.ts`：原样透传 34 个真实端点；新增 3 个场景适配函数：
  - `sceneEnterprises()` → `queryRegions({ pageNum:1, pageSize:50 })` → `{ total, rows:[{ id:regionId, name:regionName, scale:totalTerminals }] }`
  - `sceneCameras()` → `queryCameras({ pageNum:1, pageSize:50 })` → `{ total, rows:[{ id:camIndex, name, status:linkType }] }`
  - `scenePatchTasks()` → `recordsQuery({})` → `{ total, rows:[{ id, title:callerNum+'→'+destination, time:callTime }] }`
- `src/views/scenarios/Scene01Meeting.vue` / `Scene02Patrol.vue` / `Scene04Consult.vue`：字段消费对齐上述映射结构。
- `.env.example`：模板文件，不含真实值。

## 关键决策

- **保留 mock 作为显式回退**：`VITE_FC_MOCK=true` 才启用。理由：无真实平台时仓库仍可离线演示；默认真实满足用户诉求。反对项：连开关都不要会让无 env 时完全不可用。
- **场景数据映射真实接口**：遵守用户选择；接受语义不完全对等（`recordsQuery` 通话记录当工单流展示）。
- **业务错误码统一抛出**：`code !== 0` 时抛错而非静默返回，避免页面把失败当空数据。

## 错误处理

- HTTP 非 2xx：抛 `Error('HTTP <status> <statusText>')`（保留现有）。
- HTTP 2xx 但 `code !== 0`：抛 `Error(msg || 'API_ERROR_<code>')`。
- 网络异常（fetch reject）：原样抛出，由页面 `try/catch` 吞掉并 `ElMessage` 提示（现有页面已有该处理）。

## 测试与验收

- `npm run build`（vue-tsc -b && vite build）通过。
- 无真实平台地址，不做真实请求实证；显式 mock 回退模式保留，可本地设 `VITE_FC_MOCK=true` 跑起完整演示。
- 事件推送保持定时器模拟（真实 WS 订阅列为后续增量，不在本变更范围）。

/**
 * 融合通信平台接入配置
 * ------------------------------------------------------------------
 * 默认真实模式：所有请求以 fetch + V1.3 签名直连申讯融合平台。
 * 显式 VITE_FC_MOCK=true 时回退本地模拟，仓库可离线演示。
 *
 * 真实对接时在项目根目录建 .env.local（模板见 .env.example）：
 *   VITE_FC_BASE_URL=http://<平台IP>:<端口>
 *   VITE_FC_WS_URL=ws://<平台IP>:11926
 *   VITE_FC_SECRET_ID=your-secret-id
 *   VITE_FC_SECRET_KEY=your-secret-key
 *
 * 注意：浏览器直连平台会有跨域(CORS)限制,生产应由后端做签名与转发，
 * 前端只调自家后端。此 demo 的 REAL 模式用于演示调用链,上线前需加代理。
 */
export const FC_CONFIG = {
  // true = 本地模拟（仅显式 VITE_FC_MOCK=true）；false = 真实平台（默认）
  mock: import.meta.env.VITE_FC_MOCK === 'true',

  baseUrl: import.meta.env.VITE_FC_BASE_URL || '',
  wsUrl: import.meta.env.VITE_FC_WS_URL || '',
  secretId: import.meta.env.VITE_FC_SECRET_ID || '',
  secretKey: import.meta.env.VITE_FC_SECRET_KEY || '',

  // 调度台 id（文档默认 0）
  ddtId: 0,

  // 模拟网络延迟（ms），让 demo 有真实的请求感
  mockLatency: 260
} as const

export type FcConfig = typeof FC_CONFIG

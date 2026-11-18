/**
 * 融合通信平台接入配置
 * ------------------------------------------------------------------
 * MOCK 模式（默认）：所有请求走本地模拟器,无需真实平台即可完整演示。
 * REAL 模式：改为环境变量注入真实地址与密钥,切换到申讯融合平台。
 *
 * 真实对接时在项目根目录建 .env.local：
 *   VITE_FC_BASE_URL=http://<平台IP>:<端口>
 *   VITE_FC_WS_URL=ws://<平台IP>:11926
 *   VITE_FC_SECRET_ID=your-secret-id
 *   VITE_FC_SECRET_KEY=your-secret-key
 *
 * 注意：浏览器直连平台会有跨域(CORS)限制,生产应由后端做签名与转发，
 * 前端只调自家后端。此 demo 的 REAL 模式用于演示调用链,上线前需加代理。
 */
export const FC_CONFIG = {
  // true = 本地模拟；false = 真实平台（读环境变量）
  mock: !import.meta.env.VITE_FC_BASE_URL,

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

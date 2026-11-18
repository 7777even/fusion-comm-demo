/**
 * OpenAPI 鉴权签名（对应文档的「鉴权」章节）
 * 公共参数放 HTTP Header：
 *   X-CR-SecretId    企业唯一标识
 *   X-CR-Timestamp   秒级时间戳（与服务器相差 >5 分钟会过期）
 *   X-CR-Signature   sha256(secretId + "&" + timestamp + "&" + secretKey)
 */

/** Web Crypto 异步 SHA-256（浏览器原生，无需第三方库） */
export async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface AuthHeaders {
  [key: string]: string
  'X-CR-SecretId': string
  'X-CR-Timestamp': string
  'X-CR-Signature': string
  'Content-Type': string
}

/** 生成一次请求的鉴权 Header（每次请求都要重新生成） */
export async function buildAuthHeaders(
  secretId: string,
  secretKey: string
): Promise<AuthHeaders> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await sha256Hex(`${secretId}&${timestamp}&${secretKey}`)
  return {
    'X-CR-SecretId': secretId,
    'X-CR-Timestamp': timestamp,
    'X-CR-Signature': signature,
    'Content-Type': 'application/json;charset=utf-8'
  }
}

/** 生成事件 ID（UUID，文档要求长度不超过 40） */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

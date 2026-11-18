import { buildAuthHeaders } from '../api/sign.ts'

/** 回流边界：产品化后申讯签名由后端代理生成，浏览器不再持有密钥。 */
export const boundaryNote =
  '产品化回流后：X-CR-Signature 由后端代理生成，浏览器零密钥；本地 demo 仅在 REAL 演示态保留直连签名。'

export interface FcSignerOptions {
  secretId: string
  secretKey: string
  /** true 表示签名交由平台后端代理；本地 demo 传 false 走演示态直连。 */
  useProxy: boolean
}

export interface FcSigner {
  headers(): Promise<Record<string, string>>
  readonly boundaryNote: string
}

/** useProxy=true 时不读浏览器密钥，返回空头，由后端代理补签（本阶段 demo 不触发）。 */
export function createProxyAwareSigner(opts: FcSignerOptions): FcSigner {
  return {
    async headers(): Promise<Record<string, string>> {
      if (opts.useProxy) return {}
      return buildAuthHeaders(opts.secretId, opts.secretKey)
    },
    boundaryNote
  }
}

/**
 * 统一 HTTP 客户端
 * - MOCK 模式：请求分发到本地 mock 处理器
 * - REAL 模式：走 fetch + 鉴权签名
 * 所有业务接口统一 POST + JSON（对应文档协议概述）
 */
import { FC_CONFIG } from './config'
import { buildAuthHeaders } from './sign'
import { mockRequest } from './mock/handler'

export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data?: T
  total?: number
  rows?: T[]
  [key: string]: unknown
}

export async function fcPost<T = unknown>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<ApiResponse<T>> {
  if (FC_CONFIG.mock) {
    return mockRequest(path, params) as Promise<ApiResponse<T>>
  }
  const headers = await buildAuthHeaders(FC_CONFIG.secretId, FC_CONFIG.secretKey)
  const resp = await fetch(`${FC_CONFIG.baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  })
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
  }
  const body = (await resp.json()) as ApiResponse<T>
  if (body.code !== 0) {
    throw new Error(body.msg || `API_ERROR_${body.code}`)
  }
  return body
}

/** 当前运行模式，供界面角标展示 */
export const isMockMode = (): boolean => FC_CONFIG.mock

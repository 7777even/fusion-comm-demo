export interface Envelope {
  code: number
  msg: string
  data?: unknown
  rows?: unknown[]
  row?: unknown[]
  total?: number
  [key: string]: unknown
}

export function unwrapBody<T>(res: Envelope): T {
  if (res.code !== 0) throw new Error(res.msg || `API_ERROR_${res.code}`)
  if (res.data === undefined || res.data === null) throw new Error('EMPTY_BODY')
  return res.data as T
}

export function unwrapRows<T>(res: Envelope): { rows: T[]; total: number } {
  if (res.code !== 0) throw new Error(res.msg || `API_ERROR_${res.code}`)
  const rows = (res.rows ?? res.row ?? []) as T[]
  const total = res.total ?? rows.length
  return { rows, total }
}

import { fcPost } from '../api/client.ts'
import { EP } from '../api/endpoints.ts'
import type { Enterprise, PatchTask } from '../types/scenario.ts'
import type { Region, CallRecordItem } from '../types/index.ts'
export { unwrapBody, unwrapRows } from './envelope.ts'

type Params = Record<string, unknown>

const CALL_TYPE: Record<number, string> = {
  0: '电话录音', 1: '呼入未接', 2: '呼入已接', 3: '呼出通话', 4: 'MCU 接续', 5: '断线通话'
}

function toEnterprise(r: Region): Enterprise {
  const terminals = String((r as unknown as { terminals?: string }).terminals ?? '')
  return {
    id: r.regionId,
    name: r.regionName,
    hasTerminal: Number(r.totalTerminals ?? 0) > 0,
    contact: '—',
    phone: terminals.split(',')[0] || r.regionId,
    lng: 0,
    lat: 0,
    status: '未通知'
  }
}

type CameraRow = { camIndex?: string; name?: string; status?: number; linkType?: number }
function toCamera(c: CameraRow) {
  return { cameraId: c.camIndex ?? '', name: c.name ?? '', status: c.status ?? c.linkType ?? 0 }
}

function toPatchTask(r: CallRecordItem, i: number): PatchTask {
  return {
    id: r.url || `${r.callerNum}-${r.destination}-${r.startTime}-${i}`,
    type: CALL_TYPE[r.callType] ?? '通话记录',
    location: `${r.callerNum}→${r.destination}`,
    owner: r.callerNum,
    monitor: r.destination,
    status: '待核查',
    evidence: false
  }
}

/**
 * 融合通信服务层。
 * 页面统一经此调用，包络原样返回（rows/row/data 由调用方按需解包）。
 * 回流脚手架后：此层改消费 generated types，签名由后端代理生成。
 */
export const communicationApi = {
  // 组织 / 通讯录
  queryRegions: (p: Params = {}) => fcPost(EP.queryRegions, p),
  queryTerminals: (p: Params) => fcPost(EP.queryTerminals, p),
  // 视频
  cameras: (p: Params = {}) => fcPost(EP.cameras, p),
  previewUrl: (p: Params) => fcPost(EP.previewUrl, p),
  // 录音 / 转写 / 摘要
  recordsQuery: (p: Params = {}) => fcPost(EP.recordsQuery, p),
  recordAsr: (p: Params) => fcPost(EP.recordAsr, p),
  recordStartSummary: (p: Params) => fcPost(EP.recordStartSummary, p),
  recordGetSummaryStatus: (p: Params) => fcPost(EP.recordGetSummaryStatus, p),
  // 广播
  syncBroadcastGroup: (p: Params = {}) => fcPost(EP.syncBroadcastGroup, p),
  syncBroadcastTerminals: (p: Params = {}) => fcPost(EP.syncBroadcastTerminals, p),
  syncSmsTemplateList: () => fcPost(EP.syncSmsTemplateList, {}), // 阶段二预留：当前页面未引用
  broadcastCommand: (ep: string, p: Params) => fcPost(ep, p),
  // 电话 / 会议（受控下行业务入口，回流后由后端代理签名）
  terminalOperator: (p: Params) => fcPost(EP.terminalOperator, p),
  // 联动通知
  linkTaskSend: (p: Params) => fcPost(EP.linkTaskSend, p),
  // 报警联动
  sosAdd: (p: Params) => fcPost(EP.sosAdd, p),
  sosConfirm: (p: Params) => fcPost(EP.sosConfirm, p),
  // App
  appEventReport: (p: Params) => fcPost(EP.appEventReport, p),
  // 事件订阅（阶段二预留：回流后改由平台 WS 回推，当前页面未引用）
  eventSubscription: (p: Params) => fcPost(EP.eventSubscription, p),
  eventUnSubscription: (p: Params) => fcPost(EP.eventUnSubscription, p),
  // 场景数据：真实接口 + 字段适配（mock 回退态由 handler.ts 提供 __scene__/*）
  sceneEnterprises: async () => {
    const res = await fcPost(EP.queryRegions, { pageNum: 1, pageSize: 50 })
    return { ...res, rows: ((res.rows ?? []) as Region[]).map(toEnterprise) }
  },
  sceneCameras: async () => {
    const res = await fcPost(EP.cameras, { pageNum: 1, pageSize: 50 })
    return { ...res, rows: ((res.rows ?? []) as CameraRow[]).map(toCamera) }
  },
  scenePatchTasks: async () => {
    const res = await fcPost(EP.recordsQuery, { pageNum: 1, pageSize: 50 })
    return { ...res, rows: ((res.rows ?? []) as CallRecordItem[]).map(toPatchTask) }
  }
} as const

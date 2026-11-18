/** 全局领域类型 */

export interface Region {
  regionId: string
  regionName: string
  parentId: string | null
  totalTerminals: number
  terminals: string | null
  ddtId: number
}

export interface Terminal {
  terminalId: string
  terminalName: string
  keyIndex: number
  terminalType: number
  status: number // 1 在线 / -1 离线
  event: string
  codeType: number // 0 内线 1 外线 2 中继
  regionId: string | null
  location: string | null
}

export interface BroadcastGroup {
  groupId: string
  groupName: string
  groupIndex: number
  status: 'Idle' | 'playing'
  ddtId: number
}

export interface CallRecordItem {
  callerNum: string
  destination: string
  startTime: string
  timeLen: number
  callType: number
  url: string
  urlv2: string
  transcript?: string
  summary?: string
}

export interface LinkTaskPayload {
  mobile: string
  rule: number
  eventId: string
  vcontentType?: number
  vcontent?: string
  scontent?: string
  playCnt?: number
  templateCode?: string
  templateParam?: string
}

/** 实时推送事件（来自 WS 或模拟事件流） */
export interface CommEvent {
  id: string
  cmd: 'callRecord' | 'deviceStatus' | 'broadcastGroupStatus' | 'sosLinkage' | 'broadcastTaskStatus' | 'appData'
  ts: string
  text: string
  level?: 'info' | 'success' | 'warning' | 'danger'
  raw?: Record<string, unknown>
}

/** 短信发送任务（含回复跟踪状态机） */
export type SmsTaskState = 'sending' | 'sent' | 'awaiting' | 'replied' | 'escalated'

export interface SmsTask {
  id: string
  target: string
  targetName: string
  content: string
  state: SmsTaskState
  createdAt: string
  rule: number
  replyAt?: string
  escalateAt?: string
}

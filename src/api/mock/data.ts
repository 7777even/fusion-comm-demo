/**
 * Mock 拟真数据
 * 字段结构严格对齐 OpenAPI 文档返回示例，方便真实模式切换后无缝对接。
 */
import type { Region, Terminal, BroadcastGroup, CallRecordItem } from '@/types'

export const mockRegions: Region[] = [
  { regionId: 'R0001', regionName: '茂名石化 · 厂区总调度', parentId: null, totalTerminals: 12, terminals: null, ddtId: 0 },
  { regionId: 'R0101', regionName: '生产一部', parentId: 'R0001', totalTerminals: 8, terminals: '8001,8002,8003', ddtId: 0 },
  { regionId: 'R0102', regionName: '生产二部', parentId: 'R0001', totalTerminals: 6, terminals: '8011,8012', ddtId: 0 },
  { regionId: 'R0103', regionName: '化工罐区', parentId: 'R0001', totalTerminals: 10, terminals: '8021,8022', ddtId: 0 },
  { regionId: 'R0104', regionName: '应急指挥中心', parentId: 'R0001', totalTerminals: 5, terminals: '9000,9001', ddtId: 0 },
  { regionId: 'R0201', regionName: '应急小组（危化处置）', parentId: 'R0104', totalTerminals: 4, terminals: '9101,9102', ddtId: 0 },
  { regionId: 'R0202', regionName: '应急小组（消防）', parentId: 'R0104', totalTerminals: 4, terminals: '9201,9202', ddtId: 0 }
]

const termNames: Record<string, string> = {
  '8001': '一部值班室', '8002': '一部主控', '8003': '一部外操',
  '8011': '二部值班室', '8012': '二部主控',
  '8021': '罐区操作室', '8022': '罐区泵房',
  '9000': '应急总指挥', '9001': '应急值班',
  '9101': '危化处置组长', '9102': '危化处置组员',
  '9201': '消防队长', '9202': '消防战斗员'
}

export const mockTerminals: Terminal[] = Object.entries(termNames).map(([id, name], i) => ({
  terminalId: id,
  terminalName: name,
  keyIndex: i,
  terminalType: id.startsWith('9') ? 1 : 0,
  status: i === 4 || i === 9 ? -1 : 1,
  event: i === 2 ? '通话中' : '空闲',
  codeType: 0,
  regionId: id.startsWith('91') ? 'R0201' : id.startsWith('92') ? 'R0202' : id.startsWith('9') ? 'R0104' : id.startsWith('80') && +id < 8010 ? 'R0101' : 'R0103',
  location: null
}))

// 手持对讲机（terminalType=4），用于对讲频道演示
export const mockWalkieTalkies: Terminal[] = [
  { terminalId: '7001', terminalName: '对讲频道 CH1 · 调度', keyIndex: 20, terminalType: 4, status: 1, event: '空闲', codeType: 2, regionId: 'R0001', location: null },
  { terminalId: '7002', terminalName: '对讲频道 CH2 · 罐区', keyIndex: 21, terminalType: 4, status: 1, event: '空闲', codeType: 2, regionId: 'R0103', location: null },
  { terminalId: '7003', terminalName: '对讲频道 CH3 · 应急', keyIndex: 22, terminalType: 4, status: -1, event: '空闲', codeType: 2, regionId: 'R0104', location: null }
]

export const mockBroadcastGroups: BroadcastGroup[] = [
  { groupId: 'BG#0', groupName: '全厂区组呼', groupIndex: 0, status: 'Idle', ddtId: 0 },
  { groupId: 'BG#1', groupName: '生产一部广播', groupIndex: 1, status: 'Idle', ddtId: 0 },
  { groupId: 'BG#12', groupName: '罐区扩音广播', groupIndex: 12, status: 'Idle', ddtId: 0 },
  { groupId: 'BG#13', groupName: '应急指挥扩音', groupIndex: 13, status: 'playing', ddtId: 0 },
  { groupId: 'BG#14', groupName: '装卸区广播', groupIndex: 14, status: 'Idle', ddtId: 0 }
]

export const mockBroadcastMembers: Record<number, string> = {
  0: '8001,8002,8011,8012,8021,8022,9000,9001',
  1: '8001,8002,8003',
  12: '8021,8022,7002',
  13: '9000,9001,9101,9201,7003',
  14: '8011,8012'
}

const now = Date.now()
const fmt = (offsetMin: number) =>
  new Date(now - offsetMin * 60000).toISOString().slice(0, 19).replace('T', ' ')

export const mockCallRecords: CallRecordItem[] = [
  {
    callerNum: '9000', destination: '9101', startTime: fmt(6), timeLen: 42, callType: 3,
    url: '/record/9000-9101_1.wav', urlv2: '',
    transcript: '总指挥呼叫危化处置组：罐区苯报警，请立即到 P-002A 附近确认，携带可燃气体检测仪。',
    summary: '指令：罐区苯浓度报警，要求危化处置组到场确认并携带检测设备。'
  },
  {
    callerNum: '8021', destination: '9001', startTime: fmt(28), timeLen: 18, callType: 2,
    url: '/record/8021-9001_2.wav', urlv2: '',
    transcript: '罐区操作室报告：3 号罐液位正常，报警为仪表误报，已通知仪表班处理。',
    summary: '上报：3 号罐液位正常，判断为仪表误报。'
  },
  {
    callerNum: '9000', destination: '9201', startTime: fmt(55), timeLen: 63, callType: 3,
    url: '/record/9000-9201_3.wav', urlv2: '',
    transcript: '消防队注意，罐区启动三级响应，请派出两台消防车到南区集合，注意风向。',
    summary: '指令：启动三级响应，消防车南区集合。'
  },
  {
    callerNum: '8001', destination: '8003', startTime: fmt(96), timeLen: 9, callType: 3,
    url: '/record/8001-8003_4.wav', urlv2: '',
    transcript: '收到，马上到现场。',
    summary: '确认到场。'
  },
  {
    callerNum: '8011', destination: '9001', startTime: fmt(140), timeLen: 27, callType: 2,
    url: '/record/8011-9001_5.wav', urlv2: '',
    transcript: '二部报告：临时用电作业票已办理完成，现场监护到位，可以开工。',
    summary: '上报：临时用电作业票办理完成，监护到位。'
  }
]

export const mockSmsTemplates = [
  { code: 'SMS_EMERGENCY_01', name: '应急疏散通知', content: '【应急通知】${area}发生${event}，请立即按预案到指定集合点集结。' },
  { code: 'SMS_GAS_01', name: '可燃气体报警', content: '【告警】${area}${device}可燃气体浓度超标，请立即现场确认。' },
  { code: 'SMS_DRILL_01', name: '应急演练通知', content: '【演练】${time}将组织${type}应急演练，请相关人员准时参加。' }
]

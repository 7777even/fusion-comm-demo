/** 申讯融合通信 OpenAPI V1.3 接口路径（摘自文档，集中管理便于核对） */
export const EP = {
  // 组织 / 通讯录
  queryRegions: '/openapi/dispatchComm/queryRegions',
  queryTerminals: '/openapi/dispatchComm/queryTerminals',

  // 电话
  terminalOperator: '/openapi/dispatchComm/terminalOperator',

  // 广播组
  syncBroadcastGroup: '/openapi/broadcast/syncBroadcastGroup',
  syncBroadcastTerminals: '/openapi/broadcast/syncBroadcastTerminals',
  startTask: '/openapi/broadcast/startTask',
  stopTask: '/openapi/broadcast/stopTask',
  startTtsTask: '/openapi/broadcast/startTtsTask',
  startHiTask: '/openapi/broadcast/startHiTask',
  setVolume: '/openapi/broadcast/setVolume',
  incVolume: '/openapi/broadcast/incVolume',
  decVolume: '/openapi/broadcast/decVolume',
  listTask: '/openapi/broadcast/listTask',
  taskDetail: '/openapi/broadcast/taskDetail',
  listTaskHistory: '/openapi/broadcast/listTaskHistory',

  // 联动通知（短信 / 语音 / 广播 / 电话呼叫 统一入口）
  linkTaskSend: '/openapi/linkTask/send',
  syncSmsTemplateList: '/openapi/sms/syncSmsTemplateList',

  // 报警联动
  sosAdd: '/openapi/sosLinkage/add',
  sosConfirm: '/openapi/sosLinkage/confirm',

  // 录音 / 转写 / 摘要
  recordsQuery: '/openapi/records/query',
  recordAsr: '/openapi/record/asr',
  recordStartSummary: '/openapi/record/startSummary',
  recordGetSummaryStatus: '/openapi/record/getSummaryStatus',

  // App
  appPointInfo: '/openapi/app/pointInfo',
  appEventReport: '/openapi/app/eventReport',
  appGetEventReport: '/openapi/app/getEventReport',

  // 事件订阅
  eventSubscription: '/openapi/eventService/eventSubscription',
  eventUnSubscription: '/openapi/eventService/eventUnSubscription',

  // 视频联动
  cameras: '/openapi/cameras/queryCameras',
  previewUrl: '/openapi/cameras/getPreviewUrl'
} as const

/** 联动规则 rule（文档附录 C） */
export const LINK_RULE = {
  0: '不处理',
  1: 'TTS 语音播报',
  2: '仅短信通知',
  3: '短信+语音播报',
  4: '消息推送',
  5: '播放文件',
  6: '播放预案',
  7: '电话呼叫',
  8: '内线广播组动态音频同播',
  9: '内线广播组固定音频广播'
} as const

/** 话机操作 action（文档 terminalOperator） */
export const PHONE_ACTION = {
  1: '单呼/组呼(会议)',
  2: '通话中止(挂机)',
  3: '通话保持',
  4: '通话取回',
  5: '通话转接',
  6: '通话强插',
  7: '通话强拆',
  8: '通话监听',
  10: '会议呼叫',
  11: '会议发言',
  12: '会议禁言',
  13: '会议退会',
  14: '强插三方',
  15: '全体发言',
  16: '全体禁言'
} as const

/** 报警联动事件类型（文档附录 B 截取常见项） */
export const SOS_EVENT_TYPES = {
  1: '红外线报警', 2: '紧急报警', 3: 'CO超标', 6: '温度过高',
  7: '可燃气浓度过高', 9: '火灾', 11: '烟雾报警', 19: '人脸告警',
  25: '传感器事件', 26: '消防事件', 28: '中控消防报警', 32: '终端离线告警',
  33: '电话呼叫告警', 41: '电话短信联动'
} as const

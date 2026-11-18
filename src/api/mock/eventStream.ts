/**
 * 事件流模拟器
 * 对应文档的「事件订阅 / 推送」机制（通话状态、终端状态、广播状态、报警联动）。
 * MOCK 模式下用定时器产生拟真推送；REAL 模式下同接口可换成 WebSocket 订阅。
 */
import type { CommEvent } from '@/types'
import { uuid } from '../sign'

type Listener = (e: CommEvent) => void
const listeners = new Set<Listener>()
let started = false

export function onEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitEvent(e: Omit<CommEvent, 'id' | 'ts'>): void {
  const full: CommEvent = {
    ...e,
    id: uuid(),
    ts: new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }
  listeners.forEach((l) => l(full))
}

const sampleEvents: Array<Omit<CommEvent, 'id' | 'ts'>> = [
  { cmd: 'deviceStatus', text: '终端 8002 状态：空闲 → 通话中', level: 'info' },
  { cmd: 'callRecord', text: '内线 8011 呼叫 9001，振铃中', level: 'info' },
  { cmd: 'broadcastGroupStatus', text: '广播组 BG#12 开始播放', level: 'success' },
  { cmd: 'deviceStatus', text: '终端 7002（对讲 CH2）上线', level: 'success' },
  { cmd: 'callRecord', text: '外线呼入 139****0021 → 9001', level: 'info' },
  { cmd: 'broadcastTaskStatus', text: 'TTS 广播任务播放完毕', level: 'info' },
  { cmd: 'deviceStatus', text: '终端 9202 离线', level: 'warning' }
]

/** 启动周期性模拟推送 */
export function startEventStream(): void {
  if (started) return
  started = true
  const initial: CommEvent = {
    id: uuid(),
    ts: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    cmd: 'deviceStatus',
    text: '事件推送通道已连接，等待实时状态…',
    level: 'success'
  }
  setTimeout(() => listeners.forEach((l) => l(initial)), 300)

  let i = 0
  const timer = window.setInterval(() => {
    const e = sampleEvents[i % sampleEvents.length]
    emitEvent(e)
    i++
  }, 6500)
  // 组件卸载不清理全局定时器（demo 生命周期内常驻）
  void timer
}

/**
 * 短信回复状态机：发送后到计时，模拟"未回复→语音升级"。
 * 对应需求：跟踪短信回复，未按要求回复则自动调用语音通讯调度服务。
 */
export function simulateSmsLifecycle(
  targetName: string,
  onAwaiting: () => void,
  onReplied: () => void,
  onEscalated: () => void
): void {
  setTimeout(() => {
    onAwaiting()
    emitEvent({ cmd: 'appData', text: `${targetName} 短信已送达，等待回复…`, level: 'info' })
  }, 700)

  // 20% 概率回复，80% 概率超时触发语音升级（演示升级链路）
  const willReply = Math.random() < 0.2
  if (willReply) {
    setTimeout(() => {
      onReplied()
      emitEvent({ cmd: 'appData', text: `${targetName} 已回复短信「收到」`, level: 'success' })
    }, 3000)
  } else {
    setTimeout(() => {
      onEscalated()
      emitEvent({
        cmd: 'callRecord',
        text: `${targetName} 超时未回复 → 自动触发语音通知（电话呼叫）`,
        level: 'danger'
      })
    }, 4500)
  }
}

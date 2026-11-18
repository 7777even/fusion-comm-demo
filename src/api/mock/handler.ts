/**
 * Mock 请求分发器
 * 按接口路径返回与真实平台一致的数据结构；操作类接口会驱动事件总线产生推送。
 */
import { FC_CONFIG } from '../config'
import { uuid } from '../sign'
import { EP } from '../endpoints'
import { emitEvent } from './eventStream'
import type { ApiResponse } from '../client'
import {
  mockRegions, mockTerminals, mockWalkieTalkies, mockBroadcastGroups,
  mockBroadcastMembers, mockCallRecords, mockSmsTemplates,
  mockEnterprises, mockPatchTasks, mockDrillPlans
} from './data'

const ok = (data?: unknown, extra: Record<string, unknown> = {}): ApiResponse => ({
  code: 0, msg: '操作成功', data, ...extra
})

const delay = () => new Promise<void>((r) => setTimeout(r, FC_CONFIG.mockLatency))

export async function mockRequest(
  path: string,
  params: Record<string, unknown> = {}
): Promise<ApiResponse> {
  await delay()
  const p = params

  switch (path) {
    case EP.queryRegions: {
      const pageNum = Number(p.pageNum ?? 1)
      const pageSize = Number(p.pageSize ?? 10)
      const start = (pageNum - 1) * pageSize
      return ok(undefined, {
        total: mockRegions.length,
        rows: mockRegions.slice(start, start + pageSize)
      })
    }

    case EP.queryTerminals: {
      const all = [...mockTerminals, ...mockWalkieTalkies]
      const regionId = String(p.regionId ?? '')
      const name = String(p.terminalName ?? '')
      let list = all
      if (regionId) list = list.filter((t) => t.regionId === regionId)
      if (name) list = list.filter((t) => t.terminalName?.includes(name))
      return ok(undefined, { total: list.length, row: list, max: 2048 })
    }

    case EP.syncBroadcastGroup:
      return ok(undefined, {
        total: mockBroadcastGroups.length,
        rows: mockBroadcastGroups
      })

    case EP.syncBroadcastTerminals: {
      const idx = Number(p.groupIndex ?? 0)
      return ok(mockBroadcastMembers[idx] ?? '')
    }

    case EP.terminalOperator: {
      const action = Number(p.action ?? 1)
      const src = String(p.sourCaller ?? '')
      const dest = (p.destCalled as string[]) ?? []
      const verb = action === 1 ? '呼叫' : action === 10 ? '会议呼叫' :
        action === 2 ? '挂机' : action === 6 ? '强插' : action === 7 ? '强拆' :
        action === 8 ? '监听' : `操作(${action})`
      emitEvent({
        cmd: 'callRecord',
        text: `${src} ${verb} ${dest.join('、')}`,
        level: 'info',
        raw: p
      })
      // 呼叫类动作：延迟模拟被叫摘机通话
      if (action === 1 || action === 10) {
        setTimeout(() => emitEvent({
          cmd: 'callRecord',
          text: `${dest.join('、')} 已接听，通话建立（session ${uuid().slice(0, 8)}）`,
          level: 'success'
        }), 1400)
      }
      return ok()
    }

    case EP.linkTaskSend: {
      const rule = Number(p.rule ?? 0)
      const mobile = String(p.mobile ?? '')
      const content = String(p.scontent || p.vcontent || '')
      const ruleText: Record<number, string> = {
        1: 'TTS 语音播报', 2: '短信通知', 3: '短信+语音播报', 4: '消息推送',
        7: '电话呼叫', 8: '广播同播', 9: '广播播放'
      }
      emitEvent({
        cmd: 'appData',
        text: `联动通知已下发 · ${ruleText[rule] ?? '联动规则' + rule} → ${mobile}${content ? '：' + content.slice(0, 24) : ''}`,
        level: 'warning',
        raw: p
      })
      return ok()
    }

    case EP.syncSmsTemplateList:
      return ok(mockSmsTemplates)

    case EP.sosAdd: {
      const area = String(p.area ?? '')
      const desc = String(p.eventSubTypeDesc ?? '报警')
      const level = Number(p.level ?? 2)
      emitEvent({
        cmd: 'sosLinkage',
        text: `【${level >= 4 ? '高危' : '报警'}】${area} · ${desc}`,
        level: level >= 4 ? 'danger' : 'warning',
        raw: p
      })
      return ok()
    }

    case EP.sosConfirm:
      emitEvent({ cmd: 'sosLinkage', text: `报警 ${String(p.eventId ?? '').slice(0, 8)} 已人工确认`, level: 'success' })
      return ok()

    case EP.startTask:
    case EP.startTtsTask:
    case EP.startHiTask: {
      const group = String(p.groupId ?? p.mobile ?? p.groupIndex ?? '广播组')
      const content = String(p.content ?? p.vcontent ?? p.text ?? '广播内容')
      emitEvent({ cmd: 'broadcastTaskStatus', text: `广播启动 · ${group}：${content.slice(0, 24)}`, level: 'success', raw: p })
      // 播放完成后回到 Idle
      setTimeout(() => emitEvent({
        cmd: 'broadcastGroupStatus',
        text: `${group} 播放结束，回到空闲`,
        level: 'info'
      }), 3000)
      return ok(uuid())
    }

    case EP.stopTask:
      emitEvent({ cmd: 'broadcastTaskStatus', text: '广播任务已停止', level: 'info', raw: p })
      return ok()

    case EP.setVolume:
    case EP.incVolume:
    case EP.decVolume:
      return ok()

    case EP.listTask:
      return ok(undefined, {
        total: 3,
        rows: [
          { taskId: 'T1001', name: '应急疏散广播', group: 'BG#13', status: '已完成', lastRun: '10:32' },
          { taskId: 'T1002', name: '罐区安全提示', group: 'BG#12', status: '已完成', lastRun: '09:15' },
          { taskId: 'T1003', name: '班前会喊话', group: 'BG#0', status: '空闲', lastRun: '08:00' }
        ]
      })

    case EP.recordsQuery: {
      const caller = String(p.callerNum ?? '')
      const dest = String(p.destination ?? '')
      let list = mockCallRecords
      if (caller) list = list.filter((r) => r.callerNum.includes(caller))
      if (dest) list = list.filter((r) => r.destination.includes(dest))
      return ok(undefined, { total: list.length, rows: list })
    }

    case EP.recordAsr:
      emitEvent({ cmd: 'callRecord', text: '录音转写任务已提交', level: 'info' })
      return ok()

    case EP.recordStartSummary:
      return ok(uuid())

    case EP.recordGetSummaryStatus:
      return ok(1)

    case EP.appEventReport:
    case EP.appPointInfo:
    case EP.appGetEventReport:
      return ok()

    case EP.eventSubscription:
    case EP.eventUnSubscription:
      return ok()

    case EP.camerasRegions:
      return ok(undefined, {
        data: [
          { indexCode: 'REG-KQ', name: '罐区' },
          { indexCode: 'REG-XQ', name: '装卸区' },
          { indexCode: 'REG-GJ', name: '石化大道卡口' }
        ]
      })

    case EP.taskAdd:
    case EP.taskUpdate:
      emitEvent({ cmd: 'broadcastTaskStatus', text: `广播任务已${path === EP.taskAdd ? '新增' : '更新'}`, level: 'info', raw: p })
      return ok(uuid())

    case EP.taskRemove:
      emitEvent({ cmd: 'broadcastTaskStatus', text: '广播任务已删除', level: 'info', raw: p })
      return ok()

    case EP.cameras:
      return ok(undefined, {
        total: 2,
        rows: [
          { cameraId: 'CAM-KQ-01', name: '罐区全景', status: 1 },
          { cameraId: 'CAM-XQ-01', name: '装卸区', status: 1 }
        ]
      })

    case EP.previewUrl:
      return ok({ url: 'rtsp://192.168.1.100:554/live' })

    case '__scene__/enterprises':
      return ok(undefined, { total: mockEnterprises.length, rows: mockEnterprises })

    case '__scene__/cameras':
      return ok(undefined, {
        total: 2,
        rows: [
          { cameraId: 'CAM-KQ-01', name: '罐区全景', status: 1 },
          { cameraId: 'CAM-XQ-01', name: '装卸区', status: 1 }
        ]
      })

    case '__scene__/patchTasks':
      return ok(undefined, { total: mockPatchTasks.length, rows: mockPatchTasks })

    case '__scene__/drillPlans':
      return ok(undefined, { total: mockDrillPlans.length, rows: mockDrillPlans })

    default:
      return ok()
  }
}

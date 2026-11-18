/** 全局通信状态仓库：事件流、短信任务状态、当前通话、场景角色动作 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CommEvent, SmsTask } from '@/types'
import type { RoleAction } from '@/types/scenario'
import { onEvent } from '@/api/mock/eventStream'

export const useCommStore = defineStore('comm', () => {
  const events = ref<CommEvent[]>([])
  const smsTasks = ref<SmsTask[]>([])
  const activeCall = ref<string>('')
  const sceneRoleLog = ref<RoleAction[]>([])
  const currentEventId = ref<string>('')

  onEvent((e) => {
    events.value.unshift(e)
    if (events.value.length > 120) events.value.pop()
  })

  function addSmsTask(task: SmsTask) {
    smsTasks.value.unshift(task)
  }

  function updateSmsTask(id: string, patch: Partial<SmsTask>) {
    const t = smsTasks.value.find((x) => x.id === id)
    if (t) Object.assign(t, patch)
  }

  function addSceneRoleLog(entry: RoleAction) {
    sceneRoleLog.value.unshift(entry)
    if (sceneRoleLog.value.length > 60) sceneRoleLog.value.pop()
  }

  function setCurrentEventId(id: string) {
    currentEventId.value = id
  }

  return {
    events, smsTasks, activeCall, sceneRoleLog, currentEventId,
    addSmsTask, updateSmsTask, addSceneRoleLog, setCurrentEventId
  }
})

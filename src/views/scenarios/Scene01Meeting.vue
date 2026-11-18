<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { communicationApi as api } from '@/services/communication'
import { PHONE_ACTION } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { Enterprise } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/01-meeting']
const store = useCommStore()
const enterprises = ref<Enterprise[]>([])
const selected = ref<string[]>([])
const access = ref<Record<string, string>>({})
const meetingStarted = ref(false)
const controls = [
  { action: 11, label: '主席' }, { action: 12, label: '静音' },
  { action: 15, label: '全体发言' }, { action: 16, label: '全体禁言' }
]

const gateways = computed(() => [
  { label: '硬终端 SIP/H.323', count: enterprises.value.filter((e) => e.hasTerminal).length, tag: '已有依据' },
  { label: 'PC/手机软终端 WebRTC', count: enterprises.value.filter((e) => !e.hasTerminal).length, tag: '需对接' },
  { label: '电话语音 PSTN', count: enterprises.value.length, tag: '已有依据' }
])

onMounted(async () => {
  const res = await api.sceneEnterprises()
  enterprises.value = (res.rows as Enterprise[]) ?? []
})

function accessOf(e: Enterprise): string {
  return access.value[e.id] ?? (e.hasTerminal ? '硬终端' : '软终端')
}

function onSelectionChange(rows: Enterprise[]) {
  selected.value = rows.map((r) => r.id)
}

function setAccess(id: string, v: string) {
  access.value[id] = v
}

async function startMeeting() {
  if (!selected.value.length) { ElMessage.warning('请先选择参会企业'); return }
  const dest = selected.value.map((id) => enterprises.value.find((e) => e.id === id)?.phone ?? id)
  await api.terminalOperator({ action: 10, sourCaller: '9000', destCalled: dest, conferenceName: '园区安全生产会议' })
  meetingStarted.value = true
  store.addSceneRoleLog({ step: '04', role: '会议管理员', action: `发起会议呼叫 ${dest.length} 方`, system: '按 SIP/H.323 兼容协议连接会场（MOCK 状态）' })
  ElMessage.success('会议已发起，参会方逐步接入')
}

async function control(action: number, label: string) {
  await api.terminalOperator({ action, sourCaller: '9000', destCalled: selected.value })
  store.addSceneRoleLog({ step: '05', role: '主持人与会控员', action: `执行${label}`, system: `terminalOperator action=${action} 已下发` })
  ElMessage.success(`${PHONE_ACTION[action as keyof typeof PHONE_ACTION]} 已下发`)
}

function saveMeeting() {
  store.addSceneRoleLog({ step: '06', role: '会议管理员', action: '结束会议并保存资料', system: '会议记录与会控日志已归档（模拟）' })
  meetingStarted.value = false
  ElMessage.success('会议记录已保存')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">参会企业（13 家）</h3>
        <div class="endpoint-note section-gap">6 家有硬终端 · 7 家无终端；接入方式可手工调整，实际入会受许可与跨网条件约束【需对接】。</div>
        <el-table :data="enterprises" size="small" border @selection-change="onSelectionChange">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="name" label="企业" width="120" />
          <el-table-column label="终端现状" width="110">
            <template #default="{ row }">
              <el-tag :type="row.hasTerminal ? 'success' : 'warning'" size="small" effect="plain">{{ row.hasTerminal ? '有硬终端' : '无终端' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contact" label="联系人" width="100" />
          <el-table-column label="接入方式">
            <template #default="{ row }">
              <el-select :model-value="accessOf(row)" size="small" @change="(v: unknown) => setAccess(row.id, String(v))">
                <el-option label="硬终端" value="硬终端" />
                <el-option label="软终端" value="软终端" />
                <el-option label="电话语音" value="电话语音" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
        <div class="section-gap" style="margin-top:var(--space-md)">
          <el-button type="primary" :loading="false" @click="startMeeting">发起会议（terminalOperator 10）</el-button>
          <el-tag v-if="meetingStarted" type="success" effect="dark" style="margin-left:var(--space-sm)">会议进行中</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">会控台（terminalOperator 11-16）</h3>
        <div class="endpoint-note section-gap">多画面合成、录制存储无 OpenAPI 接口【模拟】。</div>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <el-button v-for="c in controls" :key="c.action" :disabled="!meetingStarted" @click="control(c.action, c.label)">{{ c.label }}</el-button>
          <el-button type="danger" :disabled="!meetingStarted" @click="saveMeeting">结束并保存</el-button>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">会场接入方式分布</h3>
        <el-row :gutter="12">
          <el-col v-for="g in gateways" :key="g.label" :span="8">
            <div class="stat-card">
              <div class="stat-label">{{ g.label }}</div>
              <div class="stat-value">{{ g.count }}</div>
              <div class="stat-foot">{{ g.tag }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </template>
  </ScenarioShell>
</template>

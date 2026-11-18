<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { Enterprise } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/06-notify']
const store = useCommStore()
const enterprises = ref<Enterprise[]>([])
const selected = ref<string[]>([])
const radius = ref(300)
const incident = { lng: 116.55, lat: 23.11 }
const sent = ref(false)

const inRange = computed(() => enterprises.value.filter((e) => {
  const dx = (e.lng - incident.lng) * 95000
  const dy = (e.lat - incident.lat) * 111000
  return Math.sqrt(dx * dx + dy * dy) <= radius.value * 10
}))

const stateColor = (s: Enterprise['status']) =>
  s === '措施落实' ? 'success' : s === '已确认' ? 'primary' : s === '已送达' ? 'warning' : 'info'

onMounted(async () => {
  const res = await fcPost('__scene__/enterprises')
  enterprises.value = (res.rows as Enterprise[]) ?? []
})

function selectAll() {
  selected.value = inRange.value.map((e) => e.id)
}

function onEnterpriseSelection(rows: Enterprise[]) {
  selected.value = rows.map((r) => r.id)
}

async function notify() {
  if (!selected.value.length) { ElMessage.warning('请人工确认通知对象'); return }
  const list = enterprises.value.filter((e) => selected.value.includes(e.id))
  await fcPost(EP.linkTaskSend, {
    mobile: list.map((e) => e.phone).join(','),
    rule: 3,
    eventId: store.currentEventId || 'SCENE06',
    scontent: '周边企业注意：危废仓库疑似泄漏，请就地避险并落实厂区管控'
  })
  list.forEach((e) => { e.status = '已送达' })
  sent.value = true
  store.addSceneRoleLog({ step: '03', role: '系统/值班员', action: `向 ${list.length} 家企业发送短信+语音通知`, system: '保存发送与呼叫状态（送达≠确认）' })
  ElMessage.success('通知已下发')
}

function simulateFeedback() {
  const list = enterprises.value.filter((e) => selected.value.includes(e.id) && e.status === '已送达')
  if (!list.length) { ElMessage.info('无待反馈企业'); return }
  const first = list[0]
  first.status = '已确认'
  fcPost(EP.appEventReport, {
    cmd: 'app', action: 'message_post', report_account: first.phone,
    message_data: { message_content: `【${first.name}】人员已避险，厂区管控中` }
  })
  store.addSceneRoleLog({ step: '04', role: `${first.name}负责人`, action: '移动端确认接收并反馈防护措施', system: '形成移动事件反馈和责任记录（模拟）' })
  ElMessage.success(`${first.name} 已反馈`)
}

async function remind() {
  const pending = enterprises.value.filter((e) => selected.value.includes(e.id) && e.status !== '已确认' && e.status !== '措施落实')
  if (!pending.length) { ElMessage.info('无未确认企业'); return }
  await fcPost(EP.linkTaskSend, {
    mobile: pending.map((e) => e.phone).join(','), rule: 7,
    eventId: store.currentEventId || 'SCENE06', vcontent: '请立即确认响应措施'
  })
  store.addSceneRoleLog({ step: '05', role: '值班员', action: `催办 ${pending.length} 家未确认企业`, system: '保存催办及最终响应结果' })
  ElMessage.success('催办电话已下发')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">影响范围与周边企业</h3>
        <div class="endpoint-note section-gap">事故扩散模型来自外部系统，空间筛选为距离估算模拟；短信送达不等于已读或已采取措施【需对接】。</div>
        <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
          <span class="mini muted">影响半径</span>
          <el-slider v-model="radius" :min="100" :max="1000" :step="100" style="width:200px" />
          <el-tag size="small" effect="plain">{{ radius * 10 }} m（示例范围）</el-tag>
          <el-button size="small" @click="selectAll">全选范围内企业</el-button>
        </div>
        <el-table :data="inRange" size="small" border style="margin-top:var(--space-md)" @selection-change="onEnterpriseSelection">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="name" label="企业" width="110" />
          <el-table-column prop="contact" label="联系人" width="100" />
          <el-table-column prop="phone" label="号码" width="80" />
          <el-table-column label="响应状态" width="110">
            <template #default="{ row }"><el-tag :type="stateColor(row.status)" size="small" effect="plain">{{ row.status }}</el-tag></template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">通知下发与响应追踪</h3>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <el-button type="primary" @click="notify">下发通知（短信+语音 rule=3）</el-button>
          <el-button :disabled="!sent" @click="simulateFeedback">模拟企业反馈</el-button>
          <el-button :disabled="!sent" @click="remind">催办未确认企业（rule=7）</el-button>
        </div>
        <div class="endpoint-note section-gap">送达 / 接通 / 人工确认 / 措施反馈为不同状态，分别记录；企业确认与超时催办规则需业务定义【需对接】。</div>
        <el-row :gutter="12">
          <el-col :span="6" v-for="s in (['未通知','已送达','已确认','措施落实'] as const)" :key="s">
            <div class="stat-card">
              <div class="stat-label">{{ s }}</div>
              <div class="stat-value">{{ enterprises.filter((e) => e.status === s).length }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </template>
  </ScenarioShell>
</template>

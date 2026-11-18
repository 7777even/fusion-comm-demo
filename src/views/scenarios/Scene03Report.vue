<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP, LINK_RULE } from '@/api/endpoints'
import { uuid } from '@/api/sign'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'

const meta = SCENE_BY_PATH['/scene/03-report']
const store = useCommStore()
const eventId = ref(uuid())
const report = ref({ caller: '企业值班室 0755-8888xxxx', source: '固定电话', time: '14:30', location: '危废仓库', desc: '疑似泄漏、烟雾异常' })
const reported = ref(false)
const level = ref(3)
const notified = ref(false)
const cameras = ref<{ cameraId: string; name: string }[]>([])
const responders = ref([
  { name: '总指挥 9000', phone: '9000', state: '未通知' },
  { name: '应急局负责人 9101', phone: '9101', state: '未通知' },
  { name: '危化组长 9102', phone: '9102', state: '未通知' },
  { name: '消防队长 9201', phone: '9201', state: '未通知' }
])

const levelText = computed(() => ({ 1: 'Ⅰ级（一般）', 2: 'Ⅱ级（较大）', 3: 'Ⅲ级（重大）', 4: 'Ⅳ级（特别重大）' })[level.value] ?? 'Ⅲ级')
const stateColor = (s: string) => s === '已确认' ? 'success' : s === '已接通' ? 'primary' : s === '已送达' ? 'warning' : 'info'

async function acceptReport() {
  await fcPost(EP.sosAdd, {
    area: report.value.location,
    eventId: eventId.value,
    eventTime: '2026-11-18 14:30:00',
    eventType: 7,
    level: 3,
    eventSubTypeDesc: report.value.desc
  })
  reported.value = true
  store.setCurrentEventId(eventId.value)
  store.addSceneRoleLog({ step: '01', role: '园区值班员', action: `接听企业电话并记录 ${report.value.time}`, system: `事件编号 ${eventId.value.slice(0, 8)}，录音关联待核实` })
  ElMessage.success('接报信息已登记')
}

async function verifyVideo() {
  const res = await fcPost(EP.cameras, { page: 1 })
  cameras.value = (res.rows as typeof cameras.value) ?? []
  await fcPost(EP.previewUrl, { camList: [cameras.value[0]?.cameraId ?? 'CAM-KQ-01'], protocol: 'hls' })
  store.addSceneRoleLog({ step: '02', role: '园区值班员', action: '调阅危废仓库监控与高空AR', system: '形成事件初判依据（模拟画面）' })
  ElMessage.success('视频核实完成')
}

function confirmLevel() {
  store.addSceneRoleLog({ step: '03', role: '指挥人员', action: `选择响应级别 ${levelText.value}`, system: '关联组织架构、岗位职责及通知清单（模拟）' })
  ElMessage.success(`响应级别 ${levelText.value} 已确认`)
}

async function notifyAll() {
  const mobiles = responders.value.map((r) => r.phone).join(',')
  await fcPost(EP.linkTaskSend, { mobile: mobiles, rule: 3, eventId: eventId.value, scontent: `危废仓库疑似泄漏，立即响应，位置 ${report.value.location}`, templateCode: 'EMERGENCY' })
  responders.value.forEach((r, i) => { r.state = i === 0 ? '已确认' : '已送达' })
  notified.value = true
  store.addSceneRoleLog({ step: '04', role: '系统/值班员', action: `按名单通知 ${responders.value.length} 人（短信+语音）`, system: `linkTask/send rule=${LINK_RULE[3]}，事件 ${eventId.value.slice(0, 8)}` })
  ElMessage.success('通知已下发，送达与确认分别记录')
}

async function recallUnconfirmed() {
  const pending = responders.value.filter((r) => r.state === '已送达')
  if (!pending.length) { ElMessage.info('无未确认人员'); return }
  await fcPost(EP.linkTaskSend, { mobile: pending.map((r) => r.phone).join(','), rule: 7, eventId: eventId.value, vcontent: '请立即确认响应' })
  pending.forEach((r) => { r.state = '已接通' })
  store.addSceneRoleLog({ step: '05', role: '值班员', action: `对 ${pending.length} 名未确认人员电话重呼`, system: '补呼及人工确认记录（模拟接通）' })
  ElMessage.success('电话重呼已下发')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">接报登记 <el-tag v-if="reported" type="success" size="small" effect="dark">已登记</el-tag></h3>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="报警来源">{{ report.source }}</el-descriptions-item>
          <el-descriptions-item label="接报时间">{{ report.time }}</el-descriptions-item>
          <el-descriptions-item label="报警号码">{{ report.caller }}</el-descriptions-item>
          <el-descriptions-item label="事故位置">{{ report.location }}</el-descriptions-item>
          <el-descriptions-item label="初判描述" :span="2">{{ report.desc }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:var(--space-md)">
          <el-button type="primary" @click="acceptReport">接听并登记（sosLinkage/add）</el-button>
          <el-button @click="verifyVideo">调阅监控核实（cameras）</el-button>
          <el-tag v-if="reported" type="success" effect="plain" style="margin-left:var(--space-sm)">录音回放需 FTP 下载，非 HTTP【需对接】</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">响应级别与指挥体系</h3>
        <div class="endpoint-note section-gap">事件登记、指挥体系匹配由敏捷应急系统承载【需对接】。</div>
        <el-radio-group v-model="level">
          <el-radio-button :value="1">Ⅰ级</el-radio-button>
          <el-radio-button :value="2">Ⅱ级</el-radio-button>
          <el-radio-button :value="3">Ⅲ级</el-radio-button>
          <el-radio-button :value="4">Ⅳ级</el-radio-button>
        </el-radio-group>
        <el-button style="margin-left:var(--space-md)" :disabled="!reported" @click="confirmLevel">确认启动 {{ levelText }}</el-button>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">一键通知与响应看板</h3>
        <div style="margin-bottom:var(--space-md)">
          <el-button type="primary" :disabled="!reported" @click="notifyAll">下发通知（短信+语音 rule=3）</el-button>
          <el-button :disabled="!notified" @click="recallUnconfirmed">未确认人员电话重呼（rule=7）</el-button>
        </div>
        <el-table :data="responders" size="small" border>
          <el-table-column prop="name" label="责任人员" />
          <el-table-column prop="phone" label="号码" width="100" />
          <el-table-column label="响应状态" width="120">
            <template #default="{ row }">
              <el-tag :type="stateColor(row.state)" size="small" effect="plain">{{ row.state }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="endpoint-note section-gap">短信送达、电话接通、人员确认、任务执行、任务完成为五类不同状态，分别记录（本页演示前三类的模拟流转）。</div>
      </div>
    </template>
  </ScenarioShell>
</template>

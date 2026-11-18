<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { CallRecordItem } from '@/types'

const meta = SCENE_BY_PATH['/scene/07-review']
const store = useCommStore()
const eventId = ref('EVT-20261118-001')
const records = ref<CallRecordItem[]>([])
const reports = ref<{ uuid: string; report_account: string; report_time: string }[]>([])
const selectedRecords = ref<string[]>([])
const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const timeline = [
  { t: '14:30', text: '企业固话接报 · 危废仓库疑似泄漏' },
  { t: '14:35', text: '调阅仓库监控与高空AR，人工核实' },
  { t: '14:38', text: '登记事件，启动Ⅲ级响应' },
  { t: '14:40', text: '跨网异构多方会商' },
  { t: '15:00', text: 'GIS 融合调度，救援力量部署' },
  { t: '15:10', text: '周边企业协同通知与避险' },
  { t: '17:00', text: '响应结束，进入复盘' }
]

const completion = computed(() => ({
  done: timeline.length - 1,
  total: timeline.length,
  rate: Math.round(((timeline.length - 1) / timeline.length) * 100)
}))

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function onRecordSelection(rows: CallRecordItem[]) {
  selectedRecords.value = rows.map((r) => r.callerNum)
}

onMounted(async () => {
  const [recRes, repRes] = await Promise.all([
    fcPost(EP.recordsQuery, { callerNum: '', destination: '', startTime: '2026-11-18 14:00:00', endTime: '2026-11-18 18:00:00', page: 1 }),
    fcPost(EP.appGetEventReport, { account: 'admin', startTime: '2026-11-18', endTime: '2026-11-18', pageNo: 1, pageSize: 20 })
  ])
  records.value = (recRes.rows as CallRecordItem[]) ?? []
  reports.value = ((repRes.rows as { uuid: string; report_account: string; report_time: string }[]) ?? []).slice(0, 5)
  await new Promise<void>((r) => setTimeout(r, 0))
  if (chartEl.value) {
    chart = echarts.init(chartEl.value)
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {},
      legend: { textStyle: { color: cssVar('--color-text-muted') } },
      xAxis: { type: 'category', data: ['接报', '核实', '响应', '会商', '调度', '通知'], axisLabel: { color: cssVar('--color-text-muted') } },
      yAxis: { type: 'value', axisLabel: { color: cssVar('--color-text-muted') }, splitLine: { lineStyle: { color: cssVar('--color-border') } } },
      series: [{ name: '响应耗时(分钟)', type: 'bar', data: [2, 5, 3, 8, 12, 6], itemStyle: { color: cssVar('--color-accent') } }]
    })
  }
})

function exportReport() {
  const text = [
    `事件编号：${eventId.value}`,
    `处置时间轴：${timeline.map((t) => `${t.t} ${t.text}`).join('；')}`,
    `录音检索：${selectedRecords.value.length} 条已选`,
    `移动速报：${reports.value.length} 条`,
    `任务完成：${completion.value.done}/${completion.value.total}（${completion.value.rate}%）`,
    '说明：本报告为人工核对模板，自动生成责任结论/AI评估不作为默认能力。'
  ].join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `复盘报告-${eventId.value}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
  store.addSceneRoleLog({ step: '07', role: '管理人员', action: '核对并导出情况汇总报告', system: '报告存档并关联事件（模拟导出）' })
  ElMessage.success('报告已导出')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">事件与时间筛选</h3>
        <div style="display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap">
          <span class="mini muted">事件编号</span>
          <el-input v-model="eventId" size="small" style="width:220px" />
          <el-date-picker type="datetimerange" size="small" :model-value="[new Date('2026-11-18T14:00:00'), new Date('2026-11-18T18:00:00')]" readonly />
          <el-tag type="info" size="small" effect="plain">事件主数据来自敏捷应急【需对接】</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">处置时间轴</h3>
        <el-timeline>
          <el-timeline-item v-for="item in timeline" :key="item.t" :timestamp="item.t" placement="top" color="var(--color-accent)">
            <span class="mini">{{ item.text }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">录音 / 视频检索（records/query）</h3>
        <el-table :data="records" size="small" border @selection-change="onRecordSelection">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="callerNum" label="主叫" width="120" />
          <el-table-column prop="destination" label="被叫" width="120" />
          <el-table-column prop="startTime" label="开始时间" />
          <el-table-column prop="timeLen" label="时长(s)" width="90" />
          <el-table-column label="转写/摘要">
            <template #default="{ row }">{{ row.transcript ? '已转写' : '未转写' }} / {{ row.summary ? '有摘要' : '—' }}</template>
          </el-table-column>
        </el-table>
        <div class="endpoint-note section-gap" style="margin-top:var(--space-sm)">录音下载走 FTP（非 HTTP）；ASR 不返回结果字段、摘要无正文查询接口【需对接】。车辆/人员轨迹回放无接口【模拟】。</div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">响应耗时与任务完成</h3>
        <div ref="chartEl" style="height:220px" />
        <div class="section-gap">
          <el-tag type="success" effect="dark">任务完成 {{ completion.done }}/{{ completion.total }}（{{ completion.rate }}%）</el-tag>
          <el-tag type="info" effect="plain" style="margin-left:var(--space-sm)">移动速报 {{ reports.length }} 条</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">报告导出</h3>
        <div class="endpoint-note section-gap">报告模板化导出可设计；自动生成事故责任结论或 AI 评估不作为默认能力【模拟】。</div>
        <el-button type="primary" @click="exportReport">生成并导出情况汇总报告</el-button>
      </div>
    </template>
  </ScenarioShell>
</template>

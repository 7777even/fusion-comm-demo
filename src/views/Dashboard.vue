<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { useCommStore } from '@/stores/comm'
import { mockTerminals, mockBroadcastGroups, mockCallRecords } from '@/api/mock/data'

const store = useCommStore()
const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const cssVar = (name: string) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const modernRgb = raw.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)(%)?\s*\)$/)
  if (!modernRgb) return raw
  const alpha = modernRgb[5] ? Number(modernRgb[4]) / 100 : modernRgb[4]
  return `rgba(${modernRgb[1]},${modernRgb[2]},${modernRgb[3]},${alpha})`
}

const onlineCount = computed(() => mockTerminals.filter((t) => t.status === 1).length)
const recentEvents = computed(() => store.events.slice(0, 7))

function renderChart() {
  if (!chartEl.value) return
  chart = chart ?? echarts.init(chartEl.value)
  const buckets = [6, 9, 12, 15, 18, 21]
  const text = cssVar('--color-text-muted')
  const grid = cssVar('--color-border')
  const accent = cssVar('--color-accent')
  const success = cssVar('--color-success')
  const warning = cssVar('--color-warning')
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['语音呼叫', '广播', '联动告警'],
      textStyle: { color: text },
      top: 0
    },
    grid: { left: 36, right: 16, top: 36, bottom: 24 },
    xAxis: {
      type: 'category',
      data: buckets.map((h) => `${h}:00`),
      axisLine: { lineStyle: { color: grid } },
      axisLabel: { color: text }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
      axisLabel: { color: text }
    },
    series: [
      { name: '语音呼叫', type: 'line', smooth: true, data: [12, 18, 9, 24, 16, 20], itemStyle: { color: accent }, areaStyle: { color: cssVar('--color-accent-faint') } },
      { name: '广播', type: 'bar', data: [3, 5, 2, 8, 4, 6], itemStyle: { color: success } },
      { name: '联动告警', type: 'bar', data: [1, 0, 2, 1, 3, 1], itemStyle: { color: warning } }
    ]
  })
}

onMounted(async () => {
  await nextTick()
  renderChart()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
})
function onResize() { chart?.resize() }
watch(() => store.events.length, renderChart)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">态势总览</h1>
        <p class="page-desc">融合通信资源实时状态 · 电话 / 广播 / 对讲 / 应急联动</p>
      </div>
      <el-tag type="success" effect="dark"><span class="dot green" />系统运行正常</el-tag>
    </div>

    <el-row :gutter="16" class="section-gap">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">注册终端</div>
          <div class="stat-value">{{ mockTerminals.length }}</div>
          <div class="stat-foot"><span class="tag-online">● {{ onlineCount }} 在线</span> · {{ mockTerminals.length - onlineCount }} 离线</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">广播组</div>
          <div class="stat-value">{{ mockBroadcastGroups.length }}</div>
          <div class="stat-foot">其中 1 组播放中 · 含扩音广播</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">今日通话录音</div>
          <div class="stat-value">{{ mockCallRecords.length }}</div>
          <div class="stat-foot">支持转写与关键词检索</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">应急小组</div>
          <div class="stat-value">2</div>
          <div class="stat-foot">危化处置 · 消防</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="16">
        <div class="panel section-gap">
          <h3 class="panel-title">通信活动趋势（近 6 小时）</h3>
          <div ref="chartEl" style="height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="panel section-gap">
          <h3 class="panel-title">最近事件</h3>
          <div class="event-feed" style="max-height: 300px">
            <div v-for="e in recentEvents" :key="e.id" class="event-item" :class="e.level ?? 'info'">
              <span class="event-ts">{{ e.ts }}</span>
              <span class="event-text">{{ e.text }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="panel">
      <h3 class="panel-title">模块能力（基于申讯 OpenAPI V1.3）</h3>
      <el-row :gutter="12">
        <el-col :span="6"><div class="call-stage"><b>电话调度</b><div class="mini muted" style="margin-top:var(--space-sm)">一键直通 · 多方会议 · 强插强拆监听</div><div class="endpoint-note" style="margin-top:var(--space-sm)">terminalOperator</div></div></el-col>
        <el-col :span="6"><div class="call-stage"><b>扩音广播</b><div class="mini muted" style="margin-top:var(--space-sm)">指定区域 · TTS 喊话 · 音量控制</div><div class="endpoint-note" style="margin-top:var(--space-sm)">broadcast/*</div></div></el-col>
        <el-col :span="6"><div class="call-stage"><b>信息发布</b><div class="mini muted" style="margin-top:var(--space-sm)">短信 · 未回复语音升级 · 公告</div><div class="endpoint-note" style="margin-top:var(--space-sm)">linkTask/send</div></div></el-col>
        <el-col :span="6"><div class="call-stage"><b>应急联动检索</b><div class="mini muted" style="margin-top:var(--space-sm)">一键报警 · 录音转写检索</div><div class="endpoint-note" style="margin-top:var(--space-sm)">sosLinkage · records</div></div></el-col>
      </el-row>
    </div>
  </div>
</template>

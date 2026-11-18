<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'

const meta = SCENE_BY_PATH['/scene/05-gis']
const store = useCommStore()
const radius = ref(500)
const marked = ref(false)
const resources = ref<{ terminalId: string; terminalName: string; terminalType: number; status: number; x: number; y: number }[]>([])
const selectedRes = ref<string[]>([])
const dispatched = ref<string[]>([])

const incident = { x: 50, y: 48, name: '危废仓库泄漏点' }
const typeName = (t: number) => t === 4 ? 'PDT 对讲' : t === 1 ? '外线电话' : '内线终端'

const inRange = computed(() => resources.value.filter((r) => {
  const dx = (r.x - incident.x) * 1.1
  const dy = (r.y - incident.y) * 1.0
  return Math.sqrt(dx * dx + dy * dy) * 8 <= radius.value / 10
}))

function onResSelection(rows: typeof resources.value) {
  selectedRes.value = rows.map((r) => r.terminalId)
}

async function loadResources() {
  const res = await fcPost(EP.queryTerminals, { ddtId: 0, pageNum: 1, pageSize: 100 })
  const rows = ((res.row as { terminalId: string; terminalName: string; terminalType: number; status: number }[]) ?? [])
  resources.value = rows.slice(0, 12).map((r, i) => ({
    ...r,
    x: 20 + (i * 29) % 65,
    y: 20 + (i * 17) % 60
  }))
  ElMessage.success(`已加载 ${resources.value.length} 个终端资源（坐标为模拟）`)
}

function markIncident() {
  marked.value = true
  store.addSceneRoleLog({ step: '01', role: '总指挥', action: '标绘事故点与警戒区', system: '二三维地图与标绘为模拟；路径规划需外部风险模型【需对接】' })
  ElMessage.success('事故点与警戒区已标绘')
}

async function dispatch() {
  if (!selectedRes.value.length) { ElMessage.warning('请先圈选资源'); return }
  const targets = selectedRes.value
  await fcPost(EP.terminalOperator, { action: 1, sourCaller: '9000', destCalled: targets })
  dispatched.value = [...targets]
  store.addSceneRoleLog({ step: '04', role: '调度员', action: `按资源类型调度 ${targets.length} 个终端`, system: '摄像头点播 / PDT 组呼 / 任务派发（跨制式互通受网关约束）' })
  ElMessage.success('调度指令已下发')
}

async function distributeVideo() {
  const res = await fcPost(EP.previewUrl, { camList: ['CAM-KQ-01'], protocol: 'hls' })
  store.addSceneRoleLog({ step: '06', role: '视频调度员', action: '高空 AR / 监控视频向现场终端分发', system: `流地址 ${(res.data as { url?: string })?.url ?? '（模拟）'}` })
  ElMessage.success('视频分发已下发')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">园区二三维态势（模拟平面图）</h3>
        <div class="endpoint-note section-gap">真实 GIS 由合同 GIS 服务提供；此处用 CSS 模拟底图与资源点位，终端位置为模拟坐标并标注采集时间，不以固定位置冒充实时【需对接】。</div>
        <div class="gis-map">
          <div class="gis-fence" :style="{ width: radius * 0.32 + 'px', height: radius * 0.32 + 'px' }" v-if="marked" />
          <div class="gis-incident" :style="{ left: incident.x + '%', top: incident.y + '%' }">事故点</div>
          <div
            v-for="r in resources"
            :key="r.terminalId"
            class="gis-resource"
            :class="{ online: r.status === 1, picked: selectedRes.includes(r.terminalId) }"
            :style="{ left: r.x + '%', top: r.y + '%' }"
            :title="`${r.terminalName} · ${typeName(r.terminalType)}`"
            @click="selectedRes.includes(r.terminalId) ? selectedRes = selectedRes.filter((x) => x !== r.terminalId) : selectedRes.push(r.terminalId)"
          >{{ typeName(r.terminalType).slice(0, 2) }}</div>
        </div>
        <div class="gis-toolbar">
          <el-button size="small" @click="markIncident">标绘警戒区</el-button>
          <el-button size="small" @click="loadResources">加载资源（queryTerminals）</el-button>
          <span class="mini muted">圈选半径</span>
          <el-slider v-model="radius" :min="100" :max="1000" :step="100" style="width:160px" />
          <el-tag size="small" effect="plain">{{ radius }}m（示例）</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">圈选资源与分类调度</h3>
        <div class="endpoint-note section-gap">圈选到的资源不一键转换为同一通信对象；跨制式受频段、网关与许可限制【需对接】。</div>
        <el-table :data="inRange" size="small" border @selection-change="onResSelection">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="terminalName" label="资源" />
          <el-table-column label="类型" width="120">
            <template #default="{ row }">{{ typeName(row.terminalType) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span class="dot" :class="row.status === 1 ? 'green' : 'gray'" />{{ row.status === 1 ? '在线' : '离线' }}
            </template>
          </el-table-column>
          <el-table-column label="已调度" width="90">
            <template #default="{ row }">{{ dispatched.includes(row.terminalId) ? '是' : '—' }}</template>
          </el-table-column>
        </el-table>
        <div style="margin-top:var(--space-md)">
          <el-button type="primary" @click="dispatch">发起调度（点呼/组呼）</el-button>
          <el-button @click="distributeVideo">视频分发（getPreviewUrl）</el-button>
        </div>
      </div>
    </template>
  </ScenarioShell>
</template>

<style scoped>
.gis-map { position: relative; height: 300px; background: var(--color-panel-soft); border: 1px solid var(--glass-border); border-radius: var(--radius-md); overflow: hidden; }
.gis-fence { position: absolute; left: 50%; top: 48%; transform: translate(-50%, -50%); border: 2px dashed var(--color-danger); border-radius: var(--radius-pill); background: color-mix(in srgb, var(--color-danger) 8%, transparent); }
.gis-incident { position: absolute; transform: translate(-50%, -50%); padding: 3px 8px; background: var(--gradient-risk); color: var(--color-text-strong); font-size: var(--font-size-caption); border-radius: var(--radius-sm); }
.gis-resource { position: absolute; transform: translate(-50%, -50%); width: 34px; height: 20px; display: flex; align-items: center; justify-content: center; background: var(--color-panel); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: var(--font-size-caption); color: var(--color-text-muted); cursor: pointer; }
.gis-resource.online { border-color: var(--color-accent); color: var(--color-accent); }
.gis-resource.picked { background: var(--color-accent); color: var(--color-text-strong); }
.gis-toolbar { display: flex; align-items: center; gap: var(--space-sm); margin-top: var(--space-md); flex-wrap: wrap; }
</style>

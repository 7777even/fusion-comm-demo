<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoCamera, Phone } from '@element-plus/icons-vue'
import { communicationApi as api } from '@/services/communication'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { PatchTask } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/02-patrol']
const store = useCommStore()
const cameras = ref<{ cameraId: string; name: string; status: number }[]>([])
const selectedCamera = ref('')
const preview = ref('')
const tasks = ref<PatchTask[]>([])
const activeTask = ref('')
const evidenceUploaded = ref<Record<string, boolean>>({})

onMounted(async () => {
  const [camRes, taskRes] = await Promise.all([
    api.sceneCameras(),
    api.scenePatchTasks()
  ])
  cameras.value = (camRes.rows as typeof cameras.value) ?? []
  tasks.value = (taskRes.rows as PatchTask[]) ?? []
})

const trackPoints = [
  { t: '09:52', x: 12, y: 62 }, { t: '09:56', x: 30, y: 58 },
  { t: '10:00', x: 52, y: 44 }, { t: '10:03', x: 68, y: 30 }
]

async function pointCamera() {
  const camId = selectedCamera.value || cameras.value[0]?.cameraId || 'CAM-KQ-01'
  const res = await api.previewUrl({ camList: [camId], protocol: 'hls' })
  preview.value = String((res.data as { url?: string })?.url ?? '')
  store.addSceneRoleLog({ step: '02', role: '园区值班员', action: '调取罐区监控点播', system: `取流地址：${preview.value || '（模拟）'}` })
  ElMessage.success('监控点播已发起')
}

async function callPatrol() {
  await api.terminalOperator({ action: 1, sourCaller: '9000', destCalled: ['9102'] })
  store.addSceneRoleLog({ step: '03', role: '园区值班员', action: '点呼巡查员 9102', system: '通信记录已生成' })
  ElMessage.success('巡查员点呼已下发')
}

function selectTask(id: string) {
  activeTask.value = id
  const t = tasks.value.find((x) => x.id === id)
  if (t) { t.status = '核查中' }
  store.addSceneRoleLog({ step: '04', role: '园区值班员', action: `读取作业票 ${id}`, system: `${t?.type} · ${t?.location} · 监护 ${t?.monitor}` })
}

function uploadEvidence(id: string) {
  evidenceUploaded.value[id] = true
  const t = tasks.value.find((x) => x.id === id)
  if (t) { t.status = '整改中'; t.evidence = true }
  store.addSceneRoleLog({ step: '06', role: '企业整改责任人', action: `上传整改证据 ${id}`, system: '图文证据已关联任务（模拟）' })
  ElMessage.success('整改证据已上传')
}

function closeTask(id: string) {
  const t = tasks.value.find((x) => x.id === id)
  if (t) { t.status = '已闭环' }
  store.addSceneRoleLog({ step: '07', role: '园区值班员', action: `复核并闭环 ${id}`, system: '抽查记录归档' })
  ElMessage.success('本次抽查已闭环')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">车辆越界告警 <el-tag type="danger" size="small" effect="dark">电子围栏</el-tag></h3>
        <div class="endpoint-note section-gap">定位与围栏告警由车辆定位系统提供，60 秒上报不等于实时【需对接】；此处用模拟地图与轨迹点演示。</div>
        <div class="mock-map">
          <div class="map-road road-h" />
          <div class="map-road road-v" />
          <div class="map-fence">管控区（模拟）</div>
          <div
            v-for="(pt, i) in trackPoints"
            :key="pt.t"
            class="track-point"
            :style="{ left: pt.x + '%', top: pt.y + '%' }"
            :title="`${pt.t} 采集`"
          >{{ i + 1 }}</div>
          <div class="map-legend">轨迹点 1→4 · 最近采集 10:03</div>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">沿途监控与点呼</h3>
        <el-row :gutter="12">
          <el-col :span="14">
            <el-select v-model="selectedCamera" placeholder="选择摄像头（接口取流）" style="width:100%">
              <el-option v-for="c in cameras" :key="c.cameraId" :label="c.name" :value="c.cameraId" />
            </el-select>
            <div class="preview-box">{{ preview ? preview : '点击「点播」获取流地址（hls）' }}</div>
          </el-col>
          <el-col :span="10">
            <el-button :icon="VideoCamera" style="width:100%;margin-bottom:var(--space-sm)" @click="pointCamera">监控点播</el-button>
            <el-button :icon="Phone" style="width:100%;margin-bottom:var(--space-sm)" @click="callPatrol">点呼巡查员</el-button>
            <div class="endpoint-note">PTZ 云台控制无 OpenAPI 接口【模拟】</div>
          </el-col>
        </el-row>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">特殊作业抽查 <el-tag type="warning" size="small" effect="plain">工单需对接</el-tag></h3>
        <el-table :data="tasks" size="small" border>
          <el-table-column prop="id" label="票号" width="80" />
          <el-table-column prop="type" label="作业类型" width="110" />
          <el-table-column prop="location" label="位置" />
          <el-table-column prop="monitor" label="监护人员" width="160" />
          <el-table-column prop="status" label="状态" width="90" />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link type="primary" @click="selectTask(row.id)">读取作业票</el-button>
              <el-button link type="primary" :disabled="activeTask !== row.id" @click="uploadEvidence(row.id)">上传整改证据</el-button>
              <el-button link type="success" :disabled="!evidenceUploaded[row.id]" @click="closeTask(row.id)">复核闭环</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="endpoint-note section-gap">视频问询、图文上传后端工单归属待明确【模拟/需对接】。</div>
      </div>
    </template>
  </ScenarioShell>
</template>

<style scoped>
.mock-map { position: relative; height: 220px; background: var(--color-panel-soft); border: 1px solid var(--glass-border); border-radius: var(--radius-md); overflow: hidden; }
.map-road { position: absolute; background: color-mix(in srgb, var(--color-accent) 14%, transparent); }
.road-h { top: 52%; left: 0; right: 0; height: 10px; }
.road-v { left: 48%; top: 0; bottom: 0; width: 10px; }
.map-fence { position: absolute; right: 8%; top: 12%; padding: 4px 8px; border: 1px dashed var(--color-danger); color: var(--color-danger); font-size: var(--font-size-caption); border-radius: var(--radius-sm); }
.track-point { position: absolute; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: var(--radius-pill); background: var(--color-accent); color: var(--color-text-strong); font-size: var(--font-size-caption); display: flex; align-items: center; justify-content: center; box-shadow: var(--panel-outer-glow); }
.map-legend { position: absolute; left: 8px; bottom: 6px; font-size: var(--font-size-caption); color: var(--color-text-muted); }
.preview-box { margin-top: var(--space-sm); padding: var(--space-md); min-height: 60px; background: var(--color-panel-soft); border-radius: var(--radius-md); font-family: var(--font-family-num); font-size: var(--font-size-helper); color: var(--color-accent); word-break: break-all; }
</style>

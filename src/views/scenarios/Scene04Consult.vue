<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { communicationApi as api } from '@/services/communication'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { Enterprise } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/04-consult']
const store = useCommStore()
const enterprises = ref<Enterprise[]>([])
const participants = ref<string[]>([])
const tiles = ref<string[]>([])
const started = ref(false)
const experts = ['环保专家（手机）', '气象专家（平板）']

const allCandidates = computed(() => [
  ...enterprises.value.filter((e) => e.hasTerminal).map((e) => `${e.name}（硬终端 ${e.phone}）`),
  ...enterprises.value.filter((e) => !e.hasTerminal).map((e) => `${e.name}（软终端 ${e.phone}）`),
  ...experts
])

onMounted(async () => {
  const res = await api.sceneEnterprises()
  enterprises.value = (res.rows as Enterprise[]) ?? []
})

async function startConsult() {
  if (!participants.value.length) { ElMessage.warning('请先选择参会方'); return }
  await api.terminalOperator({ action: 10, sourCaller: '9000', destCalled: participants.value.map((p) => p.match(/\d{4}$/)?.[0] ?? p), conferenceName: '泄漏事件应急会商' })
  started.value = true
  tiles.value = participants.value.slice(0, 6)
  store.addSceneRoleLog({ step: '01', role: '会议操作员', action: `从事件发起会商，选择 ${participants.value.length} 方`, system: '生成与事件关联的会议与邀请清单' })
  ElMessage.success('会商已发起')
}

async function addVideo() {
  const res = await api.cameras({ page: 1 })
  const cam = ((res.rows as { cameraId: string; name: string }[]) ?? [])[0]
  await api.previewUrl({ camList: [cam?.cameraId ?? 'CAM-KQ-01'], protocol: 'hls' })
  if (cam && !tiles.value.includes(cam.name)) tiles.value.push(cam.name)
  store.addSceneRoleLog({ step: '04', role: '视频操作员', action: `将监控「${cam?.name ?? '罐区'}」加入会商`, system: '转码、视频分发、多画面（模拟画面）' })
  ElMessage.success('监控画面已入会')
}

async function control(action: number, label: string) {
  await api.terminalOperator({ action, sourCaller: '9000', destCalled: participants.value })
  store.addSceneRoleLog({ step: '05', role: '主持人/专家', action: label, system: `terminalOperator action=${action} 已下发` })
  ElMessage.success(`${label}已执行`)
}

function archive() {
  store.addSceneRoleLog({ step: '07', role: '指挥人员', action: '形成研判意见并归档会商资料', system: '纪要、录制关联事件（模拟）' })
  ElMessage.success('会商纪要与资料已归档')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">参会对象 <el-tag type="info" size="small" effect="plain">6 硬 + 7 软 + 2 专家</el-tag></h3>
        <div class="endpoint-note section-gap">MCU 端口、编解码与软终端许可需按合同核定【需对接】；屏幕共享/白板无 OpenAPI 接口【模拟】。</div>
        <el-select v-model="participants" multiple filterable placeholder="选择参会方（硬终端 / 软终端 / 专家）" style="width:100%">
          <el-option v-for="p in allCandidates" :key="p" :label="p" :value="p" />
        </el-select>
        <div style="margin-top:var(--space-md)">
          <el-button type="primary" @click="startConsult">发起会商（terminalOperator 10）</el-button>
          <el-button @click="addVideo">监控视频入会</el-button>
          <el-tag v-if="started" type="success" effect="dark" style="margin-left:var(--space-sm)">会商进行中</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">多画面（模拟上墙）</h3>
        <div class="wall-grid">
          <div v-for="(t, i) in tiles" :key="t" class="wall-tile">
            <div class="tile-name">{{ t }}</div>
            <div class="tile-placeholder">画面 {{ i + 1 }}</div>
          </div>
          <div v-if="!tiles.length" class="empty-hint">发起会商或加入视频后显示画面位（无 MCP/流媒体渲染，纯模拟）</div>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">会控与归档</h3>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <el-button :disabled="!started" @click="control(11, '设置主席')">主席</el-button>
          <el-button :disabled="!started" @click="control(12, '静音')">静音</el-button>
          <el-button :disabled="!started" @click="control(15, '全体发言')">全体发言</el-button>
          <el-button :disabled="!started" @click="control(16, '全体禁言')">全体禁言</el-button>
          <el-button type="success" :disabled="!started" @click="archive">纪要归档</el-button>
        </div>
      </div>
    </template>
  </ScenarioShell>
</template>

<style scoped>
.wall-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm); }
.wall-tile { background: var(--color-panel-soft); border: 1px solid var(--glass-border); border-radius: var(--radius-md); overflow: hidden; }
.tile-name { padding: 4px 8px; font-size: var(--font-size-caption); color: var(--color-accent); background: var(--panel-head-gradient); }
.tile-placeholder { height: 96px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: var(--font-size-helper); }
</style>

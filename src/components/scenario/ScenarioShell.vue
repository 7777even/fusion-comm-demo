<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCommStore } from '@/stores/comm'
import type { ScenarioMeta, CapabilityKey } from '@/types/scenario'
import OverviewBoard from '@/components/capabilities/OverviewBoard.vue'
import PhoneDispatch from '@/components/capabilities/PhoneDispatch.vue'
import BroadcastAudio from '@/components/capabilities/BroadcastAudio.vue'
import InfoPublish from '@/components/capabilities/InfoPublish.vue'
import EmergencyLink from '@/components/capabilities/EmergencyLink.vue'

const props = defineProps<{ meta: ScenarioMeta }>()
const store = useCommStore()
const active = ref('story')

const capabilityComponents: Record<CapabilityKey, { comp: unknown; title: string }> = {
  overview: { comp: OverviewBoard, title: '态势总览' },
  phone: { comp: PhoneDispatch, title: '电话调度' },
  broadcast: { comp: BroadcastAudio, title: '扩音广播' },
  publish: { comp: InfoPublish, title: '信息发布' },
  emergency: { comp: EmergencyLink, title: '应急联动与检索' }
}
const capabilityList = computed(() =>
  (props.meta.capabilities ?? []).map((key) => ({ key, ...capabilityComponents[key] }))
)

const stageTag: Record<ScenarioMeta['stage'], string> = {
  '平时·日常管理': 'primary',
  '战时·应急指挥': 'danger'
}

const roleRows = computed(() => {
  const base = props.meta.roles.map((r) => ({ ...r, live: false }))
  const live = store.sceneRoleLog.map((r) => ({ ...r, live: true }))
  return [...live, ...base]
})
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">
          <span class="scene-no">场景 {{ meta.no }}</span> {{ meta.title }}
        </h1>
        <p class="page-desc">
          <el-tag :type="stageTag[meta.stage]" size="small" effect="dark">{{ meta.stage }}</el-tag>
          <span class="scene-value">{{ meta.value }}</span>
        </p>
      </div>
      <div class="endpoint-note">建设方案 · 场景 {{ meta.no }}</div>
    </div>

    <el-tabs v-model="active" class="scene-tabs">
      <el-tab-pane label="场景故事" name="story">
        <div class="panel">
          <p v-for="(para, i) in meta.story" :key="i" class="story-p">{{ para }}</p>
        </div>
      </el-tab-pane>

      <el-tab-pane label="场景卡片" name="card">
        <div class="panel">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="参与角色">{{ meta.card.roles }}</el-descriptions-item>
            <el-descriptions-item label="触发条件">{{ meta.card.trigger }}</el-descriptions-item>
            <el-descriptions-item label="核心目标">{{ meta.card.goal }}</el-descriptions-item>
            <el-descriptions-item label="业务对象">{{ meta.card.objects }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="业务流程" name="flow">
        <el-row :gutter="16">
          <el-col :span="7">
            <div class="panel">
              <h3 class="panel-title">流程步骤</h3>
              <div class="flow-list">
                <div v-for="s in meta.flow" :key="s.no" class="flow-step">
                  <span class="flow-no">{{ s.no }}</span>
                  <span class="flow-action">{{ s.action }}</span>
                  <el-tag v-if="s.api" size="small" type="success" effect="plain">{{ s.api }}</el-tag>
                  <el-tag v-else-if="s.simulated" size="small" type="warning" effect="plain">模拟</el-tag>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="17">
            <slot name="workspace" />
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="角色动作" name="roles">
        <div class="panel">
          <div class="endpoint-note section-gap">操作产生事件后，系统响应行会实时出现在列表顶部（标记 LIVE）。</div>
          <el-table :data="roleRows" size="small" border>
            <el-table-column prop="step" label="步骤" width="64" />
            <el-table-column prop="role" label="操作角色" width="150" />
            <el-table-column prop="action" label="业务动作" />
            <el-table-column prop="system" label="系统处理 / 形成结果" />
            <el-table-column label="来源" width="80">
              <template #default="{ row }">
                <el-tag :type="row.live ? 'success' : 'info'" size="small" effect="plain">
                  {{ row.live ? 'LIVE' : '方案' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="依赖功能" name="deps">
        <div class="panel">
          <el-table :data="meta.deps" size="small" border>
            <el-table-column prop="capability" label="依赖能力" width="200" />
            <el-table-column prop="usage" label="场景中的使用方式" />
            <el-table-column prop="owner" label="数据或建设归属" />
            <el-table-column label="依据" width="100">
              <template #default="{ row }">
                <el-tag :type="row.tag === '已有依据' ? 'success' : row.tag === '需对接' ? 'warning' : 'info'" size="small" effect="dark">
                  {{ row.tag }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="支撑能力" name="capabilities">
        <div v-if="capabilityList.length === 0" class="panel">
          <p class="mini muted">本场景无内嵌支撑能力（接口与能力映射见"依赖功能"页签）。</p>
        </div>
        <div v-for="cap in capabilityList" :key="cap.key" class="panel capability-block">
          <h3 class="panel-title">{{ cap.title }}</h3>
          <component :is="cap.comp" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.scene-no { color: var(--color-accent); font-family: var(--font-family-num); }
.scene-value { margin-left: var(--space-sm); }
.scene-tabs :deep(.el-tabs__item) { font-size: var(--font-size-body); }
.story-p { line-height: 1.9; font-size: var(--font-size-body); color: var(--color-text); margin: 0 0 var(--space-md); }
.flow-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.flow-step { display: flex; align-items: flex-start; gap: var(--space-sm); padding: var(--space-sm); background: var(--color-panel-soft); border-radius: var(--radius-md); border-left: 3px solid var(--color-accent); }
.flow-no { color: var(--color-accent); font-family: var(--font-family-num); font-weight: 700; }
.flow-action { flex: 1; font-size: var(--font-size-helper); line-height: 1.5; }
.capability-block + .capability-block { margin-top: var(--space-md); }
</style>

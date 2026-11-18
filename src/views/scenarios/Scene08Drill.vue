<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { DrillPlan } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/08-drill']
const store = useCommStore()
const plans = ref<DrillPlan[]>([])
const activePlan = ref('')
const started = ref(false)
const evaluation = ref('')
const executions = ref<{ t: string; text: string }[]>([])
const feedback = ref<{ unit: string; type: string; time: string }[]>([])

const selectedPlan = computed(() => plans.value.find((p) => p.id === activePlan.value))

onMounted(async () => {
  const res = await fcPost('__scene__/drillPlans')
  plans.value = (res.rows as DrillPlan[]) ?? []
  activePlan.value = plans.value[0]?.id ?? ''
})

function push(t: string, text: string) {
  executions.value.unshift({ t, text })
  store.addSceneRoleLog({ step: '02', role: '指挥人员', action: text, system: '演练执行节点记录（模拟）' })
}

function createPlan() {
  ElMessage.info('演练计划与结构化预案由敏捷应急系统承担【需对接】；本页使用已有计划示例。')
}

async function startDrill() {
  const p = selectedPlan.value
  if (!p) { ElMessage.warning('请选择演练计划'); return }
  p.status = '进行中'
  started.value = true
  await fcPost(EP.sosAdd, {
    area: p.location, eventId: `DRILL-${p.id}`, eventTime: '2026-11-18 15:30:00',
    eventType: 7, level: 3, eventSubTypeDesc: `演练模拟：${p.type}`
  })
  push('15:30', `模拟接报并启动响应 · ${p.name}`)
  ElMessage.success('演练已启动')
}

async function consult() {
  await fcPost(EP.terminalOperator, { action: 10, sourCaller: '9000', destCalled: ['9001', '9201'], conferenceName: '演练会商' })
  push('15:35', '开展多方会商、电话/PDT调度与视频共享')
  ElMessage.success('演练会商已发起')
}

async function submitFeedback() {
  const unit = selectedPlan.value?.units[0] ?? '参演企业'
  await fcPost(EP.appEventReport, {
    cmd: 'app', action: 'message_post', report_account: unit,
    message_data: { message_content: '现场防护已落实，位置已上报' }
  })
  feedback.value.unshift({ unit, type: '图文+位置', time: '15:42' })
  push('15:42', `${unit} 反馈现场文字/图片/视频/位置`)
  ElMessage.success('参演反馈已提交')
}

function finishDrill() {
  const p = selectedPlan.value
  if (p) p.status = '已结束'
  started.value = false
  evaluation.value = `演练「${p?.name ?? ''}」已完成：响应启动、通信联络、任务反馈链条均按预案执行；评价结果由评估员人工核定，自动评分不作为默认能力【模拟】。`
  push('16:10', '演练结束，生成记录与评价')
  ElMessage.success('演练已结束')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">演练计划与三维场景</h3>
        <div class="endpoint-note section-gap">演练计划/结构化预案来自敏捷应急，三维模型来自既有 GIS【需对接】；VR/AR/MR、事故扩散模拟、自动评分不默认承诺【模拟】。</div>
        <el-select v-model="activePlan" placeholder="选择已有演练计划" style="width:100%" :disabled="started">
          <el-option v-for="p in plans" :key="p.id" :label="`${p.name}（${p.type}）`" :value="p.id" />
        </el-select>
        <div class="drill-scene">
          <div class="scene-layer">三维园区场景（模拟占位 · {{ selectedPlan?.location ?? '未选择' }}）</div>
          <div class="scene-unit" v-for="(u, i) in (selectedPlan?.units ?? [])" :key="u" :style="{ left: (12 + i * 26) + '%' }">{{ u }}</div>
        </div>
        <div style="margin-top:var(--space-md);display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <el-button @click="createPlan">新建计划（需对接）</el-button>
          <el-button type="primary" :disabled="started || !activePlan" @click="startDrill">启动演练（sosLinkage/add）</el-button>
          <el-button :disabled="!started" @click="consult">多方会商/调度</el-button>
          <el-button :disabled="!started" @click="submitFeedback">参演反馈</el-button>
          <el-button type="success" :disabled="!started" @click="finishDrill">结束演练并评价</el-button>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">演练执行时间轴</h3>
        <el-empty v-if="!executions.length" description="尚未开始演练" :image-size="60" />
        <el-timeline v-else>
          <el-timeline-item v-for="(e, i) in executions" :key="i" :timestamp="e.t" placement="top" color="var(--color-accent)">
            <span class="mini">{{ e.text }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">参演反馈与评价</h3>
        <el-table :data="feedback" size="small" border v-if="feedback.length">
          <el-table-column prop="unit" label="参演单位" />
          <el-table-column prop="type" label="反馈类型" />
          <el-table-column prop="time" label="时间" width="80" />
        </el-table>
        <div v-else class="empty-hint">暂无反馈</div>
        <el-alert v-if="evaluation" type="success" :closable="false" :title="evaluation" style="margin-top:var(--space-md)" />
      </div>
    </template>
  </ScenarioShell>
</template>

<style scoped>
.drill-scene { position: relative; height: 200px; margin-top: var(--space-md); background: var(--color-panel-soft); border: 1px solid var(--glass-border); border-radius: var(--radius-md); overflow: hidden; }
.scene-layer { position: absolute; top: 12px; left: 12px; font-size: var(--font-size-helper); color: var(--color-text-muted); }
.scene-unit { position: absolute; bottom: 24px; transform: translateX(-50%); padding: 4px 8px; background: var(--color-accent-soft); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: var(--font-size-caption); color: var(--color-accent); }
</style>

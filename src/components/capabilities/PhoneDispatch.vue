<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Phone, PhoneFilled, VideoCamera, Mic, Mute, Switch, Delete } from '@element-plus/icons-vue'
import { communicationApi as api } from '@/services/communication'
import { PHONE_ACTION } from '@/api/endpoints'
import { mockWalkieTalkies } from '@/api/mock/data'
import type { Region, Terminal } from '@/types'
import { useCommStore } from '@/stores/comm'

const store = useCommStore()
const regions = ref<Region[]>([])
const terminals = ref<Terminal[]>([])
const selectedRegion = ref('')
const selectedTerms = ref<string[]>([])
const dialNumber = ref('')
const loading = ref(false)
const activeConference = ref(false)
const conferenceMembers = ref<string[]>([])

const termName = (id: string) => terminals.value.find((t) => t.terminalId === id)?.terminalName ?? id

const callEvents = computed(() => store.events.filter((e) => e.cmd === 'callRecord').slice(0, 12))

async function loadRegions() {
  const res = await api.queryRegions({ ddtId: 0, pageNum: 1, pageSize: 50 })
  regions.value = (res.rows as unknown as Region[]) ?? []
}
async function loadTerminals() {
  const res = await api.queryTerminals({
    ddtId: 0, regionId: selectedRegion.value, pageNum: 1, pageSize: 100
  })
  terminals.value = (res.row as unknown as Terminal[]) ?? []
}

function onRegionChange() {
  selectedTerms.value = []
  loadTerminals()
}

async function operate(action: number, targets: string[], note?: string) {
  if (!targets.length) {
    ElMessage.warning('请先选择终端')
    return
  }
  loading.value = true
  try {
    await api.terminalOperator({
      action,
      sourCaller: '9000',
      destCalled: targets,
      ddtid: 0,
      ...(action === 10 ? { conferenceName: note ?? '应急多方会议' } : {})
    })
    if (action === 1) store.activeCall = targets[0]
    if (action === 10) {
      activeConference.value = true
      conferenceMembers.value = [...targets]
    }
    if (action === 2) {
      store.activeCall = ''
      activeConference.value = false
      conferenceMembers.value = []
    }
    ElMessage.success(`${PHONE_ACTION[action as keyof typeof PHONE_ACTION] ?? '操作'}指令已下发`)
  } finally {
    loading.value = false
  }
}

function dial() {
  const num = dialNumber.value.trim()
  if (!num) return ElMessage.warning('请输入号码')
  operate(1, num.split(/[,，\s]+/))
}

function conference() {
  if (selectedTerms.value.length < 2) return ElMessage.warning('多方会议至少选择 2 个终端')
  operate(10, selectedTerms.value, '应急多方会议')
}

onMounted(() => {
  loadRegions()
  loadTerminals()
})
</script>

<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="panel" style="height:100%">
          <h3 class="panel-title">通讯录 · 组织架构</h3>
          <el-input placeholder="搜索终端名称/号码" class="section-gap" clearable />
          <el-tree
            :data="regions.map(r => ({ id: r.regionId, label: `${r.regionName} (${r.totalTerminals})` }))"
            :props="{ label: 'label' }"
            default-expand-all
            highlight-current
            @node-click="(d: any) => { selectedRegion = d.id; onRegionChange() }"
          />
          <div class="mini muted" style="margin-top:12px">
            <div>应急小组设定（对应广播组/组呼）</div>
            <el-tag v-for="w in mockWalkieTalkies" :key="w.terminalId" size="small" style="margin:6px 6px 0 0" :type="w.status===1?'success':'info'">{{ w.terminalName }}</el-tag>
          </div>
        </div>
      </el-col>

      <el-col :span="10">
        <div class="panel section-gap">
          <h3 class="panel-title">终端列表（键值通讯录）</h3>
          <el-table :data="terminals" height="270" @selection-change="(v: any) => selectedTerms = v.map((t: any) => t.terminalId)">
            <el-table-column type="selection" width="40" />
            <el-table-column prop="terminalId" label="号码" width="80" />
            <el-table-column prop="terminalName" label="名称" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <span :class="row.status===1?'tag-online':'tag-offline'">● {{ row.status===1?'在线':'离线' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70">
              <template #default="{ row }">
                <el-button link :icon="Phone" @click="operate(1,[row.terminalId])" />
              </template>
            </el-table-column>
          </el-table>
          <div style="display:flex;gap:8px;margin-top:12px">
            <el-button type="primary" :icon="PhoneFilled" :loading="loading" @click="operate(1, selectedTerms)">一键直通</el-button>
            <el-button type="success" :icon="VideoCamera" @click="conference">发起多方会议</el-button>
            <el-button :icon="Delete" @click="operate(2, activeConference?conferenceMembers:[store.activeCall].filter(Boolean))">挂机/中止</el-button>
          </div>
        </div>

        <div class="panel">
          <h3 class="panel-title">分级调度（强插 / 强拆 / 监听）</h3>
          <el-alert type="info" :closable="false" title="需终端开启强插权限与等级；强插/监听仅支持内线分机" style="margin-bottom:12px" />
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <el-button :icon="Mic" @click="operate(6, selectedTerms)">强插 (action 6)</el-button>
            <el-button :icon="Switch" @click="operate(7, selectedTerms)">强拆 (action 7)</el-button>
            <el-button :icon="Mute" @click="operate(8, selectedTerms)">监听 (action 8)</el-button>
          </div>
          <div style="margin-top:14px;display:flex;gap:8px">
            <el-input v-model="dialNumber" placeholder="直接拨号，多个号码用逗号分隔" @keyup.enter="dial" />
            <el-button type="primary" @click="dial">拨打</el-button>
          </div>
          <div v-if="activeConference" class="call-stage" style="margin-top:12px">
            <b>会议进行中</b>
            <div class="mini" style="margin-top:6px">成员：{{ conferenceMembers.map(termName).join('、') }}</div>
            <div style="margin-top:10px;display:flex;gap:8px">
              <el-button size="small" @click="operate(11, conferenceMembers)">全体发言</el-button>
              <el-button size="small" @click="operate(12, conferenceMembers)">全体禁言</el-button>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="panel" style="height:100%">
          <h3 class="panel-title">通话状态推送</h3>
          <div class="event-feed" style="max-height:620px">
            <div v-for="e in callEvents" :key="e.id" class="event-item" :class="e.level ?? 'info'">
              <span class="event-ts">{{ e.ts }}</span>
              <span class="event-text">{{ e.text }}</span>
            </div>
            <div v-if="!callEvents.length" class="empty-hint">暂无通话事件</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

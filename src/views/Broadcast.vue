<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Refresh, Plus, Minus, Setting } from '@element-plus/icons-vue'
import { communicationApi as api } from '@/services/communication'
import { EP } from '@/api/endpoints'
import { mockBroadcastGroups } from '@/api/mock/data'
import type { BroadcastGroup } from '@/types'
import { useCommStore } from '@/stores/comm'

const store = useCommStore()
const groups = ref<BroadcastGroup[]>([])
const selectedIndex = ref<number>(12)
const members = ref('')
const content = ref('')
const contentType = ref(0)
const playCnt = ref(3)
const volume = ref(60)
const broadcasting = ref(false)

const bcEvents = computed(() => store.events.filter((e) => e.cmd === 'broadcastGroupStatus' || e.cmd === 'broadcastTaskStatus').slice(0, 12))
const selectedGroup = computed(() => groups.value.find((g) => g.groupIndex === selectedIndex.value))

const typeOptions = [
  { value: 0, label: '文字转语音 (TTS)' },
  { value: 1, label: '预案文件' },
  { value: 2, label: '语音文件' },
  { value: 3, label: '人工喊话（主席号码）' },
  { value: 4, label: '播放列表' }
]

async function loadGroups() {
  const res = await api.syncBroadcastGroup({ ddtId: 0, validOnly: 1, pageNum: 1, pageSize: 50 })
  groups.value = (res.rows as unknown as BroadcastGroup[]) ?? mockBroadcastGroups
  await loadMembers()
}
async function loadMembers() {
  const res = await api.syncBroadcastTerminals({ ddtId: 0, groupIndex: selectedIndex.value })
  members.value = String(res.data ?? '')
}

function onGroupChange() {
  loadMembers()
}

async function start() {
  if (!content.value.trim()) return ElMessage.warning('请输入广播内容')
  broadcasting.value = true
  await api.broadcastCommand(EP.startTtsTask, {
    groupId: `BG#${selectedIndex.value}`,
    vcontentType: contentType.value,
    vcontent: content.value,
    content: content.value,
    playCnt: playCnt.value
  })
  setTimeout(() => { broadcasting.value = false }, 3000)
}
async function stop() {
  await api.broadcastCommand(EP.stopTask, { groupId: `BG#${selectedIndex.value}` })
  broadcasting.value = false
}
async function changeVolume(delta: number) {
  const ep = delta > 0 ? EP.incVolume : delta < 0 ? EP.decVolume : EP.setVolume
  volume.value = Math.max(0, Math.min(100, volume.value + delta))
  await api.broadcastCommand(ep, { groupId: `BG#${selectedIndex.value}`, volume: volume.value })
}
function quickTts(text: string) {
  content.value = text
  contentType.value = 0
}

onMounted(loadGroups)
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">扩音广播</h1>
        <p class="page-desc">指定广播设备或区域进行扩音通讯 · TTS 文字转语音 · 音量控制</p>
      </div>
      <div class="endpoint-note">POST /openapi/broadcast/startTtsTask</div>
    </div>

    <el-row :gutter="16">
      <el-col :span="6">
        <div class="panel" style="height:100%">
          <h3 class="panel-title">
            广播组 / 区域
            <el-button link :icon="Refresh" style="margin-left:auto" @click="loadGroups" />
          </h3>
          <el-radio-group v-model="selectedIndex" class="bc-groups" @change="onGroupChange">
            <el-radio-button v-for="g in groups" :key="g.groupId" :value="g.groupIndex" class="bc-group-btn">
              <div>{{ g.groupName }}</div>
              <div class="mini" :class="g.status==='playing'?'tag-online':'muted'">
                <span class="dot" :class="g.status==='playing'?'green':'gray'" />{{ g.groupId }}
              </div>
            </el-radio-button>
          </el-radio-group>
          <div style="margin-top:16px" class="mini muted">
            <div>组内成员（号码）</div>
            <div class="mono" style="margin-top:6px;line-height:1.7;word-break:break-all">{{ members || '—' }}</div>
          </div>
        </div>
      </el-col>

      <el-col :span="10">
        <div class="panel section-gap">
          <h3 class="panel-title">发起广播 <span class="muted mini">目标：{{ selectedGroup?.groupName }} ({{ selectedGroup?.groupId }})</span></h3>
          <el-form label-width="90px">
            <el-form-item label="内容类型">
              <el-select v-model="contentType" style="width:100%">
                <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="广播内容">
              <el-input v-model="content" type="textarea" :rows="3" placeholder="输入要播报的文字内容" />
            </el-form-item>
            <el-form-item label="播放次数">
              <el-input-number v-model="playCnt" :min="1" :max="9" />
              <span class="mini muted" style="margin-left:10px">1-9 次</span>
            </el-form-item>
          </el-form>
          <div style="display:flex;gap:8px">
            <el-button type="primary" :icon="VideoPlay" :loading="broadcasting" @click="start">开始广播</el-button>
            <el-button type="danger" @click="stop">停止</el-button>
          </div>
          <div class="mini muted" style="margin-top:12px">快捷话术：</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
            <el-tag size="small" style="cursor:pointer" @click="quickTts('请立即到应急集合点集结')">疏散集合</el-tag>
            <el-tag size="small" style="cursor:pointer" @click="quickTts('罐区发生可燃气报警，请立即撤离上风向')">罐区撤离</el-tag>
            <el-tag size="small" style="cursor:pointer" @click="quickTts('消防演练现在开始，请注意安全')">消防演练</el-tag>
          </div>
        </div>

        <div class="panel">
          <h3 class="panel-title">音量控制 <span class="muted mini">{{ selectedGroup?.groupName }}</span></h3>
          <div style="display:flex;align-items:center;gap:12px">
            <el-button :icon="Minus" @click="changeVolume(-10)" />
            <el-slider v-model="volume" style="flex:1" @change="changeVolume(0)" />
            <el-button :icon="Plus" @click="changeVolume(10)" />
            <el-tag type="primary">{{ volume }}%</el-tag>
          </div>
          <div class="mini muted" style="margin-top:8px"><Setting style="vertical-align:middle" /> 对应 setVolume / incVolume / decVolume</div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="panel" style="height:100%">
          <h3 class="panel-title">广播状态推送</h3>
          <div class="event-feed" style="max-height:620px">
            <div v-for="e in bcEvents" :key="e.id" class="event-item" :class="e.level ?? 'info'">
              <span class="event-ts">{{ e.ts }}</span>
              <span class="event-text">{{ e.text }}</span>
            </div>
            <div v-if="!bcEvents.length" class="empty-hint">暂无广播事件</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.bc-groups { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
.bc-group-btn { text-align: left; height: auto !important; padding: 10px 12px !important; }
.bc-group-btn :deep(.el-radio-button__inner) { width: 100%; box-shadow: none !important; border-radius: var(--radius-md) !important; border: 1px solid var(--glass-border) !important; }
</style>

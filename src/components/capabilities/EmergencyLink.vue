<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Search, Bell, CircleCheck } from '@element-plus/icons-vue'
import { communicationApi as api } from '@/services/communication'
import { SOS_EVENT_TYPES } from '@/api/endpoints'
import { uuid } from '@/api/sign'
import { useCommStore } from '@/stores/comm'
import type { CallRecordItem } from '@/types'

const store = useCommStore()
const tab = ref('sos')

// ---- 一键报警联动 ----
const area = ref('化工罐区(00020251)')
const eventType = ref(7)
const eventDesc = ref('可燃气浓度过高')
const level = ref(4)
const note = ref('化工中间原料罐区（一）_P-002A/B附近_苯发生报警,位号:GDS_1340GI00119,当前值:3.13')
const pendingAlarms = ref<Array<{ id: string; area: string; desc: string; level: number; time: string; confirmed: boolean }>>([])

const eventTypeOptions = Object.entries(SOS_EVENT_TYPES).map(([k, v]) => ({ value: Number(k), label: v }))

async function triggerSos() {
  const id = uuid()
  await api.sosAdd({
    area: area.value,
    eventId: id,
    eventTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    eventType: eventType.value,
    level: level.value,
    srcIndex: '3405',
    eventSubType: String(eventType.value),
    eventSubTypeDesc: eventDesc.value,
    note: note.value
  })
  pendingAlarms.value.unshift({
    id, area: area.value, desc: eventDesc.value, level: level.value,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), confirmed: false
  })
  ElMessage.success('报警联动已触发，广播/电话/对讲联动已下发')
}

async function confirmAlarm(id: string) {
  await api.sosConfirm({ eventId: id })
  const a = pendingAlarms.value.find((x) => x.id === id)
  if (a) a.confirmed = true
  ElMessage.success('报警已确认')
}

const sosEvents = computed(() => store.events.filter((e) => e.cmd === 'sosLinkage').slice(0, 12))

// ---- 录音检索 ----
const qCaller = ref('')
const qDest = ref('')
const qKeyword = ref('')
const records = ref<CallRecordItem[]>([])
const searched = ref(false)
const summaryMap = ref<Record<string, string>>({})

async function searchRecords() {
  searched.value = true
  const res = await api.recordsQuery({
    callerNum: qCaller.value, destination: qDest.value,
    startTime: '', endTime: '', pageNum: 1, pageSize: 50
  })
  records.value = (res.rows as unknown as CallRecordItem[]) ?? []
}

const filteredRecords = computed(() => {
  if (!qKeyword.value.trim()) return records.value
  const kw = qKeyword.value.trim()
  return records.value.filter((r) =>
    r.transcript?.includes(kw) || r.summary?.includes(kw) ||
    r.callerNum.includes(kw) || r.destination.includes(kw)
  )
})

async function doAsr(row: CallRecordItem) {
  await api.recordAsr({ macType: 1, filePath: row.url, cdrUuid: row.url.match(/_([0-9a-f-]{36})/)?.[1] ?? uuid() })
  ElMessage.success('转写任务已提交，演示数据中已附转写文本')
}
async function doSummary(row: CallRecordItem) {
  const res = await api.recordStartSummary({ cdrUuid: row.url })
  await api.recordGetSummaryStatus({ taskId: String(res.data) })
  summaryMap.value[row.url] = row.summary ?? '摘要生成完成'
  ElMessage.success('摘要已生成')
}
</script>

<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="一键报警联动" name="sos">
        <el-row :gutter="16">
          <el-col :span="9">
            <div class="panel">
              <h3 class="panel-title">触发报警联动</h3>
              <el-form label-width="90px">
                <el-form-item label="区域">
                  <el-input v-model="area" />
                </el-form-item>
                <el-form-item label="事件类型">
                  <el-select v-model="eventType" style="width:100%" @change="(v:number)=>eventDesc=SOS_EVENT_TYPES[v as keyof typeof SOS_EVENT_TYPES]">
                    <el-option v-for="o in eventTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="报警级别">
                  <el-radio-group v-model="level">
                    <el-radio-button :value="1">正常</el-radio-button>
                    <el-radio-button :value="2">低</el-radio-button>
                    <el-radio-button :value="3">中</el-radio-button>
                    <el-radio-button :value="4">高</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="备注">
                  <el-input v-model="note" type="textarea" :rows="3" />
                </el-form-item>
              </el-form>
              <el-button type="danger" :icon="Warning" style="width:100%" @click="triggerSos">触发一键报警联动</el-button>
              <el-alert type="info" :closable="false" show-icon style="margin-top:12px"
                title="联动触发后由平台预案自动执行：广播扩音 + 电话呼叫应急小组 + 对讲频道指令下达" />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="panel" style="height:100%">
              <h3 class="panel-title">待确认报警</h3>
              <div v-for="a in pendingAlarms" :key="a.id" class="event-item" :class="a.level>=4?'danger':'warning'" style="margin-bottom:8px">
                <div style="flex:1">
                  <div class="event-text"><b>{{ a.desc }}</b> · L{{ a.level }}</div>
                  <div class="mini muted" style="margin-top:4px">{{ a.area }} · {{ a.time }}</div>
                </div>
                <el-button v-if="!a.confirmed" size="small" type="primary" :icon="CircleCheck" @click="confirmAlarm(a.id)">确认</el-button>
                <el-tag v-else size="small" type="success" effect="dark">已确认</el-tag>
              </div>
              <div v-if="!pendingAlarms.length" class="empty-hint">暂无报警</div>
            </div>
          </el-col>
          <el-col :span="7">
            <div class="panel" style="height:100%">
              <h3 class="panel-title">联动事件推送</h3>
              <div class="event-feed" style="max-height:560px">
                <div v-for="e in sosEvents" :key="e.id" class="event-item" :class="e.level ?? 'info'">
                  <span class="event-ts">{{ e.ts }}</span>
                  <span class="event-text">{{ e.text }}</span>
                </div>
                <div v-if="!sosEvents.length" class="empty-hint">暂无联动事件</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="录音存储与检索" name="record">
        <div class="panel section-gap">
          <h3 class="panel-title">检索条件</h3>
          <el-row :gutter="12" align="middle">
            <el-col :span="5"><el-input v-model="qCaller" placeholder="主叫号码" clearable /></el-col>
            <el-col :span="5"><el-input v-model="qDest" placeholder="被叫号码" clearable /></el-col>
            <el-col :span="8"><el-input v-model="qKeyword" placeholder="关键词（检索转写文本/摘要，如：苯、消防、误报）" clearable /></el-col>
            <el-col :span="6">
              <el-button type="primary" :icon="Search" @click="searchRecords">查询录音</el-button>
              <span class="mini muted" style="margin-left:8px">时间戳检索：records/query</span>
            </el-col>
          </el-row>
        </div>

        <div class="panel">
          <h3 class="panel-title">录音记录 <span class="muted mini" v-if="searched">共 {{ filteredRecords.length }} 条</span></h3>
          <el-table :data="filteredRecords" v-if="searched">
            <el-table-column prop="startTime" label="起始时间" width="160" />
            <el-table-column label="主叫 → 被叫" width="150">
              <template #default="{ row }"><span class="mono">{{ row.callerNum }} → {{ row.destination }}</span></template>
            </el-table-column>
            <el-table-column prop="timeLen" label="时长(s)" width="80" />
            <el-table-column label="播放" width="70">
              <template #default="{ row }">
                <el-button link type="primary" @click="ElMessage.info('演示环境：播放地址 ' + row.url)">▶</el-button>
              </template>
            </el-table-column>
            <el-table-column label="转写文本 / 摘要" min-width="280">
              <template #default="{ row }">
                <div class="mini">{{ row.transcript }}</div>
                <div v-if="summaryMap[row.url]" class="mini tag-online" style="margin-top:4px">摘要：{{ summaryMap[row.url] }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link :icon="Bell" @click="doAsr(row)">转写</el-button>
                <el-button link type="success" @click="doSummary(row)">摘要</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-hint">点击「查询录音」加载全流程通话录音</div>
          <el-alert type="info" :closable="false" show-icon style="margin-top:12px"
            title="关键词检索实现：平台 records/query 只支持号码+时间；关键词通过 record/asr 转写为文本后本地检索。电话/对讲/广播录音是否统一入库需向厂家确认。" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

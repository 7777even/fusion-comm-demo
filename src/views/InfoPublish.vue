<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion, Bell } from '@element-plus/icons-vue'
import { communicationApi as api } from '@/services/communication'
import { LINK_RULE } from '@/api/endpoints'
import { mockSmsTemplates, mockTerminals } from '@/api/mock/data'
import { uuid } from '@/api/sign'
import { simulateSmsLifecycle } from '@/api/mock/eventStream'
import { useCommStore } from '@/stores/comm'
import type { SmsTask } from '@/types'

const store = useCommStore()
const tab = ref('sms')

// ---- 短信 ----
const smsTarget = ref('')
const smsContent = ref('【应急通知】罐区发生可燃气报警，请立即按预案到指定集合点集结。')
const smsTemplate = ref('SMS_EMERGENCY_01')
const trackReply = ref(true)

const targetOptions = mockTerminals.filter((t) => Number(t.terminalId) > 4000 || t.terminalId.startsWith('9')).map((t) => ({
  value: t.terminalId, label: `${t.terminalName} (${t.terminalId})`
}))

async function sendSms() {
  if (!smsTarget.value) return ElMessage.warning('请选择接收单位')
  if (!smsContent.value.trim()) return ElMessage.warning('请输入短信内容')
  const id = uuid()
  const tpl = mockSmsTemplates.find((t) => t.code === smsTemplate.value)
  const task: SmsTask = {
    id,
    target: smsTarget.value,
    targetName: targetOptions.find((o) => o.value === smsTarget.value)?.label ?? smsTarget.value,
    content: smsContent.value,
    state: 'sending',
    createdAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    rule: 2
  }
  store.addSmsTask(task)

  await api.linkTaskSend({
    mobile: smsTarget.value,
    rule: 2,
    eventId: id,
    scontent: smsContent.value,
    templateCode: smsTemplate.value,
    templateParam: tpl?.name ?? ''
  })

  store.updateSmsTask(id, { state: 'sent' })
  ElMessage.success('短信已提交到融合通信短信平台')

  if (trackReply.value) {
    simulateSmsLifecycle(
      task.targetName,
      () => store.updateSmsTask(id, { state: 'awaiting' }),
      () => store.updateSmsTask(id, { state: 'replied', replyAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }),
      async () => {
        store.updateSmsTask(id, { state: 'escalated', escalateAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }) })
        // 未回复 → 自动调用语音通讯调度服务（电话呼叫 rule=7）
        await api.linkTaskSend({
          mobile: smsTarget.value,
          rule: 7,
          eventId: uuid(),
          vcontentType: 0,
          vcontent: `紧急语音通知：${smsContent.value}`,
          playCnt: 3
        })
      }
    )
  }
}

const stateLabel: Record<string, string> = {
  sending: '提交中', sent: '已发送', awaiting: '等待回复',
  replied: '已回复', escalated: '已语音升级'
}
const stateTag: Record<string, string> = {
  sending: 'info', sent: '', awaiting: 'warning', replied: 'success', escalated: 'danger'
}

// ---- 移动端公告 ----
const noticeScope = ref('R0103')
const noticeTitle = ref('罐区应急疏散通知')
const noticeContent = ref('请罐区全体人员立即停止作业，沿上风向通道撤离至南区集合点。')
const scopeOptions = [
  { value: 'R0001', label: '全厂区' },
  { value: 'R0101', label: '生产一部' },
  { value: 'R0103', label: '化工罐区' },
  { value: 'R0104', label: '应急指挥中心' }
]

async function pushNotice() {
  if (!noticeContent.value.trim()) return ElMessage.warning('请输入公告内容')
  await api.linkTaskSend({
    mobile: noticeScope.value,
    rule: 4,
    eventId: uuid(),
    scontent: `${noticeTitle.value}：${noticeContent.value}`
  })
  await api.appEventReport({
    cmd: 'app', action: 'message_post', uuid: uuid(),
    report_account: '9000', report_time: Date.now(),
    message_data: {
      message_content: noticeTitle.value,
      content_details: noticeContent.value,
      location_info: undefined,
      enclosure_info: []
    }
  })
  ElMessage.success('公告已推送至指定范围移动端')
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">信息发布</h1>
        <p class="page-desc">短信推送 · 未回复自动语音升级 · 移动端公告指定范围</p>
      </div>
      <div class="endpoint-note">POST /openapi/linkTask/send · rule 2/3/4/7</div>
    </div>

    <el-tabs v-model="tab" class="publish-tabs">
      <el-tab-pane label="短信 + 语音升级" name="sms">
        <el-row :gutter="16">
          <el-col :span="10">
            <div class="panel">
              <h3 class="panel-title">发送应急短信</h3>
              <el-form label-width="90px">
                <el-form-item label="接收单位">
                  <el-select v-model="smsTarget" filterable placeholder="选择终端/手机号" style="width:100%">
                    <el-option v-for="o in targetOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="短信模板">
                  <el-select v-model="smsTemplate" style="width:100%">
                    <el-option v-for="t in mockSmsTemplates" :key="t.code" :label="t.name" :value="t.code" />
                  </el-select>
                </el-form-item>
                <el-form-item label="短信内容">
                  <el-input v-model="smsContent" type="textarea" :rows="4" />
                </el-form-item>
                <el-form-item label="回复跟踪">
                  <el-switch v-model="trackReply" />
                  <span class="mini muted" style="margin-left:10px">未按时回复自动语音通知</span>
                </el-form-item>
              </el-form>
              <el-alert type="info" :closable="false" show-icon
                title="联动规则：仅短信 rule=2；短信+语音 rule=3；电话呼叫 rule=7。回复回执需平台侧上行推送，本 demo 用状态机模拟。" />
              <el-button type="primary" :icon="Promotion" style="margin-top:14px;width:100%" @click="sendSms">发送短信</el-button>
            </div>
          </el-col>
          <el-col :span="14">
            <div class="panel" style="height:100%">
              <h3 class="panel-title">发送任务与回复跟踪</h3>
              <el-table :data="store.smsTasks" height="440">
                <el-table-column prop="createdAt" label="时间" width="80" />
                <el-table-column prop="targetName" label="接收单位" min-width="150" />
                <el-table-column label="状态" width="110">
                  <template #default="{ row }">
                    <el-tag :type="stateTag[row.state]" size="small" effect="dark">{{ stateLabel[row.state] }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="回复/升级" width="90">
                  <template #default="{ row }">
                    <span class="mini">{{ row.replyAt ?? row.escalateAt ?? '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="content" label="内容" min-width="180" show-overflow-tooltip />
              </el-table>
              <div v-if="!store.smsTasks.length" class="empty-hint">尚无发送任务，左侧发送一条试试</div>
              <div class="mini muted" style="margin-top:10px">
                状态机：已发送 → 等待回复 →（已回复 | 超时未回复 → 自动电话呼叫 rule=7）
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="移动端公告" name="notice">
        <el-row :gutter="16">
          <el-col :span="10">
            <div class="panel">
              <h3 class="panel-title">推送公告</h3>
              <el-form label-width="90px">
                <el-form-item label="通知范围">
                  <el-select v-model="noticeScope" style="width:100%">
                    <el-option v-for="o in scopeOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="公告标题">
                  <el-input v-model="noticeTitle" />
                </el-form-item>
                <el-form-item label="公告内容">
                  <el-input v-model="noticeContent" type="textarea" :rows="5" />
                </el-form-item>
              </el-form>
              <el-button type="primary" :icon="Bell" style="width:100%" @click="pushNotice">推送公告</el-button>
              <el-alert type="warning" :closable="false" show-icon style="margin-top:14px"
                title="能力缺口：文档仅提供 App 上报接口（eventReport），平台主动下发公告通道需向厂家确认。demo 以 linkTask/send rule=4 消息推送模拟。" />
            </div>
          </el-col>
          <el-col :span="14">
            <div class="panel" style="height:100%">
              <h3 class="panel-title">联动规则对照（附录 C）</h3>
              <el-table :data="Object.entries(LINK_RULE).map(([v,l])=>({v:Number(v),l}))" height="440">
                <el-table-column prop="v" label="rule 值" width="100" />
                <el-table-column prop="l" label="联动方式" />
                <el-table-column label="本模块用途">
                  <template #default="{ row }">
                    <span class="mini" :class="[2,3,7].includes(row.v)?'tag-online':'muted'">
                      {{ [2,3,7].includes(row.v) ? '短信/语音通知链路' : row.v===4 ? '移动端公告（模拟）' : '' }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.publish-tabs :deep(.el-tabs__item) { font-size: 14px; }
</style>

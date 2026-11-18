# Eight Business Scenarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Demo 中新增化工园区八大业务场景页面（完整七块内容 + 可交互流程），有接口走 `fcPost`，无接口用 mock 模拟并标注。

**Architecture:** 元数据抽离到 `src/scenes/meta.ts`；通用 `ScenarioShell.vue` 渲染场景头 + 7 页签（故事/卡片/流程/角色动作/依赖/边界/验收），「流程」页签留 `workspace` slot、角色动作页签由事件流驱动；8 个 View 只写各自交互工作区。共享层为现有 `fcPost`/`EP`/mock handler/store。

**Tech Stack:** Vue 3.5 + TS 5.6（strict + noUnusedLocals）+ Vite 5 + Element Plus 2.9 + Pinia + ECharts 5.5，hash 路由。项目无单测框架，验证手段为 `npm run build` + Playwright 截图/流程点击。

## Global Constraints

- 设计源：`docs/superpowers/specs/2026-11-18-eight-scenarios-design.md`；内容源：建设方案 docx（已提取到 `.work-scenes.txt`，本计划已内联全部文案，实施时不依赖临时文件）。
- 场景固定 8 个、编号 01-08，路由 `/scene/01-meeting` ~ `/scene/08-drill`，阶段分三组。
- 七块内容齐全：故事、卡片、流程、角色动作、依赖功能、合同边界、验收建议。
- 无 API 能力必须带 `【模拟】` 或 `【需对接】` 标签；有 API 能力必须走 `fcPost`，禁止页面直接 import mock 数据。
- 视觉沿用现有大屏 token（`.panel`/`.page-head`/`.event-item`/`.endpoint-note` 等），禁止硬编码色值。
- 现有 5 页与 API 层不破坏；tsconfig 开启 `noUnusedLocals`/`noUnusedParameters`，未使用导入会构建失败。
- 提交信息 conventional commits 单行，scope 用 `screen` 或 `docs`。

---

### Task 1: 领域类型与接口常量

**Files:**
- Create: `src/types/scenario.ts`
- Modify: `src/api/endpoints.ts:47-50`

**Interfaces:**
- Produces: `ScenarioMeta`/`SceneCard`/`SceneStep`/`RoleAction`/`DependencyTag`/`Dependency`/`Enterprise`/`PatchTask`/`DrillPlan`；`EP` 新增 `camerasRegions`/`taskAdd`/`taskUpdate`/`taskRemove`。

- [ ] **Step 1: 创建 `src/types/scenario.ts`**

```ts
/** 八大业务场景元数据与领域类型 */

export interface SceneCard {
  roles: string
  trigger: string
  goal: string
  objects: string
}

export interface SceneStep {
  no: string
  action: string
  api?: string
  simulated?: boolean
}

export interface RoleAction {
  step: string
  role: string
  action: string
  system: string
}

export type DependencyTag = '已有依据' | '需对接' | '模拟'

export interface Dependency {
  capability: string
  usage: string
  owner: string
  tag: DependencyTag
}

export interface ScenarioMeta {
  no: string
  path: string
  title: string
  stage: '平时·日常管理' | '战时·应急指挥' | '事后·总结提升'
  value: string
  story: string[]
  card: SceneCard
  flow: SceneStep[]
  roles: RoleAction[]
  deps: Dependency[]
  boundary: { basis: string; pending: string[] }
  acceptance: string[]
}

export interface Enterprise {
  id: string
  name: string
  hasTerminal: boolean
  contact: string
  phone: string
  lng: number
  lat: number
  status: '未通知' | '已送达' | '已确认' | '措施落实'
}

export interface PatchTask {
  id: string
  type: string
  location: string
  owner: string
  monitor: string
  status: '待核查' | '核查中' | '整改中' | '已闭环'
  evidence: boolean
}

export interface DrillPlan {
  id: string
  name: string
  type: string
  location: string
  units: string[]
  status: '未开始' | '进行中' | '已结束'
}
```

- [ ] **Step 2: 扩展 `src/api/endpoints.ts`**

把 `:47-50` 的视频段替换为：

```ts
  // 视频联动
  camerasRegions: '/openapi/cameras/queryRegions',
  cameras: '/openapi/cameras/queryCameras',
  previewUrl: '/openapi/cameras/getPreviewUrl',

  // 广播任务管理
  taskAdd: '/openapi/broadcast/task/add',
  taskUpdate: '/openapi/broadcast/task/update',
  taskRemove: '/openapi/broadcast/task/remove'
```

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 4: 提交**

```bash
git add src/types/scenario.ts src/api/endpoints.ts
git commit -m "feat(screen): add scenario domain types and endpoints"
```

---

### Task 2: 场景元数据（01-04）

**Files:**
- Create: `src/scenes/meta.ts`

**Interfaces:**
- Consumes: Task 1 的 `ScenarioMeta`。
- Produces: `scene01` ~ `scene04`（Task 3 续写 05-08），最终导出 `SCENES: ScenarioMeta[]`。

- [ ] **Step 1: 创建 `src/scenes/meta.ts`（场景 01-04）**

```ts
import type { ScenarioMeta } from '@/types/scenario'

export const scene01: ScenarioMeta = {
  no: '01', path: '/scene/01-meeting', title: '园区多企业远程会议',
  stage: '平时·日常管理', value: '让企业无需反复到场，统一完成跨企业远程沟通',
  story: [
    '园区应急管理部门需要组织13家企业召开安全生产工作会议，通报近期风险、传达整改要求并协调跨企业事项。以往企业到现场参会，或分别连接不同厂家视频会议系统，会议组织成本高。',
    '目前调研的13家企业中，广石化、吉化、盛元达、粤电、停车场、广州港等6家已有视频会议终端，厂家并不一致；伊斯科、东粤化学、东粤环保、凯美特、东江国业、广业国业、裕美公司等7家无视频会议终端。园区操作员应能统一建会、邀请、预监、会控；无终端企业通过获授权的软终端/PC浏览器参会，或在能力受限时先通过电话语音参会。'
  ],
  card: {
    roles: '园区会议组织人员、应急局/管委会、6家硬终端企业、7家无终端企业、会议管理员。',
    trigger: '日常工作例会、专项安全会议、临时协调会议。',
    goal: '统一组织会议、减少线下到场，兼顾不同厂家硬终端和无硬件企业。',
    objects: '会议、会场、参会企业、联系人、硬终端、PC/移动软终端、会控记录。'
  },
  flow: [
    { no: '01', action: '创建会议并填写主题、时间与参会单位', simulated: true },
    { no: '02', action: '从企业组织和终端目录选择参会对象', api: 'queryTerminals' },
    { no: '03', action: '按企业条件分配硬终端、PC/手机软终端或电话语音入口', simulated: true },
    { no: '04', action: '发起呼叫、参会人员接入并查看在线状态', api: 'terminalOperator(10)' },
    { no: '05', action: '管理员执行主席、广播、静音、点名、辅流等会控动作', api: 'terminalOperator(11-16)' },
    { no: '06', action: '按约定保存会议记录、录音录像并结束会议', simulated: true }
  ],
  roles: [
    { step: '01', role: '会议组织员', action: '创建会议，选择13家企业和管理部门', system: '生成会议及参会对象清单' },
    { step: '02', role: '会议管理员', action: '向已有会议终端企业发起协议呼叫', system: '按SIP/H.323等兼容协议连接会场' },
    { step: '03', role: '无终端企业', action: '使用获授权的PC浏览器、软终端或电话接入', system: '按接入许可和网络条件进入视频或语音会场' },
    { step: '04', role: '主持人与会控员', action: '设置主席、点名、静闭音、共享主画面', system: '形成统一会控状态及会场画面' },
    { step: '05', role: '会议管理员', action: '结束会议并保存所需资料', system: '保留会议基本信息与录制数据（如已配置）' }
  ],
  deps: [
    { capability: '企业与人员目录', usage: '选择单位负责人、会议室和参会对象', owner: '组织人员数据；需要与企业通讯录对接', tag: '需对接' },
    { capability: '视频会议融合', usage: '不同厂家硬终端加入同一会议', owner: 'SIP/H.323能力需结合实际设备互通测试', tag: '需对接' },
    { capability: 'WebRTC/PC/移动软终端', usage: '无硬件企业及外出人员远程入会', owner: '揭阳是否包含足额软终端/编解码许可待核实', tag: '需对接' },
    { capability: '企业电话/PSTN融合', usage: '无法视频接入时以纯语音加入', owner: '运营商线路、PSTN网关与会控能力', tag: '已有依据' },
    { capability: '音视频记录与会控', usage: '主席、点名、静音、录制、查询', owner: '融合平台与录音录像存储能力', tag: '已有依据' }
  ],
  boundary: {
    basis: '揭阳材料明确以多企业视频会议为客户痛点，给出6家已配备、7家未配备终端的调研情况；一期/本期视频会议设备集成及视频会议融合能力列入材料。中山方案明确WebRTC、软终端等技术方向，但其10个软终端许可和并发配置不能视为揭阳承诺。',
    pending: [
      '必须落实7家无硬件终端企业的实际入会方式、软终端许可、跨网访问和身份认证',
      '华为底座的群语音/群视频对讲不能直接替代类腾讯会议式多人音视频会议',
      '多厂家互通需按具体型号实测'
    ]
  },
  acceptance: [
    '选取2种不同厂家硬终端，在同一会议中稳定双向音视频互通。',
    '至少选取1家无硬件终端企业，按确认的软终端/浏览器方案完成多人视频入会。',
    '验证会议主持、静音、点名、共享画面和结束会议动作。',
    '形成最大参会人数、许可/带宽/网络限制及异常提示的验收记录。'
  ]
}

export const scene02: ScenarioMeta = {
  no: '02', path: '/scene/02-patrol', title: '移动巡检与特殊作业联防',
  stage: '平时·日常管理', value: '车辆越界可核查，特殊作业可远程问询并督促整改',
  story: [
    '上午10:00，园区运营指挥中心值班员在日常值守时看到危化品运输车辆偏离石化大道规定路线，车辆定位系统触发电子围栏告警。值班员点击告警位置，核对车辆最新定位和近1小时轨迹，调取沿途摄像头核实车辆实际状态，必要时联系巡查员开展现场处置。',
    '同一时段，园区某化工企业正在开展一级动火特殊作业。值班员从特殊作业系统查看作业票和作业位置，点呼周边安监巡查员或企业现场安全员，通过移动视频查看气体检测、监护和现场防护措施。发现问题后在专项业务系统形成隐患或整改任务，现场责任人拍照上传整改情况，由园区人员核实闭环。两个任务属于同一值班时段的独立抽查事项，并非一个事故链。'
  ],
  card: {
    roles: '园区值班员、园区巡查员（移动单兵/手持终端）、企业现场安全员、危化车辆驾驶员、企业隐患整改责任人。',
    trigger: '车辆定位越界告警；高风险特殊作业计划性抽查或人工随机抽查。',
    goal: '在地图上快速定位、调阅现场画面，完成“发现—问询—核查—整改反馈”。',
    objects: '车辆、电子围栏告警、轨迹、摄像头、特殊作业票、巡查人员、抽查任务、隐患反馈。'
  },
  flow: [
    { no: '01', action: '接收车辆越界告警并显示最新定位（带采集时间）', simulated: true },
    { no: '02', action: '查看近期轨迹、附近卡口/石化大道监控并核实实况', api: 'cameras/getPreviewUrl' },
    { no: '03', action: '必要时点呼巡查员，生成车辆现场核查记录', api: 'terminalOperator(1)' },
    { no: '04', action: '切换至特殊作业抽查，读取作业票、点位和监护人员', simulated: true },
    { no: '05', action: '点对点视频呼叫或要求手持终端上传现场图片/视频', simulated: true },
    { no: '06', action: '记录检查问题并下达整改责任、位置及要求', simulated: true },
    { no: '07', action: '企业整改提交图片/视频，园区复核并结束本次抽查', simulated: true }
  ],
  roles: [
    { step: '01', role: '园区值班员', action: '点击危化车辆越界告警并回放轨迹', system: '地图展示最新定位、采集时间和历史行驶轨迹' },
    { step: '02', role: '园区值班员', action: '调取周边固定摄像头、控制球机', system: '视频点播、云台控制；需按位置和权限匹配设备' },
    { step: '03', role: '园区值班员', action: '选中巡查员终端并发起点呼/视频', system: '与现场巡查员建立通信，生成通信记录' },
    { step: '04', role: '企业现场安全员', action: '对准动火现场展示检测与监护措施', system: '手持终端回传实时视频、照片和位置' },
    { step: '05', role: '园区值班员', action: '登记抽查问题并下发整改任务', system: '在专项业务系统建立隐患/整改记录' },
    { step: '06', role: '企业整改责任人', action: '上传整改证据，园区复核', system: '移动文字/图片/视频反馈与审核闭环' }
  ],
  deps: [
    { capability: '危化车/危废车定位', usage: '获取车辆轨迹与电子围栏告警', owner: '车辆定位系统提供定位和告警接口', tag: '需对接' },
    { capability: 'GIS位置融合', usage: '定位、轨迹回放、圈选周边终端', owner: '位置业务融合模块；轮询周期可能造成定位滞后', tag: '需对接' },
    { capability: 'GB/T 28181视频网关', usage: '一期监控、卡口画面及PTZ控制', owner: '视频资源须可访问且具云台授权', tag: '已有依据' },
    { capability: '单兵/手持终端', usage: '点呼、移动视频和位置上传', owner: '融合平台终端能力与现场设备部署', tag: '已有依据' },
    { capability: '特殊作业/隐患管理', usage: '作业票、抽查对象、整改任务和验收', owner: '专项业务系统；深度接口和工单归属待明确', tag: '需对接' },
    { capability: '便捷移动响应', usage: '事件/位置下发及图文视频反馈', owner: '揭阳敏捷应急集成条目可借鉴，需按巡检用途适配', tag: '需对接' }
  ],
  boundary: {
    basis: '揭阳材料列有危化品车辆定位、危废车辆定位、企业人员定位和手持终端定位数据，以及一期监控清单（64台警戒枪机、12台石化大道球机、4台高空AR、4台危废仓库防爆监控、6台卡口抓拍设备）。设备/调度台能力包括GIS轨迹、地理围栏、监控点播、PTZ控制和移动视频回传。',
    pending: [
      '围栏实时告警须由车辆定位系统提供或经明确业务规则实现；60秒定位上报不等于秒级实时位置',
      '周边摄像头“自动最近匹配”、特殊作业票接入、隐患工单流转需要专项软件深度对接，不能仅凭融合通信SDK即认定已实现'
    ]
  },
  acceptance: [
    '模拟车辆越界告警，定位到车辆并回放指定时段轨迹，界面显示定位更新时间。',
    '从告警定位选取可用摄像头，完成实时点播；对具权限球机验证PTZ。',
    '抽取一项一级动火作业，读取作业位置及人员，并通过手持终端完成一次视频问询。',
    '发现问题后形成整改记录，现场提交图文证据，园区复核并查看完整记录。'
  ]
}

export const scene03: ScenarioMeta = {
  no: '03', path: '/scene/03-report', title: '多渠道接报与应急响应启动',
  stage: '战时·应急指挥', value: '接报有记录、响应有对象、通知可追踪',
  story: [
    '下午14:30，某企业危废仓库气体监测超标，企业值班室同时通过固定电话报告疑似泄漏、烟雾异常。园区值班员接听电话，记录接报时间、单位和事故位置，调取危废仓库监控与高空AR画面开展人工核查。',
    '研判需要启动响应后，值班人员在敏捷应急系统登记事件并选择适用响应级别，系统加载指挥体系和各工作组责任人员，按规则发送短信、App消息并发起电话呼叫。重要人员即使未打开App，也可通过运营商电话网得到语音通知；是否接通、是否确认和是否已出动分别记录。示例中的“30秒完成激活”应视为期望目标，需测试及合同确认。'
  ],
  card: {
    roles: '企业值班员、园区接报值班员、应急局负责人、总指挥、专项工作组组长、救援队伍。',
    trigger: '监测报警、企业电话/短信上报，经值班员确认需启动响应。',
    goal: '统一接报、快速核实、按职责通知，能够追踪每位关键人员响应状态。',
    objects: '报警信息、接报录音、事件、响应级别、指挥体系、通知任务、响应节点。'
  },
  flow: [
    { no: '01', action: '电话或短信接报，记录报警来源和时间', simulated: true },
    { no: '02', action: '检索事故地点视频，人工核实事件类型、优先级及状态', api: 'cameras/getPreviewUrl' },
    { no: '03', action: '在敏捷应急登记事件并确定响应级别', simulated: true },
    { no: '04', action: '匹配指挥体系、通知单位、人员及职责', simulated: true },
    { no: '05', action: '通过短信、移动消息和PSTN电话下发事件及位置', api: 'linkTask/send' },
    { no: '06', action: '查询送达/呼叫接通情况，对未确认关键人员再次语音联系', api: 'linkTask/send(7)' },
    { no: '07', action: '相关人员确认响应、接受任务并记录出动和处置节点', simulated: true }
  ],
  roles: [
    { step: '01', role: '园区值班员', action: '接听企业值班电话，记录接报信息', system: '通话接入/录音（须落实线路与录音范围）' },
    { step: '02', role: '园区值班员', action: '调阅仓库监控与高空AR视频', system: '形成事件初判依据，维护事件优先级' },
    { step: '03', role: '指挥人员', action: '选择响应级别、确认启动', system: '关联组织架构、岗位职责及通知清单' },
    { step: '04', role: '系统/值班员', action: '按名单发短信/移动消息/电话', system: '形成发送状态、呼叫状态和操作日志' },
    { step: '05', role: '值班员', action: '对未确认人员再次电话呼叫', system: '补充呼叫及人工确认记录' },
    { step: '06', role: '部门及企业人员', action: '确认接收、领取任务、反馈响应', system: '关联任务状态、职责反馈和响应时间' }
  ],
  deps: [
    { capability: '接报业务和电话网关', usage: '企业固话/手机接入、接报录音', owner: 'PSTN/SIP接入；运营商线路和录音点位需核实', tag: '需对接' },
    { capability: '视频融合', usage: '危废仓库和高空AR视频点播', owner: '视频网关及权限；烟雾异常识别非默认AI能力', tag: '已有依据' },
    { capability: '敏捷应急事件管理', usage: '事件登记、分类、响应级别、状态', owner: '业务系统为事件主数据源', tag: '需对接' },
    { capability: '指挥体系/任务管理', usage: '人员职责匹配、任务下发、响应节点', owner: '原敏捷应急系统集成', tag: '需对接' },
    { capability: '短信四类接口', usage: '上行短信、下发、回执、状态', owner: '发送送达不等于已读；已读需额外确认机制', tag: '需对接' },
    { capability: '语音融合', usage: '关键人员电话强呼、固话/手机呼叫', owner: '可直接拨号不等于强制接通或VoLTE视频入会', tag: '已有依据' }
  ],
  boundary: {
    basis: '揭阳合同列有指挥体系、任务分发、响应跟踪、事件动态管理，以及上行短信、下行短信、回执和状态接口。融合通信设备清单列有PSTN固话语音网关、语音融合与录音能力。中山方案强调手机App退出时的紧急语音接入痛点。',
    pending: [
      '“电话接报自动生成事件”“短信已读”“未响应自动重呼”“30秒激活”均需明确业务规则和性能验收',
      'PSTN/E1网关不等于运营商IMS/VoLTE视频通道；手机未装App通常只能以电话语音接入，不能承诺原生视频入会'
    ]
  },
  acceptance: [
    '模拟企业固话接报，保存事件接报信息并回放录音。',
    '核实视频后登记事件、选择响应级别并产生对应指挥人员清单。',
    '完成一次短信发送及状态查询，并区分送达与人工确认。',
    '对未确认关键人员发起电话呼叫，记录接通、确认及任务响应节点。'
  ]
}

export const scene04: ScenarioMeta = {
  no: '04', path: '/scene/04-consult', title: '跨网异构多方视频会商',
  stage: '战时·应急指挥', value: '6家硬终端、7家无终端企业与远程专家共享同一态势',
  story: [
    '下午14:40，泄漏事件可能影响周边企业，总指挥要求立即召集13家关联企业、应急部门及环保、气象等专家开展会商，研判警戒和人员防护措施。此时，6家企业拥有不同厂家的视频会议硬终端，7家企业没有硬件会议系统，专家正通过手机或平板在外地参加。',
    '操作员在可视化调度台发起快速会商，按实际协议和许可邀请硬终端、软终端及电话语音用户。调取仓库监控、高空AR或现场移动视频作为会议画面，再通过屏幕共享和白板协作讨论地图态势。会议主持人统一点名、静闭音、广播主画面，并保存会商结论及录音录像。'
  ],
  card: {
    roles: '园区总指挥、应急局及管委会、13家企业、远程专家、会议操作员、现场视频回传人员。',
    trigger: '指挥人员发出跨部门、跨企业联合研判指令。',
    goal: '打破硬终端异构和无硬件条件限制，形成多方共同查看现场画面的会商能力。',
    objects: '应急事件、会议、参会组织和终端、共享监控画面、会商纪要、会议录像。'
  },
  flow: [
    { no: '01', action: '按事件发起应急融合会议并选择参与单位', simulated: true },
    { no: '02', action: '呼叫已有硬终端企业的SIP/H.323会场', api: 'terminalOperator(10)' },
    { no: '03', action: '通过已授权的PC/WebRTC/移动软终端邀请无硬件企业和专家', simulated: true },
    { no: '04', action: '将企业电话/公网手机作为语音会场接入', api: 'terminalOperator(1)' },
    { no: '05', action: '把监控、单兵或无人机可用视频加入会议多画面', api: 'cameras/getPreviewUrl' },
    { no: '06', action: '共享GIS态势、屏幕/辅流及白板，主持人进行会控', simulated: true },
    { no: '07', action: '记录会商结论、通知后续任务并保存会议资料', simulated: true }
  ],
  roles: [
    { step: '01', role: '会议操作员', action: '从事件详情发起会商并选择13家企业', system: '生成与事件关联的会议和邀请清单' },
    { step: '02', role: '6家有硬终端企业', action: '接受协议呼叫加入视频会场', system: '执行多厂家终端兼容与视频会议融合' },
    { step: '03', role: '7家无终端企业/专家', action: '通过浏览器或软终端加入', system: '验证授权、跨网和WebRTC/软终端许可' },
    { step: '04', role: '视频操作员', action: '选取监控和移动视频入会', system: '转码、视频分发、多画面和大屏软上墙' },
    { step: '05', role: '主持人/专家', action: '共享地图、点名讨论和白板标注', system: '保持会控、共享内容与会议记录' },
    { step: '06', role: '指挥人员', action: '形成研判意见并转入救援部署', system: '关联任务和会商资料' }
  ],
  deps: [
    { capability: '视频会议融合/MCU', usage: '硬终端互通、并发会议和会议控制', owner: '不同项目具体MCU、端口数及编解码能力须分别核对', tag: '需对接' },
    { capability: 'WebRTC与软终端', usage: '无硬件企业、外出专家的视频入会', owner: '揭阳需核实建设范围；中山有明确许可和编解码参数', tag: '需对接' },
    { capability: 'PSTN/企业电话', usage: '手机与座机语音入会', owner: '不自动具备无App手机视频入会', tag: '已有依据' },
    { capability: '视频监控/视频转码', usage: '监控、AR、单兵视频进入会商画面', owner: '视频资源授权及并发/编解码容量', tag: '已有依据' },
    { capability: '态势研判数据', usage: '周边风险、应急资源、气象图层显示', owner: '来自GIS及相关业务系统，仿真结果非融合通信生成', tag: '需对接' }
  ],
  boundary: {
    basis: '揭阳材料明确13家企业终端现状和华为底座限制，合同列有音视频会商、移动会议、视频监控及电话等集成。中山合同另有WebRTC并发8路720P、10软终端注册许可、20路1080P MCU并发等配置，仅作差异比对，不能移植为揭阳配置。',
    pending: [
      '揭阳无终端企业的高清视频入会能力属于必须落地确认的关键需求；核实WebRTC/软终端许可、跨互联网/政务网接入和MCU端口规模',
      '气象扩散模型、AR/三维态势图层来自业务系统，不能因为支持屏幕共享就认定融合通信系统自带分析模型'
    ]
  },
  acceptance: [
    '从事件一键发起会商，分别接入两类不同厂家硬终端并核查双向音视频。',
    '模拟7家无硬件企业与远程专家加入，核查全部参会方式及峰值许可。',
    '将至少一路固定监控和一路移动视频加入会议，验证多画面与大屏展示。',
    '完成主席、点名、静音、辅流共享、录制和会商结果归档。'
  ]
}
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/scenes/meta.ts
git commit -m "feat(screen): add scenario metadata for scenes 01-04"
```

---

### Task 3: 场景元数据（05-08）与汇总导出

**Files:**
- Modify: `src/scenes/meta.ts`（追加）

**Interfaces:**
- Consumes: Task 2 的 `scene01`~`scene04`。
- Produces: `scene05`~`scene08`、`SCENES: ScenarioMeta[]`、`SCENE_BY_PATH: Record<string, ScenarioMeta>`。

- [ ] **Step 1: 在 `src/scenes/meta.ts` 末尾追加场景 05-08 与导出**

（内容与 Task 2 同结构，逐字取自建设方案场景 05-08 的七块；此处完整给出。）

```ts
export const scene05: ScenarioMeta = {
  no: '05', path: '/scene/05-gis', title: '二三维GIS融合调度',
  stage: '战时·应急指挥', value: '从“地图看资源”升级为“地图选资源、直接调度”',
  story: [
    '下午15:00，会商形成外围封控、核心区处置及下风向避险等行动部署。现场救援力量使用的通信制式不一致：消防队伍可能使用350M/800M窄带PDT，园区队伍使用LTE宽带集群，企业安全人员使用公网手机，外部力量还可能使用车载台。',
    '指挥员进入二三维地图，查看事故点、附近重大危险源、企业、救援资源和人员车辆位置，使用圈选工具选取可调度终端。系统按资源类型执行不同动作：对摄像头发起点播、对PDT或LTE终端组建临时通信组、对救援人员下达任务，并将现场视频分发至已授权的指挥员或手持终端；路径分析应基于路网和人工确认的风险禁入区域，不直接承诺自动生成安全路线。'
  ],
  card: {
    roles: '总指挥、融合调度台操作员、PDT救援队伍、LTE集群队伍、企业现场人员、救援车辆。',
    trigger: '研判形成行动部署，需要地图辅助通信、救援力量派遣与视频共享。',
    goal: '依托GIS快速选定位置和资源，支撑跨制式语音指挥、视频分发和任务部署。',
    objects: '事故位置、警戒区域、摄像头、终端、人员、车辆、救援资源、通信群组、任务。'
  },
  flow: [
    { no: '01', action: '地图定位事故点并展示二三维态势和资源分布', simulated: true },
    { no: '02', action: '测距、标绘警戒区并核实风险区域与路网数据', simulated: true },
    { no: '03', action: '圈选事故周边的摄像头、手持终端和可用人员', api: 'queryTerminals' },
    { no: '04', action: '按资源类型分别执行视频点播、语音点呼/组呼或任务派发', api: 'terminalOperator' },
    { no: '05', action: '经网关把可互通的PDT/LTE/电话终端组织为临时通信组', simulated: true },
    { no: '06', action: '将高空AR或现场可用视频向指定终端分发', api: 'cameras/getPreviewUrl' },
    { no: '07', action: '救援队伍实时报告位置、进度并根据指挥调整部署', simulated: true }
  ],
  roles: [
    { step: '01', role: '总指挥', action: '加载模型、标绘管控区、测距', system: '展示二三维地图、周边目标和距离' },
    { step: '02', role: '调度员', action: '圈选终端与人员，查看在线和类型', system: '分别列示摄像头、对讲终端、移动人员' },
    { step: '03', role: '调度员', action: '创建临时组并发起PTT组呼', system: '通过实际接通的网关执行宽窄带语音融合' },
    { step: '04', role: '救援队长', action: '接收任务、确认出动和位置', system: '关联救援部署、任务及轨迹' },
    { step: '05', role: '视频调度员', action: '选择AR/监控/移动视频向现场终端分发', system: '按许可与终端兼容性完成视频分发' },
    { step: '06', role: '总指挥', action: '根据现场反馈调整部署、撤回力量', system: '更新任务状态、群组和部署记录' }
  ],
  deps: [
    { capability: '二三维GIS引擎', usage: '模型/图层、标绘、测距、路径、轨迹', owner: '揭阳合同列有二三维可视化和GIS服务能力', tag: '需对接' },
    { capability: '位置业务融合', usage: 'PDT/LTE/公网及移动终端定位、圈选', owner: '终端定位接口及报送频率须核对', tag: '需对接' },
    { capability: '集群融合/PDT网关', usage: '点呼、组呼、话权、动态重组和跨制式互通', owner: '只有兼容的无线网络与网关配置才能实际互通', tag: '需对接' },
    { capability: '融合调度台', usage: '地图操作、呼叫和视频分发', owner: '揭阳设备清单有相关能力', tag: '已有依据' },
    { capability: '应急资源/部署/任务', usage: '队伍编组、派遣、撤回、方案任务调度', owner: '敏捷应急业务系统负责状态与过程', tag: '需对接' },
    { capability: '视频融合网关', usage: '监控/AR/单兵视频调取与分发', owner: '视频平台、设备和转码并发受限', tag: '已有依据' },
    { capability: '路网/风险数据', usage: '辅助规划进入路线并避开人工标绘禁入区', owner: '“最安全路径”需外部风险模型与业务规则', tag: '需对接' }
  ],
  boundary: {
    basis: '揭阳合同有二三维图形、OSGB/三维瓦片等数据支持、GIS服务、位置业务融合、调度台、PDT集群和语音网关，救援力量部署和行动方案任务调度亦在原敏捷应急集成内容内。话权/群组时延等设备性能以合同测试条件为准。',
    pending: [
      '500米圈选只是操作示例；不能把圈选到的所有资源一键转换为同一种通信对象',
      '跨制式通信受设备、频段、网关、许可证、网络制式限制；无人机、布控球、防爆单兵硬件是否采购/利旧需核对',
      '路由算法不能自动保证化工事故下安全通行'
    ]
  },
  acceptance: [
    '在二三维地图定位事故点、绘制警戒区，查看周边终端与救援资源。',
    '圈选终端后，分别完成视频点播和可用PDT终端组呼。',
    '在已落实的网关条件下验证宽窄带互通及会话/话权性能。',
    '完成至少一次任务派遣—确认—现场反馈—撤回闭环及视频分发。'
  ]
}

export const scene06: ScenarioMeta = {
  no: '06', path: '/scene/06-notify', title: '周边企业协同通知与避险',
  stage: '战时·应急指挥', value: '从“逐家打电话”转为“按影响范围筛选并追踪企业响应”',
  story: [
    '下午15:10，指挥人员依据事故信息和风险分析认为泄漏可能对东侧周边企业及园区道路产生影响，需要对相关企业发送警戒、就地避险或疏散准备等指令。过去，值班员逐家找电话号码通知，不容易掌握哪些企业接到信息、采取了哪些措施。',
    '现在指挥人员在地图上叠加已确认的事故影响范围，查询周边企业与重点目标，人工确认通知对象后通过短信、固定电话、移动消息通知。企业负责人反馈本企业人员防护、厂区管控和其他响应情况；园区对未确认单位补充联系并形成协同记录。'
  ],
  card: {
    roles: '园区总指挥、值班员、周边企业负责人、企业应急人员、现场巡查员。',
    trigger: '事故影响范围变化，或指挥人员决定通知相关企业开展避险。',
    goal: '准确确定通知对象、掌握联系及响应状态，减少漏通知。',
    objects: '事件、影响范围、周边企业、联系人、通知记录、响应措施、状态。'
  },
  flow: [
    { no: '01', action: '加载事故影响范围或由指挥员人工绘制待核实区域', simulated: true },
    { no: '02', action: '叠加周边企业、道路、重点目标和联系人', simulated: true },
    { no: '03', action: '人工确认需要通知的企业及责任人清单', simulated: true },
    { no: '04', action: '按角色选择短信、电话、移动消息通知事件及要求', api: 'linkTask/send' },
    { no: '05', action: '企业接收并反馈人员避险、厂区管控等措施', api: 'app/eventReport' },
    { no: '06', action: '值班员查看发送/呼叫及人工确认状态', simulated: true },
    { no: '07', action: '对未确认企业补充通知，并留存各单位响应记录', api: 'linkTask/send' }
  ],
  roles: [
    { step: '01', role: '指挥人员', action: '查看影响范围并确认周边对象', system: 'GIS空间筛选企业及重点目标' },
    { step: '02', role: '值班员', action: '选择联系人和通知内容', system: '生成待通知清单、关联事件编号' },
    { step: '03', role: '系统/值班员', action: '发送短信、呼叫固话/手机', system: '保存发送和呼叫状态' },
    { step: '04', role: '企业负责人', action: '确认接收、反馈防护/避险进展', system: '形成移动事件反馈和责任记录' },
    { step: '05', role: '值班员', action: '筛选未确认单位并补充联系', system: '保存催办及最终响应结果' }
  ],
  deps: [
    { capability: 'GIS/周边态势', usage: '展示事故范围、企业及重要目标', owner: '范围来自模型或经人工确认；企业空间数据需维护', tag: '需对接' },
    { capability: '企业组织和联系人', usage: '按单位、岗位选择通知对象', owner: '组织人员与企业通讯录需更新', tag: '需对接' },
    { capability: '短信四类接口', usage: '消息发送、上行回复、回执、状态', owner: '短信状态与已读/响应确认分开', tag: '需对接' },
    { capability: '电话/PSTN融合', usage: '补充电话联系、语音群呼', owner: '受线路及终端可达性约束', tag: '已有依据' },
    { capability: '移动响应/职责反馈', usage: '企业填写措施落实状态', owner: '敏捷应急移动能力；确认流程需业务定义', tag: '需对接' },
    { capability: '事件/任务/响应跟踪', usage: '形成通知与反馈闭环', owner: '敏捷应急业务主数据', tag: '需对接' }
  ],
  boundary: {
    basis: '揭阳合同列有周边态势数据、组织人员、短信接口、企业电话集成、移动事件与职责反馈、响应跟踪等功能。GIS可用于范围可视化及对象查询，但事故扩散模型、按影响范围自动选择对象和确认业务规则并非仅由融合通信自身产生。',
    pending: [
      '短信送达不等于人已阅读或采取措施；自动筛选下风向企业需要可信的风向/扩散模型与企业空间数据',
      '企业确认、超时催办及应急措施模板属于需要深化的业务规则'
    ]
  },
  acceptance: [
    '输入一个示例事故位置和经确认的影响区域，筛选出周边企业。',
    '指挥员人工选择其中企业并发送短信或电话通知。',
    '至少一家企业完成移动端确认和响应反馈。',
    '值班员能区分送达、呼叫接通、人工确认及措施反馈，补充联系未确认企业。'
  ]
}

export const scene07: ScenarioMeta = {
  no: '07', path: '/scene/07-review', title: '应急处置全链路复盘',
  stage: '事后·总结提升', value: '以事件为索引查询通信、轨迹、任务与处置报告',
  story: [
    '下午17:00，事故得到控制，总指挥宣布响应结束。园区应急办需要复盘从报警、接报、响应启动、联合会商到救援部署和现场处置的全过程。原来，电话录音、群组对讲录音、视频会议、现场视频、车辆轨迹分别保存，人工查找耗时。',
    '复盘人员以事件编号和时间区间检索各类记录，选取关键录音录像、视频片段和救援轨迹，查看任务完成率、响应时间节点和问题反馈，形成事件情况汇总报告。根据已有合同和数据可用性实现汇总和导出；“自动生成事故责任结论”或“AI生成完整评估”不作为默认能力。'
  ],
  card: {
    roles: '园区应急办、值班员、复盘评估人员、应急指挥人员、企业资料补充人员。',
    trigger: '应急终止、处置结束，或上级要求开展事件复盘与总结。',
    goal: '数据可追溯、时间轴清晰、音视频与任务关联，支持规范汇总归档。',
    objects: '事件编号、时间轴、通话录音、视频录像、定位轨迹、任务与反馈、报告。'
  },
  flow: [
    { no: '01', action: '选择已结束事件及时间范围，筛选关联数据', simulated: true },
    { no: '02', action: '查询事件状态、任务、通知、响应时间节点', simulated: true },
    { no: '03', action: '按权限检索电话/集群录音和会议录像', api: 'records/query' },
    { no: '04', action: '按时间调取监控、单兵视频、人员与车辆轨迹', simulated: true },
    { no: '05', action: '选择重要节点及证据资料，编辑标签和说明', simulated: true },
    { no: '06', action: '汇总任务完成情况、资源调配与响应耗时', simulated: true },
    { no: '07', action: '核对并生成综合情况报告，导出、归档', simulated: true }
  ],
  roles: [
    { step: '01', role: '复盘人员', action: '按事件与时间筛选数据', system: '返回事件、通信、任务、响应相关记录' },
    { step: '02', role: '复盘人员', action: '回放接报电话、集群录音、会议视频', system: '按实际已采集的音视频源查询和下载' },
    { step: '03', role: '复盘人员', action: '检索关键监控及移动视频', system: '按授权进行历史回放、截取或入库' },
    { step: '04', role: '复盘人员', action: '回放人员车辆轨迹、核查任务节点', system: '形成可追溯的事件处置时间轴' },
    { step: '05', role: '管理人员', action: '核对、编辑、导出情况汇总报告', system: '报告存档并关联事件' }
  ],
  deps: [
    { capability: '事件选择/响应跟踪', usage: '筛选、排序、导出事件与节点数据', owner: '原敏捷应急系统集成', tag: '需对接' },
    { capability: '音视频存储', usage: '点呼/组呼/视频点呼/移动视频录音录像', owner: '实际存储范围受接入资源和保存周期影响', tag: '已有依据' },
    { capability: '视频搜索/入库', usage: '历史检索、回放、标签、视频转码', owner: '视频平台和原敏捷应急数据便捷处理', tag: '需对接' },
    { capability: 'GIS位置/轨迹', usage: '人员、车辆历史定位与轨迹回放', owner: '车辆定位/手持终端历史数据须提供', tag: '需对接' },
    { capability: '情况汇总管理', usage: '报表、可视化和导出打印', owner: '揭阳原敏捷应急系统集成内容', tag: '需对接' },
    { capability: '移动反馈', usage: '文字、图片、视频、位置及进度资料', owner: '现场人员通过授权移动端上传', tag: '已有依据' }
  ],
  boundary: {
    basis: '揭阳融合通信音视频存储模块列有点呼、组呼录音及手持终端/摄像头视频回传录像存储、查询、下载；原敏捷应急集成清单列有情况汇总、事件数据选择、视频检索及入库、移动端图文视频位置上传。',
    pending: [
      '有录音录像不等于所有第三方电话/视频自动汇入同一档案；需要明确录音点位、录像采集对象、保留期限和事件关联规则',
      '模板化报告和数据可视化可设计，语音转写、AI纪要、自动责任研判不应直接作为合同内功能'
    ]
  },
  acceptance: [
    '根据事件编号查询接报、通知、任务和响应记录。',
    '检索并回放已接入的电话/集群录音、会议及监控视频。',
    '回放车辆或人员轨迹，关联关键处置时间。',
    '生成可人工核对的情况报告并完成导出归档。'
  ]
}

export const scene08: ScenarioMeta = {
  no: '08', path: '/scene/08-drill', title: '三维数字化协同演练',
  stage: '事后·总结提升', value: '在已有预案与三维场景上验证多部门通信和协同执行',
  story: [
    '园区准备开展一次危化品储罐泄漏专项演练。演练组织人员选择事故类型、演练区域、结构化应急预案和参演单位，设置模拟事故位置与若干任务，加载园区三维模型及应急资源分布。',
    '演练开始后，指挥中心模拟接报、启动响应、召开视频会商，联系消防队伍、向现场参演人员分发任务。参演企业通过PC或手机终端反馈现场文字、图片、视频和位置；结束后回放任务和通信记录，评估响应速度和协作问题。融合通信提供演练中的“联络与会商”，演练计划、预案和模拟模型由已有敏捷应急或专项模型承担。'
  ],
  card: {
    roles: '园区演练组织人员、指挥员、企业参演人员、救援队伍、演练评估人员。',
    trigger: '年度演练计划、专项演练要求、真实事件复盘后的针对性训练。',
    goal: '模拟跨部门协同过程，验证预案执行、通信联络和任务反馈链条。',
    objects: '演练计划、数字预案、三维场景、参演单位、通信组、演练任务、记录与评价。'
  },
  flow: [
    { no: '01', action: '创建演练计划并设定事故类型、地点及参演单位', simulated: true },
    { no: '02', action: '加载现有三维模型、结构化预案和资源分布', simulated: true },
    { no: '03', action: '生成演练任务，确认参演人员和通信终端', simulated: true },
    { no: '04', action: '模拟事故接报，启动演练响应和通知', api: 'sosLinkage/add' },
    { no: '05', action: '开展多方会商、电话/PDT调度与视频共享', api: 'terminalOperator' },
    { no: '06', action: '现场参演人员接收任务并上传文字/图像/视频/位置', api: 'app/eventReport' },
    { no: '07', action: '记录执行节点和通信资料，结束后生成演练记录与评价', simulated: true }
  ],
  roles: [
    { step: '01', role: '演练组织员', action: '配置演练场景、预案、参演单位', system: '生成演练计划与任务清单' },
    { step: '02', role: '指挥人员', action: '模拟响应启动、通知和会商', system: '通过融合通信连接硬终端、软终端和电话' },
    { step: '03', role: '调度员', action: '对救援队伍组呼、视频点播和任务分发', system: '复用PDT/语音/视频/GIS与移动响应能力' },
    { step: '04', role: '现场参演人员', action: '接收任务并反馈位置、图文和视频', system: '保留演练执行节点和现场材料' },
    { step: '05', role: '评估员', action: '查看时间轴、任务与通信记录', system: '输出演练记录和人工核定的评价结果' }
  ],
  deps: [
    { capability: '演练计划与结构化预案', usage: '场景、预案、任务、参演人员管理', owner: '原敏捷应急系统既有/拟集成能力', tag: '需对接' },
    { capability: '三维模型与事故仿真', usage: '园区模型、事故区域和模拟结果', owner: '既有GIS及模型系统，不由通信平台独立生成', tag: '需对接' },
    { capability: '视频会议/移动适配', usage: '多方视频会商、屏幕共享、白板', owner: '融合通信会议能力，需依照终端许可部署', tag: '已有依据' },
    { capability: 'PDT/电话/短信', usage: '现场语音指挥与通知', owner: '融合通信音视频/数据能力', tag: '已有依据' },
    { capability: '移动事件与位置反馈', usage: '参演人员领取任务、上传图片/视频/位置', owner: '原敏捷应急移动数据流', tag: '需对接' },
    { capability: '音视频与情况汇总', usage: '回放演练过程，形成记录及评价', owner: '实际存储范围和评估规则需确认', tag: '需对接' }
  ],
  boundary: {
    basis: '《融合通讯需求.docx》对原已建敏捷应急系统的演练能力进行了介绍，提及预案演示、协同演练、推演复盘和VR/AR/MR技术；本期合同明确的重点仍是通信接入、敏捷应急数据集成及移动响应，并未据此单独确认新增完整三维数字演练系统。',
    pending: [
      'VR/AR/MR、事故扩散模拟、自动评分、上级平台级联等需先核对原系统现有功能和本期合同',
      '若仅有融合通信设备与接口，应将本场景定义为“对既有数字演练的通信支撑”，不得承诺从零开发演练平台'
    ]
  },
  acceptance: [
    '选用已有演练计划与预案，完成一次模拟事件响应启动。',
    '验证企业、指挥中心、现场参演人员的视频、电话或集群通信。',
    '完成演练任务派发、确认、图文位置反馈。',
    '查看演练时间轴及相关记录，形成演练总结文件。'
  ]
}

export const SCENES: ScenarioMeta[] = [scene01, scene02, scene03, scene04, scene05, scene06, scene07, scene08]

export const SCENE_BY_PATH: Record<string, ScenarioMeta> = Object.fromEntries(
  SCENES.map((s) => [s.path, s])
)
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/scenes/meta.ts
git commit -m "feat(screen): add scenario metadata for scenes 05-08"
```

---

### Task 4: Mock 数据与分发、共享状态

**Files:**
- Modify: `src/api/mock/data.ts`（追加）
- Modify: `src/api/mock/handler.ts`（追加 case）
- Modify: `src/stores/comm.ts`（追加状态）

**Interfaces:**
- Consumes: Task 1 的领域类型；现有 `mockTerminals`。
- Produces: `mockEnterprises`/`mockPatchTasks`/`mockDrillPlans`；`useCommStore` 新增 `sceneRoleLog`/`addSceneRoleLog`/`currentEventId`/`setCurrentEventId`。

- [ ] **Step 1: 在 `src/api/mock/data.ts` 顶部加 import、末尾追加数据集**

在文件顶部（现有 import 之后）加：`import type { Enterprise, PatchTask, DrillPlan } from '@/types/scenario'`，然后在文件末尾追加：

```ts
export const mockEnterprises: Enterprise[] = [
  { id: 'E01', name: '广石化', hasTerminal: true, contact: '陈主任', phone: '8001', lng: 116.5412, lat: 23.1023, status: '未通知' },
  { id: 'E02', name: '吉化', hasTerminal: true, contact: '李工', phone: '8002', lng: 116.5433, lat: 23.1045, status: '未通知' },
  { id: 'E03', name: '盛元达', hasTerminal: true, contact: '王经理', phone: '8003', lng: 116.5456, lat: 23.1067, status: '未通知' },
  { id: 'E04', name: '粤电', hasTerminal: true, contact: '赵值长', phone: '8004', lng: 116.5478, lat: 23.1089, status: '未通知' },
  { id: 'E05', name: '停车场', hasTerminal: true, contact: '刘班长', phone: '8005', lng: 116.5490, lat: 23.1110, status: '未通知' },
  { id: 'E06', name: '广州港', hasTerminal: true, contact: '周调度', phone: '8006', lng: 116.5512, lat: 23.1132, status: '未通知' },
  { id: 'E07', name: '伊斯科', hasTerminal: false, contact: '孙安监', phone: '8007', lng: 116.5534, lat: 23.1154, status: '未通知' },
  { id: 'E08', name: '东粤化学', hasTerminal: false, contact: '吴工', phone: '8008', lng: 116.5556, lat: 23.1176, status: '未通知' },
  { id: 'E09', name: '东粤环保', hasTerminal: false, contact: '郑主管', phone: '8009', lng: 116.5578, lat: 23.1198, status: '未通知' },
  { id: 'E10', name: '凯美特', hasTerminal: false, contact: '冯经理', phone: '8010', lng: 116.5600, lat: 23.1210, status: '未通知' },
  { id: 'E11', name: '东江国业', hasTerminal: false, contact: '何工', phone: '8011', lng: 116.5622, lat: 23.1232, status: '未通知' },
  { id: 'E12', name: '广业国业', hasTerminal: false, contact: '黄主任', phone: '8012', lng: 116.5644, lat: 23.1254, status: '未通知' },
  { id: 'E13', name: '裕美公司', hasTerminal: false, contact: '林安全员', phone: '8013', lng: 116.5666, lat: 23.1276, status: '未通知' }
]

export const mockPatchTasks: PatchTask[] = [
  { id: 'P001', type: '一级动火', location: '生产二部 罐区东侧', owner: '东粤化学·张班长', monitor: '9101 危化处置组长', status: '待核查', evidence: false },
  { id: 'P002', type: '二级高处', location: '装卸区 3 号平台', owner: '凯美特·李工', monitor: '9102 巡查员', status: '待核查', evidence: false }
]

export const mockDrillPlans: DrillPlan[] = [
  { id: 'D001', name: '危化品储罐泄漏专项演练', type: '危化品泄漏', location: '罐区 T-203', units: ['广石化', '吉化', '消防救援队'], status: '未开始' },
  { id: 'D002', name: '可燃气体报警桌面推演', type: '可燃气报警', location: '生产一部', units: ['东粤化学', '园区应急办'], status: '未开始' }
]
```

- [ ] **Step 2: 扩展 `src/stores/comm.ts`**

把 `:4` 的 import 与 `:7-27` 的 store 整体替换为：

```ts
import type { CommEvent, SmsTask } from '@/types'
import type { RoleAction } from '@/types/scenario'

export const useCommStore = defineStore('comm', () => {
  const events = ref<CommEvent[]>([])
  const smsTasks = ref<SmsTask[]>([])
  const activeCall = ref<string>('')
  const sceneRoleLog = ref<RoleAction[]>([])
  const currentEventId = ref<string>('')

  onEvent((e) => {
    events.value.unshift(e)
    if (events.value.length > 120) events.value.pop()
  })

  function addSmsTask(task: SmsTask) { smsTasks.value.unshift(task) }
  function updateSmsTask(id: string, patch: Partial<SmsTask>) {
    const t = smsTasks.value.find((x) => x.id === id)
    if (t) Object.assign(t, patch)
  }
  function addSceneRoleLog(entry: RoleAction) {
    sceneRoleLog.value.unshift(entry)
    if (sceneRoleLog.value.length > 60) sceneRoleLog.value.pop()
  }
  function setCurrentEventId(id: string) { currentEventId.value = id }

  return {
    events, smsTasks, activeCall, sceneRoleLog, currentEventId,
    addSmsTask, updateSmsTask, addSceneRoleLog, setCurrentEventId
  }
})
```

- [ ] **Step 3: 在 `src/api/mock/handler.ts` 补足新 case**

在 `:179-181` 的 `eventSubscription` case 之后、`cameras` case 之前插入：

```ts
    case EP.camerasRegions:
      return ok(undefined, {
        data: [
          { indexCode: 'REG-KQ', name: '罐区' },
          { indexCode: 'REG-XQ', name: '装卸区' },
          { indexCode: 'REG-GJ', name: '石化大道卡口' }
        ]
      })

    case EP.taskAdd:
    case EP.taskUpdate:
      emitEvent({ cmd: 'broadcastTaskStatus', text: `广播任务已${path === EP.taskAdd ? '新增' : '更新'}`, level: 'info', raw: p })
      return ok(uuid())

    case EP.taskRemove:
      emitEvent({ cmd: 'broadcastTaskStatus', text: '广播任务已删除', level: 'info', raw: p })
      return ok()
```

- [ ] **Step 4: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 5: 提交**

```bash
git add src/api/mock/data.ts src/api/mock/handler.ts src/stores/comm.ts
git commit -m "feat(screen): add scenario mock data and shared store"
```

---

### Task 5: ScenarioShell 通用壳

**Files:**
- Create: `src/components/scenario/ScenarioShell.vue`

**Interfaces:**
- Consumes: `ScenarioMeta`、`RoleAction`；`useCommStore.sceneRoleLog`。
- Produces: `ScenarioShell` 组件，props `{ meta: ScenarioMeta }`，slot `workspace`。

- [ ] **Step 1: 创建 `src/components/scenario/ScenarioShell.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCommStore } from '@/stores/comm'
import type { ScenarioMeta } from '@/types/scenario'

const props = defineProps<{ meta: ScenarioMeta }>()
const store = useCommStore()
const active = ref('story')

const stageTag: Record<ScenarioMeta['stage'], string> = {
  '平时·日常管理': 'primary',
  '战时·应急指挥': 'danger',
  '事后·总结提升': 'success'
}

const checkedAcceptance = ref<number[]>([])
const acceptanceProgress = computed(() =>
  `${checkedAcceptance.value.length}/${props.meta.acceptance.length}`
)

const roleRows = computed(() => {
  const base = props.meta.roles.map((r) => ({ ...r, live: false }))
  const live = store.sceneRoleLog.map((r) => ({ ...r, live: true }))
  return [...live, ...base]
})

function toggleAcceptance(i: number) {
  const idx = checkedAcceptance.value.indexOf(i)
  if (idx >= 0) checkedAcceptance.value.splice(idx, 1)
  else checkedAcceptance.value.push(i)
}
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

      <el-tab-pane label="合同边界" name="boundary">
        <div class="panel">
          <h3 class="panel-title">合同及方案依据</h3>
          <p class="story-p">{{ meta.boundary.basis }}</p>
          <h3 class="panel-title section-gap">待确认 / 不直接承诺</h3>
          <el-alert v-for="(item, i) in meta.boundary.pending" :key="i" type="warning" :closable="false" :title="item" class="boundary-alert" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="验收建议" name="acceptance">
        <div class="panel">
          <div class="page-head">
            <h3 class="panel-title">场景验收建议</h3>
            <el-tag type="primary" effect="dark">完成度 {{ acceptanceProgress }}</el-tag>
          </div>
          <el-checkbox
            v-for="(item, i) in meta.acceptance"
            :key="i"
            :model-value="checkedAcceptance.includes(i)"
            class="accept-item"
            @change="toggleAcceptance(i)"
          >{{ item }}</el-checkbox>
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
.boundary-alert { margin-bottom: var(--space-sm); }
.accept-item { display: block; margin: var(--space-sm) 0; height: auto; color: var(--color-text); }
</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/components/scenario/ScenarioShell.vue
git commit -m "feat(screen): add reusable scenario shell with seven tabs"
```

---

### Task 6: 路由与导航（4 组 13 项）

**Files:**
- Modify: `src/router/index.ts`（整体替换）
- Modify: `src/App.vue`（navItems 与菜单模板）

**Interfaces:**
- Consumes: Task 2/3 的 `SCENES`；现有 5 页路由。
- Produces: 13 条路由；`App.vue` 分组菜单；`currentTitle` 从 `SCENE_BY_PATH` 取场景标题。

- [ ] **Step 1: 替换 `src/router/index.ts`**

```ts
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '态势总览' } },
  { path: '/phone', name: 'phone', component: () => import('@/views/Phone.vue'), meta: { title: '电话调度' } },
  { path: '/broadcast', name: 'broadcast', component: () => import('@/views/Broadcast.vue'), meta: { title: '扩音广播' } },
  { path: '/publish', name: 'publish', component: () => import('@/views/InfoPublish.vue'), meta: { title: '信息发布' } },
  { path: '/emergency', name: 'emergency', component: () => import('@/views/Emergency.vue'), meta: { title: '应急联动与检索' } },
  { path: '/scene/01-meeting', name: 'scene01', component: () => import('@/views/scenarios/Scene01Meeting.vue'), meta: { title: '园区多企业远程会议' } },
  { path: '/scene/02-patrol', name: 'scene02', component: () => import('@/views/scenarios/Scene02Patrol.vue'), meta: { title: '移动巡检与特殊作业联防' } },
  { path: '/scene/03-report', name: 'scene03', component: () => import('@/views/scenarios/Scene03Report.vue'), meta: { title: '多渠道接报与应急响应启动' } },
  { path: '/scene/04-consult', name: 'scene04', component: () => import('@/views/scenarios/Scene04Consult.vue'), meta: { title: '跨网异构多方视频会商' } },
  { path: '/scene/05-gis', name: 'scene05', component: () => import('@/views/scenarios/Scene05Gis.vue'), meta: { title: '二三维GIS融合调度' } },
  { path: '/scene/06-notify', name: 'scene06', component: () => import('@/views/scenarios/Scene06Notify.vue'), meta: { title: '周边企业协同通知与避险' } },
  { path: '/scene/07-review', name: 'scene07', component: () => import('@/views/scenarios/Scene07Review.vue'), meta: { title: '应急处置全链路复盘' } },
  { path: '/scene/08-drill', name: 'scene08', component: () => import('@/views/scenarios/Scene08Drill.vue'), meta: { title: '三维数字化协同演练' } }
]

export default createRouter({ history: createWebHashHistory(), routes })
```

- [ ] **Step 2: 替换 `src/App.vue` 的 script 中图标导入与 navItems/currentTitle**

把 `:4-7` 的图标导入替换为：

```ts
import {
  DataBoard, Phone, VideoPlay, Promotion, Warning, Connection,
  Bell, ArrowDown, Calendar, Location, WarningFilled, VideoCamera,
  Map, Message, Document, Monitor
} from '@element-plus/icons-vue'
import { SCENE_BY_PATH } from '@/scenes/meta'
```

把 `:16-26` 的 navItems/currentTitle 替换为：

```ts
const groups = [
  {
    title: '基础能力',
    items: [
      { path: '/dashboard', title: '态势总览', icon: DataBoard },
      { path: '/phone', title: '电话调度', icon: Phone },
      { path: '/broadcast', title: '扩音广播', icon: VideoPlay },
      { path: '/publish', title: '信息发布', icon: Promotion },
      { path: '/emergency', title: '应急联动与检索', icon: Warning }
    ]
  },
  {
    title: '平时·日常管理',
    items: [
      { path: '/scene/01-meeting', title: '园区多企业远程会议', icon: Calendar },
      { path: '/scene/02-patrol', title: '移动巡检与特殊作业联防', icon: Location }
    ]
  },
  {
    title: '战时·应急指挥',
    items: [
      { path: '/scene/03-report', title: '多渠道接报与应急响应启动', icon: WarningFilled },
      { path: '/scene/04-consult', title: '跨网异构多方视频会商', icon: VideoCamera },
      { path: '/scene/05-gis', title: '二三维GIS融合调度', icon: Map },
      { path: '/scene/06-notify', title: '周边企业协同通知与避险', icon: Message }
    ]
  },
  {
    title: '事后·总结提升',
    items: [
      { path: '/scene/07-review', title: '应急处置全链路复盘', icon: Document },
      { path: '/scene/08-drill', title: '三维数字化协同演练', icon: Monitor }
    ]
  }
]

const currentTitle = computed(() =>
  route.meta.title as string ?? SCENE_BY_PATH[route.path]?.title ?? '态势总览'
)
```

- [ ] **Step 3: 替换 `src/App.vue` 模板中 `<el-menu>` 块（:40-45）**

```html
      <el-menu :default-active="route.path" router class="nav">
        <template v-for="group in groups" :key="group.title">
          <div class="nav-group-title">{{ group.title }}</div>
          <el-menu-item v-for="n in group.items" :key="n.path" :index="n.path">
            <el-icon><component :is="n.icon" /></el-icon>
            <span>{{ n.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
```

- [ ] **Step 4: 在 `src/App.vue` scoped style 追加分组标题样式**

```css
.nav-group-title { padding: 10px 20px 4px; font-size: var(--font-size-caption); color: var(--color-text-muted); letter-spacing: 1px; }
```

- [ ] **Step 5: 创建 8 个场景 View 占位文件（供路由导入，后续 Task 填充）**

对 `scene01`~`scene08` 各创建同名文件，内容为最小可编译占位：

```vue
<script setup lang="ts">
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import { SCENE_BY_PATH } from '@/scenes/meta'
const meta = SCENE_BY_PATH['/scene/01-meeting']
</script>

<template>
  <ScenarioShell :meta="meta" />
</template>
```

（其余 7 文件把路径换成对应的 `/scene/02-patrol` … `/scene/08-drill`。）

- [ ] **Step 6: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS（13 路由可解析、8 占位页可加载）。

- [ ] **Step 7: 提交**

```bash
git add src/router/index.ts src/App.vue src/views/scenarios
git commit -m "feat(screen): add scenario routes and grouped navigation"
```

---

### Task 7: 场景 01 多企业会议交互区

**Files:**
- Modify: `src/views/scenarios/Scene01Meeting.vue`（整体替换）

**Interfaces:**
- Consumes: `fcPost('__scene__/enterprises')`、`EP.terminalOperator`、`useCommStore.addSceneRoleLog`。
- Produces: 01 场景可交互工作区。

- [ ] **Step 1: 写入完整 `Scene01Meeting.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP, PHONE_ACTION } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { Enterprise } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/01-meeting']
const store = useCommStore()
const enterprises = ref<Enterprise[]>([])
const selected = ref<string[]>([])
const access = ref<Record<string, string>>({})
const meetingStarted = ref(false)
const controls = [
  { action: 11, label: '主席' }, { action: 12, label: '静音' },
  { action: 15, label: '全体发言' }, { action: 16, label: '全体禁言' }
]

const gateways = computed(() => [
  { label: '硬终端 SIP/H.323', count: enterprises.value.filter((e) => e.hasTerminal).length, tag: '已有依据' },
  { label: 'PC/手机软终端 WebRTC', count: enterprises.value.filter((e) => !e.hasTerminal).length, tag: '需对接' },
  { label: '电话语音 PSTN', count: enterprises.value.length, tag: '已有依据' }
])

onMounted(async () => {
  const res = await fcPost('__scene__/enterprises')
  enterprises.value = (res.rows as Enterprise[]) ?? []
})

function accessOf(e: Enterprise): string {
  return access.value[e.id] ?? (e.hasTerminal ? '硬终端' : '软终端')
}

function onSelectionChange(rows: Enterprise[]) {
  selected.value = rows.map((r) => r.id)
}

function setAccess(id: string, v: string) {
  access.value[id] = v
}

async function startMeeting() {
  if (!selected.value.length) { ElMessage.warning('请先选择参会企业'); return }
  const dest = selected.value.map((id) => enterprises.value.find((e) => e.id === id)?.phone ?? id)
  await fcPost(EP.terminalOperator, { action: 10, sourCaller: '9000', destCalled: dest, conferenceName: '园区安全生产会议' })
  meetingStarted.value = true
  store.addSceneRoleLog({ step: '04', role: '会议管理员', action: `发起会议呼叫 ${dest.length} 方`, system: '按 SIP/H.323 兼容协议连接会场（MOCK 状态）' })
  ElMessage.success('会议已发起，参会方逐步接入')
}

async function control(action: number, label: string) {
  await fcPost(EP.terminalOperator, { action, sourCaller: '9000', destCalled: selected.value })
  store.addSceneRoleLog({ step: '05', role: '主持人与会控员', action: `执行${label}`, system: `terminalOperator action=${action} 已下发` })
  ElMessage.success(`${PHONE_ACTION[action as keyof typeof PHONE_ACTION]} 已下发`)
}

function saveMeeting() {
  store.addSceneRoleLog({ step: '06', role: '会议管理员', action: '结束会议并保存资料', system: '会议记录与会控日志已归档（模拟）' })
  meetingStarted.value = false
  ElMessage.success('会议记录已保存')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">参会企业（13 家）</h3>
        <div class="endpoint-note section-gap">6 家有硬终端 · 7 家无终端；接入方式可手工调整，实际入会受许可与跨网条件约束【需对接】。</div>
        <el-table :data="enterprises" size="small" border @selection-change="onSelectionChange">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="name" label="企业" width="120" />
          <el-table-column label="终端现状" width="110">
            <template #default="{ row }">
              <el-tag :type="row.hasTerminal ? 'success' : 'warning'" size="small" effect="plain">{{ row.hasTerminal ? '有硬终端' : '无终端' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contact" label="联系人" width="100" />
          <el-table-column label="接入方式">
            <template #default="{ row }">
              <el-select :model-value="accessOf(row)" size="small" @update:model-value="(v) => setAccess(row.id, String(v))">
                <el-option label="硬终端" value="硬终端" />
                <el-option label="软终端" value="软终端" />
                <el-option label="电话语音" value="电话语音" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
        <div class="section-gap" style="margin-top:var(--space-md)">
          <el-button type="primary" :loading="false" @click="startMeeting">发起会议（terminalOperator 10）</el-button>
          <el-tag v-if="meetingStarted" type="success" effect="dark" style="margin-left:var(--space-sm)">会议进行中</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">会控台（terminalOperator 11-16）</h3>
        <div class="endpoint-note section-gap">多画面合成、录制存储无 OpenAPI 接口【模拟】。</div>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <el-button v-for="c in controls" :key="c.action" :disabled="!meetingStarted" @click="control(c.action, c.label)">{{ c.label }}</el-button>
          <el-button type="danger" :disabled="!meetingStarted" @click="saveMeeting">结束并保存</el-button>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">会场接入方式分布</h3>
        <el-row :gutter="12">
          <el-col v-for="g in gateways" :key="g.label" :span="8">
            <div class="stat-card">
              <div class="stat-label">{{ g.label }}</div>
              <div class="stat-value">{{ g.count }}</div>
              <div class="stat-foot">{{ g.tag }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </template>
  </ScenarioShell>
</template>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene01Meeting.vue
git commit -m "feat(screen): implement scenario 01 meeting workspace"
```

---

### Task 8: 场景 02 巡检联防交互区

**Files:**
- Modify: `src/views/scenarios/Scene02Patrol.vue`（替换占位）

**Interfaces:**
- Consumes: `fcPost('__scene__/cameras')`、`fcPost('__scene__/patchTasks')`、`EP.previewUrl`/`terminalOperator`、`addSceneRoleLog`。
- Produces: 02 场景工作区：越界告警→轨迹→点播→点呼→作业票→整改闭环。

- [ ] **Step 1: 写入完整 `Scene02Patrol.vue`**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoCamera, Phone } from '@element-plus/icons-vue'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { PatchTask } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/02-patrol']
const store = useCommStore()
const cameras = ref<{ cameraId: string; name: string; status: number }[]>([])
const preview = ref('')
const tasks = ref<PatchTask[]>([])
const activeTask = ref('')
const evidenceUploaded = ref<Record<string, boolean>>({})

onMounted(async () => {
  const [camRes, taskRes] = await Promise.all([
    fcPost('__scene__/cameras'),
    fcPost('__scene__/patchTasks')
  ])
  cameras.value = (camRes.rows as typeof cameras.value) ?? []
  tasks.value = (taskRes.rows as PatchTask[]) ?? []
})

const trackPoints = [
  { t: '09:52', x: 12, y: 62 }, { t: '09:56', x: 30, y: 58 },
  { t: '10:00', x: 52, y: 44 }, { t: '10:03', x: 68, y: 30 }
]

async function pointCamera() {
  const res = await fcPost(EP.previewUrl, { camList: [cameras.value[0]?.cameraId ?? 'CAM-KQ-01'], protocol: 'hls' })
  preview.value = String((res.data as { url?: string })?.url ?? '')
  store.addSceneRoleLog({ step: '02', role: '园区值班员', action: '调取罐区监控点播', system: `取流地址：${preview.value || '（模拟）'}` })
  ElMessage.success('监控点播已发起')
}

async function callPatrol() {
  await fcPost(EP.terminalOperator, { action: 1, sourCaller: '9000', destCalled: ['9102'] })
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
            <el-select v-model="preview" placeholder="选择摄像头（接口取流）" style="width:100%">
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
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene02Patrol.vue
git commit -m "feat(screen): implement scenario 02 patrol workspace"
```

---

### Task 9: 场景 03 接报响应交互区

**Files:**
- Modify: `src/views/scenarios/Scene03Report.vue`（替换占位）

**Interfaces:**
- Consumes: `fcPost`、`EP.sosAdd`/`linkTaskSend`/`cameras`/`terminalOperator`、`PHONE_ACTION`、`uuid`、`addSceneRoleLog`。
- Produces: 03 场景工作区：接报→核实→定级→通知→响应看板→重呼。

- [ ] **Step 1: 写入完整 `Scene03Report.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP, LINK_RULE } from '@/api/endpoints'
import { uuid } from '@/api/sign'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'

const meta = SCENE_BY_PATH['/scene/03-report']
const store = useCommStore()
const eventId = ref(uuid())
const report = ref({ caller: '企业值班室 0755-8888xxxx', source: '固定电话', time: '14:30', location: '危废仓库', desc: '疑似泄漏、烟雾异常' })
const reported = ref(false)
const level = ref(3)
const notified = ref(false)
const cameras = ref<{ cameraId: string; name: string }[]>([])
const responders = ref([
  { name: '总指挥 9000', phone: '9000', state: '未通知' },
  { name: '应急局负责人 9101', phone: '9101', state: '未通知' },
  { name: '危化组长 9102', phone: '9102', state: '未通知' },
  { name: '消防队长 9201', phone: '9201', state: '未通知' }
])

const levelText = computed(() => ({ 1: 'Ⅰ级（一般）', 2: 'Ⅱ级（较大）', 3: 'Ⅲ级（重大）', 4: 'Ⅳ级（特别重大）' })[level.value] ?? 'Ⅲ级')
const stateColor = (s: string) => s === '已确认' ? 'success' : s === '已接通' ? 'primary' : s === '已送达' ? 'warning' : 'info'

async function acceptReport() {
  await fcPost(EP.sosAdd, {
    area: report.value.location,
    eventId: eventId.value,
    eventTime: '2026-11-18 14:30:00',
    eventType: 7,
    level: 3,
    eventSubTypeDesc: report.value.desc
  })
  reported.value = true
  store.setCurrentEventId(eventId.value)
  store.addSceneRoleLog({ step: '01', role: '园区值班员', action: `接听企业电话并记录 ${report.value.time}`, system: `事件编号 ${eventId.value.slice(0, 8)}，录音关联待核实` })
  ElMessage.success('接报信息已登记')
}

async function verifyVideo() {
  const res = await fcPost(EP.cameras, { page: 1 })
  cameras.value = (res.rows as typeof cameras.value) ?? []
  await fcPost(EP.previewUrl, { camList: [cameras.value[0]?.cameraId ?? 'CAM-KQ-01'], protocol: 'hls' })
  store.addSceneRoleLog({ step: '02', role: '园区值班员', action: '调阅危废仓库监控与高空AR', system: '形成事件初判依据（模拟画面）' })
  ElMessage.success('视频核实完成')
}

function confirmLevel() {
  store.addSceneRoleLog({ step: '03', role: '指挥人员', action: `选择响应级别 ${levelText.value}`, system: '关联组织架构、岗位职责及通知清单（模拟）' })
  ElMessage.success(`响应级别 ${levelText.value} 已确认`)
}

async function notifyAll() {
  const mobiles = responders.value.map((r) => r.phone).join(',')
  await fcPost(EP.linkTaskSend, { mobile: mobiles, rule: 3, eventId: eventId.value, scontent: `危废仓库疑似泄漏，立即响应，位置 ${report.value.location}`, templateCode: 'EMERGENCY' })
  responders.value.forEach((r, i) => { r.state = i === 0 ? '已确认' : '已送达' })
  notified.value = true
  store.addSceneRoleLog({ step: '04', role: '系统/值班员', action: `按名单通知 ${responders.value.length} 人（短信+语音）`, system: `linkTask/send rule=${LINK_RULE[3]}，事件 ${eventId.value.slice(0, 8)}` })
  ElMessage.success('通知已下发，送达与确认分别记录')
}

async function recallUnconfirmed() {
  const pending = responders.value.filter((r) => r.state === '已送达')
  if (!pending.length) { ElMessage.info('无未确认人员'); return }
  await fcPost(EP.linkTaskSend, { mobile: pending.map((r) => r.phone).join(','), rule: 7, eventId: eventId.value, vcontent: '请立即确认响应' })
  pending.forEach((r) => { r.state = '已接通' })
  store.addSceneRoleLog({ step: '05', role: '值班员', action: `对 ${pending.length} 名未确认人员电话重呼`, system: '补呼及人工确认记录（模拟接通）' })
  ElMessage.success('电话重呼已下发')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">接报登记 <el-tag v-if="reported" type="success" size="small" effect="dark">已登记</el-tag></h3>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="报警来源">{{ report.source }}</el-descriptions-item>
          <el-descriptions-item label="接报时间">{{ report.time }}</el-descriptions-item>
          <el-descriptions-item label="报警号码">{{ report.caller }}</el-descriptions-item>
          <el-descriptions-item label="事故位置">{{ report.location }}</el-descriptions-item>
          <el-descriptions-item label="初判描述" :span="2">{{ report.desc }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:var(--space-md)">
          <el-button type="primary" @click="acceptReport">接听并登记（sosLinkage/add）</el-button>
          <el-button @click="verifyVideo">调阅监控核实（cameras）</el-button>
          <el-tag v-if="reported" type="success" effect="plain" style="margin-left:var(--space-sm)">录音回放需 FTP 下载，非 HTTP【需对接】</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">响应级别与指挥体系</h3>
        <div class="endpoint-note section-gap">事件登记、指挥体系匹配由敏捷应急系统承载【需对接】。</div>
        <el-radio-group v-model="level">
          <el-radio-button :value="1">Ⅰ级</el-radio-button>
          <el-radio-button :value="2">Ⅱ级</el-radio-button>
          <el-radio-button :value="3">Ⅲ级</el-radio-button>
          <el-radio-button :value="4">Ⅳ级</el-radio-button>
        </el-radio-group>
        <el-button style="margin-left:var(--space-md)" :disabled="!reported" @click="confirmLevel">确认启动 {{ levelText }}</el-button>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">一键通知与响应看板</h3>
        <div style="margin-bottom:var(--space-md)">
          <el-button type="primary" :disabled="!reported" @click="notifyAll">下发通知（短信+语音 rule=3）</el-button>
          <el-button :disabled="!notified" @click="recallUnconfirmed">未确认人员电话重呼（rule=7）</el-button>
        </div>
        <el-table :data="responders" size="small" border>
          <el-table-column prop="name" label="责任人员" />
          <el-table-column prop="phone" label="号码" width="100" />
          <el-table-column label="响应状态" width="120">
            <template #default="{ row }">
              <el-tag :type="stateColor(row.state)" size="small" effect="plain">{{ row.state }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="endpoint-note section-gap">短信送达、电话接通、人员确认、任务执行、任务完成为五类不同状态，分别记录（本页演示前三类的模拟流转）。</div>
      </div>
    </template>
  </ScenarioShell>
</template>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene03Report.vue
git commit -m "feat(screen): implement scenario 03 reporting workspace"
```

---

### Task 10: 场景 04 视频会商交互区

**Files:**
- Modify: `src/views/scenarios/Scene04Consult.vue`（替换占位）

**Interfaces:**
- Consumes: `fcPost('__scene__/enterprises')`、`EP.terminalOperator`/`cameras`/`previewUrl`、`addSceneRoleLog`。
- Produces: 04 场景工作区：参会对象→多画面→视频入会→会控→纪要。

- [ ] **Step 1: 写入完整 `Scene04Consult.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
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
  const res = await fcPost('__scene__/enterprises')
  enterprises.value = (res.rows as Enterprise[]) ?? []
})

async function startConsult() {
  if (!participants.value.length) { ElMessage.warning('请先选择参会方'); return }
  await fcPost(EP.terminalOperator, { action: 10, sourCaller: '9000', destCalled: participants.value.map((p) => p.match(/\d{4}$/)?.[0] ?? p), conferenceName: '泄漏事件应急会商' })
  started.value = true
  tiles.value = participants.value.slice(0, 6)
  store.addSceneRoleLog({ step: '01', role: '会议操作员', action: `从事件发起会商，选择 ${participants.value.length} 方`, system: '生成与事件关联的会议与邀请清单' })
  ElMessage.success('会商已发起')
}

async function addVideo() {
  const res = await fcPost(EP.cameras, { page: 1 })
  const cam = ((res.rows as { cameraId: string; name: string }[]) ?? [])[0]
  await fcPost(EP.previewUrl, { camList: [cam?.cameraId ?? 'CAM-KQ-01'], protocol: 'hls' })
  if (cam && !tiles.value.includes(cam.name)) tiles.value.push(cam.name)
  store.addSceneRoleLog({ step: '04', role: '视频操作员', action: `将监控「${cam?.name ?? '罐区'}」加入会商`, system: '转码、视频分发、多画面（模拟画面）' })
  ElMessage.success('监控画面已入会')
}

async function control(action: number, label: string) {
  await fcPost(EP.terminalOperator, { action, sourCaller: '9000', destCalled: participants.value })
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
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene04Consult.vue
git commit -m "feat(screen): implement scenario 04 consultation workspace"
```

---

### Task 11: 场景 05 GIS 调度交互区

**Files:**
- Modify: `src/views/scenarios/Scene05Gis.vue`（替换占位）

**Interfaces:**
- Consumes: `fcPost`、`EP.queryTerminals`/`terminalOperator`/`cameras`/`previewUrl`、`useCommStore`。
- Produces: 05 场景工作区：模拟地图→标绘→圈选→分类调度→视频分发。

- [ ] **Step 1: 写入完整 `Scene05Gis.vue`**

```vue
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
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene05Gis.vue
git commit -m "feat(screen): implement scenario 05 gis dispatch workspace"
```

---

### Task 12: 场景 06 周边通知交互区

**Files:**
- Modify: `src/views/scenarios/Scene06Notify.vue`（替换占位）

**Interfaces:**
- Consumes: `fcPost('__scene__/enterprises')`、`EP.linkTaskSend`/`appEventReport`、`addSceneRoleLog`。
- Produces: 06 场景工作区：影响范围→空间筛选→人工确认→通知→反馈状态机→催办。

- [ ] **Step 1: 写入完整 `Scene06Notify.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { Enterprise } from '@/types/scenario'

const meta = SCENE_BY_PATH['/scene/06-notify']
const store = useCommStore()
const enterprises = ref<Enterprise[]>([])
const selected = ref<string[]>([])
const radius = ref(300)
const incident = { lng: 116.55, lat: 23.11 }
const sent = ref(false)

const inRange = computed(() => enterprises.value.filter((e) => {
  const dx = (e.lng - incident.lng) * 95000
  const dy = (e.lat - incident.lat) * 111000
  return Math.sqrt(dx * dx + dy * dy) <= radius.value * 10
}))

const stateColor = (s: Enterprise['status']) =>
  s === '措施落实' ? 'success' : s === '已确认' ? 'primary' : s === '已送达' ? 'warning' : 'info'

onMounted(async () => {
  const res = await fcPost('__scene__/enterprises')
  enterprises.value = (res.rows as Enterprise[]) ?? []
})

function selectAll() {
  selected.value = inRange.value.map((e) => e.id)
}

function onEnterpriseSelection(rows: Enterprise[]) {
  selected.value = rows.map((r) => r.id)
}

async function notify() {
  if (!selected.value.length) { ElMessage.warning('请人工确认通知对象'); return }
  const list = enterprises.value.filter((e) => selected.value.includes(e.id))
  await fcPost(EP.linkTaskSend, {
    mobile: list.map((e) => e.phone).join(','),
    rule: 3,
    eventId: store.currentEventId || 'SCENE06',
    scontent: '周边企业注意：危废仓库疑似泄漏，请就地避险并落实厂区管控'
  })
  list.forEach((e) => { e.status = '已送达' })
  sent.value = true
  store.addSceneRoleLog({ step: '03', role: '系统/值班员', action: `向 ${list.length} 家企业发送短信+语音通知`, system: '保存发送与呼叫状态（送达≠确认）' })
  ElMessage.success('通知已下发')
}

function simulateFeedback() {
  const list = enterprises.value.filter((e) => selected.value.includes(e.id) && e.status === '已送达')
  if (!list.length) { ElMessage.info('无待反馈企业'); return }
  const first = list[0]
  first.status = '已确认'
  fcPost(EP.appEventReport, {
    cmd: 'app', action: 'message_post', report_account: first.phone,
    message_data: { message_content: `【${first.name}】人员已避险，厂区管控中` }
  })
  store.addSceneRoleLog({ step: '04', role: `${first.name}负责人`, action: '移动端确认接收并反馈防护措施', system: '形成移动事件反馈和责任记录（模拟）' })
  ElMessage.success(`${first.name} 已反馈`)
}

async function remind() {
  const pending = enterprises.value.filter((e) => selected.value.includes(e.id) && e.status !== '已确认' && e.status !== '措施落实')
  if (!pending.length) { ElMessage.info('无未确认企业'); return }
  await fcPost(EP.linkTaskSend, {
    mobile: pending.map((e) => e.phone).join(','), rule: 7,
    eventId: store.currentEventId || 'SCENE06', vcontent: '请立即确认响应措施'
  })
  store.addSceneRoleLog({ step: '05', role: '值班员', action: `催办 ${pending.length} 家未确认企业`, system: '保存催办及最终响应结果' })
  ElMessage.success('催办电话已下发')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">影响范围与周边企业</h3>
        <div class="endpoint-note section-gap">事故扩散模型来自外部系统，空间筛选为距离估算模拟；短信送达不等于已读或已采取措施【需对接】。</div>
        <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap">
          <span class="mini muted">影响半径</span>
          <el-slider v-model="radius" :min="100" :max="1000" :step="100" style="width:200px" />
          <el-tag size="small" effect="plain">{{ radius * 10 }} m（示例范围）</el-tag>
          <el-button size="small" @click="selectAll">全选范围内企业</el-button>
        </div>
        <el-table :data="inRange" size="small" border style="margin-top:var(--space-md)" @selection-change="onEnterpriseSelection">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="name" label="企业" width="110" />
          <el-table-column prop="contact" label="联系人" width="100" />
          <el-table-column prop="phone" label="号码" width="80" />
          <el-table-column label="响应状态" width="110">
            <template #default="{ row }"><el-tag :type="stateColor(row.status)" size="small" effect="plain">{{ row.status }}</el-tag></template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">通知下发与响应追踪</h3>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <el-button type="primary" @click="notify">下发通知（短信+语音 rule=3）</el-button>
          <el-button :disabled="!sent" @click="simulateFeedback">模拟企业反馈</el-button>
          <el-button :disabled="!sent" @click="remind">催办未确认企业（rule=7）</el-button>
        </div>
        <div class="endpoint-note section-gap">送达 / 接通 / 人工确认 / 措施反馈为不同状态，分别记录；企业确认与超时催办规则需业务定义【需对接】。</div>
        <el-row :gutter="12">
          <el-col :span="6" v-for="s in (['未通知','已送达','已确认','措施落实'] as const)" :key="s">
            <div class="stat-card">
              <div class="stat-label">{{ s }}</div>
              <div class="stat-value">{{ enterprises.filter((e) => e.status === s).length }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </template>
  </ScenarioShell>
</template>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene06Notify.vue
git commit -m "feat(screen): implement scenario 06 notification workspace"
```

---

### Task 13: 场景 07 全链路复盘交互区

**Files:**
- Modify: `src/views/scenarios/Scene07Review.vue`（替换占位）

**Interfaces:**
- Consumes: `fcPost`、`EP.recordsQuery`/`appGetEventReport`、`mockCallRecords`、`addSceneRoleLog`。
- Produces: 07 场景工作区：筛选→时间轴→录音检索→轨迹→完成率图表→报告导出。

- [ ] **Step 1: 写入完整 `Scene07Review.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { fcPost } from '@/api/client'
import { EP } from '@/api/endpoints'
import { useCommStore } from '@/stores/comm'
import { SCENE_BY_PATH } from '@/scenes/meta'
import ScenarioShell from '@/components/scenario/ScenarioShell.vue'
import type { CallRecordItem } from '@/types'

const meta = SCENE_BY_PATH['/scene/07-review']
const store = useCommStore()
const eventId = ref('EVT-20261118-001')
const records = ref<CallRecordItem[]>([])
const reports = ref<{ uuid: string; report_account: string; report_time: string }[]>([])
const selectedRecords = ref<string[]>([])
const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const timeline = [
  { t: '14:30', text: '企业固话接报 · 危废仓库疑似泄漏' },
  { t: '14:35', text: '调阅仓库监控与高空AR，人工核实' },
  { t: '14:38', text: '登记事件，启动Ⅲ级响应' },
  { t: '14:40', text: '跨网异构多方会商' },
  { t: '15:00', text: 'GIS 融合调度，救援力量部署' },
  { t: '15:10', text: '周边企业协同通知与避险' },
  { t: '17:00', text: '响应结束，进入复盘' }
]

const completion = computed(() => ({
  done: timeline.length - 1,
  total: timeline.length,
  rate: Math.round(((timeline.length - 1) / timeline.length) * 100)
}))

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function onRecordSelection(rows: CallRecordItem[]) {
  selectedRecords.value = rows.map((r) => r.callerNum)
}

onMounted(async () => {
  const [recRes, repRes] = await Promise.all([
    fcPost(EP.recordsQuery, { callerNum: '', destination: '', startTime: '2026-11-18 14:00:00', endTime: '2026-11-18 18:00:00', page: 1 }),
    fcPost(EP.appGetEventReport, { account: 'admin', startTime: '2026-11-18', endTime: '2026-11-18', pageNo: 1, pageSize: 20 })
  ])
  records.value = (recRes.rows as CallRecordItem[]) ?? []
  reports.value = ((repRes.rows as { uuid: string; report_account: string; report_time: string }[]) ?? []).slice(0, 5)
  await new Promise<void>((r) => setTimeout(r, 0))
  if (chartEl.value) {
    chart = echarts.init(chartEl.value)
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {},
      legend: { textStyle: { color: cssVar('--color-text-muted') } },
      xAxis: { type: 'category', data: ['接报', '核实', '响应', '会商', '调度', '通知'], axisLabel: { color: cssVar('--color-text-muted') } },
      yAxis: { type: 'value', axisLabel: { color: cssVar('--color-text-muted') }, splitLine: { lineStyle: { color: cssVar('--color-border') } } },
      series: [{ name: '响应耗时(分钟)', type: 'bar', data: [2, 5, 3, 8, 12, 6], itemStyle: { color: cssVar('--color-accent') } }]
    })
  }
})

function exportReport() {
  const text = [
    `事件编号：${eventId.value}`,
    `处置时间轴：${timeline.map((t) => `${t.t} ${t.text}`).join('；')}`,
    `录音检索：${selectedRecords.value.length} 条已选`,
    `移动速报：${reports.value.length} 条`,
    `任务完成：${completion.value.done}/${completion.value.total}（${completion.value.rate}%）`,
    '说明：本报告为人工核对模板，自动生成责任结论/AI评估不作为默认能力。'
  ].join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `复盘报告-${eventId.value}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
  store.addSceneRoleLog({ step: '07', role: '管理人员', action: '核对并导出情况汇总报告', system: '报告存档并关联事件（模拟导出）' })
  ElMessage.success('报告已导出')
}
</script>

<template>
  <ScenarioShell :meta="meta">
    <template #workspace>
      <div class="panel">
        <h3 class="panel-title">事件与时间筛选</h3>
        <div style="display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap">
          <span class="mini muted">事件编号</span>
          <el-input v-model="eventId" size="small" style="width:220px" />
          <el-date-picker type="datetimerange" size="small" :model-value="[new Date('2026-11-18T14:00:00'), new Date('2026-11-18T18:00:00')]" readonly />
          <el-tag type="info" size="small" effect="plain">事件主数据来自敏捷应急【需对接】</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">处置时间轴</h3>
        <el-timeline>
          <el-timeline-item v-for="item in timeline" :key="item.t" :timestamp="item.t" placement="top" color="var(--color-accent)">
            <span class="mini">{{ item.text }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">录音 / 视频检索（records/query）</h3>
        <el-table :data="records" size="small" border @selection-change="onRecordSelection">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="callerNum" label="主叫" width="120" />
          <el-table-column prop="destination" label="被叫" width="120" />
          <el-table-column prop="startTime" label="开始时间" />
          <el-table-column prop="timeLen" label="时长(s)" width="90" />
          <el-table-column label="转写/摘要">
            <template #default="{ row }">{{ row.transcript ? '已转写' : '未转写' }} / {{ row.summary ? '有摘要' : '—' }}</template>
          </el-table-column>
        </el-table>
        <div class="endpoint-note section-gap" style="margin-top:var(--space-sm)">录音下载走 FTP（非 HTTP）；ASR 不返回结果字段、摘要无正文查询接口【需对接】。车辆/人员轨迹回放无接口【模拟】。</div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">响应耗时与任务完成</h3>
        <div ref="chartEl" style="height:220px" />
        <div class="section-gap">
          <el-tag type="success" effect="dark">任务完成 {{ completion.done }}/{{ completion.total }}（{{ completion.rate }}%）</el-tag>
          <el-tag type="info" effect="plain" style="margin-left:var(--space-sm)">移动速报 {{ reports.length }} 条</el-tag>
        </div>
      </div>

      <div class="panel section-gap">
        <h3 class="panel-title">报告导出</h3>
        <div class="endpoint-note section-gap">报告模板化导出可设计；自动生成事故责任结论或 AI 评估不作为默认能力【模拟】。</div>
        <el-button type="primary" @click="exportReport">生成并导出情况汇总报告</el-button>
      </div>
    </template>
  </ScenarioShell>
</template>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene07Review.vue
git commit -m "feat(screen): implement scenario 07 review workspace"
```

---

### Task 14: 场景 08 三维演练交互区

**Files:**
- Modify: `src/views/scenarios/Scene08Drill.vue`（替换占位）

**Interfaces:**
- Consumes: `fcPost('__scene__/drillPlans')`、`EP.sosAdd`/`terminalOperator`/`appEventReport`、`addSceneRoleLog`。
- Produces: 08 场景工作区：建计划→任务→模拟响应→会商调度→参演反馈→评价。

- [ ] **Step 1: 写入完整 `Scene08Drill.vue`**

```vue
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
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/views/scenarios/Scene08Drill.vue
git commit -m "feat(screen): implement scenario 08 drill workspace"
```

---

### Task 15: 场景专用 mock 数据 case 与全局验证

**Files:**
- Modify: `src/api/mock/handler.ts`（追加专用 case）
- Create: `engineering/qa/2026-11-18-eight-scenarios.md`

**Interfaces:**
- Consumes: Task 4 的数据集；全部 8 个 View。
- Produces: `__scene__/enterprises`、`__scene__/cameras`、`__scene__/patchTasks`、`__scene__/drillPlans` 的 mock 分发；QA 记录。

- [ ] **Step 1: 在 `src/api/mock/handler.ts` 的 switch 末尾 `default` 之前插入场景专用 case**

```ts
    case '__scene__/enterprises':
      return ok(undefined, { total: mockEnterprises.length, rows: mockEnterprises })

    case '__scene__/cameras':
      return ok(undefined, {
        total: 2,
        rows: [
          { cameraId: 'CAM-KQ-01', name: '罐区全景', status: 1 },
          { cameraId: 'CAM-XQ-01', name: '装卸区', status: 1 }
        ]
      })

    case '__scene__/patchTasks':
      return ok(undefined, { total: mockPatchTasks.length, rows: mockPatchTasks })

    case '__scene__/drillPlans':
      return ok(undefined, { total: mockDrillPlans.length, rows: mockDrillPlans })
```

- [ ] **Step 2: 在 handler.ts 头部 import 中补数据集**

把 `:10-13` 的 import 替换为：

```ts
import {
  mockRegions, mockTerminals, mockWalkieTalkies, mockBroadcastGroups,
  mockBroadcastMembers, mockCallRecords, mockSmsTemplates,
  mockEnterprises, mockPatchTasks, mockDrillPlans
} from './data'
```

- [ ] **Step 3: 全局构建与无硬编码扫描**

Run: `npm run build`
Expected: BUILD SUCCESS。

Run（PowerShell）: 扫描 `src/views/scenarios/` 与 `src/components/scenario/` 不得出现 `#[0-9a-fA-F]{6}` 硬编码色（允许 `var(--...)` 与 token 函数）。

- [ ] **Step 4: Playwright 逐场景实证**

启动 `npm run dev`（注意端口可能被占用，以 devserver.log 为准）。用 Playwright 访问 hash 路由 `#/scene/01-meeting` ~ `#/scene/08-drill`，对每个场景：
1. 截图 `engineering/qa/evidence/scene-XX.png`
2. 断言 7 个页签均可点击、内容区非空
3. 按主流程点击（01 选企业发会、02 点呼+闭环、03 接报+通知、04 发起会商、05 标绘+调度、06 通知+反馈、07 导出报告、08 启动+反馈+结束）
4. 断言「角色动作」页签出现 LIVE 行
5. 记录页面错误为 0

- [ ] **Step 5: 写 QA 记录**

创建 `engineering/qa/2026-11-18-eight-scenarios.md`，列出 8 场景 × (页签齐全 / 主流程通过 / LIVE 行 / 页面错误 0) 的核对表、截图路径、发现与修复。

- [ ] **Step 6: 提交**

```bash
git add src/api/mock/handler.ts engineering/qa/2026-11-18-eight-scenarios.md
git commit -m "feat(screen): add scenario mock cases and record eight-scenario acceptance"
```

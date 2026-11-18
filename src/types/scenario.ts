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

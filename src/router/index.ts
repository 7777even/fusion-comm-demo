import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/scene/01-meeting' },
  { path: '/scene/01-meeting', name: 'scene01', component: () => import('@/views/scenarios/Scene01Meeting.vue'), meta: { title: '园区多企业远程会议' } },
  { path: '/scene/02-patrol', name: 'scene02', component: () => import('@/views/scenarios/Scene02Patrol.vue'), meta: { title: '移动巡检与特殊作业联防' } },
  { path: '/scene/03-report', name: 'scene03', component: () => import('@/views/scenarios/Scene03Report.vue'), meta: { title: '多渠道接报与应急响应启动' } },
  { path: '/scene/04-consult', name: 'scene04', component: () => import('@/views/scenarios/Scene04Consult.vue'), meta: { title: '跨网异构多方视频会商' } },
  { path: '/scene/05-gis', name: 'scene05', component: () => import('@/views/scenarios/Scene05Gis.vue'), meta: { title: '二三维GIS融合调度' } },
  { path: '/:pathMatch(.*)*', redirect: '/scene/01-meeting' }
]

export default createRouter({ history: createWebHashHistory(), routes })

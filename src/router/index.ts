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
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

export default createRouter({ history: createWebHashHistory(), routes })

import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '态势总览', icon: 'DataBoard' }
  },
  {
    path: '/phone',
    name: 'phone',
    component: () => import('@/views/Phone.vue'),
    meta: { title: '电话调度', icon: 'Phone' }
  },
  {
    path: '/broadcast',
    name: 'broadcast',
    component: () => import('@/views/Broadcast.vue'),
    meta: { title: '扩音广播', icon: 'VideoPlay' }
  },
  {
    path: '/publish',
    name: 'publish',
    component: () => import('@/views/InfoPublish.vue'),
    meta: { title: '信息发布', icon: 'Promotion' }
  },
  {
    path: '/emergency',
    name: 'emergency',
    component: () => import('@/views/Emergency.vue'),
    meta: { title: '应急联动与检索', icon: 'Warning' }
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})

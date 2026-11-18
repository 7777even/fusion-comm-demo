<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataBoard, Phone, VideoPlay, Promotion, Warning, Connection,
  Bell, ArrowDown
} from '@element-plus/icons-vue'
import { isMockMode } from '@/api/client'
import { useCommStore } from '@/stores/comm'

const route = useRoute()
const store = useCommStore()
const mock = isMockMode()
const showEvents = ref(false)

const navItems = [
  { path: '/dashboard', title: '态势总览', icon: DataBoard },
  { path: '/phone', title: '电话调度', icon: Phone },
  { path: '/broadcast', title: '扩音广播', icon: VideoPlay },
  { path: '/publish', title: '信息发布', icon: Promotion },
  { path: '/emergency', title: '应急联动与检索', icon: Warning }
]

const currentTitle = computed(() =>
  navItems.find((n) => n.path === route.path)?.title ?? '态势总览'
)
const unread = computed(() => store.events.filter((e) => e.level === 'danger' || e.level === 'warning').length)
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">融</div>
        <div>
          <div class="brand-title">融合通信指挥</div>
          <div class="brand-sub">Fusion Command · Demo</div>
        </div>
      </div>
      <el-menu :default-active="route.path" router class="nav">
        <el-menu-item v-for="n in navItems" :key="n.path" :index="n.path">
          <el-icon><component :is="n.icon" /></el-icon>
          <span>{{ n.title }}</span>
        </el-menu-item>
      </el-menu>
      <div class="side-foot">
        <div class="mini muted">申讯 OpenAPI V1.3</div>
        <div class="mini" style="margin-top:var(--space-sm)">
          <span class="dot" :class="mock ? 'gray' : 'green'" />
          {{ mock ? '本地模拟模式' : '真实平台模式' }}
        </div>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:var(--space-sm)">
          <span style="font-size:var(--font-size-h2);font-weight:600;color:var(--color-text-strong)">{{ currentTitle }}</span>
          <el-tag v-if="mock" size="small" type="warning" effect="dark">MOCK</el-tag>
          <el-tag v-else size="small" type="success" effect="dark">LIVE</el-tag>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-md)">
          <span class="mini muted"><Connection style="vertical-align:middle" /> 平台通道正常</span>
          <el-badge :value="unread" :hidden="!unread" :max="99">
            <el-button :icon="Bell" circle @click="showEvents = !showEvents" />
          </el-badge>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="muted">指挥员</span><el-icon><ArrowDown /></el-icon>
          </div>
        </div>
      </header>
      <main class="page-content">
        <router-view />
      </main>
    </div>

    <el-drawer v-model="showEvents" title="实时事件推送" size="380px" :with-header="true" append-to-body>
      <template #header>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:600">实时事件推送</span>
          <el-tag size="small" type="success" effect="plain">订阅中</el-tag>
        </div>
      </template>
      <div class="event-feed">
        <div v-for="e in store.events" :key="e.id" class="event-item" :class="e.level ?? 'info'">
          <span class="event-ts">{{ e.ts }}</span>
          <span class="event-text">{{ e.text }}</span>
        </div>
        <div v-if="!store.events.length" class="empty-hint">暂无事件</div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.nav { flex: 1; padding-top: var(--space-sm); }
.side-foot { padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--glass-border); }
</style>

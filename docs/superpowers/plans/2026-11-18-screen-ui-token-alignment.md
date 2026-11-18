# Screen UI Token Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把融合通信 Demo 的视觉全量对齐脚手架大屏端 UI 规范（单一 token 真源 + 玻璃面板 + 青色光带），不改变任何功能与数据。

**Architecture:** 建立 4 层样式文件——`tokens.css`（唯一视觉真源，从脚手架 `:root` 块复制）、`global.css`（body 背景/滚动条/玻璃面板/青色竖条标题）、`element-dark.css`（Element Plus 深色覆盖）、`main.css`（Demo 布局与组件，全 token 化）。`main.ts` 按顺序引入，ECharts 运行时读取 CSS 变量取色。

**Tech Stack:** Vue 3.5 + Vite 5 + TypeScript 5.6 + Element Plus 2.9 + ECharts 5.5，无测试框架（验证手段为 `npm run build` + grep 断言 + 浏览器截图）。

## Global Constraints

- 唯一视觉真源为 `src/styles/tokens.css`，组件中禁止硬编码颜色/字号/字体/尺寸（结构性 border 宽度、图标固定尺寸除外，与脚手架自身实践一致）。
- 所有颜色必须写作 `var(--token)` 或 `color-mix(in srgb, var(--token) …)`；ECharts canvas 场景用 `getComputedStyle` 读取具体色值，且只用非 `color-mix()` 的 token；读取后须把 CSS Color 4 的 `rgb(r g b / a)` 规范化为 `rgba(r,g,b,a)`（zrender 色值解析器只认逗号语法）。
- 三端互斥：只实现大屏端，禁止引入 mgmt/mobile 主题或 `[data-skin]` 情景皮肤。
- 功能零改动：不得修改路由、5 个 view 的业务逻辑、API、store、Mock 数据。
- 参考源路径固定：`D:/gkproject/mm-security-platform-scaffold/src/styles/`。
- 提交信息遵循 conventional commits，单行成句，scope 取 `screen`/`docs`（见 AGENTS 约定）。

---

### Task 1: 建立 token 三层基座并接入

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/styles/element-dark.css`
- Modify: `src/main.ts:4-7`

**Interfaces:**
- Consumes: 脚手架 `tokens.css:7-811`（`:root` 大屏块）、`global.css:1-139`、`element-dark.css` 全文。
- Produces: 全局 CSS 变量 `--color-*`/`--font-*`/`--space-*`/`--radius-*`/`--glass-*`/`--layout-*`/`--z-*`/`--chart-*`，供后续所有 task 使用。

- [ ] **Step 1: 提取脚手架 `:root` 大屏块为 tokens.css**

Run（PowerShell，工作目录 `d:\gkproject\fusion-comm-demo`）：
```powershell
(Get-Content 'D:/gkproject/mm-security-platform-scaffold/src/styles/tokens.css' -Encoding UTF8)[6..810] | Set-Content -Encoding UTF8 'src/styles/tokens.css'
```
Expected: `src/styles/tokens.css` 首行为 `:root {`，末行为 `}`，含 `--color-bg: #001630;` 与 `--z-toast: 40;`。

- [ ] **Step 2: 提取脚手架 global.css 基础段**

```powershell
(Get-Content 'D:/gkproject/mm-security-platform-scaffold/src/styles/global.css' -Encoding UTF8)[0..138] | Set-Content -Encoding UTF8 'src/styles/global.css'
```
Expected: 末行为 `.tone-info { color: var(--color-text-muted); }` 的闭合 `}`，含 `.glass-panel` 与 `.panel-title::before`。

- [ ] **Step 3: 复制 Element Plus 深色覆盖**

```powershell
Copy-Item 'D:/gkproject/mm-security-platform-scaffold/src/styles/element-dark.css' 'src/styles/element-dark.css'
```
Expected: 文件存在，首行注释含 `Element Plus 深色主题覆盖`。

- [ ] **Step 4: 调整 main.ts 引入顺序**

把 `src/main.ts:4-7` 的：
```ts
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/main.css'
```
改为：
```ts
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/global.css'
import './styles/element-dark.css'
import './styles/main.css'
```

- [ ] **Step 5: 验证基座可编译**

Run: `npm run build`
Expected: 构建成功（此时 main.css 仍是旧版硬编码，样式可叠加，但不应有编译错误）。

- [ ] **Step 6: 提交**

```bash
git add src/styles/tokens.css src/styles/global.css src/styles/element-dark.css src/main.ts
git commit -m "feat(screen): add scaffold screen ui token foundation"
```

---

### Task 2: 重写 main.css 为全 token 化样式

**Files:**
- Modify: `src/styles/main.css`（整文件替换）

**Interfaces:**
- Consumes: Task 1 的 tokens.css / global.css / element-dark.css 变量与类。
- Produces: `.app-shell`/`.sidebar`/`.topbar`/`.page-content`/`.panel`/`.stat-card`/`.event-*` 等 Demo 类的最终大屏视觉。

- [ ] **Step 1: 用以下内容整体替换 `src/styles/main.css`**

```css
/* 全局样式：视觉值全部取自 tokens.css（大屏端 UI 规范），禁止硬编码颜色/字号/字体 */

* { box-sizing: border-box; }

html, body, #app { height: 100%; margin: 0; }

/* Element Plus 深色适配（tokens 化）—— 覆盖 element-dark.css 未覆盖的组件 */
.el-menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--color-text-muted);
  --el-menu-hover-bg-color: var(--color-accent-soft);
  border-right: none !important;
}
.el-menu-item.is-active {
  background: linear-gradient(90deg, var(--color-accent-soft), transparent) !important;
  color: var(--color-accent) !important;
}
.el-card {
  background: var(--glass-bg) !important;
  border: 1px solid var(--glass-border) !important;
  color: var(--color-text) !important;
  border-radius: var(--radius-lg) !important;
}
.el-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--color-panel-soft);
  --el-table-border-color: var(--color-border);
  --el-table-text-color: var(--color-text);
  --el-table-header-text-color: var(--color-text-muted);
  --el-table-row-hover-bg-color: var(--row-alt-bg);
  background: transparent !important;
}
.el-table__inner-wrapper::before { background: var(--color-border) !important; }
.el-dialog, .el-drawer { background: var(--color-panel) !important; color: var(--color-text) !important; }
.el-drawer__header, .el-dialog__title { color: var(--color-text-strong) !important; }
.el-input__wrapper, .el-select__wrapper, .el-textarea__inner {
  background: var(--color-panel-soft) !important;
  box-shadow: 0 0 0 1px var(--color-border) inset !important;
  color: var(--color-text) !important;
}
.el-input__inner, .el-textarea__inner { color: var(--color-text) !important; }
.el-select-dropdown, .el-popper { background: var(--color-panel) !important; border-color: var(--color-border) !important; color: var(--color-text) !important; }
.el-select-dropdown__item { color: var(--color-text) !important; }
.el-select-dropdown__item.is-hovering { background: var(--color-accent-soft) !important; }
.el-radio-button__inner { background: var(--color-panel-soft) !important; border-color: var(--color-border) !important; color: var(--color-text-muted) !important; }
.el-radio-button__original-radio:checked + .el-radio-button__inner { background: var(--color-accent) !important; border-color: var(--color-accent) !important; color: var(--color-text-strong) !important; }
.el-tabs__item { color: var(--color-text-muted) !important; }
.el-tabs__item.is-active { color: var(--color-accent) !important; }
.el-tabs__nav-wrap::after { background: var(--color-border) !important; }
.el-button--primary {
  background: var(--gradient-tech-blue);
  border-color: var(--color-accent);
  color: var(--color-text-strong);
}
.el-button--primary:hover { filter: brightness(1.15); }
.el-button--danger {
  background: var(--gradient-risk);
  border-color: var(--color-danger);
  color: var(--color-text-strong);
}
.el-tag { border-radius: var(--radius-sm); }

/* 布局 */
.app-shell { display: flex; height: 100vh; overflow: hidden; }
.sidebar {
  width: 232px; flex: 0 0 232px;
  background: var(--glass-bg);
  border-right: 1px solid var(--glass-border);
  display: flex; flex-direction: column;
  z-index: var(--z-chrome);
}
.brand {
  height: var(--layout-header-h);
  display: flex; align-items: center; gap: var(--space-sm);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
}
.brand-mark {
  width: 30px; height: 30px;
  border-radius: var(--radius-md);
  background: var(--gradient-tech-blue);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--color-text-strong);
}
.brand-title { font-size: var(--font-size-h2); font-weight: 600; letter-spacing: .5px; color: var(--color-text-strong); }
.brand-sub { font-size: var(--font-size-caption); color: var(--color-text-muted); }
.main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar {
  position: relative;
  height: var(--layout-header-h); flex: 0 0 var(--layout-header-h);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
  background: var(--layout-header-bg);
  z-index: var(--z-chrome);
}
.topbar::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--layout-header-line); }
.page-content { flex: 1; overflow: auto; padding: var(--space-lg); }

/* 通用 */
.page-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: var(--space-md); }
.page-title { font-size: var(--font-size-h1); font-weight: 600; margin: 0 0 4px; color: var(--color-text-strong); }
.page-desc { color: var(--color-text-muted); font-size: var(--font-size-stat-label); margin: 0; }
.panel {
  position: relative;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--glow-inner);
}
.panel::before {
  content: ''; position: absolute; top: -1px; left: var(--space-md); right: var(--space-md); height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-glow), transparent);
  pointer-events: none;
}
.panel:hover { border-color: var(--border-glow); box-shadow: var(--glow-inner), var(--panel-outer-glow); }
.panel-title { margin-bottom: var(--space-md); }
.grid { display: grid; gap: var(--space-md); }
.stat-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  box-shadow: var(--glow-inner);
  transition: border-color .2s, box-shadow .2s;
}
.stat-card:hover { border-color: var(--border-glow); box-shadow: var(--glow-inner), var(--panel-outer-glow); }
.stat-label { color: var(--color-text-muted); font-size: var(--font-size-helper); }
.stat-value { font-family: var(--font-family-num); font-size: var(--font-size-stat-big); font-weight: 600; margin-top: var(--space-sm); line-height: 1; color: var(--color-accent-bright); }
.stat-foot { font-size: var(--font-size-caption); color: var(--color-text-muted); margin-top: 10px; }
.mono { font-family: var(--font-family-num); }
.tag-online { color: var(--color-success); }
.tag-offline { color: var(--color-text-muted); }
.muted { color: var(--color-text-muted); }
.mini { font-size: var(--font-size-helper); }

/* 事件流 */
.event-feed { height: 100%; overflow: auto; display: flex; flex-direction: column; gap: var(--space-sm); max-height: 460px; }
.event-item { display: flex; gap: 10px; padding: 10px 12px; background: var(--color-panel-soft); border-radius: var(--radius-md); border-left: 3px solid var(--color-accent); }
.event-item.success { border-left-color: var(--color-success); }
.event-item.warning { border-left-color: var(--color-warning); }
.event-item.danger { border-left-color: var(--color-danger); }
.event-ts { color: var(--color-text-muted); font-size: var(--font-size-caption); white-space: nowrap; font-family: var(--font-family-num); padding-top: 2px; }
.event-text { font-size: var(--font-size-helper); line-height: 1.5; }

.dot { display: inline-block; width: 8px; height: 8px; border-radius: var(--radius-pill); margin-right: var(--space-sm); }
.dot.green { background: var(--color-success); }
.dot.red { background: var(--color-danger); }
.dot.gray { background: var(--color-text-muted); }

.call-stage { border: 1px dashed var(--color-border-soft); border-radius: var(--radius-md); padding: var(--space-md); min-height: 90px; background: var(--color-panel-soft); }
.call-stage .num { font-size: var(--font-size-h2); font-weight: 600; }
.empty-hint { color: var(--color-text-muted); font-size: var(--font-size-body); text-align: center; padding: var(--space-lg); }

.section-gap { margin-bottom: var(--space-md); }
.endpoint-note { font-size: var(--font-size-caption); color: var(--color-text-muted); font-family: var(--font-family-num); }
a { color: var(--color-accent); }
```

- [ ] **Step 2: 验证无旧变量残留**

Run（PowerShell）:
```powershell
if (Select-String -Path 'src/styles/main.css' -Pattern '\-\-fc-' -Quiet) { throw 'legacy --fc-* found' } else { 'OK: no --fc-*' }
```
Expected: 输出 `OK: no --fc-*`。

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 4: 提交**

```bash
git add src/styles/main.css
git commit -m "feat(screen): tokenize layout and component styles"
```

---

### Task 3: App.vue 壳层布局与内联样式 token 化

**Files:**
- Modify: `src/App.vue:56-71`（topbar 内联样式）、`src/App.vue:95-98`（scoped style）

**Interfaces:**
- Consumes: Task 1 的 `--font-size-h2`/`--font-size-caption`/`--space-sm`/`--space-md`/`--space-lg`/`--glass-border`。
- Produces: 顶栏标题字号、页脚间距全部 token 化，壳层与全局一致。

- [ ] **Step 1: 替换 topbar 内联样式**

把 `src/App.vue:57`：
```html
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:16px;font-weight:600">{{ currentTitle }}</span>
```
改为：
```html
        <div style="display:flex;align-items:center;gap:var(--space-sm)">
          <span style="font-size:var(--font-size-h2);font-weight:600;color:var(--color-text-strong)">{{ currentTitle }}</span>
```

把 `src/App.vue:62`：
```html
        <div style="display:flex;align-items:center;gap:16px">
```
改为：
```html
        <div style="display:flex;align-items:center;gap:var(--space-md)">
```

把 `src/App.vue:48`：
```html
        <div class="mini" style="margin-top:6px">
```
改为：
```html
        <div class="mini" style="margin-top:var(--space-sm)">
```

- [ ] **Step 2: 替换 scoped style**

把 `src/App.vue:95-98`：
```css
<style scoped>
.nav { flex: 1; padding-top: 10px; }
.side-foot { padding: 16px 20px; border-top: 1px solid var(--fc-border); }
</style>
```
改为：
```css
<style scoped>
.nav { flex: 1; padding-top: var(--space-sm); }
.side-foot { padding: var(--space-md) var(--space-lg); border-top: 1px solid var(--glass-border); }
</style>
```

- [ ] **Step 3: 验证 App.vue 无硬编码颜色/旧变量**

Run（PowerShell）:
```powershell
if (Select-String -Path 'src/App.vue' -Pattern '\-\-fc-|#[0-9a-fA-F]{6}\b' -Quiet) { throw 'legacy color found' } else { 'OK: App.vue clean' }
```
Expected: `OK: App.vue clean`。

- [ ] **Step 4: 提交**

```bash
git add src/App.vue
git commit -m "feat(screen): tokenize app shell inline styles"
```

---

### Task 4: ECharts 图表 token 化

**Files:**
- Modify: `src/views/Dashboard.vue:8-44`

**Interfaces:**
- Consumes: Task 1 的 `--color-text-muted`/`--color-border`/`--color-accent`/`--color-success`/`--color-warning`/`--color-accent-faint`（均为可直接被 canvas 解析的具体色值，非 `color-mix()`）。
- Produces: 图表配色随 token 统一，无硬编码 hex/rgba。

- [ ] **Step 1: 加入 CSS 变量读取工具并改写 renderChart**

在 `src/views/Dashboard.vue` 的 `<script setup lang="ts">` 内，紧跟 `let chart: echarts.ECharts | null = null` 之后加入：
```ts
const cssVar = (name: string) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const modernRgb = raw.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)(%)?\s*\)$/)
  if (!modernRgb) return raw
  const alpha = modernRgb[5] ? Number(modernRgb[4]) / 100 : modernRgb[4]
  return `rgba(${modernRgb[1]},${modernRgb[2]},${modernRgb[3]},${alpha})`
}
```
（`--color-border: rgb(0 140 220 / 25%)` / `--color-accent-faint: rgb(0 180 255 / 8%)` 是 CSS Color 4 语法，zrender 不认，必须转 `rgba()` 并把百分比 alpha 换算为小数；纯 hex token 原样返回。）

然后把 `renderChart` 函数（原 `Dashboard.vue:14-44`）整体替换为：
```ts
function renderChart() {
  if (!chartEl.value) return
  chart = chart ?? echarts.init(chartEl.value)
  const buckets = [6, 9, 12, 15, 18, 21]
  const text = cssVar('--color-text-muted')
  const grid = cssVar('--color-border')
  const accent = cssVar('--color-accent')
  const success = cssVar('--color-success')
  const warning = cssVar('--color-warning')
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['语音呼叫', '广播', '联动告警'],
      textStyle: { color: text },
      top: 0
    },
    grid: { left: 36, right: 16, top: 36, bottom: 24 },
    xAxis: {
      type: 'category',
      data: buckets.map((h) => `${h}:00`),
      axisLine: { lineStyle: { color: grid } },
      axisLabel: { color: text }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
      axisLabel: { color: text }
    },
    series: [
      { name: '语音呼叫', type: 'line', smooth: true, data: [12, 18, 9, 24, 16, 20], itemStyle: { color: accent }, areaStyle: { color: cssVar('--color-accent-faint') } },
      { name: '广播', type: 'bar', data: [3, 5, 2, 8, 4, 6], itemStyle: { color: success } },
      { name: '联动告警', type: 'bar', data: [1, 0, 2, 1, 3, 1], itemStyle: { color: warning } }
    ]
  })
}
```

- [ ] **Step 2: 清理模板内联间距**

把 `Dashboard.vue` 模板中的 `style="margin-top:8px"`（4 处）统一替换为 `style="margin-top:var(--space-sm)"`。

Run（PowerShell）:
```powershell
(Get-Content 'src/views/Dashboard.vue' -Encoding UTF8) -replace 'style="margin-top:8px"', 'style="margin-top:var(--space-sm)"' | Set-Content -Encoding UTF8 'src/views/Dashboard.vue'
```
Expected: 再运行 `Select-String -Path 'src/views/Dashboard.vue' -Pattern 'margin-top:8px' -Quiet` 返回 False。

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS，无 TS 类型错误。

- [ ] **Step 4: 提交**

```bash
git add src/views/Dashboard.vue
git commit -m "feat(screen): tokenize echarts colors"
```

---

### Task 5: 全量验证与浏览器截图核对

**Files:** 无（仅验证与留痕）

**Interfaces:**
- Consumes: Task 1-4 的全部产物。
- Produces: 构建通过、grep 断言通过、截图存于 `engineering/qa/evidence/`（被 .gitignore 忽略）。

- [ ] **Step 1: 全局硬编码扫描**

Run（PowerShell，扫描组件层源码；三个脚手架来源文件为唯一允许硬编码的视觉真源，须排除）:
```powershell
$scaffoldFiles = @('tokens.css','global.css','element-dark.css')
$bad = Get-ChildItem -Path 'src' -Recurse -Include '*.vue','*.ts','*.css' |
  Where-Object { $scaffoldFiles -notcontains $_.Name } |
  Select-String -Pattern '\-\-fc-|#[0-9a-fA-F]{6}\b|rgba?\('
if ($bad) { $bad | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }; throw 'hardcoded values remain' } else { 'OK: no hardcoded colors in components' }
```
Expected: `OK: no hardcoded colors in components`。

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 启动 dev server 并截图**

Run: `npm run dev -- --port 5188`
Expected: 服务监听 5188。

用 Playwright（Chromium）依次访问 `/dashboard`、`/phone`、`/broadcast`、`/publish`、`/emergency`，截图保存至 `engineering/qa/evidence/screen-ui-<route>.png`。逐页核对：
- 背景为深藏蓝渐变（非旧 `#0d1526` 纯色）
- 面板为半透明玻璃、蓝描边、内发光；标题有 4×16px 青色竖条
- 顶栏 77px，底部有一条青色光带
- 统计数值为 Poppins 风格亮青色
- 图表线/柱为青/绿/黄，图例与坐标轴为灰蓝
- Element Plus 下拉、分页、抽屉、表格均为深色且与面板一致
- 5 页所有功能控件可点击、无布局错位

- [ ] **Step 4: 截图证据留痕**

把核对结论写入 `engineering/qa/2026-11-18-screen-ui-token-alignment.md`，列出 5 张截图路径与逐项核对结果。

- [ ] **Step 5: 提交证据文档**

```bash
git add engineering/qa/2026-11-18-screen-ui-token-alignment.md
git commit -m "docs: record screen ui alignment visual acceptance"
```

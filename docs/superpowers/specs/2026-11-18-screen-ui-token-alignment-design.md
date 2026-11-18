# 融合通信 Demo 对齐脚手架大屏端 UI 规范 — 设计

- 日期：2026-11-18
- 状态：Approved（用户已确认方案）
- 参考源：`D:/gkproject/mm-security-platform-scaffold`（`src/styles/tokens.css`、`docs/UI规范-大屏端.md`、`src/styles/global.css`）

## 背景与目标

当前 Demo 使用自有的 `--fc-*` 深色变量与侧栏 + 顶栏 + 卡片表格的管理式界面。用户要求将 UI 规范换成脚手架系统的大屏端规范。

- **目标端**：大屏端深色规范（`:root` 默认块），而非后台管理端 / 移动端（三端视觉互斥）。
- **改造范围**：视觉换肤 + 轻量布局调整。保留 5 页信息架构与全部功能，只把视觉全量对齐大屏 token，并将侧栏 / 顶栏 / 卡片改为大屏风格。

## 非目标

- 不重构为「左右信息面板 + 中间态势区」的大屏形态。
- 不改动路由、5 页结构、API、store、Mock 数据、功能逻辑。
- 不引入后台端 / 移动端主题或情景皮肤。

## 架构：单一 token 真源 + 分层覆盖

照搬脚手架「tokens.css 唯一权威源」的做法，建立 4 层样式文件：

| 文件 | 来源 | 职责 |
|---|---|---|
| `src/styles/tokens.css` | 复制脚手架 `tokens.css:7-813` 的 `:root` 大屏块 | 色彩 / 字号 / 间距 / 圆角 / 渐变 / 玻璃 / 布局 / 层级 / 图表 token，唯一视觉真源 |
| `src/styles/global.css` | 移植脚手架 `global.css:1-130` | body 深蓝径向渐变背景、细滚动条、`.glass-panel`、`.panel-title` 青色竖条、语义色类 |
| `src/styles/element-dark.css` | 移植脚手架 Element Plus 深色适配 | el-menu / card / table / input / tabs / dialog 统一深色 |
| `src/styles/main.css` | 重写 | 删除全部 `--fc-*`，布局类改走 token，保留 Demo 特有类但颜色 token 化 |

`src/main.ts` 按 `tokens → global → element-dark → main` 顺序引入。

## Token 映射（旧 → 新）

| 旧 `--fc-*` | 新 token | 视觉变化 |
|---|---|---|
| `--fc-bg: #0d1526` | `--color-bg: #001630` | 更深邃的藏蓝底 |
| `--fc-panel: #152039` | `--glass-bg` | 半透明玻璃面板 + 蓝描边 + 内发光 |
| `--fc-border: #26365c` | `--glass-border` / `--color-border` | 蓝描边 |
| `--fc-accent: #3d8bff` | `--color-accent: #00b4ff` | 青蓝主强调 |
| `--fc-accent-2: #00d4a0` | `--color-success: #3dd68c` | 成功绿 |
| `--fc-warn: #ffb020` | `--color-warning: #f0b429` | 预警黄 |
| `--fc-danger: #ff5b6e` | `--color-danger: #ff5a4a` | 报警红 |
| `--fc-text / --fc-sub` | `--color-text / --color-text-muted` | 四级文字阶 |

字体栈换 `--font-family-zh` + 数字用 `--font-family-num`（Poppins/DIN）；圆角从 12px 收到大屏规范的 `--radius-sm/md/lg`（2/4/10px）；间距统一 `--space-*`（4/8/16/24px）。

## 组件样式改造

- **顶栏**：68px → `--layout-header-h: 77px`，背景 `--layout-header-bg` 竖向渐变，`::after` 加底部青色光带 `--layout-header-line`。
- **侧栏**：保留 232px 导航宽度，改玻璃材质，选中态用青色光带 + 发光，`z-index` 走 `--z-chrome`。
- **卡片 / 面板**：`.panel`、`.stat-card` 套 `.glass-panel` 材质；`.panel-title::before` 改 4×16px 青色竖条 + glow；统计数值用 `--font-family-num` + `--color-accent-bright`。
- **按钮**：Element Plus 主按钮用 `--gradient-tech-blue` 竖向渐变、`--radius-sm`，危险按钮用 `--gradient-risk`。
- **状态色**：`.tag-*`、`.dot.*`、`.event-item` 等级色条改走 `--color-alarm-1..4` / `--color-success` 等 token。
- **ECharts**（`Dashboard.vue:18-43`）：硬编码色改为运行时读 `getComputedStyle` 取 `--chart-*` token，对齐整体配色。

## 验证方式

1. `npm run build`（vue-tsc 严格类型检查 + vite 构建）通过。
2. 启动 dev server 用浏览器截图，逐页核对玻璃质感、顶栏光带、青色竖条、图表配色。
3. grep 确认 `src/` 下无残留硬编码颜色 / `--fc-*` 引用。

## 范围边界

所有改动集中在 `src/styles/*`、`src/main.ts`、`src/App.vue`、`src/views/Dashboard.vue`（图表色）及各视图内联样式的颜色清理。功能与数据层零改动。

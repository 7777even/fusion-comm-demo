# 大屏端 UI 规范对齐 — 视觉验收记录

- 日期：2026-11-18
- 方案：`docs/superpowers/specs/2026-11-18-screen-ui-token-alignment-design.md`
- 计划：`docs/superpowers/plans/2026-11-18-screen-ui-token-alignment.md`
- 环境：Vite dev server `http://localhost:5189`（5188 被占用），Playwright Chromium 159，viewport 1440×900

## 验证手段

1. `npm run build`：vue-tsc 严格类型检查 + vite 构建，全部通过。
2. 全局硬编码扫描：排除 `tokens.css`/`global.css`/`element-dark.css` 三个脚手架真源后，`src/` 下无 `--fc-*`、`#rrggbb`、`rgba?(` 残留（Dashboard 的 `cssVar()` rgba 规范化函数为例外）。
3. Playwright 逐路由截图 + DOM 样式断言（`getComputedStyle` 读实际计算值）。

## 逐页核对

| 路由 | 页面标题 | 渐变背景 | 顶栏 77px | 标题青条 4×16 | 面板内发光 | 页面错误 |
|---|---|---|---|---|---|---|
| `/#/dashboard` | 态势总览 ✓ | ✓ | ✓ | ✓ | ✓ | 0 |
| `/#/phone` | 电话调度 ✓ | ✓ | ✓ | ✓ | ✓ | 0 |
| `/#/broadcast` | 扩音广播 ✓ | ✓ | ✓ | ✓ | ✓ | 0 |
| `/#/publish` | 信息发布 ✓ | ✓ | ✓ | ✓ | ✓ | 0 |
| `/#/emergency` | 应急联动与检索 ✓ | ✓ | ✓ | ✓ | ✓ | 0 |

截图（被 .gitignore 忽略，不入库）：

- `engineering/qa/evidence/screen-ui-dashboard.png` — 数字为 Poppins 亮青；图表线/柱为青/绿/黄 token 色；图例与坐标轴灰蓝。
- `engineering/qa/evidence/screen-ui-phone.png` — `el-tree` 组织树深色底、悬停青色；`el-alert` 深色；状态点绿/灰 token 色。
- `engineering/qa/evidence/screen-ui-broadcast.png` — `el-input-number` 步进器深色；`el-slider` 轨道深色、进度青色；主按钮蓝渐变、危险按钮红渐变。
- `engineering/qa/evidence/screen-ui-publish.png` — 下拉框深色；switch 主色；空状态文案正常。
- `engineering/qa/evidence/screen-ui-emergency.png` — `el-alert` 深色；报警级别 radio 选中态青色；一键联动红色渐变按钮。

## 验收中发现的真实缺陷与修复

浏览器实证暴露了 3 类 grep / 构建无法发现的浅色残留（mock 单元测试也无法覆盖），均已修复：

1. `Broadcast.vue:167` 内联 scoped 样式残留 `var(--fc-border)` → 改 `var(--glass-border)`，圆角 6px → `var(--radius-md)`。
2. Element Plus `el-tree` / `el-alert` 组件无深色覆盖，在电话页与应急页呈白色块 → 在 `main.css` 补 token 化深色规则。
3. `el-button--success` / `el-input-number` / `el-slider` 呈亮绿/白底 → 在 `main.css` 补 token 化深浅覆盖。

补充：路由为 `createWebHashHistory`，截图 URL 必须用 `/#/<route>`；首轮脚本用 `/<route>` 导致全部落到 dashboard，已修正脚本并按页面标题断言。

## 结论

5/5 页面视觉对齐脚手架大屏端规范，无浅色残留、无页面错误；功能与数据层零改动。验收通过。

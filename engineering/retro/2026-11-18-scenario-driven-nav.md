# Retro：场景驱动导航重构

- 分支：`feature/scenario-driven-nav`，基线 `1d9b2db`（设计 `e5751ad`）。
- 规模：6 个任务，开发提交 `85a229e`~`35b4d9b`（含计划修正 `bbbb43b` 与 Task 1 amend 后的新号 `85a229e`），任务级 review 5 次。

## 做对了什么

1. **设计三段逐段确认**：导航结构、能力内嵌方案、映射与旧页面删除策略分三段给用户确认，每段"没问题"后再推进，最后才落 design 文档，全程零返工。
2. **单一真源避免分散判断**：场景→能力映射只放 `scenes/meta.ts` 的 `capabilities` 字段，`ScenarioShell` 纯数据驱动渲染，不在 shell 里按场景号写 if/else，调整映射只改一处。
3. **git mv 保留 rename 历史**：5 个 view 用 `git mv` 转 capabilities 组件（rename 相似度 94-96%），script/store/service 逻辑零改动，只删页面级 `page-head`，diff 极清晰。
4. **RED→GREEN 做实依赖脱节**：Task 1 抽走 view 后故意保留 router 旧引用让构建 RED，确认引用确实断开，Task 4 删路由后转 GREEN，避免"以为改干净"的误判。
5. **浏览器实证逐场景覆盖能力**：playwright 逐场景点开"支撑能力"页签断言能力组件齐全，而非只看侧边栏，兜住了"能力映射配错/组件没渲染"的回归。

## 踩坑与修正

1. **提交类型与全局约束冲突**：Task 1 初提交用 `refactor:`，被 reviewer 判 Important（本仓只允许 docs/feat/fix）；amend 为 `feat:`（`85a229e`），并补 `bbbb43b` 同步修正计划文本；Task 2 报告把可选建议写成"偏离"，一并改回"类型注解说明"。
2. **shell 链式命令路径解析**：`cd ...; git add ...` 报"系统找不到指定的路径"，链式 `git -C ...; git -C ...` 把 `-C` 传给子命令报 unknown switch；统一改用单条 `git -C "绝对路径" ...`、node 用绝对脚本路径后稳定。
3. **目录不存在导致 git mv 失败**：计划 self-review 发现 `git mv` 目标 `src/components/capabilities/` 未建会失败，实施前先 mkdir，并在计划 Task 1 补上该步。
4. **广播归属冲突**：用户既选"按建议映射（广播全局保留）"又选"彻底删除旧页面与路由"，二者矛盾；以"彻底删除"为准把广播并入场景 05 GIS，设计文档写死"不设全局入口"，避免实施期摇摆。

## 遗留与交接

1. 场景 06-08 与"事后·总结提升"分组不在本次范围（用户确认只重构现有 5 场景），README 与 spec 均已说明。
2. 本轮为 mock 态实证，无 `.env.local` 真实平台地址；能力组件真实请求行为沿用 `2026-11-18-demo-real-http` 变更，未重验。
3. ECharts 在"支撑能力"页签内随页签切换重建，长时多次切换未做压力测试（浏览器实证无 error、未见泄漏迹象）。
4. 分支尚未合并/推送，按用户意图走 finishing flow。

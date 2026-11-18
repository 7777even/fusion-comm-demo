# 融合通信 Demo 产品化落地（阶段一）验收记录

- 日期：2026-11-18
- 分支：`feature/fusion-comm-productization`（分支起点 `7a4a83f`，本验收任务直接基线 `92e9b95`）
- 提案：`openspec/archive/2026-11-18-fusion-comm-productization/`（归档后路径）
- 计划：`openspec/archive/2026-11-18-fusion-comm-productization/plan.md`（归档后路径）
- 范围：demo 贴近系统规范（服务层收口 + 签名边界声明），不含回流脚手架/后端的实现。

## 验证手段与结果

### 纯函数测试（Node 24 类型剥离 + node:assert，零新增依赖）

| 命令 | 输出 |
|---|---|
| `node --experimental-strip-types scripts/test-envelope.mjs` | `envelope OK` |
| `node --experimental-strip-types scripts/test-fc-signature.mjs` | `fcSignature OK` |

> 附 `ExperimentalWarning: Type Stripping`，为 Node 24 预期提示，非错误。

### 零残留断言

`findstr /n /s "fcPost(" src\views\*.vue src\views\scenarios\*.vue`：无输出。9 个页面共 38 处 `fcPost` 直连全部收口到 `services/communication`。

### 类型检查 + 生产构建

`npm run build`（vue-tsc -b + vite build）：BUILD SUCCESS，2210 modules transformed。chunk >500kB 警告为既有、非本阶段引入。

### 浏览器实证（Playwright Chromium，viewport 1440×900，dev server :5188）

- **10 项导航**：逐项点击，顶栏标题全部匹配（态势总览/电话调度/扩音广播/信息发布/应急联动与检索 + 场景 01-05），零页面错误。
- **5 场景交互**：切「业务流程」页签点击关键操作，再切「角色动作」页签，LIVE 行数依次为 1/2/3/3/4（跨场景累加），证明服务层调用链在真实浏览器中产出角色动作日志。
- **控制台**：`pageerror` 与 console error 均为 0。
- 截图：`engineering/qa/evidence/shots-fusion-comm-productization/`（evidence 目录被 .gitignore 忽略，不入库）。

实证中发现的两个脚本问题（非产品缺陷，均已修正后复验通过）：
1. Scene01「发起会议」需先勾选参会企业，否则产品逻辑提前返回不写 LIVE 行——脚本补勾选后通过。
2. Scene03 按钮文案为「接听并登记（sosLinkage/add）」，原脚本关键词表未覆盖——修正关键词后通过。

## 交付物

- `src/services/envelope.ts`：B3 包络解包纯函数（零导入）。
- `src/adapters/fcSignature.ts`：签名边界适配器，声明回流后由后端代理生成、浏览器零密钥；为阶段三契约载体，当前未接入运行路径，真实模式仍走 `sign.ts` 直连。
- `src/services/communication.ts`：22 个方法的服务层，收口全部页面直连。
- 9 个页面（4 基础 + 5 场景）改走服务层。
- 2 个测试脚本 + 本验收记录。

## 遗留项（非本阶段范围）

1. **阶段二（脚手架）/ 阶段三（后端）未在本仓执行**：契约扩端点、生成类型、`fm-communication` 子应用迁入、后端 Controller/受控下行白名单/三方言迁移/权限种子，须各开 Change 并过 L4。
2. **`code!==0` 端到端不抛错**：`api/client.ts` 只检查 HTTP 状态、不检查业务 code，服务层原样返回包络、页面用 `??` 兜底。该行为改造前后一致（既有），且 `unwrapBody`/`unwrapRows` 已提供可识别错误路径，回流平台契约严格对拍时统一治理。
3. **重构后类型断言弱化**：`fcPost<Type>` 泛型移除后，4 处列表消费靠 `as unknown as Xxx[]` 双重断言恢复元素类型；字段形状变更不再被 TS 拦截。建议阶段二用 generated types 彻底替换。

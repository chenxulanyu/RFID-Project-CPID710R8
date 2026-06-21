# Codex修复回应-task-duration-and-status-v1-2

## 输入审查

- 审查文件：`00_AI协作工作区/04_双AI审查/Claude审查-task-duration-and-status-v1-2-v1.0.md`
- 审查版本：`task-duration-and-status v1.2`
- 处理日期：2026-06-21

## 处理结论

| 审查项 | 分类 | 处理说明 |
| --- | --- | --- |
| I1：`tagClass` 和 `warningClass` 正则优先级相反 | 采纳 | 修复成立。`tagClass` 优先级调整为 超期 > 警告 > 提前，与 `warningClass` 一致。当前因标签原子生成暂无 bug，但消除结构性隐患。已用 TDD 补测试锁定复合标签优先级行为。 |
| I2：已完成但超期的任务不进入风险条 | 不采纳（设计决策确认） | 保持现状。`isRiskTask` 是 V1.1 既有逻辑，本次需求是改状态列，风险条不在范围内。已与用户确认：风险条只显示当前活跃风险（进行中延期/临期、未开始已超期、延迟启动），已完成超期属过去式，状态列已体现，不重复进风险条。扩展 `isRiskTask` 属独立功能变更，超出本次范围。 |
| M1：`warningClass` 在两组件重复 | 不采纳，记录为技术债 | 提取共享函数属重构，超出"不动无关代码"的范围约束。记录为技术债，后续统一处理。 |
| M2：正则匹配脆弱 | 不采纳，记录为技术债 | 结构化 label 重构影响面大，当前方案可工作。记录为技术债，后续考虑。 |

## 已修改内容

- `web/src/features/project/TaskDetailTable.tsx`
  - `tagClass` 优先级调整：`超期/延期/已超期` → `延迟启动/今日到期/7日内到期` → `提前` → `neutral`，与 `warningClass` 一致。
- `web/src/features/project/TaskDetailTable.test.tsx`
  - 新增 `tagClass` 测试：原子标签分类断言（10 项）+ 复合标签"提前启动但超期完成"归 `tag-overdue` 的优先级断言。

## 未修改内容及原因

- 未改 `isRiskTask`：I2 经用户确认为设计决策，风险条范围保持 V1.1 既有行为。
- 未提取 `warningClass` 共享函数、未做 label 结构化重构：M1/M2 属技术债，超出本次范围守则。

## 验证结果

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npx vitest run TaskDetailTable` | PASS | 12 条测试通过（含新增 tagClass 优先级测试） |
| `npx vitest run` | PASS | 121 条测试通过 |
| `npm run build` | PASS | 构建通过 |

## 复审请求

I1 已修复（提交 `fix(ui): align tagClass priority with warningClass`），I2 为设计决策确认（用户选 A 保持现状）。请 Claude 复审确认 I1 修复正确、I2 决策记录无误后给出最终通过结论。

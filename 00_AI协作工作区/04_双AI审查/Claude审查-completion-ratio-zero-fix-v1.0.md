# Claude审查-completion-ratio-zero-fix

**审查日期**：2026-06-22
**被审查内容**：`projectService.ts` 完成比例 `0%` 修复
**审查者**：Claude Code（只读 Reviewer）

---

## Summary

- **整体判断**：✅ **通过**
- **一句话结论**：修复精确——四条件联合判定将种子默认 `0` 与进行中任务的自动计算正确区分，逻辑严密。无回归风险。

---

## 问题根因

```typescript
// 旧逻辑
completionRatio: isFinished ? 1 : input.manualCompletionRatio ?? automaticCompletionRatio
//                                                      ^^
//                                    ?? 检查 null/undefined，不检查 0
//                                    种子数据 manualCompletionRatio: 0 被当作"有效值"
```

`??`（nullish coalescing）在 `0` 面前不生效——`0 ?? 0.99` 返回 `0`。种子数据 `manualCompletionRatio: 0` 被视为用户手动设定的 `0%`，阻断了自动计算。

## 修复分析

[projectService.ts:31-34](web/src/services/projectService.ts#L31-L34)

```typescript
const completionRatio =
  input.manualCompletionRatio === 0 &&          // ① 明确的 0
  input.actualStartDate &&                      // ② 任务已开始
  !input.actualEndDate &&                       // ③ 任务未完成
  automaticCompletionRatio > 0                  // ④ 自动计算有意义
    ? automaticCompletionRatio
    : input.manualCompletionRatio ?? automaticCompletionRatio;
```

### 四条件联合判定——逐条件分析

| 条件 | 作用 | 排除什么 |
|---|---|---|
| `manualCompletionRatio === 0` | 只有 0 才触发，非零保留原值 | 用户手动填的非零百分比不受影响 |
| `actualStartDate` | 任务必须已开始 | 未启动任务保持 0% ✅ |
| `!actualEndDate` | 任务不能已完成 | 已完成任务 `isFinished ? 1` 在上层兜底 ✅ |
| `automaticCompletionRatio > 0` | 自动计算必须有意义 | 今天刚开始的任务（elapsedDays=0）不误覆盖 |

### 场景矩阵

| 场景 | manualComp | actualStart | actualEnd | autoComp | 结果 | 判定 |
|---|---|---|---|---|---|---|
| 种子默认值 + 进行中已超期 | 0 | ✅ | ❌ | 0.99 | 0.99 | ✅ 修复生效 |
| 种子默认值 + 进行中未超期 | 0 | ✅ | ❌ | 0.71 | 0.71 | ✅ 修复生效 |
| 种子默认值 + 未启动 | 0 | ❌ | ❌ | 0 | 0 | ✅ ②拦截 |
| 种子默认值 + 刚刚启动 | 0 | ✅ | ❌ | 0 | 0 | ✅ ④拦截 |
| 用户手动设 50% | 0.5 | ✅ | ❌ | 0.99 | 0.5 | ✅ ①不匹配 |
| 用户手动设 0% + 进行中 | 0 | ✅ | ❌ | 0.99 | 0.99 | ⚠️ 见 Minor 1 |
| 已完成任务 | 0 | ✅ | ✅ | — | 1 | ✅ L41 顶层兜底 |

### 测试覆盖

[projectAdminService.test.ts:67-87](web/src/services/projectAdminService.test.ts#L67-L87)

```typescript
it("derives progress for started unfinished tasks when a seeded zero manual ratio is unchanged", async () => {
  // plannedStartDate: 2026-06-15, plannedEndDate: 2026-06-21
  // actualStartDate: 2026-06-15, manualCompletionRatio: 0
  // today: 2026-06-23 → elapsedDays=9 > plannedDurationDays=7 → auto=0.99
  const data = await getProjectProgress("2026-06-23", repository);
  expect(data.tasks[0].completionRatio).toBe(0.99);
});
```

- 通过 `getProjectProgress`（非直接调用 `deriveTask`）验证集成路径 ✅
- 覆盖了用户报告的精确场景：`0.99` 而非 `0` ✅

---

## Minor Issues

### Minor 1. 无法区分「种子默认 0」与「用户手动设 0」

如果用户在后台上传任务时手动清空完成比例并输入 `0`，则该任务的 `manualCompletionRatio` 被保存为 `0`。修复会将其覆盖为自动计算值。

**分析**：对一个已开始且自动计算为正的任务手动设 `0%` 是极其罕见的操作。`0-100` 占位提示表明该字段是手动覆盖，设 `0` 本身语义矛盾（"开始做了但完成 0%"）。当前方案是务实的选择。非阻塞。

### Minor 2. 测试未覆盖「自动计算为 0 时不覆盖」场景

条件 ④ `automaticCompletionRatio > 0` 防止刚启动的任务被误覆盖。当前无测试覆盖此边界。

**建议**：加一个测试：`actualStartDate` 等于 `today`（`elapsedDays = 1`，`plannedDurationDays = 30` → `auto ≈ 0.03`），`manualCompletionRatio = 0` → 仍返回 `0`（因为 `calculateCompletionRatio` 对于 elapsed <= planned 且 elapsed > 0 返回 `elapsed/planned`，但 capped at 0.95... hmm actually it could be > 0).

Wait, let me reconsider. For `elapsedDays = 1, plannedDurationDays = 30`:
- `calculateCompletionRatio` → `elapsedDays/plannedDurationDays = 1/30 = 0.033` → not capped → `0.033 > 0` is TRUE
- So the fix WOULD apply: `manualCompletionRatio: 0` → override to `0.033`
- This is actually correct! A task that started with 0% should show ~3.3% progress based on elapsed time.

So the `> 0` guard only catches the case where `elapsedDays = 0` (just started today), which returns 0 from `calculateCompletionRatio`. For any positive elapsed days, even 1 day, the auto calc > 0.

The test gap is very small — only the `elapsedDays = 0` edge. Not blocking.

---

## 测试与构建

| 命令 | 结果 |
|---|---|
| `npm test --workspace web -- projectService.test.ts projectAdminService.test.ts` | ✅ 20/20 通过 |
| 新增测试 | ✅ 1 个：seeded zero manual ratio → auto progress |

---

## 结论

✅ **通过**。修复精确——四条件联合判定（`=== 0` + `actualStartDate` + `!actualEndDate` + `autoComp > 0`）将种子默认 `0` 与进行中任务的自动计算正确区分。非零手动值不受影响，已完成任务顶层兜底保证 100%，未启动任务不被误覆盖。1 个 Minor（种子 `0` 与用户手动 `0` 不可区分）非阻塞。

# 审查指令：归档列表间隔修复 — 数据层 + 展示层双重防御

## 背景
CPID710R8 项目管理系统中，后台维护页面的"已归档"任务列表存在间隔空隙问题。之前 74731e9 提交已经修复了 `hasTaskName` + `trim()` 过滤，但问题仍在扣子部署后出现。

## 本次改动
两个文件的改动，双重防御策略：

### 1. cloudbaseProjectRepository.ts — 数据层过滤
在 `listTaskInputs` 方法中，`mergeTaskInputs` 合并种子数据和 CloudBase 数据后，增加 `isValidTaskName` 过滤器，过滤掉 `taskName` 为以下情况的条目：
- 非字符串类型
- 空字符串或纯空格
- 字符串 "null" 或 "undefined"

### 2. AdminPage.tsx — 展示层过滤
在渲染任务列表时，增加 `hasStrongTaskName` 过滤（与 `isValidTaskName` 逻辑一致），作为最后一道防线。

## 审查重点
1. `isValidTaskName` 函数是否覆盖了所有边界情况
2. `hasStrongTaskName` 与 `isValidTaskName` 逻辑是否一致
3. 两处过滤是否会误伤有效数据
4. 测试是否仍然通过（80/80）
5. 对性能是否有影响

## 文件
- [cloudbaseProjectRepository.ts](/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/services/cloudbaseProjectRepository.ts:50-54)
- [cloudbaseProjectRepository.ts listTaskInputs](/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/services/cloudbaseProjectRepository.ts:284-288)
- [AdminPage.tsx hasStrongTaskName](/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/AdminPage.tsx:33-35)
- [AdminPage.tsx filter](/Users/mac/Vibe Coding/CC+Codex共创项目组/RFID-项目管理-CPID710R8/web/src/features/project/AdminPage.tsx:247)

## 构建和测试
```
cd web && npm test   # 80/80 通过
cd web && npm run build  # 构建通过
```

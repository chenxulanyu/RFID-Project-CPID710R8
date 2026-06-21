# Brainstorm Summary

- Change: dashboard-and-timeline-v1-1
- Date: 2026-06-21

## 确认的技术方案

1. 仪表盘"未启动"指标：`ProjectSummaryDashboard.tsx` 新增卡片展示 `metrics.notStartedTasks`
2. 后台里程碑/TaskID 对调：`AdminPage.tsx` 交换两个 label 的 JSX 顺序
3. 时间轴双条形：扩展 `DashboardTask.timeline` 为 `{ plan, actual? }`，蓝条(12px)+红条(6px)居中重叠
4. 隐藏后台入口：`App.tsx` 移除导航栏 `<a>` 标签，路由不变
5. 资源方/责任人非必填：`projectValidation.ts` + `cloudbaseProjectRepository.ts` 移除必填检查
6. 项目周期自动扩展：`saveProjectMetadata` 计算任务日期范围传入 `validateProject`，可设更长时间但不能短于任务范围

## 关键取舍与风险

- 时间轴不引入新 npm 依赖，纯 CSS 双 bar 方案
- 需求6的日期约束仅在保存时校验，不在前端实时阻止
- 所有改动仅涉及 ~14 个文件，不碰 CloudBase 结构

## 测试策略

- 每个需求独立 TDD：先写测试 → 看它失败 → 最小实现 → 全量回归
- 需求3（时间轴）需要视觉回归，建议截图对比
- 需求6（日期约束）需要边界测试：等于任务范围、超出范围、短于范围

## Spec Patch

无

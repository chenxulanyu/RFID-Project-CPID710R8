import type { DashboardModel } from "./dashboardMetrics";
import { formatPercent } from "./formatters";

export function ProjectSummaryDashboard({ model }: { model: DashboardModel }) {
  const { project, metrics, today } = model;
  const riskTotal = metrics.overdueTasks + metrics.dueTodayTasks + metrics.withinWeekTasks;

  return (
    <section className="dashboard-hero" aria-labelledby="dashboard-title">
      <div className="dashboard-title-block">
        <p className="eyebrow">项目总览</p>
        <h1 id="dashboard-title">{project.name}</h1>
        <p className="dashboard-meta">
          计划周期：{project.plannedStartDate} 至 {project.plannedEndDate} · 今日：{today} · 日历口径：自然日
        </p>
      </div>

      <div className="metric-grid" aria-label="项目关键指标">
        <article className="metric-card metric-card-primary">
          <span>总体进度</span>
          <strong>{formatPercent(metrics.overallProgress)}</strong>
        </article>
        <article className="metric-card">
          <span>任务总数</span>
          <strong>{metrics.totalTasks}</strong>
          <small>{metrics.totalDetailTasks} 条明细</small>
        </article>
        <article className="metric-card metric-card-warning">
          <span>延期/临期</span>
          <strong>{riskTotal}</strong>
        </article>
        <article className="metric-card metric-card-danger">
          <span>延迟启动</span>
          <strong>{metrics.startDelayedTasks}</strong>
        </article>
        <article className="metric-card">
          <span>已完成</span>
          <strong>{metrics.finishedTasks}</strong>
        </article>
        <article className="metric-card">
          <span>进行中</span>
          <strong>{metrics.inProgressTasks}</strong>
        </article>
        <article className="metric-card">
          <span>未启动</span>
          <strong>{metrics.notStartedTasks}</strong>
        </article>
      </div>
    </section>
  );
}

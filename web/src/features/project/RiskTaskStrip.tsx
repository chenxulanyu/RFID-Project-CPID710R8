import type { DashboardTask } from "./dashboardMetrics";

export function RiskTaskStrip({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <section className="risk-strip" aria-labelledby="risk-strip-title">
      <div className="section-heading-row">
        <h2 id="risk-strip-title">风险任务</h2>
        <span>{tasks.length} 项需关注</span>
      </div>
      {tasks.length ? (
        <div className="risk-list">
          {tasks.map((task) => (
            <article
              className={`risk-pill status-${task.dashboardStatus} warning-${task.warningState}`}
              key={task.id}
            >
              <strong>{task.milestoneCode}</strong>
              <span>{task.taskName}</span>
              <em>{task.riskLabel}</em>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">当前没有延期、临期或延迟启动任务。</p>
      )}
    </section>
  );
}

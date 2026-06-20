import type { DashboardModel } from "./dashboardMetrics";
import { formatPercent } from "./formatters";

export function ProjectTimeline({ model }: { model: DashboardModel }) {
  return (
    <section className="dashboard-panel" aria-labelledby="timeline-title">
      <div className="section-heading-row">
        <h2 id="timeline-title">计划时间轴</h2>
        <span>
          {model.timelineRange.startDate} 至 {model.timelineRange.endDate}
        </span>
      </div>
      <div className="timeline-scroll">
        <div className="timeline-frame" aria-label="项目计划时间轴">
          <div className="timeline-axis" aria-hidden="true">
            <strong>当前日期：{model.today}</strong>
          </div>
          {model.tasks.map((task) => (
            <div className="timeline-row" key={task.id}>
              <div className="timeline-label">
                <strong>{task.milestoneCode}</strong>
                <span title={task.taskName}>{task.taskName}</span>
              </div>
              <div className="timeline-track">
                <div
                  className={`timeline-bar status-${task.dashboardStatus} warning-${task.warningState}`}
                  style={{
                    left: `${task.timeline.leftPercent}%`,
                    width: `${Math.max(task.timeline.widthPercent, 1.4)}%`,
                  }}
                  title={`${task.taskName}：${task.statusLabel}，完成 ${formatPercent(task.completionRatio)}`}
                >
                  <span className="timeline-percent">{formatPercent(task.completionRatio)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

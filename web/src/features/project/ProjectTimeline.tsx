import type { DashboardModel } from "./dashboardMetrics";

function progressPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

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
            <span>{model.timelineRange.startDate}</span>
            <strong>当前日期：{model.today}</strong>
            <span>{model.timelineRange.endDate}</span>
          </div>
          <div className="timeline-today-row">
            <div className="timeline-today-track" aria-label="当前日期位置">
              <div className="timeline-today" style={{ left: `${model.timelineRange.todayPercent}%` }}>
                当前日期
              </div>
            </div>
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
                  title={`${task.taskName}：${task.statusLabel}，完成 ${progressPercent(task.completionRatio)}`}
                >
                  <span>{progressPercent(task.completionRatio)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

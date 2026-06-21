import type { DashboardModel } from "./dashboardMetrics";

export function ProjectTimeline({ model }: { model: DashboardModel }) {
  return (
    <section className="dashboard-panel" aria-labelledby="timeline-title">
      <div className="section-heading-row">
        <h2 id="timeline-title">计划时间轴</h2>
        <span>
          {model.timelineRange.startDate} 至 {model.timelineRange.endDate}
        </span>
      </div>
      <div className="section-heading-row" style={{ marginTop: 8 }}>
        <span>当前日期：{model.today}</span>
        <div className="timeline-legend" aria-label="时间轴图示">
          <span>
            <i className="timeline-legend-plan" />
            计划周期
          </span>
          <span>
            <i className="timeline-legend-actual" />
            实际周期
          </span>
        </div>
      </div>
      <div className="timeline-scroll">
        <div className="timeline-frame" aria-label="项目计划时间轴">
          {model.tasks.map((task) => (
            <div className="timeline-row" key={task.id}>
              <div className="timeline-label">
                <strong>{task.milestoneCode}</strong>
                <span title={task.taskName}>{task.taskName}</span>
              </div>
              <div className="timeline-track">
                <div
                  className="timeline-bar-plan"
                  style={{
                    left: `${task.timeline.plan.leftPercent}%`,
                    width: `${Math.max(task.timeline.plan.widthPercent, 1.4)}%`,
                  }}
                  title={`${task.taskName}：${task.statusLabel}`}
                />
                {task.timeline.actual ? (
                  <div
                    className="timeline-bar-actual"
                    style={{
                      left: `${task.timeline.actual.leftPercent}%`,
                      width: `${Math.max(task.timeline.actual.widthPercent, 1.4)}%`,
                    }}
                    title={`${task.taskName} 实际周期：${task.actualStartDate} 至 ${task.actualEndDate ?? "进行中"}`}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

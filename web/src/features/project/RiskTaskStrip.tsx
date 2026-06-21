import type { DashboardTask } from "./dashboardMetrics";
import { tagClass } from "./TaskDetailTable";

function warningClass(task: DashboardTask): string {
  const text = task.riskLabels.join("");
  if (/超期|延期|已超期/.test(text)) return "warning-overdue";
  if (/延迟启动|今日到期|7日内到期/.test(text)) return "warning-start-delayed";
  if (/提前/.test(text)) return "warning-early";
  return `warning-${task.warningState}`;
}

export function RiskTaskStrip({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <section className="risk-strip" aria-labelledby="risk-strip-title">
      <h2 id="risk-strip-title" className="section-heading-row" style={{ justifyContent: "flex-start" }}>
        风险任务
        <span>{tasks.length} 项需关注</span>
      </h2>
      {tasks.length ? (
        <div className="risk-list">
          {tasks.map((task) => (
            <article
              className={`risk-pill ${warningClass(task)}`}
              key={task.id}
            >
              <strong>{task.milestoneCode}</strong>
              <span>{task.taskName}</span>
              <em>
                {task.riskLabels.map((label, index) => (
                  <span key={index} className={tagClass(label)}>{label}</span>
                ))}
              </em>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">当前没有延期、临期或延迟启动任务。</p>
      )}
    </section>
  );
}

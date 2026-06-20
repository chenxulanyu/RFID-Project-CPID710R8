import type { DashboardTask } from "./dashboardMetrics";
import { formatPercent } from "./formatters";

function actualPeriod(task: DashboardTask) {
  if (!task.actualStartDate && !task.actualEndDate) return "未开始";
  return `${task.actualStartDate ?? "-"} 至 ${task.actualEndDate ?? "进行中"}`;
}

export function TaskDetailTable({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <section className="dashboard-panel" aria-labelledby="task-table-title">
      <div className="section-heading-row">
        <h2 id="task-table-title">任务明细</h2>
        <span>按里程碑分组扫描</span>
      </div>
      <div className="table-scroll">
        <table className="task-table dashboard-task-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>项目内容</th>
              <th>任务名称</th>
              <th>计划周期</th>
              <th>实际周期</th>
              <th>完成比例</th>
              <th>状态</th>
              <th>责任人</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.milestoneCode}</td>
                <td className="cell-strong">{task.projectContent}</td>
                <td>{task.taskName}</td>
                <td>
                  {task.plannedStartDate} 至 {task.plannedEndDate}
                </td>
                <td>{actualPeriod(task)}</td>
                <td>
                  <span className="progress-cell">
                    <span className="progress-track" aria-hidden="true">
                      <span style={{ width: `${Math.round(task.completionRatio * 100)}%` }} />
                    </span>
                    {formatPercent(task.completionRatio)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${task.dashboardStatus} warning-${task.warningState}`}>
                    {task.riskLabel ?? task.statusLabel}
                  </span>
                </td>
                <td>{task.responsiblePerson}</td>
                <td>{task.remarks ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

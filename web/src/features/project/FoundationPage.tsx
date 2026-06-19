import { useEffect, useState } from "react";
import { getProjectProgress } from "../../services/projectService";
import type { ProjectProgressData } from "../../types/project";

export function FoundationPage() {
  const [data, setData] = useState<ProjectProgressData | null>(null);

  useEffect(() => {
    void getProjectProgress().then(setData);
  }, []);

  if (!data) {
    return <p>正在加载项目数据...</p>;
  }

  return (
    <section className="page-stack">
      <header>
        <p className="eyebrow">项目基础数据</p>
        <h1>{data.project.name}</h1>
        <p>
          计划周期：{data.project.plannedStartDate} 至 {data.project.plannedEndDate}
        </p>
      </header>

      <div className="summary-strip">
        <span>任务数：{data.tasks.length}</span>
        <span>数据源：Mock</span>
        <span>日历口径：自然日</span>
      </div>

      <table className="task-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>项目内容</th>
            <th>进度名称</th>
            <th>计划周期</th>
            <th>完成比例</th>
            <th>责任人</th>
          </tr>
        </thead>
        <tbody>
          {data.tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.milestoneCode}</td>
              <td>{task.projectContent}</td>
              <td>{task.taskName}</td>
              <td>
                {task.plannedStartDate} 至 {task.plannedEndDate}
              </td>
              <td>{Math.round(task.completionRatio * 100)}%</td>
              <td>{task.responsiblePerson}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

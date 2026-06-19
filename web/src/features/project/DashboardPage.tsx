import { useEffect, useState } from "react";
import { getProjectProgress } from "../../services/projectService";
import type { ProjectProgressData } from "../../types/project";
import { buildDashboardModel, type DashboardModel } from "./dashboardMetrics";
import { ProjectSummaryDashboard } from "./ProjectSummaryDashboard";
import { RiskTaskStrip } from "./RiskTaskStrip";
import { TaskDetailTable } from "./TaskDetailTable";

function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage({ today = getCurrentDateString() }: { today?: string }) {
  const [model, setModel] = useState<DashboardModel | null>(null);

  useEffect(() => {
    void getProjectProgress(today).then((data: ProjectProgressData) => {
      setModel(buildDashboardModel({ project: data.project, tasks: data.tasks, today }));
    });
  }, [today]);

  if (!model) {
    return <p>正在加载项目仪表盘...</p>;
  }

  return (
    <section className="dashboard-page">
      <ProjectSummaryDashboard model={model} />
      <RiskTaskStrip tasks={model.riskTasks} />
      <TaskDetailTable tasks={model.tasks} />
    </section>
  );
}

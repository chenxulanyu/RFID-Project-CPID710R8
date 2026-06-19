import { useEffect, useState } from "react";
import { getProjectProgress } from "../../services/projectService";
import type { ProjectProgressData } from "../../types/project";
import { buildDashboardModel, type DashboardModel } from "./dashboardMetrics";
import { LandscapeGate } from "./LandscapeGate";
import { ProjectSummaryDashboard } from "./ProjectSummaryDashboard";
import { ProjectTimeline } from "./ProjectTimeline";
import { RiskTaskStrip } from "./RiskTaskStrip";
import { TaskDetailTable } from "./TaskDetailTable";

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function getCurrentDateString(date = new Date()): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

export function DashboardPage({ today = getCurrentDateString() }: { today?: string }) {
  const [model, setModel] = useState<DashboardModel | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;

    setError(false);
    setModel(null);
    void getProjectProgress(today)
      .then((data: ProjectProgressData) => {
        if (!isActive) return;
        setModel(buildDashboardModel({ project: data.project, tasks: data.tasks, today }));
      })
      .catch(() => {
        if (!isActive) return;
        setError(true);
      });

    return () => {
      isActive = false;
    };
  }, [today]);

  if (error) {
    return <p role="alert">项目数据加载失败，请稍后重试。</p>;
  }

  if (!model) {
    return <p>正在加载项目仪表盘...</p>;
  }

  return (
    <LandscapeGate>
      <section className="dashboard-page">
        <ProjectSummaryDashboard model={model} />
        <RiskTaskStrip tasks={model.riskTasks} />
        <TaskDetailTable tasks={model.tasks} />
        <ProjectTimeline model={model} />
      </section>
    </LandscapeGate>
  );
}

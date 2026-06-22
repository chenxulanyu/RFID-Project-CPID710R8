import { useEffect, useState } from "react";
import { getProjectProgress } from "../../services/projectService";
import type { ProjectProgressData } from "../../types/project";
import { buildDashboardModel, type DashboardModel } from "./dashboardMetrics";
import { ProjectSummaryDashboard } from "./ProjectSummaryDashboard";
import { ProjectTimeline } from "./ProjectTimeline";
import { RiskTaskStrip } from "./RiskTaskStrip";
import { TaskDetailTable } from "./TaskDetailTable";
import { exportDashboardToPdf } from "../../utils/exportPdf";

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
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportDashboardToPdf();
    } catch (err) {
      console.error("PDF 导出失败：", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="dashboard-page">
      <ProjectSummaryDashboard model={model} />
      <RiskTaskStrip tasks={model.riskTasks} />
      <TaskDetailTable tasks={model.tasks} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <ProjectTimeline model={model} />
        <button
          className="export-pdf-btn"
          disabled={isExporting}
          onClick={handleExportPdf}
        >
          {isExporting ? "生成中…" : "导出PDF"}
        </button>
      </div>
    </section>
  );
}

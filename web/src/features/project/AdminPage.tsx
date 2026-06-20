import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectTaskInput } from "../../types/project";
import {
  archiveProjectTask,
  createProjectTask,
  deleteProjectTask,
  getAdminProjectData,
  restoreProjectTask,
  saveProjectMetadata,
  updateProjectTask,
} from "../../services/projectAdminService";
import { LocalProjectRepository, type ProjectRepository } from "../../services/projectRepository";

type TaskFilter = "active" | "archived";

function emptyTask(): ProjectTaskInput {
  return {
    id: "",
    milestoneCode: "",
    projectContent: "",
    taskName: "",
    plannedStartDate: "",
    plannedEndDate: "",
    resourceOwner: "",
    responsiblePerson: "",
  };
}

function hasTaskName(task: ProjectTaskInput): boolean {
  return typeof task.taskName === "string" && task.taskName.trim().length > 0;
}

function taskVisible(task: ProjectTaskInput, filter: TaskFilter) {
  if (filter === "archived") return Boolean(task.isArchived) && hasTaskName(task);
  return !task.isArchived && hasTaskName(task);
}

function percentToRatio(value: string): number | undefined {
  if (!value.trim()) return undefined;
  return Number(value) / 100;
}

function ratioToPercent(value: number | undefined): string {
  return value === undefined ? "" : String(Math.round(value * 100));
}

function optionalTaskValue(field: keyof ProjectTaskInput, value: string): string | undefined {
  return ["actualStartDate", "actualEndDate", "remarks"].includes(field) && value === "" ? undefined : value;
}

function sanitizeTaskForSave(task: ProjectTaskInput, isNewTask: boolean): ProjectTaskInput {
  const normalized = {
    ...task,
    manualCompletionRatio:
      task.manualCompletionRatio === undefined
        ? undefined
        : Math.min(Math.max(task.manualCompletionRatio, 0), 1),
  };
  if (isNewTask) {
    return { ...normalized, isArchived: false, archivedAt: undefined };
  }
  return normalized;
}

export function AdminPage({
  today = "2026-06-19",
  repository,
}: {
  today?: string;
  repository?: ProjectRepository;
}) {
  const activeRepository = useMemo(() => repository ?? new LocalProjectRepository(), [repository]);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTaskInput[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("active");
  const [selectedTask, setSelectedTask] = useState<ProjectTaskInput | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectEditEnabled, setProjectEditEnabled] = useState(false);

  useEffect(() => {
    let isActive = true;
    void getAdminProjectData(activeRepository).then((data) => {
      if (!isActive) return;
      setProject(data.project);
      setTasks(data.tasks);
      setSelectedTask(data.tasks.find((task) => !task.isArchived) ?? data.tasks[0] ?? emptyTask());
      setProjectEditEnabled(false);
    });
    return () => {
      isActive = false;
    };
  }, [activeRepository]);

  const visibleTasks = tasks.filter((task) => taskVisible(task, filter));

  function updateSelectedTask(field: keyof ProjectTaskInput, value: string) {
    setSelectedTask((current) => {
      if (!current) return current;
      if (field === "manualCompletionRatio") {
        return { ...current, manualCompletionRatio: percentToRatio(value) };
      }
      return { ...current, [field]: optionalTaskValue(field, value) };
    });
  }

  async function reload(selectTaskId?: string, nextFilter = filter) {
    const data = await getAdminProjectData(activeRepository);
    setProject(data.project);
    setTasks(data.tasks);
    setFilter(nextFilter);
    const nextTask =
      data.tasks.find((task) => task.id === selectTaskId) ??
      data.tasks.find((task) => taskVisible(task, nextFilter)) ??
      data.tasks[0] ??
      emptyTask();
    setSelectedTask(nextTask);
    setIsNewTask(false);
    setProjectEditEnabled(false);
  }

  async function handleProjectSave() {
    if (!project) return;
    setError(null);
    setMessage(null);
    try {
      const savedProject = await saveProjectMetadata(activeRepository, project);
      setProject(savedProject);
      await reload(selectedTask?.id);
      setMessage("项目信息已保存");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    }
  }

  async function handleTaskSave() {
    if (!selectedTask) return;
    setError(null);
    setMessage(null);
    try {
      const savedTask = isNewTask
        ? await createProjectTask(activeRepository, sanitizeTaskForSave(selectedTask, true))
        : await updateProjectTask(activeRepository, sanitizeTaskForSave(selectedTask, false));
      await reload(savedTask.id, savedTask.isArchived ? "archived" : "active");
      setMessage(isNewTask ? "任务信息已保存" : "任务信息已保存");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    }
  }

  async function handleArchive() {
    if (!selectedTask?.id) return;
    setError(null);
    setMessage(null);
    try {
      const archived = await archiveProjectTask(activeRepository, selectedTask.id, today);
      await reload(archived.id, "archived");
      setMessage("任务已归档");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "任务归档失败");
    }
  }

  async function handleRestore() {
    if (!selectedTask?.id) return;
    setError(null);
    setMessage(null);
    try {
      const restored = await restoreProjectTask(activeRepository, selectedTask.id);
      await reload(restored.id, "active");
      setMessage("任务已恢复");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "任务恢复失败");
    }
  }

  function autoAdjustProjectDates() {
    if (!project) return;
    const allTasks = tasks;
    const dates = allTasks
      .map((t) => t.plannedStartDate)
      .filter(Boolean)
      .sort();
    const startDate = dates.length > 0 ? dates[0] : project.plannedStartDate;
    const endDates = allTasks
      .map((t) => t.plannedEndDate)
      .filter(Boolean)
      .sort();
    const endDate = endDates.length > 0 ? endDates[endDates.length - 1] : project.plannedEndDate;
    if (startDate !== project.plannedStartDate || endDate !== project.plannedEndDate) {
      setProject({ ...project, plannedStartDate: startDate, plannedEndDate: endDate });
    }
  }

  async function handleDelete() {
    if (!selectedTask?.id) return;
    setError(null);
    setMessage(null);
    try {
      await deleteProjectTask(activeRepository, selectedTask.id);
      await reload(undefined, "archived");
      setMessage("任务已删除");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "任务删除失败");
    }
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <p className="eyebrow">Admin</p>
        <h1>后台进度维护</h1>
        <p>维护项目基础信息、任务计划、实际进度、手动完成比例和任务归档状态。</p>
      </div>

      <div className="admin-layout">
        <aside className="admin-panel">
          <div className="section-heading-row">
            <h2>任务列表</h2>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setSelectedTask(emptyTask());
                setIsNewTask(true);
                setError(null);
                setMessage(null);
              }}
            >
              新增任务
            </button>
          </div>
          <div className="admin-actions" aria-label="任务筛选">
            <button type="button" className={filter === "active" ? "primary-button" : "ghost-button"} onClick={() => setFilter("active")}>
              活跃任务
            </button>
            <button type="button" className={filter === "archived" ? "primary-button" : "ghost-button"} onClick={() => setFilter("archived")}>
              已归档
            </button>
          </div>
          <ul className="admin-task-list" aria-label="任务列表">
            {visibleTasks.map((task) => (
              <li key={task.id}>
                <button
                  className="admin-task-button"
                  type="button"
                  onClick={() => {
                    setSelectedTask(task);
                    setIsNewTask(false);
                    setError(null);
                    setMessage(null);
                  }}
                >
                  <strong>{task.taskName}</strong>
                  <span>
                    {task.id} · {task.milestoneCode} · {task.responsiblePerson}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="admin-panels">
          {project ? (
            <section className="admin-panel admin-section">
              <div className="section-heading-row">
                <h2>项目信息</h2>
                <label className="admin-guard">
                  <input
                    type="checkbox"
                    checked={projectEditEnabled}
                    onChange={(event) => {
                    const next = event.target.checked;
                    setProjectEditEnabled(next);
                    if (!next) autoAdjustProjectDates();
                  }}
                  />
                  <span>确认修改项目信息</span>
                </label>
              </div>
              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>项目名称</span>
                  <input
                    disabled={!projectEditEnabled}
                    value={project.name}
                    onChange={(event) => setProject({ ...project, name: event.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span>项目计划开始</span>
                  <input
                    disabled={!projectEditEnabled}
                    type="date"
                    value={project.plannedStartDate}
                    onChange={(event) => setProject({ ...project, plannedStartDate: event.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span>项目计划结束</span>
                  <input
                    disabled={!projectEditEnabled}
                    type="date"
                    value={project.plannedEndDate}
                    onChange={(event) => setProject({ ...project, plannedEndDate: event.target.value })}
                  />
                </label>
              </div>
              <div className="admin-actions admin-actions-left">
                <button className="primary-button" type="button" onClick={handleProjectSave}>
                  保存项目信息
                </button>
              </div>
            </section>
          ) : null}

          {selectedTask ? (
            <section className="admin-panel admin-section">
              <div className="section-heading-row">
                <h2>任务详情</h2>
              </div>
              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>任务 ID</span>
                  <input value={selectedTask.id} onChange={(event) => updateSelectedTask("id", event.target.value)} disabled={!isNewTask} />
                </label>
                <label className="admin-field">
                  <span>里程碑</span>
                  <input value={selectedTask.milestoneCode} onChange={(event) => updateSelectedTask("milestoneCode", event.target.value)} />
                </label>
                <label className="admin-field admin-field-wide">
                  <span>项目内容</span>
                  <input value={selectedTask.projectContent} onChange={(event) => updateSelectedTask("projectContent", event.target.value)} />
                </label>
                <label className="admin-field admin-field-wide">
                  <span>任务名称</span>
                  <input value={selectedTask.taskName} onChange={(event) => updateSelectedTask("taskName", event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>计划开始</span>
                  <input type="date" value={selectedTask.plannedStartDate} onChange={(event) => updateSelectedTask("plannedStartDate", event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>计划结束</span>
                  <input type="date" value={selectedTask.plannedEndDate} onChange={(event) => updateSelectedTask("plannedEndDate", event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>实际开始</span>
                  <input type="date" value={selectedTask.actualStartDate ?? ""} onChange={(event) => updateSelectedTask("actualStartDate", event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>实际结束</span>
                  <input type="date" value={selectedTask.actualEndDate ?? ""} onChange={(event) => updateSelectedTask("actualEndDate", event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>手动完成比例</span>
                  <input
                    inputMode="numeric"
                    placeholder="0-100"
                    value={ratioToPercent(selectedTask.manualCompletionRatio)}
                    onChange={(event) => updateSelectedTask("manualCompletionRatio", event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>资源方</span>
                  <input value={selectedTask.resourceOwner} onChange={(event) => updateSelectedTask("resourceOwner", event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>责任人</span>
                  <input value={selectedTask.responsiblePerson} onChange={(event) => updateSelectedTask("responsiblePerson", event.target.value)} />
                </label>
                <label className="admin-field admin-field-wide">
                  <span>备注</span>
                  <textarea value={selectedTask.remarks ?? ""} onChange={(event) => updateSelectedTask("remarks", event.target.value)} />
                </label>
              </div>

              <div className="admin-actions admin-actions-left">
                <button className="primary-button" type="button" onClick={handleTaskSave}>
                  保存任务信息
                </button>
                {!isNewTask && !selectedTask.isArchived ? (
                  <button className="danger-button" type="button" onClick={handleArchive}>
                    归档任务
                  </button>
                ) : null}
                {!isNewTask && selectedTask.isArchived ? (
                  <button className="ghost-button" type="button" onClick={handleRestore}>
                    恢复任务
                  </button>
                ) : null}
                {!isNewTask && selectedTask.isArchived ? (
                  <button className="danger-button" type="button" onClick={handleDelete}>
                    删除任务
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {error ? (
            <div className="admin-message error" role="alert">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="admin-message success" role="status">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

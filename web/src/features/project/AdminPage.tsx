import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectTaskInput } from "../../types/project";
import {
  archiveProjectTask,
  createProjectTask,
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

function taskVisible(task: ProjectTaskInput, filter: TaskFilter) {
  return filter === "archived" ? Boolean(task.isArchived) : !task.isArchived;
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

  useEffect(() => {
    let isActive = true;
    void getAdminProjectData(activeRepository).then((data) => {
      if (!isActive) return;
      setProject(data.project);
      setTasks(data.tasks);
      setSelectedTask(data.tasks.find((task) => !task.isArchived) ?? data.tasks[0] ?? emptyTask());
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
  }

  async function handleProjectSave() {
    if (!project) return;
    setError(null);
    setMessage(null);
    try {
      const saved = await saveProjectMetadata(activeRepository, project);
      setProject(saved);
      setMessage("项目已保存");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "项目保存失败");
    }
  }

  async function handleTaskSave() {
    if (!selectedTask) return;
    setError(null);
    setMessage(null);
    try {
      const saved = isNewTask
        ? await createProjectTask(activeRepository, selectedTask)
        : await updateProjectTask(activeRepository, selectedTask);
      await reload(saved.id, saved.isArchived ? "archived" : "active");
      setMessage("任务已保存");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "任务保存失败");
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

          <div className="admin-panel">
            {project ? (
              <div className="admin-section">
                <h2>项目信息</h2>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>项目名称</span>
                    <input value={project.name} onChange={(event) => setProject({ ...project, name: event.target.value })} />
                  </label>
                  <label className="admin-field">
                    <span>项目计划开始</span>
                    <input
                      type="date"
                      value={project.plannedStartDate}
                      onChange={(event) => setProject({ ...project, plannedStartDate: event.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span>项目计划结束</span>
                    <input
                      type="date"
                      value={project.plannedEndDate}
                      onChange={(event) => setProject({ ...project, plannedEndDate: event.target.value })}
                    />
                  </label>
                </div>
                <div className="admin-actions">
                  <button className="primary-button" type="button" onClick={handleProjectSave}>
                    保存项目
                  </button>
                </div>
              </div>
            ) : null}

            {selectedTask ? (
              <div className="admin-section">
                <h2>任务详情</h2>
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

                <div className="admin-actions">
                  <button className="primary-button" type="button" onClick={handleTaskSave}>
                    保存任务
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
                </div>
              </div>
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

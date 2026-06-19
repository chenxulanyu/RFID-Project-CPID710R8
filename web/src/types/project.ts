export type WarningState = "none" | "due-today" | "within-week" | "future" | "overdue";

export interface Project {
  id: string;
  name: string;
  plannedStartDate: string;
  plannedEndDate: string;
  calendarMode: "calendar-days" | "workdays";
}

export interface ProjectTaskInput {
  id: string;
  milestoneCode: string;
  projectContent: string;
  taskName: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  resourceOwner: string;
  responsiblePerson: string;
  remarks?: string;
}

export interface ProjectTask extends ProjectTaskInput {
  plannedDurationDays: number;
  actualDurationDays?: number;
  elapsedDays: number | "not-started" | "finished";
  completionRatio: number;
  overdueDays?: number;
  warningState: WarningState;
}

export interface ProjectProgressData {
  project: Project;
  tasks: ProjectTask[];
}

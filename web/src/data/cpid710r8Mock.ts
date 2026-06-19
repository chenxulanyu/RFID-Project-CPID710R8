import type { Project, ProjectTaskInput } from "../types/project";

export const cpid710r8Project: Project = {
  id: "cpid710r8",
  name: "CPID710R8 Check Point 定制读写器 - 开发进度管理",
  plannedStartDate: "2026-03-30",
  plannedEndDate: "2026-09-28",
  calendarMode: "calendar-days",
};

export const cpid710r8TaskInputs: ProjectTaskInput[] = [
  {
    id: "M1-001",
    milestoneCode: "M1",
    projectContent: "硬件方案确定",
    taskName: "硬件架构选型+关键器件确认",
    plannedStartDate: "2026-03-30",
    plannedEndDate: "2026-04-19",
    actualStartDate: "2026-03-30",
    actualEndDate: "2026-04-19",
    resourceOwner: "芯联",
    responsiblePerson: "周伟松/唐凯",
  },
  {
    id: "M5-002",
    milestoneCode: "M5",
    projectContent: "V1.0 PCBA打样",
    taskName: "PCB板/屏蔽盖/物料",
    plannedStartDate: "2026-06-05",
    plannedEndDate: "2026-06-16",
    actualStartDate: "2026-06-05",
    resourceOwner: "芯联",
    responsiblePerson: "林泳钦",
  },
  {
    id: "M6-001",
    milestoneCode: "M6",
    projectContent: "测试固件&驱动开发",
    taskName: "完成单片机测试固件",
    plannedStartDate: "2026-06-15",
    plannedEndDate: "2026-06-21",
    resourceOwner: "芯联",
    responsiblePerson: "邹青",
  },
];

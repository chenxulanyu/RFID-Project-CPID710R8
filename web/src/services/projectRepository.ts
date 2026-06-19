import { cpid710r8Project, cpid710r8TaskInputs } from "../data/cpid710r8Mock";
import type { Project, ProjectTaskInput } from "../types/project";

export interface ProjectRepository {
  getProject(): Promise<Project>;
  listTaskInputs(): Promise<ProjectTaskInput[]>;
}

export class MockProjectRepository implements ProjectRepository {
  async getProject(): Promise<Project> {
    return cpid710r8Project;
  }

  async listTaskInputs(): Promise<ProjectTaskInput[]> {
    return cpid710r8TaskInputs;
  }
}

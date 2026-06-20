import cloudbase from "@cloudbase/js-sdk";
import { CloudBaseProjectRepository, type CloudBaseDatabaseLike } from "./cloudbaseProjectRepository";
import { DefaultProjectRepository, type ProjectRepository } from "./projectRepository";

export type ProjectDataSource = "local" | "cloudbase";

export interface ProjectDataSourceConfig {
  source: ProjectDataSource;
  cloudbase?: {
    envId: string;
    accessKey?: string;
    projectId: string;
    projectsCollection: string;
    tasksCollection: string;
  };
}

export interface ProjectRepositoryFactoryDependencies {
  database?: CloudBaseDatabaseLike;
}

type EnvRecord = Record<string, string | undefined>;

const defaultProjectsCollection = "projects";
const defaultTasksCollection = "project_tasks";

export function readProjectDataSourceConfig(env: EnvRecord = import.meta.env): ProjectDataSourceConfig {
  if (env.VITE_CLOUDBASE_SECRET_ID || env.VITE_CLOUDBASE_SECRET_KEY) {
    throw new Error("CloudBase frontend config must not contain secretId or secretKey");
  }

  if (env.VITE_PROJECT_DATA_SOURCE !== "cloudbase") {
    return { source: "local" };
  }

  const envId = env.VITE_CLOUDBASE_ENV_ID;
  const projectId = env.VITE_CLOUDBASE_PROJECT_ID;
  if (!envId || !projectId) {
    return { source: "local" };
  }

  return {
    source: "cloudbase",
    cloudbase: {
      envId,
      accessKey: env.VITE_CLOUDBASE_ACCESS_KEY,
      projectId,
      projectsCollection: env.VITE_CLOUDBASE_PROJECTS_COLLECTION ?? defaultProjectsCollection,
      tasksCollection: env.VITE_CLOUDBASE_TASKS_COLLECTION ?? defaultTasksCollection,
    },
  };
}

function createCloudBaseDatabase(config: NonNullable<ProjectDataSourceConfig["cloudbase"]>): CloudBaseDatabaseLike {
  const app = cloudbase.init({
    env: config.envId,
    accessKey: config.accessKey,
  });
  return app.database() as CloudBaseDatabaseLike;
}

export function createProjectRepository(
  config: ProjectDataSourceConfig = readProjectDataSourceConfig(),
  dependencies: ProjectRepositoryFactoryDependencies = {},
): ProjectRepository {
  if (config.source !== "cloudbase" || !config.cloudbase) {
    return new DefaultProjectRepository();
  }

  return new CloudBaseProjectRepository({
    database: dependencies.database ?? createCloudBaseDatabase(config.cloudbase),
    projectId: config.cloudbase.projectId,
    projectsCollection: config.cloudbase.projectsCollection,
    tasksCollection: config.cloudbase.tasksCollection,
  });
}

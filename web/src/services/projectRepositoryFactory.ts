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
const defaultCloudBaseEnvId = "webtest-d1g5ir6tl69366b35";
const defaultCloudBaseAccessKey =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL3dlYnRlc3QtZDFnNWlyNnRsNjkzNjZiMzUuYXAtc2hhbmdoYWkudGNiLWFwaS50ZW5jZW50Y2xvdWRhcGkuY29tIiwic3ViIjoiYW5vbiIsImF1ZCI6IndlYnRlc3QtZDFnNWlyNnRsNjkzNjZiMzUiLCJleHAiOjQwODU2MDIzNjEsImlhdCI6MTc4MTkxOTE2MSwibm9uY2UiOiIzTVVjOGNMQlJ5T2txVmxORk8tbkp3IiwiYXRfaGFzaCI6IjNNVWM4Y0xCUnlPa3FWbE5GTy1uSnciLCJuYW1lIjoiQW5vbnltb3VzIiwic2NvcGUiOiJhbm9ueW1vdXMiLCJwcm9qZWN0X2lkIjoid2VidGVzdC1kMWc1aXI2dGw2OTM2NmIzNSIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJ1c2VyX3R5cGUiOiIiLCJjbGllbnRfdHlwZSI6ImNsaWVudF91c2VyIiwiaXNfc3lzdGVtX2FkbWluIjpmYWxzZX0.OenhuNoO7ihB4tvSHC0ajSSxhiVvbhEcrUJxMhsMTftJrqKO6QW_Ky0LlFMMdOUG50RHB9a3St_50iCSstsE37UpAaNT7pQlbJvM3twLXIZNi16St1v-2pOjY6VYBB5Uqh10nnJUqUmCwUZPBAuNzuyHxnCX6SQ7NJCQVey89M3IymdsjPPmB_3xUvzr5CGu014ai1Y3CKxf3Z6rAZCAVnSiKmcJekzNH68x-kBPdWifzL8EttpU-Z_Ww2yqp2wKcQ4zpC9i59O5GhbfbNWXBV4YXLur0GDwTLe5O3YPt2rIwDUGHDetmlFw6iGi-JU_4MSnmZ7b2QfunXJmaHsQ0Q";
const defaultProjectId = "cpid710r8";

export function readProjectDataSourceConfig(env: EnvRecord = import.meta.env): ProjectDataSourceConfig {
  if (env.VITE_CLOUDBASE_SECRET_ID || env.VITE_CLOUDBASE_SECRET_KEY) {
    throw new Error("CloudBase frontend config must not contain secretId or secretKey");
  }

  if (env.VITE_PROJECT_DATA_SOURCE === "local") {
    return { source: "local" };
  }

  const envId = env.VITE_CLOUDBASE_ENV_ID ?? defaultCloudBaseEnvId;
  const projectId = env.VITE_CLOUDBASE_PROJECT_ID ?? defaultProjectId;

  return {
    source: "cloudbase",
    cloudbase: {
      envId,
      accessKey: env.VITE_CLOUDBASE_ACCESS_KEY ?? defaultCloudBaseAccessKey,
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
  return app.database() as unknown as CloudBaseDatabaseLike;
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

import { describe, expect, it } from "vitest";
import { CloudBaseProjectRepository } from "./cloudbaseProjectRepository";
import { LocalProjectRepository } from "./projectRepository";
import { createProjectRepository, readProjectDataSourceConfig } from "./projectRepositoryFactory";

describe("project repository factory", () => {
  it("falls back to local repository when CloudBase config is missing", () => {
    const config = readProjectDataSourceConfig({});
    const repository = createProjectRepository(config);

    expect(config.source).toBe("local");
    expect(repository).toBeInstanceOf(LocalProjectRepository);
  });

  it("uses CloudBase repository when cloudbase config is complete", () => {
    const database = { collection: () => ({}) } as never;
    const config = readProjectDataSourceConfig({
      VITE_PROJECT_DATA_SOURCE: "cloudbase",
      VITE_CLOUDBASE_ENV_ID: "env-test",
      VITE_CLOUDBASE_ACCESS_KEY: "public-key",
      VITE_CLOUDBASE_PROJECT_ID: "cpid710r8",
      VITE_CLOUDBASE_PROJECTS_COLLECTION: "projects",
      VITE_CLOUDBASE_TASKS_COLLECTION: "project_tasks",
    });

    const repository = createProjectRepository(config, { database });

    expect(repository).toBeInstanceOf(CloudBaseProjectRepository);
  });

  it("rejects service-side secrets in frontend config", () => {
    expect(() =>
      readProjectDataSourceConfig({
        VITE_PROJECT_DATA_SOURCE: "cloudbase",
        VITE_CLOUDBASE_ENV_ID: "env-test",
        VITE_CLOUDBASE_SECRET_ID: "must-not-exist",
        VITE_CLOUDBASE_SECRET_KEY: "must-not-exist",
      }),
    ).toThrow("CloudBase frontend config must not contain secretId or secretKey");
  });
});

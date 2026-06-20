import { createProjectRepository } from "../../services/projectRepositoryFactory";
import { AdminPage } from "./AdminPage";
import { getCurrentDateString } from "./DashboardPage";

export function AdminPlaceholder() {
  return <AdminPage repository={createProjectRepository()} today={getCurrentDateString()} />;
}

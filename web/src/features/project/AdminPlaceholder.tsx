import { AdminPage } from "./AdminPage";
import { getCurrentDateString } from "./DashboardPage";

export function AdminPlaceholder() {
  return <AdminPage today={getCurrentDateString()} />;
}

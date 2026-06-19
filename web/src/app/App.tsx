import { AdminPlaceholder } from "../features/project/AdminPlaceholder";
import { DashboardPage } from "../features/project/DashboardPage";

function getPathname() {
  return window.location.pathname;
}

export function App() {
  const pathname = getPathname();

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="主导航">
        <a href="/">项目仪表盘</a>
        <a href="/admin">后台维护</a>
      </nav>
      {pathname === "/admin" ? <AdminPlaceholder /> : <DashboardPage />}
    </main>
  );
}

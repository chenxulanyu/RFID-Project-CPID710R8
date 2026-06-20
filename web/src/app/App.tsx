import { AdminPlaceholder } from "../features/project/AdminPlaceholder";
import { DashboardPage } from "../features/project/DashboardPage";
import { LandscapeGate } from "../features/project/LandscapeGate";

function getPathname() {
  return window.location.pathname;
}

export function App() {
  const pathname = getPathname();

  return (
    <LandscapeGate>
      <main className="app-shell">
        <nav className="top-nav" aria-label="主导航">
          <a href="/">项目仪表盘</a>
          <a href="/admin">后台维护</a>
        </nav>
        {pathname === "/admin" ? <AdminPlaceholder /> : <DashboardPage />}
      </main>
    </LandscapeGate>
  );
}

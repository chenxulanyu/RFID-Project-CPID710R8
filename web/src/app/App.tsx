import { AdminPlaceholder } from "../features/project/AdminPlaceholder";
import { FoundationPage } from "../features/project/FoundationPage";

function getPathname() {
  return window.location.pathname;
}

export function App() {
  const pathname = getPathname();

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="主导航">
        <a href="/">项目基础</a>
        <a href="/admin">后台占位</a>
      </nav>
      {pathname === "/admin" ? <AdminPlaceholder /> : <FoundationPage />}
    </main>
  );
}

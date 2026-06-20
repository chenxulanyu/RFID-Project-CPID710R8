import type { ReactNode } from "react";

export function LandscapeGate({ children }: { children: ReactNode }) {
  return (
    <div className="landscape-shell">
      <div className="landscape-content">{children}</div>
    </div>
  );
}

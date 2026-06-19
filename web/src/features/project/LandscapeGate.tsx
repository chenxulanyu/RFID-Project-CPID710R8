import type { ReactNode } from "react";

export function LandscapeGate({ children }: { children: ReactNode }) {
  return (
    <>
      <aside className="landscape-gate" aria-label="移动端横屏提示">
        <h1>建议横屏查看</h1>
        <p>项目任务表和计划时间轴信息较多，请旋转手机以查看完整仪表盘。</p>
      </aside>
      <div className="landscape-content">{children}</div>
    </>
  );
}

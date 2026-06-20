import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectProgress } from "../../services/projectService";
import { DashboardPage, getCurrentDateString } from "./DashboardPage";

vi.mock("../../services/projectService", () => ({
  getProjectProgress: vi.fn(async () => {
    const actual = await vi.importActual<typeof import("../../services/projectService")>(
      "../../services/projectService",
    );
    return actual.getProjectProgress("2026-06-19");
  }),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(getProjectProgress).mockClear();
    vi.mocked(getProjectProgress).mockImplementation(async () => {
      const actual = await vi.importActual<typeof import("../../services/projectService")>(
        "../../services/projectService",
      );
      return actual.getProjectProgress("2026-06-19");
    });
  });

  it("renders project summary KPI cards", async () => {
    render(<DashboardPage today="2026-06-19" />);

    expect(await screen.findByText(/CPID710R8 Check Point/)).toBeInTheDocument();
    expect(screen.getByText("总体进度")).toBeInTheDocument();
    expect(screen.getByText("任务总数")).toBeInTheDocument();
    expect(screen.getByText("延迟启动")).toBeInTheDocument();
  });

  it("renders risk tasks and task detail fields", async () => {
    render(<DashboardPage today="2026-06-19" />);

    expect(await screen.findByText("风险任务")).toBeInTheDocument();
    expect(screen.getAllByText("PCB板/屏蔽盖/物料").length).toBeGreaterThan(0);
    expect(screen.getAllByText("延期3天").length).toBeGreaterThan(0);
    expect(screen.getAllByText("完成单片机测试固件").length).toBeGreaterThan(0);
    expect(screen.getAllByText("延迟启动").length).toBeGreaterThan(0);
  });

  it("renders the project timeline", async () => {
    render(<DashboardPage today="2026-06-19" />);

    const timeline = await screen.findByRole("region", { name: "计划时间轴" });
    expect(within(timeline).getByText("硬件架构选型+关键器件确认")).toBeInTheDocument();
    expect(within(timeline).getByText("当前日期")).toBeInTheDocument();
  });

  it("positions the current date marker against the timeline track", async () => {
    render(<DashboardPage today="2026-06-29" />);

    const timeline = await screen.findByRole("region", { name: "计划时间轴" });
    const markerTrack = within(timeline).getByLabelText("当前日期位置");
    expect(markerTrack).toHaveClass("timeline-today-track");
    expect(within(markerTrack).getByText("当前日期")).toHaveStyle({
      left: "49.72677595628415%",
    });
  });

  it("renders the dashboard without the old mobile landscape guidance", async () => {
    render(<DashboardPage today="2026-06-19" />);

    expect(await screen.findByText(/CPID710R8 Check Point/)).toBeInTheDocument();
    expect(screen.queryByText("建议横屏查看")).not.toBeInTheDocument();
  });

  it("formats the default current date from local calendar fields", () => {
    const date = new Date(2026, 5, 19, 1, 2, 3);

    expect(getCurrentDateString(date)).toBe("2026-06-19");
  });

  it("shows an error message when project data loading fails", async () => {
    vi.mocked(getProjectProgress).mockRejectedValueOnce(new Error("network down"));

    render(<DashboardPage today="2026-06-19" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("项目数据加载失败");
  });
});

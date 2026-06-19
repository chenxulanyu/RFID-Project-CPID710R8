import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
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

  it("includes mobile landscape guidance", async () => {
    render(<DashboardPage today="2026-06-19" />);

    expect(await screen.findByText("建议横屏查看")).toBeInTheDocument();
  });
});

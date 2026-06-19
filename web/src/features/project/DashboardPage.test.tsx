import { render, screen } from "@testing-library/react";
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
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AdminPage } from "./AdminPage";

describe("AdminPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders project metadata and a left-list right-detail task editor", async () => {
    render(<AdminPage today="2026-06-19" />);

    expect(await screen.findByRole("heading", { name: "后台进度维护" })).toBeInTheDocument();
    expect(document.querySelector(".landscape-shell")).toBeInTheDocument();
    expect(screen.queryByText("建议横屏查看")).not.toBeInTheDocument();
    expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "任务列表" })).toBeInTheDocument();
    expect(screen.getByLabelText("任务名称")).toBeInTheDocument();
  });

  it("saves a task update and shows a success message", async () => {
    render(<AdminPage today="2026-06-19" />);

    const taskName = await screen.findByLabelText("任务名称");
    fireEvent.change(taskName, { target: { value: "更新后的任务名称" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务" }));

    expect(await screen.findByRole("status")).toHaveTextContent("任务已保存");
    expect(screen.getByText("更新后的任务名称")).toBeInTheDocument();
  });

  it("shows validation errors for invalid planned dates", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.change(await screen.findByLabelText("计划开始"), { target: { value: "2026-06-10" } });
    fireEvent.change(screen.getByLabelText("计划结束"), { target: { value: "2026-06-01" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("计划结束日期不能早于开始日期");
  });

  it("shows validation errors after clearing a required text field", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.change(await screen.findByLabelText("任务名称"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("任务名称不能为空");
  });

  it("creates, archives, and restores a task", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.click(await screen.findByRole("button", { name: "新增任务" }));
    fireEvent.change(screen.getByLabelText("任务 ID"), { target: { value: "NEW-001" } });
    fireEvent.change(screen.getByLabelText("里程碑"), { target: { value: "M9" } });
    fireEvent.change(screen.getByLabelText("项目内容"), { target: { value: "新增内容" } });
    fireEvent.change(screen.getByLabelText("任务名称"), { target: { value: "新增后台任务" } });
    fireEvent.change(screen.getByLabelText("计划开始"), { target: { value: "2026-07-01" } });
    fireEvent.change(screen.getByLabelText("计划结束"), { target: { value: "2026-07-05" } });
    fireEvent.change(screen.getByLabelText("资源方"), { target: { value: "芯联" } });
    fireEvent.change(screen.getByLabelText("责任人"), { target: { value: "负责人" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务" }));

    expect(await screen.findByText("新增后台任务")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "归档任务" }));
    expect(await screen.findByRole("status")).toHaveTextContent("任务已归档");
    fireEvent.click(screen.getByRole("button", { name: "已归档" }));
    const archivedList = screen.getByRole("list", { name: "任务列表" });
    expect(within(archivedList).getByText("新增后台任务")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "恢复任务" }));
    expect(await screen.findByRole("status")).toHaveTextContent("任务已恢复");
    fireEvent.click(screen.getByRole("button", { name: "活跃任务" }));
    expect(screen.getByText("新增后台任务")).toBeInTheDocument();
  });
});

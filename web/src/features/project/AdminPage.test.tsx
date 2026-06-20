import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AdminPage } from "./AdminPage";

describe("AdminPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("locks project metadata until editing is confirmed", async () => {
    render(<AdminPage today="2026-06-19" />);

    expect(await screen.findByRole("heading", { name: "后台进度维护" })).toBeInTheDocument();
    expect(screen.getByLabelText("项目名称")).toBeDisabled();
    expect(screen.getByLabelText("项目计划开始")).toBeDisabled();
    expect(screen.getByLabelText("项目计划结束")).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "确认修改项目信息" }));

    expect(screen.getByLabelText("项目名称")).toBeEnabled();
    expect(screen.getByLabelText("项目计划开始")).toBeEnabled();
    expect(screen.getByLabelText("项目计划结束")).toBeEnabled();
  });

  it("saves project metadata independently from task details", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.click(await screen.findByRole("checkbox", { name: "确认修改项目信息" }));
    fireEvent.change(screen.getByLabelText("项目名称"), { target: { value: "更新后的项目名称" } });
    fireEvent.click(screen.getByRole("button", { name: "保存项目信息" }));

    expect(await screen.findByRole("status")).toHaveTextContent("项目信息已保存");
    expect(screen.getByDisplayValue("更新后的项目名称")).toBeInTheDocument();
  });

  it("saves task details independently from project metadata", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.change(await screen.findByLabelText("任务名称"), { target: { value: "更新后的任务名称" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务信息" }));

    expect(await screen.findByRole("status")).toHaveTextContent("任务信息已保存");
    expect(screen.getByDisplayValue("更新后的任务名称")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "保存任务信息" }));

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

  it("shows validation errors after clearing a required text field", async () => {
    render(<AdminPage today="2026-06-19" />);

    fireEvent.change(await screen.findByLabelText("任务名称"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "保存任务信息" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("任务名称不能为空");
  });
});

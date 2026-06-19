import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App routing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("renders the project dashboard page", async () => {
    window.history.pushState({}, "", "/");
    render(<App />);

    expect(await screen.findByText(/CPID710R8 Check Point/)).toBeInTheDocument();
    expect(screen.getByText("总体进度")).toBeInTheDocument();
  });

  it("renders admin maintenance page", async () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "后台进度维护" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增任务" })).toBeInTheDocument();
  });

  it("uses the current local date when archiving from the admin route", async () => {
    vi.setSystemTime(new Date(2026, 5, 20, 9, 0, 0));
    window.history.pushState({}, "", "/admin");
    render(<App />);

    await screen.findByRole("heading", { name: "后台进度维护" });
    fireEvent.click(screen.getByRole("button", { name: "归档任务" }));

    await screen.findByRole("status");
    const raw = window.localStorage.getItem("cpid710r8-project-progress");
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw ?? "{}") as { tasks?: Array<{ id: string; archivedAt?: string }> };
    expect(data.tasks?.find((task) => task.id === "M1-001")?.archivedAt).toBe("2026-06-20");
  });
});

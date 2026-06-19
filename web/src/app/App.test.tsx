import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("App routing", () => {
  afterEach(() => {
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
});

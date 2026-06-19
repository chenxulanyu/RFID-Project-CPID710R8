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

  it("renders admin placeholder without edit controls", () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(screen.getByRole("heading", { name: "后台维护占位" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /保存|编辑|新增/ })).not.toBeInTheDocument();
  });
});

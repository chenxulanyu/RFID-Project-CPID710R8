import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("styles", () => {
  it("uses seven width-filling metric card columns on desktop", () => {
    expect(styles).toMatch(/\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(128px,\s*1fr\)\)/s);
    expect(styles).toMatch(/\.metric-grid\s*\{[^}]*width:\s*100%/s);
  });

  it("keeps the metric grid as one row on mobile layout", () => {
    expect(styles).not.toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.metric-grid\s*\{[^}]*repeat\(2,/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(112px,\s*1fr\)\)/);
  });

  it("keeps admin right-side sections at natural height", () => {
    expect(styles).toMatch(/\.admin-panels\s*\{[^}]*align-content:\s*start[^}]*align-items:\s*start[^}]*\}/s);
  });

  it("keeps the admin task list bounded with internal scrolling", () => {
    expect(styles).toMatch(/\.admin-layout\s*>\s*\.admin-panel\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*220px\)/s);
    expect(styles).toMatch(/\.admin-task-list\s*\{[^}]*overflow:\s*auto[^}]*\}/s);
  });
});

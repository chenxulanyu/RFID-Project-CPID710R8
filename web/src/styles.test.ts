import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("styles", () => {
  it("uses content-aware metric card columns on desktop", () => {
    expect(styles).toMatch(
      /\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(min-content,\s*max-content\)\)/s,
    );
  });

  it("keeps admin right-side sections at natural height", () => {
    expect(styles).toMatch(/\.admin-panels\s*\{[^}]*align-content:\s*start[^}]*align-items:\s*start[^}]*\}/s);
  });
});

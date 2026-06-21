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

  it("uses a dedicated visible warning style for delayed-start risks", () => {
    expect(styles).toMatch(/\.warning-start-delayed\s*\{[^}]*background:\s*#fff7db[^}]*border-color:\s*#e0b341[^}]*color:\s*#735500[^}]*\}/s);
  });

  it("keeps overdue warnings on the red-orange palette", () => {
    expect(styles).toMatch(/\.warning-overdue\s*\{[^}]*background:\s*#fff1ed[^}]*border-color:\s*#db6b5f[^}]*color:\s*#8b3f35[^}]*\}/s);
  });

  it("styles early deviations with a green palette", () => {
    expect(styles).toMatch(/\.tag-early\s*\{[^}]*background:\s*#edf7ee[^}]*color:\s*#2f6b3f[^}]*\}/s);
  });

  it("styles overdue tag with a red-orange palette", () => {
    expect(styles).toMatch(/\.tag-overdue\s*\{[^}]*background:\s*#fff1ed[^}]*color:\s*#8b3f35[^}]*\}/s);
  });

  it("right-aligns duration cells", () => {
    expect(styles).toMatch(/\.duration-cell\s*\{[^}]*text-align:\s*right[^}]*white-space:\s*nowrap[^}]*\}/s);
  });

  it("keeps admin right-side sections at natural height", () => {
    expect(styles).toMatch(/\.admin-panels\s*\{[^}]*align-content:\s*start[^}]*align-items:\s*start[^}]*\}/s);
  });

  it("lets the admin task panel stretch to the right column while the list scrolls internally", () => {
    expect(styles).not.toMatch(/\.admin-layout\s*>\s*\.admin-panel\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*220px\)/s);
    expect(styles).toMatch(/\.admin-layout\s*>\s*\.admin-panel\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0[^}]*\}/s);
    expect(styles).toMatch(/\.admin-layout\s*>\s*\.admin-panel\s*\{[^}]*overflow:\s*hidden[^}]*\}/s);
    expect(styles).toMatch(/\.admin-task-list\s*\{[^}]*overflow:\s*auto[^}]*\}/s);
  });
});

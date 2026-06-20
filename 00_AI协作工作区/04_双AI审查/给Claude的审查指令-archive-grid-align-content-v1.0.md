# Claude Code 审查指令：archive-grid-align-content-v1.0

请作为只读 Reviewer 审查本次归档列表间距修复。注意：这次不是 CloudBase 数据过滤问题，而是后台维护左侧任务列表的 CSS Grid 行轨道被拉伸问题。

## 背景
用户重新部署后截图显示：已归档列表中有 3 个有效条目，内容分别类似：
- `12` / `12 · 12 · 12`
- `44` / `44 · 44 · 44`
- `55` / `55 · 55 · 55`

条目不是空数据，但它们之间出现巨大纵向间隔。此前围绕 `taskName` 空值过滤的修复方向不完整，因为截图证明列表项有内容。

## 根因假设
`.admin-task-list` 是 CSS Grid 容器，同时在左侧 `.admin-panel` flex column 中设置了 `flex: 1`，占满剩余高度。Grid 默认 `align-content: normal/stretch`，当容器高度大于网格内容总高度时，会拉伸自动行轨道，导致少量归档条目被纵向分散，看起来像“中间隔了很多空任务”。

## 本次改动
### 1. `web/src/styles.css`
在 `.admin-task-list` 中新增：

```css
align-content: start;
```

目标：让 grid 行轨道贴顶部紧凑排列，仍保留 `flex: 1` 和 `overflow: auto`，不破坏左侧列表区域高度。

### 2. `web/src/features/project/AdminPage.test.tsx`
新增回归测试：

```ts
it("keeps the archived task list rows packed at the top", () => {
  const styles = readFileSync(stylesPath, "utf8");
  const listRuleStart = styles.indexOf(".admin-task-list");
  const listRules = styles.slice(listRuleStart, listRuleStart + 200);

  expect(listRuleStart).toBeGreaterThanOrEqual(0);
  expect(listRules).toContain("align-content: start");
});
```

并在测试文件顶部用单文件 `/// <reference types="node" />` 支持 Node fs/path/url 类型，避免修改全局 tsconfig。

## 已验证命令
```bash
npm test --workspace web -- AdminPage.test.tsx
npm test --workspace web
npm run build --workspace web
```
结果：
- AdminPage focused: 8/8 通过
- 全量测试：13 files / 81 tests 通过
- build 通过

## 请重点审查
1. `align-content: start` 是否确实对应截图中的 CSS Grid 行距被拉伸问题。
2. 该修复是否应该保留 `flex: 1`，避免左侧列表高度回退到过短。
3. 是否有比 `align-content: start` 更合适的 CSS，如 `align-items`、`grid-auto-rows`、改 `display` 为 flex 等；如果没有，请说明当前方案是否最小。
4. 测试读取 CSS 文件的方式是否可接受：只在测试文件局部声明 Node types，不修改 tsconfig，不新增依赖。
5. 是否需要回退或保留之前已提交的 `taskName` 数据过滤防御（本次改动不触碰那部分）。

请给出结论：通过 / 有条件通过 / 不通过，并指出阻塞问题。

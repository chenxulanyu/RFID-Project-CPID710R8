# Codex 开发流程铁律

**最后更新：2026-06-20**

## 核心原则

Codex 在此项目中既是 Planner 又是 Implementer。所有代码修改必须严格遵循 Comet + 双 AI 审查流程，**任何情况不得跳过**。

## 代码修改强制流程

```
1. Comet Open（创建变更）
2. Comet Design（深度设计，产出 design.md）
3. TDD（先写测试，再写实现）
4. 实现代码
5. npm test + npm run build（本地验证）
6. 【等待】生成 Claude Code 审查指令给用户
7. 【等待】Claude Code 审查通过
8. 修复审查问题（如有，回到步骤 5）
9. 归档变更
10. git commit + git push
```

## 绝对禁止

- ❌ **审查通过前推送代码** — 这是最严重的违规。必须在 Claude Code 审查通过后才能推送。
- ❌ 跳过 TDD 写实现代码
- ❌ 跳过构建验证就声称完成
- ❌ 未经用户确认擅自修改 Comet 工作区或 Claude 专属文件
- ❌ 修改扣子部署相关文件（.coze、根目录 package.json、serve.mjs）

## 每次代码修改检查清单

在提交前自查：
- [ ] 测试全绿？（npm test --workspace web）
- [ ] 构建通过？（npm run build --workspace web）
- [ ] Claude Code 审查通过？
- [ ] 审查报告已写入 00_AI协作工作区/04_双AI审查/？
- [ ] CHANGELOG 已更新？
- [ ] VERSION 已更新？

## 推送时机

只有满足以下全部条件才能推送：
1. Claude Code 审查结果为"通过 ✅"
2. 变更已归档（.openspec.yaml phase 为 archived）
3. 用户明确说"推送"或"部署"

## 给用户的 Claude Code 审查指令模板

每次代码修改完成后，自动生成如下格式的指令：

```
请审查 Git 提交 <commit-hash>，修复范围：<简述>。

改动文件：<文件列表>
验证：npm test --workspace web（<N>/<N> 通过），npm run build --workspace web（通过）。
审查报告写入 00_AI协作工作区/04_双AI审查/Claude审查-<change-name>-v<version>.md
```

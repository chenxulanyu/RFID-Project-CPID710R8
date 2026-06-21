# Codex 开发流程铁律

> **本文件已被全局 skill `cc-codex-workflow` 和项目组规范文档取代。**
> 完整流程参见：
> - Codex Skill: `cc-codex-workflow`（Codex 自动加载）
> - 项目组规范: `/Users/mac/Vibe Coding/CC+Codex共创项目组/开发流程规范.md`

## 核心原则（简化版）

Codex 在此项目中既是 Planner 又是 Implementer。所有代码修改必须严格遵循 Comet + 双 AI 审查流程。

## 代码修改强制流程（速查）

```
1. Comet Open（创建变更）
2. Comet Design（深度设计）
3. TDD + 实现 + npm run build
4. Codex 自检
5. 【等待】生成 Claude Code 审查指令 → git commit
6. 【等待】Claude Code 审查通过
7. 修复审查问题（如有）
8. Comet Verify → Comet Archive
9. git push gitee main && git push github main
10. 扣子部署
```

## 绝对禁止

- ❌ 审查通过前推送代码
- ❌ 跳过 build 验证
- ❌ 修改无关代码
- ❌ 改动人家的扣子部署文件

## 审查文件路径

- 审查指令: `00_AI协作工作区/04_双AI审查/给Claude的审查指令-<name>-v<version>.md`
- 审查报告: `00_AI协作工作区/04_双AI审查/Claude审查-<name>-v<version>.md`
- 修复回应: `00_AI协作工作区/04_双AI审查/Codex修复回应-<name>-v<version>.md`

# Brainstorm Summary

- Change: web-app-foundation
- Date: 2026-06-19

## 已确认事实

- 用户计划网站部署在扣子，项目数据保存在腾讯云 CloudBase。
- 用户不确定具体前端技术栈，希望 Codex 根据扣子部署和 CloudBase 支持情况判断。
- 已查官方资料：CloudBase 静态网站托管支持 React、Vue、Vite、Next.js、Nuxt、Angular 等前端项目；CloudBase React(Vite) 文档提供 Web SDK 集成路径。
- 用户已确认首版采用 React + Vite + TypeScript。
- 用户已确认首版基础工程预留 `/admin` 占位路由，但实际编辑能力由 `admin-progress-backend` 实现。

## 候选技术方案

- 已选方案：React + Vite + TypeScript 静态 SPA，使用 CloudBase Web SDK 或后续 CloudBase 适配器访问数据。
- 备选：Next.js + TypeScript，仅在需要 SSR、服务端 API 路由或更复杂部署能力时采用。
- 备选：Vue 3 + TypeScript，仅在用户明确偏好 Vue 生态时采用。

## 确认的技术方案

首版基础工程采用 React + Vite + TypeScript 静态 SPA。工程输出静态构建产物，适配扣子网页部署路径；数据访问通过统一 service/repository 抽象，首版使用 mock/local repository，后续由 CloudBase adapter 替换。

基础工程包含 `/` 项目基础展示入口和 `/admin` 占位路由。`/admin` 只稳定导航与工程边界，不实现真实编辑、保存、权限或 CloudBase 写入能力；这些能力由后续 `admin-progress-backend` 和 `cloudbase-persistence` changes 实现。

## 关键取舍与风险

- React + Vite 输出静态 `dist`，对扣子网页应用部署和 CloudBase 静态托管都更稳，避免依赖长期 Node 服务。
- 若后续需要服务端密钥逻辑，应优先放入 CloudBase 云函数，而不是网站前端项目自身的 Node 服务。
- `/admin` 占位路由可以提前稳定导航和工程边界，但不得在本 change 中实现真实编辑、保存或权限逻辑。
- 数据模型区分输入字段和派生字段，避免后续 CloudBase 保存大量容易不一致的计算结果。

## 测试策略

- 后续设计需覆盖本地 mock 启动、静态构建、CloudBase 配置缺失 fallback、CloudBase 配置存在时的数据访问适配。
- 验证至少一条 Excel 任务可映射为结构化 `ProjectTask`。
- 验证页面通过 service/repository 读取数据，而不是直接硬编码或直接读取原始 mock。
- 验证 `/admin` 仅为占位页，不提供真实编辑能力。

## Spec Patch

- 暂无。

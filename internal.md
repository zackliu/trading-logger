# 项目内部导航（改什么看哪里）

面向刚上手的同学，按“想改什么”来定位代码。运行/构建请参考根目录 `README.md`。

## 总览
- Monorepo：`apps/server`（Fastify + Drizzle + SQLite）、`apps/web`（React + Vite）、`packages/shared`（Zod schema & 类型）。
- 数据：SQLite 存在 `data/app.db`，上传文件在 `data/uploads`。
- 共享类型：全部在 `packages/shared/src/index.ts`，API 请求/返回、枚举都依赖这里。

## 后端（apps/server）
- 入口：`apps/server/src/index.ts`。Fastify 实例、插件（CORS、multipart、static）、`/api` 路由注册、自动执行 migrations。
  - 想调试/改启动流程或中间件：改这里。
- 路由：`apps/server/src/routes/*.ts`，每个文件一个资源：
  - `records.ts` 交易记录 CRUD + 批量操作。
  - `tags.ts` 标签 CRUD。
  - `customFields.ts` 自定义字段/选项 CRUD。
  - `attachments.ts` 上传与记录关联。
  - `analytics.ts` 统计分析接口。
  - 想加新接口：仿照现有文件建一个路由文件，再在 `index.ts` 的 register 区域挂载。
- 业务逻辑：`apps/server/src/services/*.ts`
  - `records.ts` 核心：查询、过滤、标签/自定义字段/附件关联。
  - `filters.ts` 负责把查询参数转为内部过滤结构。
  - `analytics.ts` 汇总统计、分组。
  - `tags.ts`、`customFields.ts` 对应简单 CRUD。
  - 想改查询/统计行为：对应文件里改。
- 数据层：`apps/server/src/db`
  - `schema.ts` Drizzle schema（表定义、关系）。
  - `client.ts` 创建 better-sqlite3 实例、暴露 `db`、`runMigrations()`，并创建上传目录。
  - 想新增字段/表：改 `schema.ts`，生成迁移（见下）。
- Migrations：`apps/server/drizzle/migrations`
  - SQL 文件按编号；`meta/_journal.json` 记录历史。
  - 想生成迁移：在 `apps/server` 目录运行 `npx drizzle-kit generate:sqlite`（配置见 `apps/server/drizzle.config.ts`），或手写 SQL 并更新 `meta/_journal.json`（不推荐手写）。
- 数据脚本：
  - `apps/server/src/migrate.ts` 手动跑迁移（`npm run migrate` 调用）。
  - `apps/server/src/seed.ts` 填充示例标签/自定义字段（`npm run seed`）。

## 共享类型（packages/shared）
- 单一入口：`packages/shared/src/index.ts`。
  - 枚举：`AccountTypeEnum`、`ResultTypeEnum`、`CustomFieldTypeEnum`。
  - 资源 schema：`Record*Schema`、`TagSchema`、`AttachmentSchema`、`CustomField*Schema` 等。
  - 过滤/分析：`RecordFilterSchema`、`CustomFieldFilterSchema`、`AnalyticsSummarySchema` 等。
  - 想改 API 契约/前后端类型：先改这里，再同步两端逻辑。

## 前端（apps/web）
- 入口：`apps/web/src/main.tsx` -> `App.tsx`。路由与页面在 `App.tsx` 定义。
- API 封装：`apps/web/src/api`，统一使用 fetch/TanStack Query。
- 页面：`apps/web/src/pages`
  - `RecordsPage.tsx` 列表、过滤器、批量操作。
  - `RecordDetailPage.tsx` 详情。
  - `AnalysisPage.tsx` 统计/图表。
  - 想加页面：在 `pages/` 新建并在 `App.tsx` 配路由。
- 组件：`apps/web/src/components`
  - `RecordForm.tsx` 新建/编辑表单。
  - `RecordTable.tsx` 列表表格。
  - 其他共享 UI 组件也在此处。
  - 想改交互/表单校验/布局：对应组件里改。
- 样式：`apps/web/src/index.css`
  - 全局主题、输入/按钮样式在这里。想调整颜色/字体/间距从此入手。
- 工具：`apps/web/src/utils` 存放日期/格式化等小函数。

## 常用修改指引
- 改 API 数据结构：`packages/shared/src/index.ts`（schema）→ `apps/server/src/services/*`（数据计算）→ `apps/web/src/api` & 对应组件。
- 改数据库结构：`apps/server/src/db/schema.ts` → 生成/编写迁移（`apps/server/drizzle/migrations`）→ 视情况调整 services 与前端展示。
- 加/改统计逻辑：`apps/server/src/services/analytics.ts`，前端展示在 `apps/web/src/pages/AnalysisPage.tsx`。
- 调整上传/静态资源：`apps/server/src/db/client.ts`（目录）、`apps/server/src/routes/attachments.ts`（路由），前端展示/上传组件在 `apps/web/src/components`。
- UI/主题调整：首选 `apps/web/src/index.css`；局部布局在各组件内联样式或局部样式。

## 运行 & 调试速记
- 开发：`npm run dev`（同时启动 web 5173 和 server 4000）。
- 仅后端：`npm --workspace apps/server run dev`。
- 仅前端：`npm --workspace apps/web run dev`，可用 `VITE_API_BASE` 指向自定义 API。
- 迁移：`npm run migrate`；种子数据：`npm run seed`。

---

## 数据库表设计（当前）
- records：datetime、symbol、account_type、result、r_multiple、complied（派生）、notes、created_at、updated_at。
- tags / record_tags：标签主表和记录↔标签关系。
- attachments：上传文件，含 record_id、mime、尺寸、file_path（文件在 `data/uploads`）。
- custom_fields / custom_field_options / record_field_values：自定义字段定义及记录值（text/number/boolean/singleSelect/multiSelect/date/datetime）。
- compliance_checks：合规检查项，type 为 `checkbox` 或 `setup`。
- compliance_check_options：setup 类型的选项，按 sort_order 排序。
- record_compliance：记录的合规选项（checkbox 用 is_checked，setup 用 option_id）。

## 后端如何与数据库交互
- Drizzle schema：`apps/server/src/db/schema.ts` 定义表；SQLite 由 better-sqlite3 驱动。
- Migrations：`apps/server/drizzle/migrations/*.sql`（0001_compliance.sql 添加合规相关表）；`npm --workspace apps/server run migrate` 应用。
- Services：
  - `services/records.ts`：CRUD，写入标签/自定义字段/附件/合规选项，计算 complied = 所有 checkbox 为真且 setup 选了非 None。
  - `services/compliance.ts`：合规检查项与选项的 CRUD。
  - `services/analytics.ts`：基于 r_multiple 的统计，配合 `services/filters.ts` 构造查询。
- Routes（`apps/server/src/routes/*` 挂载到 `/api`）：`/records`、`/records/bulk/*`、`/attachments`、`/tags`、`/custom-fields`、`/analytics/*`、`/compliance-checks`。
- 上传与静态：`apps/server/src/routes/attachments.ts` + `db/client.ts` 创建 uploads 目录并通过 Fastify static 提供 `/uploads/*`。

## 前端如何与后端交互
- 共享类型：`packages/shared/src/index.ts` 定义 Zod schema/TypeScript 类型，两端共用。
- API 客户端：`apps/web/src/api/client.ts` 封装 fetch，调用上述 `/api/*` 路由。
- 记录相关：
  - `components/RecordForm.tsx`：加载 tags/custom fields/compliance checks；提交时携带 `complianceSelections`，本地展示合规状态。
  - `pages/RecordsPage.tsx`：获取 records 与 analytics，渲染卡片（`RecordCard.tsx` 展示附件/合规状态/灯箱）。
- 设置：
  - `pages/SettingsTagsPage.tsx`：管理标签，并在同页管理合规检查项/选项（无需单独页面）。
  - `pages/SettingsFieldsPage.tsx`：管理自定义字段。
- 分析：`pages/AnalysisPage.tsx` 调用 `/analytics/summary` 和 `/analytics/groupBy`，展示 R-based 指标。

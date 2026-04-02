# Codex — 上下文与协作规范

## 你是谁

你是 Codex，负责 Lumen 项目的 **后端逻辑、API、数据库、测试** 部分。
本项目另有 Claude Code 协同开发前端 UI，职责边界见 `docs/ai-collab/OWNERSHIP.md`。

---

## 项目速览

**Lumen** — 胶卷美学壁纸平台，Next.js 14 App Router + TypeScript + Tailwind CSS。

| 服务 | 用途 |
|------|------|
| Cloudflare R2 | 壁纸图片存储（lib/r2.ts，使用 @aws-sdk/client-s3） |
| Supabase | PostgreSQL + RLS，客户端在 lib/supabase.ts |
| Resend | Magic Link 邮件，lib/resend.ts |
| NextAuth v5 | Session 管理，lib/auth.ts |
| Upstash Redis | 分布式速率限制（未配置时回退内存限流）|

**数据库迁移顺序**：`202604010001` → `007`，修改 schema 务必新增迁移文件，不修改已有文件。

---

## 你的职责范围

```
lib/             ← 你全权负责（工具库、数据层、服务客户端）
app/api/         ← 你全权负责（所有 API Routes）
supabase/        ← 你全权负责（migrations、seed、repair）
middleware.ts    ← 你全权负责（鉴权、速率限制、安全头）
types/           ← 你全权负责（TypeScript 类型定义）
e2e/             ← 你全权负责（Playwright 测试）
hooks/           ← 你全权负责（自定义 React Hooks）
```

**协作区（改动前在 TASK_QUEUE.md 备注）**

```
app/layout.tsx
next.config.mjs
package.json
```

**禁止直接修改（属于 Claude Code）**

```
components/    styles/    app/(main)/    app/(auth)/
tailwind.config.ts        public/
```

如需 UI 层配合，在 `docs/ai-collab/TASK_QUEUE.md` 提交需求，由 Claude Code 处理。

---

## API 开发规范

所有 API Route 必须遵循：**鉴权 → Zod 校验 → 业务逻辑 → 统一返回格式**

```ts
// 成功
return Response.json({ data: T, message?: string }, { status: 200 | 201 })
// 错误
return Response.json({ error: string, code: string }, { status: 400 | 401 | 403 | 500 })
```

- 使用 `getServerSession(authOptions)` 鉴权，未登录返回 401
- 所有 POST/PUT/PATCH 用 Zod schema 校验 body
- 关键操作（上传、下载、登录、审核）输出结构化 JSON 日志

---

## 数据库规范

- 新功能新增迁移文件，命名：`202604010008_描述.sql`
- 所有新表默认启用 RLS，参考 `202604010007_security_hardening.sql`
- 内部表（sessions/likes/downloads 等）只授权 `service_role`
- 公开表（wallpapers/users/wallpaper_files）授权 `anon` 只读

---

## 类型定义规范

- 所有新类型放 `types/` 目录，按业务领域命名
- API 请求/响应类型必须有显式定义，禁止 `any`
- 数据库行类型从 `types/database.ts` 导出
- 与 Claude Code 协作的接口类型（如 `MoodCardData`）改动前必须通知

---

## Git 规范

```bash
# 分支命名
codex/feat-wallpaper-search
codex/fix-r2-presign-expiry

# Commit 格式
feat(api): add wallpaper search with full-text filtering
fix(auth): handle expired magic link token gracefully
test(e2e): add visual regression baseline for homepage
```

---

## 与 Claude Code 的交接协议

1. 完成 API/类型定义后，在 `docs/ai-collab/TASK_QUEUE.md` 标为 `✅ codex done`
2. 如果新 API 需要 UI 展示，注明 **接口路径**、**返回数据结构**、**所需 UI 组件**
3. 新增或修改 `types/` 中共享类型时，必须在任务队列里说明变更
4. 每次会话开始前先读 `docs/ai-collab/TASK_QUEUE.md`

---

## 测试规范

```bash
pnpm test:e2e           # 核心流程（跳过视觉）
pnpm test:visual        # 视觉回归对比
pnpm test:visual:update # 更新基准（设计师确认后执行）
pnpm test:all           # 全套
```

E2E 测试配置在 `playwright.config.ts`，覆盖场景见 `e2e/` 目录。
视觉回归基准截图存在 `e2e/__snapshots__/`，提交到 git。

---

## 常用命令

```bash
pnpm dev              # 开发服务器 :3000
pnpm type-check       # TypeScript 检查（必须 0 错误才能提 PR）
pnpm lint             # ESLint
pnpm check            # lint + build + type-check
npx supabase start    # 启动本地 Supabase（需要 Docker）
npx supabase db push  # 执行迁移
```

# Lumen

Lumen 是一个面向摄影师、数字艺术家与壁纸爱好者的高质感壁纸平台原型工程。

当前这版已经把仓库从单纯的静态原型文件夹，整理成了一个可继续开发的 `Next.js 14 + TypeScript + Tailwind CSS` 项目骨架，并保留了根目录下的设计规范与 HTML/React 参考稿。

## 当前已搭好

- App Router 基础结构
- 设计 Token 与全局样式
- 首页主框架与关键版块组件
- 核心业务路由占位
- API 路由占位
- 环境变量模板
- `lib/` 与 `types/` 基础分层

## 本地启动

```bash
pnpm install
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 工程校验

```bash
pnpm check
```

这条命令会按顺序执行：

- `pnpm lint`
- `pnpm build`
- `pnpm type-check`

如果你要跑性能审计：

```bash
pnpm lighthouse
```

## 后端接入

- Supabase schema 已放在 `supabase/migrations/202604010001_frame_schema.sql`
- 互动能力迁移已放在 `supabase/migrations/202604010002_wallpaper_engagement.sql`
- 用户系统迁移已放在 `supabase/migrations/202604010003_user_system.sql`
- Supabase seed 已放在 `supabase/seed.sql`
- 上传工作台入口为 `/creator/studio`
- 上传管理后台入口为 `/creator/studio/manage`
- 个人库入口为 `/library`
- 上传链路为：申请 presign → 直传 R2 → 写入 `wallpapers` 和 `wallpaper_files`
- 上传创建成功后会在服务端自动生成 `4k / thumb / preview` 三个 WebP 变体
- AI 识图链路支持多 provider 兜底：Qwen、Kimi、OpenRouter、OpenAI，以及 2 个自定义 OpenAI 兼容模型槽位
- 如果所有 AI provider 都不可用或额度不足，上传仍然会成功，只会跳过 AI 标签分析
- `/explore` 已支持关键词、标签、分类、精选切换与热度排序
- `/explore/[category]` 分类页和 `/darkroom` 精选页已经接上真实数据读取
- 已补站点级 SEO 基础能力：动态 metadata、`/sitemap.xml`、`/robots.txt`
- 登录、上传和 AI 分析接口已接入速率限制；未配置 Upstash 时自动退回到本地内存限流
- 上传工作台现在要求创作者确认上传与展示授权，并记录授权确认时间
- 壁纸详情页已经提供举报入口，举报会落到 `wallpaper_reports` 表，供后续审核后台处理
- 编辑白名单账号现在可以进入 `/creator/studio/moderation` 审核台，处理待审核举报并同步调整作品状态
- 审核台已支持 `open / pending / reviewing / resolved / dismissed / all` 历史筛选，终态审核会尝试通过 Resend 通知创作者
- 创作者现在会在个人库里看到站内通知，审核终态会同时生成一条站内通知并支持标记已读
- 审核台现在还支持按举报类型、关键词和创作者用户名过滤；个人库通知支持一键全部已读
- 审核台已经支持批量处理举报，个人库通知也支持按类型筛选
- 项目已接入可选的 Sentry 错误监控：App Router 错误页、API 异常上报、上传 / AI / 审核关键链路 span 都已经就位
- Phase 5 的缓存与安全基线已经接入：公开 API 带 `s-maxage` 缓存头，登录与工作台路由强制 `no-store`，并统一补上 CSP / `X-Frame-Options` / `Referrer-Policy` 等安全头
- Supabase 内部表已经补上 RLS 加固迁移，默认只允许后端 `service_role` 访问，避免匿名 key 直接绕过应用层限流
- Vercel Analytics 和 Speed Insights 已经接到根布局，生产环境默认开启，也可以通过环境变量显式开关
- 关键写操作链路已经补上结构化日志，便于在 Vercel Runtime Logs 里追登录、上传、发布和下载
- 壁纸详情页已接入真实下载计数与登录态收藏
- 收藏会同步进入默认收藏夹，个人库会展示收藏夹与下载历史
- 登录链路已切到 Magic Link：`/login` → `/api/email/send` → `/verify` → 会话 Cookie
- R2 现在会按文档使用结构化目录：`originals/`、`compressed/`、`thumbnails/`、`previews/`
- 删除作品时会同步清理对应的 R2 对象，避免桶里残留孤儿文件

### 初始化顺序

1. 先执行 `supabase/migrations/202604010001_frame_schema.sql`
2. 再执行 `supabase/migrations/202604010002_wallpaper_engagement.sql`
3. 再执行 `supabase/migrations/202604010003_user_system.sql`
4. 再执行 `supabase/migrations/202604010004_wallpaper_ai_enrichment.sql`
5. 再执行 `supabase/migrations/202604010005_content_safety.sql`
6. 再执行 `supabase/migrations/202604010006_notifications.sql`
7. 再执行 `supabase/migrations/202604010007_security_hardening.sql`
8. 再执行 `supabase/seed.sql`
9. 启动应用后访问 `/login`、`/explore`、`/wallpaper/[slug]`、`/creator/[username]`、`/library`、`/creator/studio/manage`

如果之前迁移执行到一半就失败，先跑 `supabase/repair_schema.sql` 修补旧表，再重新执行 seed。

## Cloudflare R2 配置

1. 在 Cloudflare 创建一个私有 R2 bucket，例如 `frame-wallpapers`
2. 为这个 bucket 生成 S3 API Token，填入 `.env.local` 中的：
   - `CLOUDFLARE_R2_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET`
3. 给 R2 绑定一个可公开访问的自定义域或 R2 公网域，并填到：
   - `CLOUDFLARE_R2_PUBLIC_URL`
4. 给 bucket 配置浏览器直传所需的 CORS，至少允许你的站点域名和本地开发域名访问 `PUT / GET / HEAD`

当前代码中的对象目录约定：

```text
originals/{uuid}.{ext}
compressed/{uuid}_4k.webp
thumbnails/{uuid}_800.webp
previews/{uuid}_400.webp
```

当前上传链路会先把原图直传到 `originals/`，再由服务端读取原图并生成 `compressed/`、`thumbnails/`、`previews/` 三类衍生资源。

## AI 识图兜底配置

在 `.env.local` 中按顺序填写可用 provider。系统会按 `AI_VISION_PROVIDER_ORDER` 从前到后尝试，只要有一家成功就会写入 AI 标签；全部失败也不会影响上传主流程。

```env
AI_VISION_PROVIDER_ORDER=qwen,kimi,openrouter,openai,custom_1,custom_2
AI_VISION_TIMEOUT_MS=12000

AI_VISION_QWEN_API_KEY=
AI_VISION_QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_VISION_QWEN_MODEL=qwen3.5-flash

AI_VISION_KIMI_API_KEY=
AI_VISION_KIMI_BASE_URL=https://api.moonshot.cn/v1
AI_VISION_KIMI_MODEL=kimi-k2.5

AI_VISION_OPENROUTER_API_KEY=
AI_VISION_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_VISION_OPENROUTER_MODEL=google/gemini-2.5-flash-lite

AI_VISION_OPENAI_API_KEY=
AI_VISION_OPENAI_BASE_URL=https://api.openai.com/v1
AI_VISION_OPENAI_MODEL=gpt-5-mini
```

如果你要接入别的国内或国外模型，只要它兼容 OpenAI Chat Completions 协议，就可以填进 `AI_VISION_CUSTOM_1_*` 或 `AI_VISION_CUSTOM_2_*`。

## 速率限制

当前代码已接入以下保护：

- 登录邮件：同一 IP `5 次 / 分钟`
- 登录邮件：同一邮箱 `1 次 / 5 分钟`
- 上传 Presign：同一用户 `10 次 / 小时`
- AI 重跑分析：同一用户 `20 次 / 小时`
- 举报提交：同一 IP `5 次 / 小时`

如果填写了 `UPSTASH_REDIS_URL` 和 `UPSTASH_REDIS_TOKEN`，线上会自动使用 Upstash 做分布式限流；如果不填，则回退为本地内存限流，适合本地开发但不适合多实例生产环境。

## 编辑审核权限

如果你要开启内容审核台，在 `.env.local` 中补一个或两个白名单变量：

```env
LUMEN_EDITOR_EMAILS=editor@cloudify.icu,another@cloudify.icu
LUMEN_EDITOR_USERNAMES=lumen-editor,chief-curator
```

命中任意一个白名单后，登录用户就能看到 `/creator/studio/moderation` 的入口，并使用举报审核接口。

## Sentry 监控

如果你要启用错误监控，在 `.env.local` 中补这些变量：

```env
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.15
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.15
```

如果你还要在生产构建时上传 source maps，再额外补：

```env
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

当前接入已经包含这些能力：

- `instrumentation.ts` / `instrumentation-client.ts` 初始化 Next.js App Router 监控
- `app/error.tsx` 和 `app/global-error.tsx` 会捕获界面级异常并展示品牌化错误页
- 常用 API 路由在返回 `500` 前会主动上报处理过的异常
- 上传创建、AI 重跑分析、举报审核三条重链路已经带自定义 span

这部分不需要新的数据库迁移。

## Vercel 可观测性

当前项目已经在 [app/layout.tsx](/Users/lishiya/Lumen/app/layout.tsx) 挂上了 Vercel 的两类前端指标：

- `@vercel/analytics`：用于 Web Analytics
- `@vercel/speed-insights`：用于 Core Web Vitals

默认行为：

- `production` 环境默认开启
- 本地开发默认关闭
- 如果你想手动覆盖，使用下面两个环境变量：

```env
NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=true
NEXT_PUBLIC_ENABLE_VERCEL_SPEED_INSIGHTS=true
```

另外，这一轮也加了一个轻量健康检查：

- [app/api/health/route.ts](/Users/lishiya/Lumen/app/api/health/route.ts)

访问 `/api/health` 可以看到当前环境里 `Supabase / R2 / Resend / Sentry / Auth / Analytics` 的启用状态，便于上线后快速排查配置问题。

## CI / 上线准备

仓库现在已经补上：

- [ci.yml](/Users/lishiya/Lumen/.github/workflows/ci.yml)
- [lighthouse.yml](/Users/lishiya/Lumen/.github/workflows/lighthouse.yml)
- [lighthouserc.json](/Users/lishiya/Lumen/lighthouserc.json)
- [production-runbook.md](/Users/lishiya/Lumen/docs/production-runbook.md)

默认 CI 会在 PR 和 `main` 分支推送时执行 `pnpm check`。Lighthouse 工作流会在 PR 和手动触发时跑首页、登录页和探索页的性能审计。

## 缓存与安全

当前这版已经默认做了这些基线配置：

- 公开内容页使用 ISR 风格的 `revalidate`，首页、探索页、精选页、创作者页、详情页和 sitemap 会自动再生
- 公开 API 返回 `s-maxage=300, stale-while-revalidate=86400`，适合走 Vercel / CDN 边缘缓存
- 登录页、验证页、个人库、创作台和写操作 API 都强制 `Cache-Control: private, no-store`
- 全站统一设置 `Content-Security-Policy`、`X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`
- Supabase 的 `sessions / likes / downloads / collections / collection_items / wallpaper_favorites / wallpaper_reports / notifications` 默认只允许 `service_role` 访问
- 登录、上传、发布、下载这几条关键链路已经输出结构化 JSON 日志，便于直接在 Vercel Logs 中检索

如果你要把数据库权限基线同步到线上，请记得执行：

```sql
supabase/migrations/202604010007_security_hardening.sql
```

## 项目结构

```text
app/
  (auth)/
  (main)/
  api/
  creator/
  wallpaper/
components/
  layout/
  sections/
  ui/
  wallpaper/
hooks/
lib/
  data/
styles/
types/
```

## 下一步建议

1. 接入真实数据源：Supabase + R2
2. 补登录链路：Magic Link / Session
3. 加入 Storybook 与 Playwright
4. 将首页静态数据迁移为服务端数据获取

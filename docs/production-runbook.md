# Lumen 生产上线 Runbook

这份清单面向第一次把 Lumen 正式部署到 Vercel 的场景。顺序按“先环境、再数据、最后域名与验收”编排。

## 1. 上线前环境变量

最少需要配置这些变量：

```env
NEXTAUTH_URL=https://byteify.icu
NEXTAUTH_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=lument
CLOUDFLARE_R2_PUBLIC_URL=https://img.byteify.icu
NEXT_DISABLE_IMAGE_OPTIMIZATION=false

RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@artchain.icu
```

推荐同时配置这些生产辅助项：

```env
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.15
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.15
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=true
NEXT_PUBLIC_ENABLE_VERCEL_SPEED_INSIGHTS=true
```

如果有审核员，再补：

```env
LUMEN_EDITOR_EMAILS=
LUMEN_EDITOR_USERNAMES=
```

## 2. Supabase 数据库

按顺序执行这些 SQL：

1. `supabase/migrations/202604010001_frame_schema.sql`
2. `supabase/migrations/202604010002_wallpaper_engagement.sql`
3. `supabase/migrations/202604010003_user_system.sql`
4. `supabase/migrations/202604010004_wallpaper_ai_enrichment.sql`
5. `supabase/migrations/202604010005_content_safety.sql`
6. `supabase/migrations/202604010006_notifications.sql`
7. `supabase/migrations/202604010007_security_hardening.sql`

如果线上库还是旧结构，先执行：

1. `supabase/repair_schema.sql`
2. 然后重新跑上面 7 份迁移

是否需要示例数据：

- 生产环境通常不要跑 `supabase/seed.sql`
- 预览环境或验收环境可以跑一次方便检查 UI

## 3. Cloudflare R2

确认这几项：

1. Bucket 为私有
2. 自定义域已经指向 R2
3. CORS 至少允许站点域名和 Vercel Preview 域名访问 `PUT / GET / HEAD`
4. 公网访问域已经写入 `CLOUDFLARE_R2_PUBLIC_URL`

建议再检查对象前缀是否正常生成：

- `originals/`
- `compressed/`
- `thumbnails/`
- `previews/`

## 4. Resend

确认这几项：

1. `RESEND_FROM_EMAIL` 属于已验证域名
2. 生产域名 `NEXTAUTH_URL` 能正常回跳到 `/verify`
3. `/login` 能收到真实 Magic Link 邮件

## 5. Vercel 项目设置

推荐在 Vercel 中确认：

1. Node.js 版本为 20+
2. Production / Preview / Development 三套环境变量都已同步
3. Web Analytics 已开启
4. Speed Insights 已开启
5. Sentry source maps 上传变量已配置

## 6. 域名与 DNS

当前建议：

- 网站域名：`byteify.icu`
- 资源域名：`img.byteify.icu`
- 发信域名：`artchain.icu`

上线时确认：

1. `byteify.icu` 已正确接入 Vercel
2. `www` 是否需要重定向到主域
3. `img.byteify.icu` 已正确绑定到 Cloudflare R2 自定义域
4. HTTPS 已签发成功
5. `NEXTAUTH_URL` 与实际访问域名完全一致

说明：

- 不建议默认把整个 Vercel 站点放到 Cloudflare 反代之后
- 更推荐 `byteify.icu -> Vercel`，`img.byteify.icu -> R2 + Cloudflare` 的拆分结构
- 具体步骤见 [cloudflare-byteify-setup.md](/Users/lishiya/Lumen/docs/cloudflare-byteify-setup.md)

## 7. 验收清单

上线后至少检查这些路径：

1. `/`
2. `/explore`
3. `/darkroom`
4. `/login`
5. `/api/health`

重点验证：

1. `/api/health` 中 `auth / supabase / r2 / resend` 为 `true`
2. 首页响应头带安全头
3. 登录页响应头为 `no-store`
4. 上传链路可以完成 `presign -> original -> 变体生成 -> 入库`
5. 下载计数、收藏、举报、通知链路都能跑通

## 8. CI 与性能

仓库里已经补上：

1. `.github/workflows/ci.yml`
2. `.github/workflows/lighthouse.yml`
3. `lighthouserc.json`

上线前至少看一次：

1. `pnpm check`
2. `pnpm lighthouse`

当前 Lighthouse 关注的门槛：

- `LCP <= 2500ms`
- `CLS <= 0.1`
- `TBT <= 200ms`
- Performance score `>= 0.85`

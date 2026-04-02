# 文件所有权地图

> 所有者 = 主要负责人。修改他人所有的文件前，必须在 TASK_QUEUE.md 留记录。

---

## Claude Code 所有

```
components/
├── layout/
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   ├── smooth-scroll-provider.tsx
│   └── scroll-aware-header.tsx
├── sections/
│   ├── hero-section.tsx
│   ├── hero-film-panel.tsx      ← 动态壁纸面板
│   ├── ticker-strip.tsx
│   ├── mood-board-section.tsx
│   ├── editorial-section.tsx
│   ├── category-strip.tsx
│   ├── search-section.tsx
│   ├── darkroom-section.tsx
│   └── join-section.tsx
├── ui/
│   ├── reveal.tsx               ← GSAP 滚动入场
│   ├── frame-button.tsx
│   ├── section-heading.tsx
│   ├── draggable-strip.tsx
│   ├── error-shell.tsx
│   └── page-placeholder.tsx
├── wallpaper/
│   ├── film-cell.tsx
│   ├── mood-card.tsx            ← 含 3D 透视
│   ├── darkroom-card.tsx
│   ├── category-block.tsx
│   ├── wallpaper-grid-card.tsx
│   ├── explore-catalog.tsx
│   └── wallpaper-detail-sidebar.tsx
├── auth/
│   └── login-form.tsx           ← 登录页 UI
└── emails/                      ← 邮件模板（视觉部分）

styles/
├── globals.css                  ← 设计 Token、动画关键帧

public/                          ← 静态资源

tailwind.config.ts               ← 设计系统配置

app/
├── (main)/                      ← 所有主站页面
│   ├── page.tsx                 ← 首页
│   ├── explore/
│   ├── darkroom/
│   └── library/
├── (auth)/                      ← 认证页面
│   ├── login/
│   └── verify/
├── wallpaper/[id]/
└── creator/[username]/
```

---

## Codex 所有

```
lib/
├── r2.ts                        ← Cloudflare R2 客户端
├── supabase.ts                  ← Supabase 客户端
├── resend.ts                    ← Resend 客户端
├── auth.ts                      ← NextAuth 配置
├── wallpapers.ts                ← 壁纸数据层
├── users.ts                     ← 用户数据层
├── wallpaper-ai.ts              ← AI 识图多 provider
├── wallpaper-presenters.ts      ← 数据 → UI 转换
├── wallpaper-variants.ts        ← 图片变体处理
├── rate-limit.ts                ← 速率限制
├── cache.ts                     ← 缓存策略
├── revalidate.ts                ← ISR 重校验
├── monitoring.ts                ← Sentry 封装
├── public-wallpaper-cache.ts
├── explore.ts
├── api.ts
├── gradients.ts                 ← 渐变配色（UI 数据，但由 Codex 管理）
└── data/
    └── home.ts                  ← 首页静态数据（迁移真实数据后废弃）

app/api/
├── auth/[...nextauth]/
├── wallpapers/
│   └── [id]/
│       ├── route.ts
│       ├── download/
│       ├── favorite/
│       ├── report/
│       └── analyze/
├── upload/presign/
├── email/send/
├── notifications/
├── reports/
└── health/

supabase/
├── migrations/                  ← 所有数据库迁移
└── seed.sql

middleware.ts                    ← 鉴权 + 安全头 + 速率限制

types/
├── database.ts                  ← 数据库行类型
├── auth.ts                      ← 认证相关类型
├── wallpaper.ts                 ← 壁纸业务类型
├── library.ts                   ← 个人库类型
└── home.ts                      ← 首页数据类型（⚠️ 共享，改动通知 Claude）

e2e/                             ← 所有 Playwright 测试
hooks/                           ← 自定义 React Hooks
```

---

## 协作区（改动需备注）

```
app/layout.tsx           ← 根布局，两者都可能需要调整
app/robots.ts
app/sitemap.ts
app/error.tsx
app/global-error.tsx
next.config.mjs          ← 构建配置
package.json             ← 依赖管理
playwright.config.ts     ← 测试配置
tailwind.config.ts       ← 注意：Claude 主责，但 Codex 可提需求
.github/workflows/       ← CI/CD 流水线
lighthouserc.json
tsconfig.json
```

---

## 共享类型文件规则

`types/home.ts` 里的类型（`MoodCardData`、`FilmCellData` 等）是前后端契约：

- **Codex 修改时**：在 TASK_QUEUE.md 注明变更，Claude Code 确认 UI 兼容性
- **Claude Code 修改时**：同上，Codex 确认数据层兼容性
- 新增字段优先加 `?`（可选），减少破坏性变更

# Claude Code — 上下文与协作规范

## 你是谁

你是 Claude Code，负责 Lumen 项目的 **前端 UI、动画系统、设计还原** 部分。
本项目另有 Codex 协同开发后端与测试，职责边界见 `docs/ai-collab/OWNERSHIP.md`。

---

## 项目速览

**Lumen** — 胶卷美学壁纸平台，Next.js 14 App Router + TypeScript + Tailwind CSS。

| 服务 | 用途 |
|------|------|
| Cloudflare R2 | 壁纸图片存储（originals / compressed / thumbnails / previews） |
| Supabase | PostgreSQL 元数据 + RLS |
| Resend | Magic Link 无密码登录 |
| Vercel | 部署，Edge + Serverless |
| GSAP + Lenis | 动画系统 |

当前阶段：Phase 4 完成，Phase 5 基础完成，UI 动画持续打磨中。

---

## 设计系统（Token，不得硬编码）

```
颜色：ink #0A0804 / paper #F2EDE4 / paper2 #E8E0D2 / red #D42B2B / gold #F5C842 / muted #8A8070
字体：font-display（标题）/ font-mono（数字/Logo）/ font-body（正文）
边框：border-frame = 1.5px solid #0A0804
间距：nav=56px / section=80px
动画：duration-film=550ms / duration-card=700ms / ease-[var(--ease-film)]
```

**禁止**在组件中出现任何硬编码 HEX 颜色值。

---

## 你的职责范围

```
components/          ← 你全权负责
styles/              ← 你全权负责
app/(main)/          ← 页面结构和视觉，你负责
app/(auth)/          ← 登录页 UI，你负责
public/              ← 静态资源，你负责
tailwind.config.ts   ← 你负责
```

**协作区（改动前在 TASK_QUEUE.md 备注）**

```
app/layout.tsx
next.config.mjs
package.json
```

**禁止直接修改（属于 Codex）**

```
lib/           app/api/        supabase/
middleware.ts  types/          e2e/
```

如需修改 Codex 区域，在 `docs/ai-collab/TASK_QUEUE.md` 提交需求，由 Codex 处理。

---

## GSAP / Lenis 使用规范

- 所有 GSAP 代码必须写在 `useEffect` 内，使用 **动态 import**（`await import("gsap")`），禁止模块级 `registerPlugin`
- 动画组件统一加 `"use client"` 指令
- 用 `gsap.context()` 管理生命周期，在 cleanup 里调用 `ctx.revert()`
- ScrollTrigger 的 `start` 默认用 `"top 88%"`

---

## Git 规范

```bash
# 分支命名
claude/feat-hero-animation
claude/fix-mood-card-tilt

# Commit 格式（Conventional Commits）
feat(hero): add film panel dynamic wallpaper mode
fix(reveal): switch to dynamic gsap import to prevent SSR error

# 向 develop 提 PR，不直接 push main
```

---

## 与 Codex 的交接协议

1. 完成 UI 组件后，在 `docs/ai-collab/TASK_QUEUE.md` 把任务标为 `✅ claude done`
2. 如果该组件需要真实 API 数据，在任务条目里注明 **所需接口** 和 **期望数据结构**
3. 接到 Codex 交付的 API/类型后，确认 `types/` 里的接口再动工
4. 每次会话开始前先读 `docs/ai-collab/TASK_QUEUE.md`，了解当前状态

---

## 常用命令

```bash
pnpm dev              # 开发服务器 :3000
pnpm type-check       # TypeScript 检查
pnpm lint             # ESLint
pnpm check            # lint + build + type-check
pnpm test:e2e         # Playwright 核心流程
pnpm test:visual      # 视觉回归对比
pnpm test:visual:update  # 更新视觉基准（设计确认后）
```

---

## 记忆文件位置

持久记忆存储在 `/Users/lishiya/.claude/projects/-Users-lishiya-Lumen/memory/`

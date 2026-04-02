# 任务队列

> 每次会话开始前读这里，了解当前状态。完成后更新状态标记。

---

## 进行中

_（暂无）_

---

## 待处理

### TASK-002 · 首页静态数据迁真实 API
- **状态**: ✅✅ done
- **分支**: `claude/feat-home-real-data` → 待 PR 合入 develop
- **完成内容**: `page.tsx` 改用 `getHomePageSnapshot()`；`EditorialSection`、`DarkroomSection` 改为 props 驱动；静态 import 全部移除

### TASK-003 · Playwright E2E 基准截图建立
- **状态**: 🔜 codex pending
- **内容**: 设计确认后执行 `pnpm test:visual:update`，生成并提交 VR-01~VR-15 基准截图
- **前置**: 本地 `pnpm build && pnpm start` 正常

### TASK-004 · Storybook 接入
- **状态**: 📋 backlog
- **内容**: 按 `FRAME-视觉一致性保障方案.md` 第 2 节，为 10 个核心组件建 Story
- **负责**: Claude Code（UI 组件） + Codex（接入 Chromatic CI）

### TASK-005 · 创作者详情页 `/creator/[username]`
- **状态**: 📋 backlog
- **内容**: 展示创作者信息、作品网格
- **Codex 先**: 确认数据接口 `/api/creator/:username`
- **Claude 后**: UI 页面还原

### TASK-006 · 壁纸详情页动态壁纸支持
- **状态**: 📋 backlog
- **内容**: 详情页支持视频壁纸预览（`videoUrl` 字段已加入 `FilmCellData`，待推广到 `wallpapers` 表）
- **Codex 先**: 在 `wallpapers` 表加 `video_url` 字段（新迁移文件），更新 `types/wallpaper.ts`
- **Claude 后**: 详情页视频播放器 UI

### TASK-007 · AI 识图标签在卡片上展示
- **状态**: 📋 backlog
- **内容**: MoodCard / DarkroomCard 上展示 AI 生成的标签
- **Codex 先**: 确认 `wallpapers.ai_tags` 字段的数据结构
- **Claude 后**: 卡片 UI 加标签展示

---

## 已完成

### ✅ Phase 0 — 项目初始化
- Next.js 14 + TypeScript + Tailwind + ESLint + Husky
- CI/CD 流水线（ci.yml + lighthouse.yml）
- 环境变量模板

### ✅ Phase 1 — 设计还原
- 首页所有 Section 组件（Hero、Ticker、MoodBoard、Editorial、CategoryStrip、Search、Darkroom、Join、Footer）
- 设计 Token（tailwind.config.ts + globals.css）

### ✅ Phase 2 — 壁纸核心
- Cloudflare R2 直传链路（Presigned URL）
- 图片变体生成（4K / thumb / preview WebP）
- 壁纸详情页 + 下载计数 + 收藏

### ✅ Phase 3 — 用户系统
- Magic Link 登录（/login → /api/email/send → /verify）
- 个人库（收藏夹 + 下载历史 + 通知）
- 创作者上传工作台 + 作品管理
- 举报系统 + 编辑审核台

### ✅ Phase 4 — 内容完善
- /explore 搜索 + 过滤 + 排序
- /darkroom 精选页
- SEO（sitemap.xml + robots.ts + metadata）
- AI 识图多 provider（Qwen/Kimi/OpenRouter/OpenAI）

### ✅ Phase 5 — 性能与安全
- Sentry 错误监控
- Vercel Analytics + Speed Insights
- CSP / X-Frame-Options 等安全头
- ISR revalidate + CDN 缓存策略
- 速率限制（Upstash / 内存回退）
- 7 个 Supabase 迁移（含 RLS 安全加固）

### ✅ GSAP + Lenis 动画系统
- `SmoothScrollProvider`（动态 import，修复 SSR 错误）
- `Reveal` 组件（ScrollTrigger 滚动入场）
- 各 Section 接入滚动入场动画
- 暗室格子 stagger 交错出场

### ✅ 首页 UI 细节打磨
- Hero fade-up stagger（4 个元素错开 0→110→240→360ms）
- MoodCard 3D 透视倾斜
- CategoryBlock flex 过渡动画
- DarkroomCard grid 布局 bug 修复（md:row-span-2）
- Nav 滚动投影
- Ticker 悬停暂停 + ✦ 分隔符
- Editorial 列表 hover 箭头
- SectionHeading 装饰横线

### ✅ Hero 动态壁纸面板
- 9 格子呼吸动画（错开时序）
- 点击格子进入播放模式（全屏渐变 + 控制栏）
- 播放/暂停控制
- 支持 videoUrl 播放真实视频壁纸（预留）
- CRT 扫描线效果

### ✅ TASK-001 · 首页 UI 动画打磨
- GSAP ScrollTrigger 入场动画（`Reveal` 组件，所有 Section 接入）
- MoodCard 3D 鼠标跟踪透视倾斜
- Hero 动态壁纸面板（9 格子呼吸 + 点击全屏播放 + 视频预留）
- CategoryBlock flex 过渡动画
- DarkroomCard grid 布局修复 + hover 箭头
- Nav 滚动投影（`ScrollAwareHeader`）
- Ticker 悬停暂停 + ✦ 分隔符
- FilmCell 标签滑入动画
- SectionHeading 装饰横线
- CRT 扫描线效果

### ✅ 测试体系搭建
- Playwright 配置（双项目：桌面 1440 + iPhone 14）
- 5 个核心 E2E 流程测试
- VR-01~VR-15 视觉回归测试（待生成基准）

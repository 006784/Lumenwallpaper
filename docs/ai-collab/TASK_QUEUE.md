# 任务队列

> 每次会话开始前读这里，了解当前状态。完成后更新状态标记。

---

## 进行中

### TASK-011 · OpenClaw 管理 API 扩展
- **状态**: ✅ codex done
- **内容**: 为 OpenClaw 补齐可导入的工具清单，以及重复检测、批量重命名、批量审核、下载接口
- **Codex 完成**:
  - 新增 `GET /api/openclaw/tools`，返回 function-tools 风格工具清单
  - 新增 `GET /api/openclaw/tools/agents`，返回 OpenAI Agents 风格 HTTP 工具清单
  - 新增 `GET /api/openclaw/tools/mcp`，返回 MCP 风格 HTTP 工具目录
  - 新增 `GET /api/openclaw/wallpapers/duplicates`
  - 新增 `POST /api/openclaw/wallpapers/duplicates/cleanup`，支持默认保留最新一张的重复清理与 dry-run
  - 新增 `POST /api/openclaw/wallpapers/rename`
  - 新增 `PATCH /api/openclaw/wallpapers/batch`
  - 新增 `GET /api/openclaw/wallpapers/[id]/download`
  - 现有 `GET/POST /api/openclaw/wallpapers/import-r2` 已支持 `objects[]` 直导
  - OpenClaw 壁纸返回补充 `displayTitle`
  - 文档已同步到 `docs/openclaw-admin-api.md`

### TASK-010 · `byteify.icu` / Cloudflare 资源域准备
- **状态**: ✅ codex done
- **内容**: 为 `next.config.mjs`、中间件和部署文档补齐 `byteify.icu` 主站 + `img.byteify.icu` 资源域的准备工作
- **Codex 完成**:
  - `next.config.mjs` 不再硬编码旧图片域名，改为根据 `CLOUDFLARE_R2_PUBLIC_URL` 自动放行远程图片域名
  - `middleware.ts` 已补 `www.byteify.icu -> byteify.icu` 的 308 规范化跳转
  - `.env.example`、`README.md`、`docs/production-runbook.md` 已切到 `byteify.icu / img.byteify.icu`
  - 已新增 `docs/cloudflare-byteify-setup.md`
- **剩余人工步骤**:
  - 在 Cloudflare 里给 R2 bucket 绑定 `img.byteify.icu`
  - 把生产环境 `CLOUDFLARE_R2_PUBLIC_URL` 更新为 `https://img.byteify.icu`
  - 视实测情况决定是否打开 `NEXT_DISABLE_IMAGE_OPTIMIZATION=true`

---

## 待处理

### TASK-012 · Explore 分页支持
- **状态**: ✅ claude done（Codex 额度不足，由 Claude 全程完成）
- **完成内容**:
  - `types/wallpaper.ts` 新增 `offset?: number`
  - `lib/wallpapers.ts` offset slice 支持
  - `lib/public-wallpaper-cache.ts` offset 纳入 cache key，新增 `getCachedPublishedWallpapersPage` + `EXPLORE_PAGE_SIZE=24`
  - `GET /api/wallpapers` 支持 `?offset=N`
  - `explore-catalog.tsx` 分页 UI：URL param `page`，上一页/下一页，页码数字，共 N 件显示

### TASK-002 · 首页静态数据迁真实 API
- **状态**: ✅ claude done
- **Codex 完成**: 已新增首页聚合数据层 `lib/home.ts` 和接口 `GET /api/home`
- **返回结构**: `HomePageSnapshot`，定义在 `types/home-api.ts`
- **字段**: `{ moodCards, editorialFeature, editorialItems, darkroomItems }`
- **缓存**: 公共缓存头 `s-maxage=300, stale-while-revalidate=86400`
- **Claude 待做**: 首页 `EditorialSection`、`DarkroomSection` 接入 `/api/home` 返回的真实 props，逐步替换 `lib/data/home.ts` 中的静态内容

### TASK-003 · Playwright E2E 基准截图建立
- **状态**: ✅ claude done（Codex 额度不足，由 Claude 完成）
- **完成**: 19 张 PNG 基准已生成并提交，VR-01~VR-14 桌面端 + 部分移动端，18 通过 2 fixme（VR-08/VR-15 因 GSAP rAF 动画截图不稳定）

### TASK-004 · Storybook 接入
- **状态**: ✅ claude done（全程 Claude 完成）
- **Claude 完成**: Storybook 10 + 10 个核心组件 Story
- **Chromatic CI**: `.github/workflows/chromatic.yml` 已创建
- **剩余人工步骤**: 在 GitHub repo Settings → Secrets 添加 `CHROMATIC_PROJECT_TOKEN`（从 chromatic.com 项目设置获取）

### TASK-005 · 创作者详情页 `/creator/[username]`
- **状态**: ✅ claude done
- **内容**: 展示创作者信息、作品网格
- **Codex 完成**: `app/api/creator/[username]/route.ts`、`lib/creators.ts`、`types/creator-api.ts`、`getCachedCreatorPageSnapshot()` 已补齐
- **返回结构**: `{ creator, wallpapers, stats }`
- **Claude 进行中**: `claude/feat-creator-page` 已完成创作者头部、统计横条、壁纸网格、空态和 `notFound()`；拿到缓存导出后切回 `getCachedCreatorPageSnapshot`
- **分支**: `claude/feat-creator-page`

### TASK-006 · 壁纸详情页动态壁纸支持
- **状态**: ✅ claude done
- **内容**: 详情页支持视频壁纸预览（`videoUrl` 字段已加入 `FilmCellData`，待推广到 `wallpapers` 表）
- **Codex 完成**: 已新增迁移 `202604010008_video_wallpapers.sql`，并将 `videoUrl` 接入 `types/database.ts`、`types/wallpaper.ts`、创建/更新壁纸 schema 与 API 返回
- **Claude 后**: 详情页视频播放器 UI

### TASK-007 · AI 识图标签在卡片上展示
- **状态**: ✅ claude done
- **内容**: MoodCard / DarkroomCard 上展示 AI 生成的标签
- **Codex 完成**: `wallpapers.ai_tags` 在数据库层是 `text[]`，在 API / 类型层映射为 `Wallpaper.aiTags: string[]`；公开接口 `/api/wallpapers` 已直接返回 `aiTags`；共享类型 `types/home.ts` 已补 `MoodCardData.aiTags?` / `DarkroomItem.aiTags?`，映射层会传 `wallpaper.aiTags.slice(0, 3)`
- **Claude 后**: 卡片 UI 加标签展示

### TASK-008 · 详情页下载体验修复
- **状态**: ✅ claude done
- **内容**: 下载按钮不再跳到图片页，并在按钮附近显示下载进度
- **Codex 完成**:
  - `GET /api/wallpapers/[id]/download` 已改成同域附件流，不再 307 跳到 R2 公网 URL
  - 响应头会返回 `Content-Disposition`、`Content-Length`、`X-Wallpaper-Downloads-Count`、`X-Wallpaper-Download-Variant`
  - 已新增共享 hook `hooks/use-wallpaper-download.ts`
  - 已新增共享类型 `WallpaperDownloadProgressSnapshot` / `WallpaperDownloadStatus`
- **Claude 待做**:
  - 在 `components/wallpaper/wallpaper-detail-sidebar.tsx` 用 `useWallpaperDownload({ identifier })` 替换当前 `<a target=\"_blank\">`
  - 点击下载后调用 `download()`
  - 用 `progress.percent`、`progress.bytesReceived`、`progress.totalBytes` 渲染下载中状态
  - 完成后用 hook 返回的 `downloadsCount` 同步 UI 数字

### TASK-009 · 上传页改成专门上传界面
- **状态**: ✅ claude done
- **内容**: 现在上传页虽然支持点击选择文件，但视觉上仍像“拖拽区优先”，用户反馈“只有拖拽太不好了”。需要改成明确的专门上传界面，让“选择文件”成为主操作，拖拽只是辅助能力。
- **现状**:
  - 页面入口: `app/creator/studio/page.tsx`
  - 表单组件: `components/creator/upload-studio-form.tsx`
  - 后端接口已可用: `POST /api/upload/presign`、`POST /api/wallpapers`
  - 当前后端链路已支持: presign、R2 直传、元数据写入、授权确认、AI 标签补全
- **Claude 待做**:
  - 把上传页改成“上传工作台”式布局，而不是大块拖拽框
  - 增加明确可见的主按钮文案，例如 `选择图片` / `上传作品`
  - 文件选择后显示更明显的预览区，至少包含缩略图、文件名、尺寸/体积、替换按钮
  - 保留拖拽上传能力，但降级成辅助提示，不要再作为主入口文案
  - 把元数据表单和上传状态区做成更清晰的两栏或分步结构，避免用户觉得“只是在拖一个文件”
  - 如果合适，可加入上传队列感或步骤感：`选择文件 → 填写信息 → 确认授权 → 发布`
  - 保持现有接口契约不变，直接复用当前提交逻辑
- **Codex 备注**:
  - 当前后端不需要新增 API
  - 如果 UI 侧需要展示上传阶段文案，可直接复用已有状态：`idle | submitting | success | error`
  - 如果需要更细的进度百分比，Codex 后续可以补共享 hook / 请求进度契约

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

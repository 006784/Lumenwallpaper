---
title: "FRAME™ 项目开发方案"
subtitle: "Next.js 14 · TypeScript · Cloudflare R2 · Vercel · Resend"
project: FRAME™
date: "2026-04"
---

# FRAME™ 项目开发方案

> Next.js 14 · TypeScript · Cloudflare R2 · Vercel · Resend

---

## 1. 项目概述

FRAME™ 是一款以「胶卷美学 × 高端杂志排版」为设计语言的壁纸发现与分享平台，面向全球摄影师、数字艺术家与壁纸爱好者。平台核心理念是：

- 每一帧都值得被看见
- 壁纸不是装饰，是态度

### 核心功能

- 浏览与发现：情绪版横向滚动、暗室精选、按风格/心情分类浏览
- 下载：4K / 5K 高清壁纸，支持多分辨率适配（桌面、手机、平板）
- 上传与创作者中心：创作者注册、上传、管理作品
- 邮箱验证与账户：基于 Resend 的魔法链接（Magic Link）无密码登录
- 收藏与个人库：用户收藏夹、下载历史

### 非功能目标

- 首屏加载 < 1.5s（基于 Vercel Edge Network + R2 CDN）
- 图片 Core Web Vitals（LCP）< 2.5s
- 移动端完整适配，触控手势原生支持

## 2. 技术架构总览

### 2.1 技术选型一览

|          |                          |                           |                                           |
|----------|--------------------------|---------------------------|-------------------------------------------|
| **层级** | **技术**                 | **用途**                  | **选型理由**                              |
| 前端框架 | Next.js 14 (App Router)  | 页面路由 / RSC / 流式渲染 | 最优 SSR/ISR 支持，Vercel 原生集成        |
| 语言     | TypeScript 5             | 全栈类型安全              | 降低运行时错误，IDE 提示完整              |
| 样式     | Tailwind CSS 3           | 原子化样式                | 与设计系统配合，编译产物极小              |
| 动画     | GSAP 3 + Lenis           | ScrollTrigger / 丝滑滚动  | Awwwards 级别动画，性能稳定               |
| 存储     | Cloudflare R2            | 壁纸原图 / 缩略图存储     | 无出口流量费，S3 兼容 API                 |
| 数据库   | Supabase (PostgreSQL)    | 用户 / 壁纸 / 收藏元数据  | 开源，Row Level Security，与 Next.js 契合 |
| 邮件     | Resend                   | 邮箱验证 / Magic Link     | 开发者友好 API，送达率高                  |
| 部署     | Vercel                   | 全球 Edge 部署            | 与 Next.js 零配置，Preview URL 工作流     |
| CDN      | Cloudflare + R2 自定义域 | 图片边缘缓存              | 全球节点，与 R2 原生集成                  |
| Auth     | NextAuth.js v5 (Beta)    | 会话管理 / OAuth 扩展     | 与 Next.js App Router 深度兼容            |

### 2.2 系统架构图（文字描述）

整体采用「前端 → API 层 → 服务层」三层架构，配合边缘优化：

- 浏览器 / 移动端 → Vercel Edge Network
- Next.js App Router（RSC + Server Actions） → API Routes
- API Routes → Supabase（元数据）/ Cloudflare R2（图片文件）/ Resend（邮件）
- 图片读取路径：R2 → 自定义域 → Cloudflare CDN → 用户（零出口费）
- 图片上传路径：用户浏览器 → Presigned URL → 直传 R2（不经过 Vercel）

## 3. 项目目录结构

采用 Next.js 14 App Router 标准结构，功能模块按业务领域划分：

```
frame/
├── app/ # App Router 根目录
│ ├── (auth)/ # 认证相关页面（路由组）
│ │ ├── login/page.tsx # 登录（Magic Link 入口）
│ │ └── verify/page.tsx # 邮箱验证中转页
│ ├── (main)/ # 主站路由组
│ │ ├── page.tsx # 首页
│ │ ├── explore/page.tsx # 探索/画廊页
│ │ ├── darkroom/page.tsx # 暗室精选
│ │ ├── wallpaper/[id]/ # 壁纸详情页
│ │ └── creator/[username]/ # 创作者主页
│ ├── api/ # API 路由
│ │ ├── auth/[...nextauth]/ # NextAuth 端点
│ │ ├── wallpapers/ # 壁纸 CRUD
│ │ ├── upload/presign/ # R2 Presigned URL
│ │ └── email/send/ # Resend 触发器
│ └── layout.tsx # 根 Layout（字体 / 主题）
├── components/ # 可复用 UI 组件
│ ├── ui/ # 原子组件
│ ├── layout/ # Nav / Footer
│ ├── wallpaper/ # 壁纸卡片 / 网格 / 灯箱
│ └── animations/ # GSAP / Lenis 封装
├── lib/ # 工具库
│ ├── r2.ts # R2 客户端（@aws-sdk/client-s3）
│ ├── supabase.ts # Supabase 客户端
│ ├── resend.ts # Resend 客户端
│ └── auth.ts # NextAuth 配置
├── hooks/ # 自定义 React Hooks
├── types/ # TypeScript 类型定义
├── public/ # 静态资源
├── styles/ # 全局 CSS / Tailwind 配置
├── .env.local # 环境变量（本地）
└── next.config.ts # Next.js 配置
```

## 4. 核心模块详解

### 4.1 Cloudflare R2 图片存储

### Bucket 结构设计

```
frame-wallpapers/
├── originals/{uuid}.{ext} # 原图（最高画质）
├── compressed/{uuid}_4k.webp # 4K 压缩版（下载用）
├── thumbnails/{uuid}_800.webp # 列表缩略图（800px）
└── previews/{uuid}_400.webp # 卡片预览（400px）
```

### 上传流程（Presigned URL 直传）

为避免大文件经过 Vercel（有 4.5MB 请求体限制），采用客户端直传 R2 方案：

- ① 前端请求 /api/upload/presign，携带文件名 / 类型 / 大小
- ② Server Action 校验权限后，用 AWS SDK 生成 PutObject Presigned URL（有效期 5 分钟）
- ③ 前端用 fetch(presignedUrl, { method: 'PUT', body: file }) 直传 R2
- ④ 上传成功后，前端通知后端触发图片处理 Worker（压缩 / 生成缩略图）
- ⑤ Worker 处理完成后写入 Supabase 元数据，状态由 processing → published

**图片处理（Cloudflare Images / Sharp）**

- 方案 A（推荐）：Cloudflare Images Transform，URL 参数动态调整尺寸，无需预生成多版本
- 方案 B：Sharp（Node.js）在 Vercel Serverless Function 中预生成 4 个尺寸并存回 R2
- 格式统一转为 WebP（体积减少 ~60%，浏览器支持率 97%+）

### 关键环境变量

```
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET=frame-wallpapers
CLOUDFLARE_R2_PUBLIC_URL=https://img.frame.app # 自定义域
```

### 4.2 Resend 邮箱验证

**认证流程（Magic Link，无密码）**

- ① 用户输入邮箱，点击「发送登录链接」
- ② Server Action 生成 signed token（JWT，15 分钟有效），存入 Supabase sessions 表
- ③ 调用 Resend API 发送包含 Magic Link 的邮件（HTML 模板）
- ④ 用户点击邮件中的链接（/auth/verify?token=xxx）
- ⑤ Server 校验 token 有效性，创建 NextAuth session，跳转首页

### Resend 集成代码结构

```
// lib/resend.ts
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY);
// 发送 Magic Link
await resend.emails.send({
from: 'FRAME™ <noreply@frame.app>',
to: [email],
subject: '你的登录链接已就绪',
react: <MagicLinkEmail url={magicLink} />,
});
```

### 邮件模板（React Email）

- 使用 @react-email/components 编写 HTML 邮件，与 Resend 原生集成
- 邮件风格与 FRAME™ 品牌一致：纸色背景、黑色字体、红色 CTA 按钮
- 包含：Logo、一句话说明、Magic Link 按钮、15 分钟有效提示、纯文本备用链接

### 关键环境变量

```
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=noreply@frame.app # 需在 Resend 验证域名
NEXTAUTH_URL=https://frame.app
NEXTAUTH_SECRET=... # openssl rand -base64 32
```

### 4.3 数据库设计（Supabase / PostgreSQL）

### 核心数据表

|                  |                                                                                                         |                                                   |
|------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| **表名**         | **字段（关键）**                                                                                        | **说明**                                          |
| users            | id, email, username, avatar_url, bio, created_at                                                        | 用户账户，与 NextAuth session 关联                |
| wallpapers       | id, user_id, title, slug, status, tags, colors, width, height, downloads_count, likes_count, created_at | 壁纸元数据，status: processing/published/rejected |
| wallpaper_files  | id, wallpaper_id, variant(original/4k/thumb/preview), url, size, format                                 | R2 文件记录（多分辨率）                           |
| collections      | id, user_id, name, is_public                                                                            | 用户收藏夹                                        |
| collection_items | collection_id, wallpaper_id, added_at                                                                   | 收藏夹与壁纸多对多                                |
| downloads        | id, user_id, wallpaper_id, variant, downloaded_at                                                       | 下载记录（用于统计）                              |
| likes            | user_id, wallpaper_id, created_at                                                                       | 点赞记录                                          |
| sessions         | id, email, token_hash, expires_at, used_at                                                              | Magic Link token 存储                             |

### Row Level Security（RLS）策略要点

- wallpapers：任何人可读 published 状态；仅创建者可修改自己的作品
- likes / downloads：已登录用户可插入；不可删除他人记录
- sessions：仅 Service Role 可读写（后端专用）

### 4.4 前端动画系统

### GSAP 3 + ScrollTrigger

- 安装：npm install gsap（含 ScrollTrigger 插件，无需额外安装）
- 全站 Lenis 平滑滚动：在 root layout 的 client component 中初始化，并将 raf 传递给 GSAP ticker
- ScrollTrigger 场景：情绪版卡片横向视差、分类区文字淡入、暗室格子交错出现
- 英雄区标题：SplitText（字符级动画）逐字浮现，配合 stagger 0.04s
- 胶卷区：CSS flex transition 驱动展开，无需 GSAP（性能更优）

### 性能注意事项

- 所有 GSAP 动画使用 transform / opacity（GPU 合成层，不触发 layout reflow）
- 移动端通过 ScrollTrigger.normalizeScroll(true) 统一滚动行为
- 图片使用 Next.js <Image> 组件（自动 WebP + srcset + lazy load）
- 超出视窗的卡片用 IntersectionObserver 延迟初始化 GSAP，减少初始 JS 执行

## 5. Vercel 部署方案

### 5.1 部署配置

Next.js 14 与 Vercel 零配置部署，以下为关键配置项：

```
// next.config.ts
const config = {
images: {
domains: ['img.frame.app'], // R2 自定义域
formats: ['image/avif', 'image/webp'],
},
experimental: { ppr: true }, // Partial Prerendering (Next.js 14)
};
```

### 5.2 环境分支策略

|          |                 |                     |                     |
|----------|-----------------|---------------------|---------------------|
| **分支** | **Vercel 环境** | **域名**            | **说明**            |
| main     | Production      | frame.app           | 生产环境，自动部署  |
| develop  | Preview         | dev.frame.app       | 开发集成测试        |
| feat/*  | Preview         | feat-xxx.vercel.app | PR 自动生成预览 URL |

### 5.3 Edge Functions vs Serverless Functions

- Edge Function（推荐用于）：中间件（鉴权 / 重定向）、图片 CDN 路由、A/B 测试
- Serverless Function：R2 Presigned URL 生成（需 AWS SDK，体积较大）、Resend 邮件发送、数据库写操作
- ISR（增量静态再生）：壁纸详情页 revalidate: 3600，保证 SEO 同时减少数据库查询
- Streaming：首页使用 React Suspense 流式渲染，Navbar 和骨架屏先到，图片数据后加载

### 5.4 关键 Vercel 环境变量清单

|                                 |                         |                   |
|---------------------------------|-------------------------|-------------------|
| **变量名**                      | **来源**                | **用途**          |
| CLOUDFLARE_R2_ACCOUNT_ID        | Cloudflare Dashboard    | R2 账户 ID        |
| CLOUDFLARE_R2_ACCESS_KEY_ID     | R2 API Token            | R2 访问密钥       |
| CLOUDFLARE_R2_SECRET_ACCESS_KEY | R2 API Token            | R2 密钥           |
| CLOUDFLARE_R2_BUCKET            | 手动配置                | 存储桶名称        |
| CLOUDFLARE_R2_PUBLIC_URL        | R2 自定义域             | 图片公网 URL 前缀 |
| SUPABASE_URL                    | Supabase Dashboard      | 数据库连接        |
| SUPABASE_SERVICE_ROLE_KEY       | Supabase Dashboard      | 后端专用密钥      |
| SUPABASE_ANON_KEY               | Supabase Dashboard      | 前端公开密钥      |
| RESEND_API_KEY                  | Resend Dashboard        | 邮件发送          |
| RESEND_FROM_EMAIL               | 手动配置                | 发件人地址        |
| NEXTAUTH_URL                    | 手动配置                | 站点 URL          |
| NEXTAUTH_SECRET                 | openssl rand -base64 32 | Session 加密密钥  |

## 6. 开发里程碑

|                    |           |                                                                                             |                                                      |
|--------------------|-----------|---------------------------------------------------------------------------------------------|------------------------------------------------------|
| **阶段**           | **周期**  | **核心交付物**                                                                              | **完成标准**                                         |
| Phase 0 基础搭建   | Week 1    | Next.js 项目初始化、Tailwind、ESLint、Husky、GitHub 仓库、Vercel 连接、所有环境变量配置完成 | CI/CD 流水线跑通，Preview URL 可访问                 |
| Phase 1 设计还原   | Week 2–3  | 首页 Hero（胶卷 + 标题动画）、Nav、Ticker、情绪版横向滚动、GSAP + Lenis 接入                | 与 FRAME™ 设计稿还原度 ≥ 95%，Lighthouse 性能分 ≥ 85 |
| Phase 2 壁纸核心   | Week 4–5  | R2 存储桶配置、Presigned URL 上传、图片压缩 Worker、壁纸详情页、下载功能                    | 能完整走通上传→处理→展示→下载链路                    |
| Phase 3 用户系统   | Week 6–7  | Resend Magic Link 登录、NextAuth session、用户主页、收藏夹、上传管理后台                    | 邮件送达率 ≥ 98%，登录链路 < 3 步                   |
| Phase 4 内容完善   | Week 8    | 探索页过滤 + 搜索（Supabase 全文检索）、暗室精选（编辑后台）、分类页、SEO meta + sitemap    | Google Search Console 无爬虫错误                     |
| Phase 5 性能与上线 | Week 9–10 | Core Web Vitals 调优、图片 CDN 缓存策略、错误监控（Sentry）、安全审计（RLS 复查）、正式上线 | LCP < 2.5s、CLS < 0.1、FID < 100ms                |

## 7. 安全与合规

### 7.1 认证与授权

- Magic Link token 使用 SHA-256 哈希存储（不存明文），一次性使用，15 分钟过期
- Session 基于 HttpOnly Cookie，防止 XSS 窃取
- API 路由统一通过 getServerSession() 校验，未登录返回 401
- R2 Bucket 设为私有，仅通过 Presigned URL 或自定义域（带 Cloudflare Access）访问

### 7.2 内容安全

- 上传文件类型白名单：仅允许 image/jpeg, image/png, image/webp
- 文件大小限制：原图 ≤ 50MB，通过 Presigned URL 的 ContentLengthRange 条件强制
- 版权声明：用户上传时需同意授权协议，Supabase 记录授权时间戳
- 举报系统：壁纸详情页提供举报入口，管理员后台审核

### 7.3 速率限制

- Vercel Middleware + Upstash Redis：登录请求 5 次/分钟/IP，上传 10 次/小时/用户
- Resend 邮件：同一邮箱 1 封/5 分钟（防刷码）

## 8. 成本估算（月度，冷启动阶段）

|               |                       |            |                                               |
|---------------|-----------------------|------------|-----------------------------------------------|
| **服务**      | **用量预估**          | **费用**   | **备注**                                      |
| Vercel        | Pro 计划              | \$20 /月   | 包含商业域名、团队协作、高级分析              |
| Cloudflare R2 | 100GB 存储 + 10M 操作 | ~\$1.5 /月 | 存储 \$0.015/GB，操作 \$0.36/百万次，出口 \$0 |
| Supabase      | Pro 计划              | \$25 /月   | 8GB 数据库，50GB 文件（不用于图片）           |
| Resend        | 免费计划 3,000 封/月  | \$0 /月    | 超出后 \$20/月（含 50,000 封）                |
| Cloudflare    | 免费计划              | \$0 /月    | CDN + DDoS 防护 + R2 自定义域                 |
| 域名          | frame.app             | ~\$15 /年  | Cloudflare Registrar 成本价                   |
| 合计          | —                     | ~\$47 /月  | 不含超出用量费用                              |

随流量增长，R2 出口零费用的优势将显著体现——传统 AWS S3 在相同流量下出口带宽费用可达数百美元/月。

## 9. 后续功能规划（v2）

### AI 功能

- AI 色调提取：上传时自动分析主色调，用于「按颜色筛选」
- AI 标签生成：自动识别场景（自然 / 城市 / 抽象），减少人工标注
- AI 推荐引擎：基于用户下载 / 收藏历史，个性化首页

### 创作者变现

- Premium 壁纸：创作者设置付费下载，通过 Stripe 收款
- 创作者订阅：粉丝订阅创作者获取专属内容

### 社区功能

- 评论系统（基于 Supabase Realtime）
- 壁纸挑战赛：编辑发起主题，创作者投稿，用户投票

### 移动端

- PWA 支持：manifest.json + Service Worker，添加到主屏幕
- React Native 应用（长期规划）

## 10. 快速启动命令

```
# 1. 克隆并安装依赖
git clone https://github.com/your-org/frame.git && cd frame
npm install
# 2. 配置环境变量
cp .env.example .env.local
# 填入 R2 / Supabase / Resend / NextAuth 密钥
# 3. 初始化数据库
npx supabase db push
# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
# 5. 部署到 Vercel
npx vercel --prod
```

*FRAME™ — 每一帧都值得被看见*

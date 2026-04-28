# 任务队列

> 每次会话开始前读这里，了解当前状态。完成后更新状态标记。

---

## 进行中

### TASK-030 · 首页壁纸展示密度提升

- **状态**: ✅ codex done
- **内容**: 用户反馈页面壁纸很多但首页只展示几张，Codex 接管前端与首页数据聚合，提升首页各内容区块的壁纸取数和展示数量
- **Codex 完成**:
  - `lib/home.ts`：首页 published 候选池从 30 提到 96、featured 从 12 提到 36、iOS 候选池从 24 提到 72
  - `lib/home.ts`：大数据量时首页展示提升到情绪版 18 张、iOS 15 张、编辑推荐 6 张、暗室精选 12 张
  - `lib/home.ts`：先为编辑主推和 iOS 竖屏专区分配作品，再分配其他区块，减少竖屏作品被前置区块抢走的问题
  - `components/sections/darkroom-section.tsx`：让暗室精选在大屏下支持更多卡片而不是固定 5 张版式
- **验证**:
  - `pnpm type-check`
  - `pnpm lint`
  - 本地 `/api/home` 返回：`mood=18`、`ios=15`、`editorial=6`、`darkroom=12`

### TASK-029 · iOS 专区留白与夜色模式可读性修复

- **状态**: ✅ codex done
- **内容**: 用户明确要求 Codex 接管 Claude 前端职责，全面检查首页 iOS 专区卡片留白、夜色模式文字/按钮对比度，并直接优化 Claude-owned UI 文件
- **Codex 完成**:
  - `components/sections/ios-spotlight-section.tsx`：压缩 iOS 专区布局，避免右侧壁纸卡片被网格拉伸后产生大面积空白
  - `styles/globals.css`：补齐暗色模式下 glass surface/control/chip/field 的背景、边框、阴影与文字对比度
  - `components/wallpaper/wallpaper-grid-card.tsx`：卡片改为 `h-fit self-start`，配合 `.wallpaper-card-grid { align-items: start; }` 防止被父级网格强制拉伸
- **验证**:
  - `pnpm type-check`
  - `pnpm lint`
  - 本地 `http://localhost:3001` 明暗模式截图检查；iOS 区域卡片高度已回到正常内容高度，夜色模式按钮和卡片文字可读

### TASK-028 · 全站 Soft Glass UI 改版

- **状态**: ✅ codex done / ⏳ claude review
- **内容**: 按用户提供的白色玻璃拟物参考图，把 Lumen 的公开页、私有页、下载面板和上传工作台统一升级为 soft glass / neumorphic 风格
- **Codex 完成**:
  - `styles/globals.css` 新增全局 glass tokens 与工具类：`glass-surface`、`glass-surface-soft`、`glass-control`、`glass-primary`、`glass-field`、`glass-chip`、`glass-icon`
  - 统一全站主色为深青绿 + 橙色强调，页面背景改为轻网格和柔和白色玻璃质感
  - 已改造公共导航、移动导航、footer、首页 hero / search / darkroom / editorial / ticker / join 区块
  - 首页“情绪版”区块已二次重排为左侧目录面板 + 右侧统一尺寸画廊，避免巨型标题和不规则卡片抢重心
  - 已改造 `/explore` 工具栏、筛选 chip、分页与空态；壁纸卡片改为圆角玻璃相框
  - 已改造 `/wallpaper/[id]` 详情页和 `DownloadPanel`，同时修复下载面板右侧控件被预览裁切层遮挡的问题
  - 已改造登录、验证、Library、Creator Studio、管理、导入、审核、创作者公开页、错误壳层和占位组件
  - 新增 `.wallpaper-card-grid` 全局壁纸网格尺寸规范，Explore / Library / Darkroom / Creator / 详情推荐统一改为更紧凑的多列卡片；管理台和审核页的作品缩略卡也同步缩小
  - `e2e/download.spec.ts` 与 `e2e/search.spec.ts` 已跟随新交互与 glass 样式更新
- **给 Claude 的 UI 交接**:
  - 这次按用户明确要求直接修改了 Claude-owned 的 `components/`、`styles/`、`app/(main|auth|public|dashboard)` 相关前端文件；请后续复核视觉细节并决定是否更新视觉回归基准
  - 建议重点看 `/`、`/explore`、`/wallpaper/beauty-photo-0395`、`/login`、`/library`、`/creator/studio`、`/creator/studio/import`、`/creator/studio/manage`、`/creator/studio/moderation`
  - 已做验证：`pnpm type-check`、`pnpm lint`、`next build`、核心下载/搜索/上传 E2E、auth/facets/motion/SEO/collection API E2E

### TASK-025 · 发现连续浏览、设备预设与合集 API

- **状态**: ✅ codex done / ⏳ claude todo
- **内容**: 为“像找壁纸工具一样连续浏览”补齐后端能力：相似推荐、多设备下载预设、收藏夹/合集，以及上传错误产品化响应
- **Codex 完成**:
  - 新增 `GET /api/wallpapers/[id]/similar?limit=6`，按相似风格、相似颜色、同作者、同比例返回分组推荐；`id` 支持壁纸 id 或 slug
  - 新增 `GET /api/wallpapers/download-presets`，返回 iPhone、iPad、Mac、Windows、Android 常见下载裁切预设
  - 新增 `GET/POST /api/library/collections`：列出当前用户合集、创建合集
  - 新增 `GET /api/library/collections/[id]`：返回合集详情与壁纸列表
  - 新增 `POST/DELETE /api/library/collections/[id]/items`：把壁纸加入/移出指定合集，body 支持 `wallpaperId`，也兼容 `wallpaperSlug` / `id`
  - `lib/wallpaper-create-errors.ts` 的上传创建失败响应新增 `details.title/description/actionLabel/actionHref/retryable/troubleshooting`，前端可以显示短提示 + 操作入口
  - 新增 `e2e/wallpaper-discovery-library.spec.ts` 覆盖相似推荐、设备预设和合集鉴权错误
- **给 Claude 的 UI 交接**:
  - 详情页在主图下方或右栏低优先级位置接入 `/api/wallpapers/${slug}/similar?limit=6`，按 `groups[].kind` 分区展示“相似风格 / 相似颜色 / 同作者 / 同比例”
  - 下载配置面板可以把 `/api/wallpapers/download-presets` 渲染成“一键：iPhone / 桌面 / WebP 小体积”等普通用户入口，高级裁切继续折叠在后面
  - Library 页面可从 `/api/library/collections` 接入多合集；收藏按钮旁可增加“加入合集”入口
  - 上传页遇到 `jsonError.details` 时优先展示 `details.title` 与 `details.description`，按钮使用 `details.actionLabel/actionHref`；不要直接把 R2/CORS 长技术句展示成主错误
  - 动态壁纸 UI 可继续用 `GET /api/wallpapers?media=motion`，卡片层增加 poster、悬停静音预览、视频格式标识与“下载视频 / 下载封面”两个入口
  - SEO / 分享卡片、详情页“图片优先”、版权与举报信任感属于公开页 UI/metadata 层；建议在 `app/(public)` 和相关组件里接入现有 report API 与 metadata 生成

### TASK-026 · 动态壁纸体验与版权信任 API

- **状态**: ✅ codex done / ⏳ claude todo
- **内容**: 给动态壁纸卡片、详情页播放预览、封面下载，以及版权/举报信任模块补齐公开数据契约
- **Codex 完成**:
  - 新增 `GET /api/wallpapers/[id]/motion`，返回 `isMotion`、静音播放配置、视频资产和封面资产；`id` 支持壁纸 id 或 slug
  - 新增 `GET /api/wallpapers/[id]/trust`，返回创作者归属、授权确认状态、举报入口、举报原因和累计举报信息
  - `getWallpaperDownloadFileByVariant()` 已修正动态壁纸分支：`variant=original` 下载原视频，`preview/thumb/4k` 下载动态封面，支持 UI 分成“下载视频 / 下载封面”
  - `types/wallpaper.ts` 新增 `WallpaperMotionSnapshot`、`WallpaperMotionAsset`、`WallpaperTrustSnapshot`
  - `e2e/wallpaper-discovery-library.spec.ts` 已覆盖动态资产接口和信任信息接口
- **给 Claude 的 UI 交接**:
  - 动态卡片 hover 时可调用 `/api/wallpapers/${slug}/motion`，使用 `playback.previewUrl` 静音播放，`playback.posterUrl` 做加载前封面
  - 动态详情页下载区建议拆成两个主入口：`assets.video.downloadUrl` 下载原视频，`assets.posters[0].downloadUrl` 下载封面；封面没有时隐藏封面入口
  - 详情页版权信任模块可调用 `/api/wallpapers/${slug}/trust`，展示 `license.statement`、`attribution.username`、`report.endpoint` 和 `report.reasons`
  - 举报弹层提交仍走现有 `POST /api/wallpapers/[id]/report`；提交后可以用 `report.message` 做信任说明文案

### TASK-027 · Explore Facets 与壁纸 SEO 分享卡片 API

- **状态**: ✅ codex done / ⏳ claude todo
- **内容**: 为 Explore 真实筛选工具栏和详情页 SEO / 分享卡片补齐公开数据契约
- **Codex 完成**:
  - 新增 `GET /api/wallpapers/facets`，返回筛选工具栏所需的分辨率、方向、比例、媒体类型、颜色、风格、标签、分类、排序选项及数量
  - 新增 `GET /api/wallpapers/[id]/seo`，返回详情页 canonical URL、SEO 标题描述、关键词、OG / Twitter 分享卡片和 `ImageObject` JSON-LD
  - 新增 `lib/wallpaper-discovery.ts` 聚合公开壁纸 facets 和 SEO 数据，缓存接入 `lib/public-wallpaper-cache.ts`
  - `types/wallpaper.ts` 新增 `WallpaperExploreFacetsSnapshot`、`WallpaperExploreFacetOption`、`WallpaperSeoSnapshot`
  - `e2e/explore-filters.spec.ts` 覆盖 facets 契约；`e2e/wallpaper-discovery-library.spec.ts` 覆盖 SEO 契约
- **给 Claude 的 UI 交接**:
  - Explore 工具栏可先请求 `/api/wallpapers/facets` 渲染筛选项，显示 `count`，颜色项使用 `swatch`
  - 筛选点击仍然拼接到现有 `/explore?...` 与 `/api/wallpapers?withMeta=true...` 参数，不需要新增 UI 状态协议
  - 详情页 metadata 可改用 `/api/wallpapers/${slug}/seo` 或直接复用同名数据层；分享卡片优先使用 `openGraph.images[0]`
  - 页面内分享按钮可读取 `canonicalUrl`、`title`、`description`，结构化数据可使用 `jsonLd`

### TASK-024 · Explore 智能筛选与排序

- **状态**: ✅ codex done / ⏳ claude todo
- **内容**: 把探索页从简单标签筛选升级成真实壁纸查找工具，支持分辨率、横竖屏、手机比例、动态/静态、颜色、风格、热度和最新筛选
- **Codex 完成**:
  - `GET /api/wallpapers` 已新增筛选参数：`resolution=1080p|2k|4k|5k|8k`、`minWidth`、`minHeight`、`orientation=landscape|portrait|square`、`aspect=desktop|phone|tablet|ultrawide|square`、`media=all|static|motion`、`color`、`style`
  - `sort=downloads|hot|trending` 会归一到 `popular`，`sort=favorite|favorites|liked` 会归一到 `likes`，继续兼容 `latest|popular|likes`
  - 旧参数 `motion=true|false` 继续兼容；新参数 `media` 优先级更高
  - 分页响应 `filters` 已回显新筛选状态，方便 UI 渲染当前条件 chips
  - `lib/public-wallpaper-cache.ts` 已把新筛选纳入缓存 key，并把公开壁纸缓存版本升级到 `v4`
  - 新增 `e2e/explore-filters.spec.ts` 覆盖组合筛选、颜色回显和非法参数结构化错误
- **给 Claude 的 UI 交接**:
  - `components/wallpaper/explore-catalog.tsx` 可把现有筛选条升级成工具栏：分辨率、屏幕方向、设备比例、静态/动态、颜色、风格、排序
  - URL 示例：`/explore?orientation=portrait&aspect=phone&resolution=1080p&media=static&sort=downloads`
  - API 示例：`/api/wallpapers?withMeta=true&orientation=portrait&aspect=phone&resolution=1080p&media=static&sort=downloads&page=1`
  - `filters` 返回字段：`aspect/category/color/featured/media/minHeight/minWidth/motion/orientation/query/resolution/sort/style/tag`

### TASK-023 · 公开页 UI/UX 二次打磨

- **状态**: ✅ codex done / ⏳ claude todo
- **内容**: 继续打磨 Explore、详情页、下载配置面板、上传工作台的 UI/UX，减少首屏说明文字和默认封面感，补齐下载/上传失败态的用户路径
- **Codex 完成**:
  - 已复核 `/explore`、`/wallpaper/beauty-photo-0403`、下载配置弹层和上传工作台的主要问题
  - `lib/explore.ts` 已把媒体完整度纳入公共壁纸列表排序，优先展示带 preview/thumb/4k、尺寸、视频封面的作品，降低缺少变体或 poster 的 published 数据出现在首屏的概率
  - 下载配置面板已补齐 `formatKey / outputWidth / outputHeight / crop` 回调参数，详情侧栏改用 `formatKey` 选择下载源，避免竖图/非 16:9 继续靠固定 `3840 × 2160` 判断 4K
  - 已新增设计交接文档 `docs/ai-collab/TASK-023-ui-ux-polish-brief.md`
- **给 Claude 的 UI 交接**:
  - 详情页压缩说明区，避免中文标题单字孤行，让下载主操作上移
  - 下载配置面板扩大预览图占比，拆清“原图”和“格式转换”，接入下载进度与最终响应头
  - 上传页把 R2/CORS 错误改成短提示 + 诊断入口，使用 presign 响应里的 `diagnostics` 和 `constraints`
  - 动态壁纸/封面缺失状态需要比默认黑块更像产品内占位

### TASK-022 · 上传 presign 兼容与创建失败分层

- **状态**: ✅ codex done
- **内容**: 补强上传链路的后端反馈，减少线上直传或创建失败时只显示泛化错误的问题
- **Codex 完成**:
  - `POST /api/upload/presign` 现在兼容 `filename/contentType/size` 与 `fileName/fileType/fileSize` 两套字段名，降低客户端字段不一致导致的失败
  - presign 响应 `PresignedUploadPayload` 增加 `constraints`、`contentType`、`filename`、`diagnostics`，包含允许格式、当前格式最大体积、所需 PUT 请求头和 `/api/upload/diagnostics` 入口
  - `POST /api/wallpapers` 与 `POST /api/openclaw/wallpapers` 现在会把常见上传创建失败拆成明确错误码：源文件路径缺失、R2 对象不存在、R2 拒绝访问、源文件格式不支持、变体生成失败、Supabase 未配置
  - `lib/r2.ts` 增加 R2 错误识别工具，`lib/wallpaper-variants.ts` 增加 `WallpaperVariantGenerationError` 保留原始 cause
- **给 Claude 的 UI 交接**:
  - 上传页拿到 presign 响应后，可显示 `data.constraints.maxSizeBytes` 与 `data.diagnostics.corsDiagnosticsUrl`
  - 创建作品失败时可根据错误码给用户更准确提示，例如 `WALLPAPER_UPLOAD_SOURCE_NOT_FOUND` 建议重新上传，`R2_ACCESS_DENIED` 建议检查部署环境变量或 R2 权限

### TASK-021 · 下载配置链路校验与后端归一

- **状态**: ✅ codex done
- **内容**: 全面检查下载配置链路，修复配置绕过/误转换/失败计数问题，并补齐可验证响应头与 E2E 覆盖
- **Codex 完成**:
  - `GET /api/wallpapers/[id]/download` 现在会对 `variant / format / ratio / resolution` 做显式校验，非法配置返回结构化 400 错误
  - 面板传来的“原图 + 原始尺寸 + FREE 裁切”请求会在后端归一成真正原图下载，避免被误转成 PNG
  - 下载计数延后到源文件存在且转换准备成功后再写入，避免 404、R2 缺失、限流或转换失败也增加下载数
  - 转换输出补充 `X-Wallpaper-Download-Format / Ratio / Resolution / Requested-Format` 响应头，方便 UI 和测试判断实际下载配置
  - `Content-Disposition` 增加 ASCII `filename` 兜底，兼容更多浏览器和下载管理器
  - 裁切转换改为先应用 EXIF 方向再按可见尺寸裁切，避免竖图/旋转图裁切偏移
  - `hooks/use-wallpaper-download` 已支持传入下载配置对象，并返回格式与是否转换信息
  - `e2e/download.spec.ts` 新增下载配置非法参数与 WebP 裁切转换链路用例
- **给 Claude 的 UI 交接**:
  - `DownloadPanel` 当前“原图”预设仍把 `fmt` 传成 `PNG`；后端已做兼容，但建议 UI 后续把原图预设明确传 `format: "original"`，把 PNG 导出作为单独文案/选项
  - 下载面板可读取响应头 `X-Wallpaper-Download-Format` 和 `X-Wallpaper-Download-Resolution` 显示最终输出，而不是只显示预估值

### TASK-020 · 下载转换与 R2 上传诊断补强

- **状态**: ✅ codex done
- **内容**: 修复 fallback 壁纸下载配置被绕过的问题，并为下载转换加限流 / 内存缓存 / 大文件保护；补齐上传链路的 R2 CORS 预检诊断
- **Codex 完成**:
  - `GET /api/wallpapers/[id]/download` 现在会对 fallback SVG 走同一套裁切、分辨率和 PNG/WebP 转换逻辑
  - 下载转换增加 per user/IP 限流、源文件大小/像素保护和进程内短 TTL 缓存，响应头返回 `X-Wallpaper-Transform-Cache`
  - 新增 `GET /api/upload/diagnostics`，登录后可对当前 `Origin` 生成 presigned URL 并执行 R2 CORS `OPTIONS` 预检
  - `lib/r2.ts` 新增 R2 上传 CORS 需求与诊断工具，`types/r2-diagnostics.ts` 新增显式响应类型
  - `README.md` 与 `docs/production-runbook.md` 已补最小 CORS 配置和诊断入口说明
  - 2026-04-25 已用本地 R2 S3 凭证跑通 `lument` 桶：ListObjects、SDK Put/Get、presigned PUT、`http://localhost:3000` CORS 预检与 `img.byteify.icu` 公开下载均成功
  - 2026-04-25 已用本地临时 session 跑通 `POST /api/upload/presign` → R2 `PUT` → 公开 URL `GET`，并修复诊断接口把 OPTIONS 响应误判为缺少 `ETag` 暴露头的 false warning
- **给 Claude 的可选 UI 交接**:
  - 上传页如果捕获到 R2 `status 0`，可以提示用户打开 `/api/upload/diagnostics` 或在管理区展示诊断结果
  - 诊断接口返回结构见 `types/r2-diagnostics.ts`

### TASK-018 · 全局主题首屏与错误页壳层体验优化

- **状态**: ✅ codex done
- **内容**: 优化根布局与全局错误页的主题初始化、字体继承和浏览器界面色彩一致性，减少首屏闪烁与错误态样式断层
- **Codex 完成**:
  - 新增 `lib/theme.ts` 统一维护主题存储 key、浅/深色浏览器界面色值和首屏主题初始化脚本
  - `app/layout.tsx` 现通过共享脚本在 hydration 前同步 `.dark` 与 `color-scheme`，并补充 `viewport.themeColor`
  - `app/global-error.tsx` 现继承 Geist 字体变量与同一套主题初始化逻辑，避免错误页回退到不一致的视觉外观

### TASK-015 · 公开/私有布局拆分与公开页去用户态

- **状态**: ✅ codex done
- **内容**: 把公开页和私有页拆成独立 route group / layout，移除公共 header 对 session、通知数和管理入口的依赖，并让壁纸详情页的收藏状态改为客户端补拉
- **Codex 完成**:
  - 根布局 `app/layout.tsx` 现在只保留 providers，不再在全站共享 layout 里挂用户态 header
  - 新增 `app/(public)/layout.tsx`、`app/(dashboard)/layout.tsx`、`app/(auth)/layout.tsx`
  - 公共页与私有页已拆到 `app/(public)` / `app/(dashboard)`，URL 保持不变
  - `components/layout/site-header.tsx` 已改成纯公共 header，不再读 session / 未读通知 / 管理入口
  - 新增 `components/layout/dashboard-header.tsx` 承载私有区用户态导航
  - 壁纸详情页已移除服务端 `getCurrentSession()` / `getWallpaperFavoriteState()` 依赖
  - `GET /api/wallpapers/[id]/favorite` 现返回 `isSignedIn`，详情页收藏状态改为客户端补拉
  - `package.json` 的 `type-check` 已切到 `tsc --noEmit --incremental false`，避免 route group 调整后 `.next/types` 残留导致假红

### TASK-014 · 暗房下载配置面板

- **状态**: ✅ codex done
- **内容**: 按品牌规格实现新的暗房下载配置面板，并替换详情页当前下载弹层
- **Codex 完成**:
  - 新增 `components/wallpaper/DownloadPanel.tsx`，按暗房规格实现格式切换、比例裁切、辅助开关、输出信息块与下载/缓存按钮
  - `app/wallpaper/[id]/page.tsx` 与 `components/wallpaper/wallpaper-detail-sidebar.tsx` 已切换到新下载面板
  - 现有真实下载接口仍保留，点击面板下载会继续走 `/api/wallpapers/[id]/download`
  - `tailwind.config.ts` 已补齐 `paper-2 / brand-red / hint / border / 1.5 / bebas` 扩展，避免破坏现有全站 token

### TASK-013 · 封面加载与主题兼容修复

- **状态**: ✅ codex done
- **内容**: 修复封面错误状态卡死、恢复响应式封面加载、补齐旧版 Safari/WebView 的主题监听兼容
- **Codex 完成**:
  - `WallpaperCoverImage` 改为原生 `img + srcset + sizes` 直连资源域，不再全量禁用响应式加载
  - `WallpaperCoverImage` 在 `src` 变化时重置失败状态，避免错误兜底卡死
  - `types/home.ts` 新增共享类型 `WallpaperCoverSource`
  - 首页/专题/卡片封面已接入 `coverSources`
  - `ThemeProvider` 为 `matchMedia` 增加 `addListener/removeListener` 兼容分支
- **共享类型变更**:
  - `MoodCardData.coverSources?`
  - `EditorialFeature.coverSources?`
  - `EditorialItem.coverSources?`
  - `DarkroomItem.coverSources?`

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

### TASK-019 · 首页 Hero 左侧文案区重排

- **状态**: ⏳ claude todo
- **内容**: 重做首页 Hero 左侧文案区的深色版式层级与信息编排，解决“空、闷、散、像 dashboard”的问题
- **影响文件**:
  - `components/sections/hero-section.tsx`
- **设计说明**:
  - 见 `docs/ai-collab/TASK-019-hero-brief.md`
- **Codex 备注**:
  - 当前不需要新增 API / hook / 类型
  - 这是纯 UI 重排任务，可直接在现有数据契约上完成

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

### ✅ TASK-017 · 公开 API 元数据细化与下载面板联调

- `GET /api/wallpapers?withMeta=true` 的分页结果已补充：
  - `count`
  - `pageSize`
  - `hasNextPage`
  - `hasPreviousPage`
  - `filters`
- `withMeta=true` 时现在会尊重 `limit` 作为每页大小（上限 100）
- 共享类型 `types/wallpaper.ts` 已扩展：
  - `WallpaperListFiltersSnapshot`
  - `WallpaperListPageResult.count`
  - `WallpaperListPageResult.pageSize`
  - `WallpaperListPageResult.hasNextPage`
  - `WallpaperListPageResult.hasPreviousPage`
  - `WallpaperListPageResult.filters`
- `explore-catalog.tsx` 已切到消费新的分页元数据
- `playwright.config.ts` 已改成通过 `PLAYWRIGHT_PROXY_SERVER` 可选开启代理，便于线上联调
- `e2e/download.spec.ts` 已补下载面板的打开、格式/比例切换、缓存恢复用例

### ✅ TASK-016 · 公开探索页静态壳与公开缓存补强

- `/explore` 改为静态壳 + 客户端读取缓存 `GET /api/wallpapers?withMeta=true`
- `/explore/[category]` 补 `generateStaticParams()`，分类页按公开目录静态生成
- `GET /api/wallpapers` 新增分页元数据返回能力（`withMeta=true` / `page`）
- `wallpaper/[id]` 与 `creator/[username]` 补 `generateStaticParams()`，公开详情页更易命中预渲染
- 新增共享类型：
  - `types/api.ts` → `ApiSuccessResponse` / `ApiErrorResponse`
  - `types/wallpaper.ts` → `WallpaperListPageResult`

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

# TASK-023 · 公开页 UI/UX 二次打磨 brief

> 2026-04-26 Codex 复核范围：`/explore`、`/wallpaper/beauty-photo-0403`、下载配置弹层、上传工作台。Codex 已在数据层把媒体完整度纳入公开列表排序，并把下载面板的裁切/输出尺寸参数传到详情页下载链路；下面是需要 Claude Code 继续处理的纯 UI 部分。

## 目标

让 Lumen 从“胶片风格 demo 页面”收敛成一个真实可用的壁纸产品：

- 首屏先让用户看到壁纸，不让说明文字和统计框占据太多注意力
- 下载面板的预览区与配置区比例更合理，点击下载后有明确进度
- 动态壁纸卡片在视频尚未播放前也有封面，不出现大黑块
- 上传失败时把 R2/CORS 诊断信息变成可操作的下一步，而不是长错误句

## 当前问题

### Explore

- Hero 文案区偏大，真实壁纸网格在 1440×1200 视口里位置靠下；搜索和筛选已经足够表达功能，说明段落可压缩。
- 右侧统计小框信息密度低，占用了首屏横向注意力；建议改成搜索栏右侧的轻量状态，或移动到筛选栏下方。
- 卡片首屏会混入缺少 preview/thumb/尺寸的历史导入数据，容易显示成黑块或默认封面感。Codex 已在 `lib/explore.ts` 对 published 列表按媒体完整度优先排序，UI 侧仍建议给“封面缺失”状态一个更像产品内占位的样式。

### 壁纸详情页

- 桌面端标题在中文三段标题上容易出现单字孤行，比如“汉服 · 古风 · 女 / 性”。建议详情页标题最大字号再降一档，或给标题容器更宽的网格比例。
- “Wallpaper Detail / AI 描述 / Content Safety”等说明卡片太多，下载主操作被挤到下方。建议保留核心元数据、标签、主色调和下载按钮，把 AI 描述和举报说明改成可折叠/低权重区块。
- “进入暗房导出面板后，可切换...”这段是功能说明，不应作为详情页中部卡片常驻展示。建议移除或改成下载按钮下方一行极短提示。

### 下载配置面板

- 当前配置面板右侧过宽、预览图偏小，用户反馈“框很大一片空白”。建议桌面端改为 `minmax(560px, 1fr) / 420px` 左右比例，预览图按所选比例占满更多可用空间。
- 格式按钮“原图 / 4K / WebP”会让用户误解“原图”和“格式”是同一层级。Codex 后端已兼容，但 UI 最好拆成“输出类型：原图 / 转换导出”和“格式：PNG / WebP”。
- 点击下载后需要显示真实进度：`useWallpaperDownload` 已返回 `progress.percent`、`bytesReceived`、`totalBytes`、`status`、`result.format`、`result.resolution`，下载按钮应切换成进度态并在完成后同步下载数。
- 面板应直接读取响应头展示最终输出：`X-Wallpaper-Download-Format`、`X-Wallpaper-Download-Resolution`、`X-Wallpaper-Transformed`。

### 上传工作台

- R2 `status 0` 错误目前是长句，用户很难知道下一步。上传页可在错误态提供“运行上传诊断”按钮，打开 `/api/upload/diagnostics` 或在 UI 中展示诊断结果。
- `POST /api/upload/presign` 已返回：
  - `data.constraints.maxSizeBytes`
  - `data.diagnostics.corsDiagnosticsUrl`
  - `data.diagnostics.requiredHeaders`
  - `data.diagnostics.requiredMethod`
- `POST /api/wallpapers` 已返回更明确的错误码，例如 `WALLPAPER_UPLOAD_SOURCE_NOT_FOUND`、`R2_ACCESS_DENIED`、`WALLPAPER_VARIANT_GENERATION_FAILED`。UI 可按错误码展示短标题 + 操作建议。
- 上传页顶部仍有较长介绍文案；建议压缩为一行状态，更多说明放到 secondary/help 区，不占主流程。

## 建议改动文件

- `components/wallpaper/explore-catalog.tsx`
- `components/wallpaper/wallpaper-grid-card.tsx`
- `components/wallpaper/wallpaper-detail-sidebar.tsx`
- `components/wallpaper/DownloadPanel.tsx`
- `components/creator/upload-studio-form.tsx`
- 可选：`components/wallpaper/motion-preview-layer.tsx`

## Codex 已完成

- `lib/explore.ts`：公共壁纸列表排序增加媒体完整度权重，优先展示有 preview/thumb/4k、尺寸、视频封面的作品，降低缺失变体或缺 poster 的 published 数据在首屏出现的概率。
- `components/wallpaper/DownloadPanel.tsx` 与 `components/wallpaper/wallpaper-detail-sidebar.tsx`：下载回调已带上 `formatKey`、最终输出宽高和裁切框，详情页不再用固定 `3840 × 2160` 推断 4K；当前仍建议 Claude 继续打磨右侧控件密度和整体视觉层级。

## 验收建议

- `/explore` 首屏在 1440×1200 下至少能看到完整第一行 3 张壁纸卡片。
- `/wallpaper/beauty-photo-0403` 桌面标题不出现单字孤行，下载按钮无需滚动即可看到。
- 打开下载配置后，预览图在桌面端占面板宽度的 55% 以上，手机端配置项不遮挡图片。
- 下载时按钮显示进度百分比，完成后显示最终格式/分辨率。
- 上传 R2 失败时，错误态出现诊断入口和短操作建议。

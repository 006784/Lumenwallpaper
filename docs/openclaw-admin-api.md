# OpenClaw Admin API

`/api/openclaw/*` 是给外部 agent（例如 OpenClaw）调用的服务端管理接口。它使用单独的 API Key，不依赖站内登录态。

## 环境变量

```env
OPENCLAW_API_KEY=replace-with-a-long-random-secret
```

请求时推荐使用：

```http
Authorization: Bearer <OPENCLAW_API_KEY>
```

也兼容：

- `x-openclaw-key`
- `x-api-key`

## 主要接口

- `GET /api/openclaw`
- `GET /api/openclaw/tools`
- `GET /api/openclaw/tools/agents`
- `GET /api/openclaw/tools/mcp`
- `GET /api/openclaw/health`
- `POST /api/openclaw/upload/presign`
- `POST /api/openclaw/upload/remote`
- `GET /api/openclaw/wallpapers`
- `POST /api/openclaw/wallpapers`
- `PATCH /api/openclaw/wallpapers/batch`
- `GET /api/openclaw/wallpapers/duplicates`
- `POST /api/openclaw/wallpapers/duplicates/cleanup`
- `POST /api/openclaw/wallpapers/rename`
- `GET /api/openclaw/wallpapers/:id`
- `PATCH /api/openclaw/wallpapers/:id`
- `DELETE /api/openclaw/wallpapers/:id`
- `GET /api/openclaw/wallpapers/:id/download`
- `POST /api/openclaw/wallpapers/:id/analyze`
- `GET /api/openclaw/wallpapers/import-r2`
- `POST /api/openclaw/wallpapers/import-r2`
- `POST /api/openclaw/wallpapers/backfill`
- `GET /api/openclaw/reports`
- `PATCH /api/openclaw/reports`
- `GET /api/openclaw/reports/:id`
- `PATCH /api/openclaw/reports/:id`

## 调用示例

```bash
curl https://byteify.icu/api/openclaw/health \
  -H "Authorization: Bearer $OPENCLAW_API_KEY"
```

```bash
curl 'https://byteify.icu/api/openclaw/wallpapers?status=published&limit=10' \
  -H "Authorization: Bearer $OPENCLAW_API_KEY"
```

```bash
curl https://byteify.icu/api/openclaw/tools \
  -H "Authorization: Bearer $OPENCLAW_API_KEY"
```

```bash
curl https://byteify.icu/api/openclaw/tools/agents \
  -H "Authorization: Bearer $OPENCLAW_API_KEY"
```

```bash
curl https://byteify.icu/api/openclaw/tools/mcp \
  -H "Authorization: Bearer $OPENCLAW_API_KEY"
```

```bash
curl https://byteify.icu/api/openclaw/upload/presign \
  -X POST \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "demo.jpg",
    "contentType": "image/jpeg",
    "size": 1048576
  }'
```

从 Telegram file URL 或其他远程图片 URL 一步上传并创建壁纸：

```bash
curl https://byteify.icu/api/openclaw/upload/remote \
  -X POST \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://api.telegram.org/file/bot.../photos/file_12.jpg",
    "title": "telegram · wallpaper · 001",
    "description": "Imported by OpenClaw from Telegram.",
    "directory": "telegram",
    "tags": ["telegram", "openclaw"],
    "status": "published"
  }'
```

视频壁纸也可以传 `posterSourceUrl`，用于生成静态封面变体：

```bash
curl https://byteify.icu/api/openclaw/upload/remote \
  -X POST \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://example.com/motion.mp4",
    "posterSourceUrl": "https://example.com/motion-poster.jpg",
    "title": "motion · telegram · 001",
    "directory": "motion-videos",
    "tags": ["motion", "动态", "video"],
    "status": "published"
  }'
```

```bash
curl https://byteify.icu/api/openclaw/wallpapers/import-r2 \
  -X POST \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "creatorUsername": "Lumen",
    "limit": 100
  }'
```

```bash
curl 'https://byteify.icu/api/openclaw/wallpapers/duplicates?status=published&limit=20' \
  -H "Authorization: Bearer $OPENCLAW_API_KEY"
```

```bash
curl https://byteify.icu/api/openclaw/wallpapers/duplicates/cleanup \
  -X POST \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true,
    "keep": "latest",
    "reason": "asset_id",
    "limit": 20
  }'
```

```bash
curl https://byteify.icu/api/openclaw/wallpapers/rename \
  -X POST \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "displayTitle",
    "wallpaperIds": ["beauty-photo-0112", "beauty-photo-0113"]
  }'
```

```bash
curl https://byteify.icu/api/openclaw/wallpapers/batch \
  -X PATCH \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "wallpaperIds": ["beauty-photo-0112", "beauty-photo-0113"],
    "status": "published",
    "appendTags": ["精选"]
  }'
```

```bash
curl 'https://byteify.icu/api/openclaw/wallpapers/beauty-photo-0112/download?variant=4k' \
  -H "Authorization: Bearer $OPENCLAW_API_KEY"
```

## 上传流程

Telegram/OpenClaw 推荐使用一步式远程上传：

1. 从 Telegram `getFile` 拿到 `file_path`，拼出 `https://api.telegram.org/file/bot<TOKEN>/<file_path>`
2. 调 `POST /api/openclaw/upload/remote`，传 `sourceUrl + title + tags`
3. Lumen 会下载远程文件、上传 R2、创建 Supabase 壁纸记录、触发变体生成与 AI 分析

如果 OpenClaw 想自己控制 R2 PUT，可以继续使用三步式：

1. 调 `POST /api/openclaw/upload/presign`
2. 用返回的 `presignedUrl + headers` 把文件传到 R2
3. 调 `POST /api/openclaw/wallpapers` 写入壁纸记录

如果文件已经直接在 R2 里：

1. 调 `GET /api/openclaw/wallpapers/import-r2` 先扫描
2. 调 `POST /api/openclaw/wallpapers/import-r2` 导入前台
3. 如果你已经在别处拿到了对象列表，也可以直接把 `objects` 数组传给 `POST /api/openclaw/wallpapers/import-r2`

## 工具清单

`GET /api/openclaw/tools` 会返回一份 OpenAI function-tools 风格的 JSON 工具清单，包含：

- 健康检查
- 上传签名
- 远程 URL 一步上传
- 壁纸增删改查
- 下载选项与流式下载
- 重复壁纸检测
- 批量重命名
- 批量审核 / 状态更新
- R2 扫描导入
- 资产回填
- 举报审核

OpenClaw 或其他支持 function tools 的 agent 可以直接读取这份清单，然后按 `xHttp.method + xHttp.path` 调用对应 HTTP 接口。

如果你更偏向 OpenAI Agents 或 MCP 风格集成，还可以使用：

- `GET /api/openclaw/tools/agents`
  - 更扁平的 HTTP tool 清单
  - 包含 `baseUrl + auth + annotations.readOnlyHint`
- `GET /api/openclaw/tools/mcp`
  - MCP 风格的 HTTP 工具目录
  - 适合做二次转换或导入到自己的 MCP 桥接层

## 重复清理说明

`POST /api/openclaw/wallpapers/duplicates/cleanup` 默认行为：

- 默认 `dryRun = false` 以外建议你先显式传 `dryRun: true`
- 默认 `keep = latest`
- 默认 `reason = asset_id`

也就是说，默认只会清理“明确共享同一 R2 资产”的重复记录，不会默认删除仅靠标题/尺寸推断出来的 `fallback_fingerprint` 组，避免误删相似但并非同一张的作品。

## 说明

- 所有接口都返回统一 JSON 结构：
  - 成功：`{ data, message? }`
  - 失败：`{ error, code, status }`
- 接口默认 `Cache-Control: private, no-store`
- 这些接口直接复用站内数据层，所以会触发现有的：
  - R2 写入
  - Supabase 记录
  - AI 分析
  - 公开缓存刷新

# Cloudflare R2 实时同步

这套实时链路的目标是：你手动把图片或视频传进 Cloudflare R2 后，Cloudflare 立即把“新增对象”事件推给 Worker，Worker 再调用 Lumen 的 webhook，把对应对象直接导入前台。

当前仓库已经准备好的文件：

- `cloudflare/r2-import-sync-worker/src/index.js`
- `cloudflare/r2-import-sync-worker/wrangler.toml.example`
- `app/api/webhooks/r2-import/route.ts`

## 1. 安装 Wrangler

如果本机还没有 Wrangler，可以直接用：

```bash
cd cloudflare/r2-import-sync-worker
pnpm install
pnpm dlx wrangler@latest login
```

## 2. 配置 Worker

把 `wrangler.toml.example` 复制成 `wrangler.toml`：

```bash
cp wrangler.toml.example wrangler.toml
```

默认配置已经指向线上 webhook：

```toml
name = "lumen-r2-import-sync"
main = "src/index.js"
compatibility_date = "2026-04-03"

[[queues.consumers]]
queue = "lumen-r2-import-events"
max_batch_size = 50
max_batch_timeout = 5

[vars]
LUMEN_IMPORT_WEBHOOK_URL = "https://lumen-wallpaper.vercel.app/api/webhooks/r2-import"
LUMEN_IMPORT_SYNC_CREATOR_USERNAME = "Lumen"
LUMEN_IMPORT_WEBHOOK_BATCH_SIZE = "24"
```

再写入 Worker Secret：

```bash
pnpm dlx wrangler secret put LUMEN_IMPORT_WEBHOOK_SECRET
```

Secret 的值就是主站生产环境里的 `R2_IMPORT_WEBHOOK_SECRET`。

## 3. 创建队列

```bash
pnpm dlx wrangler queues create lumen-r2-import-events
```

## 4. 部署 Worker

```bash
pnpm deploy
```

部署后可以先看一下 Worker 是否在线：

```bash
pnpm dlx wrangler tail
```

## 5. 打开 R2 事件通知

把你的 R2 bucket `lument` 接到这个队列：

```bash
pnpm dlx wrangler r2 bucket notification create lument \
  --event-type object-create \
  --queue lumen-r2-import-events
```

如果你只想监听某个目录，也可以额外带前缀：

```bash
pnpm dlx wrangler r2 bucket notification create lument \
  --event-type object-create \
  --queue lumen-r2-import-events \
  --prefix imports/
```

## 6. 工作方式

这条实时链路会：

1. 接收 R2 `object-create` 事件
2. 过滤掉 `compressed/`、`thumbnails/`、`previews/` 这些衍生资源
3. 只保留图片和视频原文件：`jpg / jpeg / png / webp / mp4 / webm / mov`
4. 把对象 `key + size + lastModified` 批量发给：

```text
POST /api/webhooks/r2-import
```

主站收到后会只导入这些具体对象，不再整桶扫描，所以比定时任务更快也更准。

## 7. 建议

- 如果你经常直接往 R2 根目录丢文件，这条实时同步已经够用
- 如果你后面想把“人工上传”和“自动上传”区分开，建议统一放到 `imports/` 目录，再给事件通知加 `--prefix imports/`
- 定时任务 `/api/cron/import-r2` 可以继续保留，作为兜底补扫

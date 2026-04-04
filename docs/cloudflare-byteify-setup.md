# Cloudflare + Byteify 部署与缓存优化清单

这份说明专门面向当前 Lumen 的生产结构：

- 主站：`https://byteify.icu`
- 资源域：`https://img.byteify.icu`
- 应用层：Vercel
- 图片 / 视频静态资源：Cloudflare R2

## 推荐拓扑

不要把整个 `byteify.icu` 默认放在 Cloudflare 反代后面再回源到 Vercel。更稳的结构是：

- `byteify.icu` → 直接指向 Vercel
- `www.byteify.icu` → 重定向到 `byteify.icu`
- `img.byteify.icu` → 绑定到 Cloudflare R2 自定义域

这样可以把：

- 页面渲染、SSR、登录、API 交给 Vercel
- 壁纸图、视频封面、动态壁纸文件交给 Cloudflare 缓存和优化

## 主站 DNS

当前主站建议保持：

```text
@    A       76.76.21.21
www  CNAME   cname.vercel-dns.com
```

仓库里的中间件已经补了规范化跳转：

- `https://www.byteify.icu/*` → `https://byteify.icu/*`

## 资源域建议

生产资源域建议使用：

```text
img.byteify.icu
```

R2 这边完成自定义域绑定后，把环境变量改成：

```env
CLOUDFLARE_R2_PUBLIC_URL=https://img.byteify.icu
```

## 当前状态

现在生产环境已经是：

- 主站：`https://byteify.icu`
- 资源域：`https://img.byteify.icu`

并且站点接口返回的壁纸文件地址已经切到：

```text
https://img.byteify.icu/...
```

当前最值得继续做的一步，是把 `img.byteify.icu` 从“能访问”推进到“强缓存 + 图片优化 + 视频缓存命中”。

## Cloudflare 建议打开

资源域建议至少启用这些能力：

- Brotli
- Zstandard（如果你的套餐和规则界面可用）
- HTTP/3
- Always Use HTTPS
- SSL/TLS = Full (strict)
- Polish = Lossy
- WebP / AVIF 交付
- 对图片与视频资源设置长缓存

## 不建议默认开启

这些项建议谨慎处理，不要一开始全开：

- Rocket Loader
  - Next.js 应用容易因为脚本加载顺序和 CSP 出现兼容问题
- 全站 Cache Everything
  - 适合资源域，不适合直接套在整个 Next.js 站点和 API 上

## 资源缓存规则建议

### 1. 给 `img.byteify.icu` 建一条单独的 Cache Rule

路径：

- `Caching` → `Cache Rules` → `Create rule`

条件建议：

```text
Hostname equals img.byteify.icu
```

如果你想只缓存具体资源文件，也可以用更严格的表达式：

```text
(http.host eq "img.byteify.icu" and lower(http.request.uri.path) matches ".*\\.(jpg|jpeg|png|webp|avif|mp4|webm|mov)$")
```

动作建议：

- `Eligible for cache`
- `Edge TTL`：`Ignore cache-control header and use this TTL`
- `Edge TTL value`：`1 month` 到 `1 year`
- `Browser TTL`：`Respect origin` 或 `Override -> 1 month`
- `Cache deception armor`：`On`

建议分两档：

- 图片：
  - `jpg jpeg png webp avif`
  - `Edge TTL = 1 year`
  - `Browser TTL = 1 month` 或 `Respect origin`
- 视频：
  - `mp4 webm mov`
  - `Edge TTL = 1 month`
  - `Browser TTL = 7 days` 到 `1 month`

这样做的原因：

- 图片几乎不会变，适合更激进的边缘缓存
- 视频体积更大，保留适度更新窗口更稳

### 2. 如果你用的是免费版，先只做一条主规则

免费版也能先这样做：

```text
Hostname equals img.byteify.icu
→ Eligible for cache
→ Edge TTL 1 month
→ Browser TTL Respect origin
```

先把 `cf-cache-status` 从 `DYNAMIC` 拉到 `MISS/HIT`，收益已经很明显。

如果你在 Cloudflare 上给 `img.byteify.icu` 配缓存规则，建议把这些格式一起纳入：

- `jpg`
- `jpeg`
- `png`
- `webp`
- `avif`
- `mp4`
- `webm`
- `mov`

推荐方向：

- Edge TTL：图片 `1 year`，视频 `1 month`
- Browser TTL：优先 `Respect origin`，稳定后再提升
- Cache Deception Armor：`On`

## 图片优化建议

路径：

- `Speed` / `Images` / `Polish`

建议：

- `Polish = Lossy`
- `WebP` 自动交付开启
- 如果界面支持 `AVIF` 或 `format=auto` 类配置，也一起开

注意：

- `Polish` 主要优化标准图片格式，不会替你优化视频
- 如果原图已经是 `webp`，Polish 不会再继续优化它

## 压缩建议

路径：

- `Speed` → `Optimization` 或 `Rules` → `Compression Rules`

建议：

- 开启默认压缩
- 如果可选，优先 `Brotli + Gzip`
- 如果你当前套餐支持 `Zstandard`，可以在文本资源上开，但它对图片/视频本身帮助不大

说明：

- 压缩主要加速 HTML / CSS / JS / JSON
- 图片和视频本体的收益主要来自缓存和图片优化，不来自文本压缩

## Tiered Cache 建议

路径：

- `Caching` → `Tiered Cache`

建议：

- 开 `Tiered Cache`
- 如果有 `Smart Tiered Cache`，优先开它
- 如果你的访客分布很广，再看是否有 `Regional Tiered Cache`

这对图片站的意义是：

- 边缘节点未命中时，先去上层缓存拿
- 减少直接回源到 R2
- 提高首波访问后的整体命中率

## 不建议浪费时间的项

- `Rocket Loader`
  - 对 Next.js 主站不建议一上来开
- `Cache Reserve`
  - 对绑定到 zone 自定义域的 R2 公共 bucket 不适用，不要把它当这条链路的核心优化手段
- 给主站 `byteify.icu` 直接套全站 `Cache Everything`
  - 很容易把登录态、API、详情页缓存乱掉

## 项目侧已经完成的配套

当前仓库已经补好这些点：

1. `next.config.mjs` 会自动读取 `CLOUDFLARE_R2_PUBLIC_URL`，把对应 hostname 加到 Next.js 远程图片白名单
2. `middleware.ts` 会把 `www.byteify.icu` 统一 308 跳转到 `byteify.icu`
3. `.env.example` 和生产 Runbook 已切到 `byteify.icu / img.byteify.icu`
4. 保留了 `NEXT_DISABLE_IMAGE_OPTIMIZATION` 开关，后续可以按需关闭 Vercel 图片优化

## 最小可执行清单

先只做这 5 项就够：

1. `img.byteify.icu` 建 `Cache Rule`
2. `Eligible for cache`
3. 图片 `Edge TTL = 1 year`
4. 开 `Polish = Lossy`
5. 开 `Tiered Cache`

做完后你应该重点看这两个信号：

- 响应头里出现：
  - `cf-cache-status: HIT`
- 图片请求从：
  - `DYNAMIC`
 逐渐变成
  - `MISS -> HIT`

## 验证方法

你可以用浏览器开发者工具或终端看：

```bash
curl -I https://img.byteify.icu/Lumen/beauty-photo-0112.jpg
```

重点看：

- `cf-cache-status`
- `content-type`
- `cache-control`

理想状态：

- 首次：`MISS`
- 之后：`HIT`
- 图片格式保持正确，比如 `image/jpeg` / `image/webp`

## 建议的切换顺序

1. 先确认 `byteify.icu` 正常指向 Vercel
2. 在 Cloudflare 里给 R2 bucket 绑定 `img.byteify.icu`
3. 把 `CLOUDFLARE_R2_PUBLIC_URL` 改成 `https://img.byteify.icu`
4. 部署一版，确认前台图片和视频封面都正常加载
5. 再按实际效果决定是否开启：

```env
NEXT_DISABLE_IMAGE_OPTIMIZATION=true
```

如果开启这个变量，Next.js 会直接把远程图片交给浏览器请求，不再走 Vercel 的图片优化链路。

---
title: "FRAME™ 视觉一致性保障方案（单人版）"
subtitle: "设计 Token · 验收清单 · Playwright 回归"
project: FRAME™
date: "2026-04"
---

# FRAME™ 视觉一致性保障方案（单人版）

> 设计 Token · 验收清单 · Playwright 回归

---

## 1. 第一道防线：设计 Token 固化

把设计稿中所有「可测量的值」——颜色、字体、间距、圆角、动画时长——提取为代码常量，作为唯一可信来源（Single Source of Truth）。开发者只能从这个池子里取值，不能自行发明。

### 1.1 从设计稿提取 Token

基于我们已确认的 FRAME™ 设计，提取以下 Token：

### 颜色系统

```
// tailwind.config.ts → theme.extend.colors
colors: {
ink: '#0A0804', // 主文字、边框、按钮
paper: '#F2EDE4', // 背景（米黄）
paper2:'#E8E0D2', // 次级背景（悬停底色）
red: '#D42B2B', // 强调色、CTA、标题
gold: '#F5C842', // 标签、年份标识
muted: '#8A8070', // 次要文字、图例
// 壁纸渐变——只在 CSS 变量中定义，不放 Tailwind
},
```

### 字体系统

```
// tailwind.config.ts → theme.extend.fontFamily
fontFamily: {
display: ['DM Serif Display', 'Georgia', 'serif'], // 标题、pull quote
mono: ['Bebas Neue', 'Impact', 'sans-serif'], // 数字、Logo、Ticker
body: ['Instrument Sans', 'Helvetica', 'sans-serif'], // 正文、标签
},
```

### 间距 / 尺寸系统

```
// tailwind.config.ts → theme.extend.spacing
// 在默认 4px 基础上扩展项目专用值
spacing: {
'nav': '56px', // 导航栏高度
'section':'80px', // 章节上下内边距（桌面）
'card-sm':'13px', // 卡片间距
},
```

### 动画时长

```
// tailwind.config.ts → theme.extend.transitionDuration
transitionDuration: {
'film': '550ms', // 胶卷展开动画（cubic-bezier(.4,0,.2,1)）
'card': '700ms', // 卡片背景缩放
'info': '420ms', // 卡片信息滑入
'hover': '200ms', // 通用悬停反馈
},
```

### 边框

```
// tailwind.config.ts → theme.extend.borderWidth
borderWidth: {
'frame': '1.5px', // 全站统一边框粗细
},
```

### 1.2 Token 与 CSS 变量双轨制

Tailwind Token 负责静态值；动态值（如 GSAP 动画中间态）使用 CSS 变量，两者在 globals.css 中声明：

```
/* styles/globals.css */
:root {
--color-ink: #0A0804;
--color-paper: #F2EDE4;
--color-red: #D42B2B;
--color-gold: #F5C842;
--color-muted: #8A8070;
--border-frame: 1.5px solid #0A0804;
--dur-film: 550ms;
--ease-film: cubic-bezier(.4, 0, .2, 1);
}
```

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>⚠ 警告</strong></p>
<p>任何在代码中硬编码的颜色（如 style={{ color: '#d42b2b' }}）在 Code Review 中视为 [BLOCK] 错误。所有颜色必须引用 Token 或 CSS 变量。</p></td>
</tr>
</tbody>
</table>

### 1.3 设计稿 → Token 对应表（设计师维护）

以下表格由设计师在交付设计稿时同步填写，工程师严格对照实现：

|                    |                      |                              |                |
|--------------------|----------------------|------------------------------|----------------|
| **设计元素**       | **设计稿中的值**     | **对应 Token / Tailwind 类** | **验证方法**   |
| 全站背景色         | #F2EDE4             | bg-paper                     | 截图取色对比   |
| 主文字色           | #0A0804             | text-ink                     | 截图取色对比   |
| 强调红色           | #D42B2B             | text-red\` / \`bg-red        | 截图取色对比   |
| Nav 高度           | 56px                 | h-nav                        | Dev Tools 测量 |
| 全站边框           | 1.5px solid #0A0804 | border-frame border-ink      | Dev Tools 测量 |
| 标题字体           | DM Serif Display     | font-display                 | Dev Tools 查看 |
| 胶卷展开时长       | 550ms ease           | duration-film ease-film      | 录屏帧率对比   |
| 情绪卡 portrait    | 210×330px            | 硬编码尺寸（设计值）         | Dev Tools 测量 |
| 章节内边距（桌面） | 80px                 | py-section                   | Dev Tools 测量 |
| 噪点纹理透明度     | 3.8%                 | opacity-[0.038]            | 截图叠加对比   |

## 2. 第二道防线：Storybook 隔离开发

每个 UI 组件在 Storybook 中独立开发和审查，设计师可以直接在浏览器中与组件交互，不需要启动整个应用，实现「设计师即 QA」。

### 2.1 Storybook 配置

```
# 安装
npx storybook@latest init # 自动检测 Next.js + Tailwind
pnpm add -D @storybook/addon-designs # 嵌入 Figma 设计稿
pnpm add -D @storybook/test-runner # 自动截图测试
pnpm add -D @chromatic-com/storybook # 视觉对比云服务
```

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>ℹ 注意</strong></p>
<p>Storybook 在 localhost:6006 运行，与主应用（localhost:3000）完全隔离。组件在这里开发完成并通过设计师确认后，再集成到页面中。</p></td>
</tr>
</tbody>
</table>

### 2.2 必须建立 Story 的组件清单

以下 FRAME™ 核心组件，每个都必须有对应的 Story 文件：

|                       |                         |                                                                 |
|-----------------------|-------------------------|-----------------------------------------------------------------|
| **组件**              | **Story 文件**          | **必须覆盖的 Story 场景**                                       |
| FilmCell（胶卷格）    | FilmCell.stories.tsx    | 默认态 / 悬停展开态 / 移动端缩小态                              |
| MoodCard（情绪卡）    | MoodCard.stories.tsx    | 四种尺寸（portrait/landscape/square/tall）/ 悬停 / 下载按钮显示 |
| CatBlock（分类块）    | CatBlock.stories.tsx    | 收起态 / 展开态 / 七种分类渐变                                  |
| Nav（导航栏）         | Nav.stories.tsx         | 默认态 / 滚动后投影 / 移动端                                    |
| MagBtn（磁性按钮）    | MagBtn.stories.tsx      | 实心 / 描边 / 悬停位移 / 点击态                                 |
| SearchBar（搜索栏）   | SearchBar.stories.tsx   | 空态 / 有输入 / 标签选中                                        |
| DrCell（暗室格）      | DrCell.stories.tsx      | 普通 / 跨列 / 带 badge / 悬停                                   |
| Ticker（滚动公告）    | Ticker.stories.tsx      | 默认 / 暂停（鼠标悬停）                                         |
| HeroSection（英雄区） | HeroSection.stories.tsx | 桌面 / 平板 / 移动端                                            |
| UploadArea（上传区）  | UploadArea.stories.tsx  | 默认 / 拖入中 / 上传进度 / 成功                                 |

### 2.3 Story 文件规范

每个 Story 必须包含：嵌入的 Figma 设计稿链接、所有交互状态、移动端 viewport。

```
// components/wallpaper/MoodCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MoodCard } from './MoodCard';
const meta: Meta<typeof MoodCard> = {
title: 'Wallpaper/MoodCard',
component: MoodCard,
parameters: {
// 嵌入 Figma 设计稿——设计师在此直接对比
design: {
type: 'figma',
url: 'https://figma.com/file/xxx?node-id=MoodCard',
},
// 默认在移动端 viewport 预览
viewport: { defaultViewport: 'mobile1' },
},
};
export default meta;
// Story 1：四种尺寸
export const Portrait: StoryObj = {
args: { card: { k:'void', w:210, h:330, name:'深夜独处', sub:'宇宙·4K', n:'001' } },
};
export const Landscape: StoryObj = {
args: { card: { k:'forest', w:360, h:230, name:'清晨翠谷', sub:'自然·5K', n:'002' } },
};
// ...其他尺寸
// Story 2：强制悬停状态（用于截图对比）
export const Hovered: StoryObj = {
args: { card: { k:'dusk', w:210, h:330, name:'黄昏将至', sub:'渐变·4K', n:'003' } },
play: async ({ canvasElement }) => {
const card = canvasElement.querySelector('.mood-card');
await userEvent.hover(card); // 触发悬停动画
},
};
```

### 2.4 设计师审查流程（Storybook Review）

每个组件完成开发后，在 PR 合入 develop 之前，必须经过以下设计师审查步骤：

1.  开发者将 Storybook 部署到 Chromatic（自动，每次 push 触发）

2.  在 PR description 中附上 Chromatic Story 链接

3.  设计师在 Chromatic 页面开启「设计稿叠加」（使用 @storybook/addon-designs）

4.  设计师逐项检查 Story，发现偏差在 PR 评论中标注截图 + 具体说明

5.  开发者修复后重新推送，Chromatic 自动更新截图

6.  设计师确认无误，在 PR 添加 Approved 标签

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ 提示</strong></p>
<p>Chromatic 免费版提供 5,000 次/月 的截图配额，对于 FRAME™ 早期开发完全够用。设计师不需要配置任何本地环境，只需浏览器访问链接即可审查。</p></td>
</tr>
</tbody>
</table>

## 3. 第三道防线：Playwright 视觉回归测试

视觉回归测试（Visual Regression Testing）自动截图并与基准图对比，像素级发现「代码没报错但页面变样了」的问题。这是最后一道，也是最重要的自动化防线。

### 3.1 工具选型

|                  |                          |                                          |
|------------------|--------------------------|------------------------------------------|
| **工具**         | **定位**                 | **与 FRAME™ 的关系**                     |
| Playwright       | E2E 测试框架（微软出品） | 主测试运行器，负责启动浏览器、截图、交互 |
| @playwright/test | 内置 toHaveScreenshot()  | 像素级截图对比，基准图存入 Git           |
| Chromatic        | Storybook 云端视觉对比   | 组件级视觉守护，与 Storybook 集成        |
| Percy（可选）    | 页面级云端视觉对比       | 如 Chromatic 满足不了，升级到 Percy      |

### 3.2 截图基准建立流程

视觉回归测试的「基准」是在设计师确认效果后，手动生成并提交到 Git 的截图文件。这些截图就是「金标准」。

7.  设计师在 Storybook / Preview URL 确认所有页面效果「完全正确」

8.  Tech Lead 执行以下命令生成基准截图：

```
# 生成所有测试页面的基准截图（首次运行 / 设计更新后运行）
pnpm playwright test --update-snapshots
# 快照存入 e2e/__snapshots__/ 目录
```

9.  将快照文件提交到 Git（重要！）：

```
git add e2e/__snapshots__/
git commit -m 'test(visual): establish baseline snapshots v1.0'
```

10. 此后每次 PR，CI 自动运行对比，发现像素差异即报告失败

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✕ 重要</strong></p>
<p>基准截图只能在设计师「已正式确认」的状态下生成。如果基准是错的，后续所有测试都是在守护一个错误的设计。生成基准必须留下记录。</p></td>
</tr>
</tbody>
</table>

### 3.3 视觉回归测试文件示例

```
// e2e/visual/homepage.spec.ts
import { test, expect } from '@playwright/test';
test.describe('首页视觉回归', () => {
test('英雄区 — 桌面端', async ({ page }) => {
await page.goto('/');
await page.waitForLoadState('networkidle');
// 等待 GSAP 入场动画完成
await page.waitForTimeout(1200);
await expect(page.locator('.hero')).toHaveScreenshot(
'hero-desktop.png',
{ maxDiffPixels: 50 } // 允许 50px 以内的像素差（抗锯齿容差）
);
});
test('情绪版 — 卡片悬停', async ({ page }) => {
await page.goto('/');
const firstCard = page.locator('.mood-card-wrap').first();
await firstCard.hover();
await page.waitForTimeout(500); // 等待悬停动画
await expect(firstCard).toHaveScreenshot('mood-card-hovered.png');
});
test('分类栏 — 展开态', async ({ page }) => {
await page.goto('/');
await page.locator('.cat-block').nth(2).hover();
await page.waitForTimeout(600);
await expect(page.locator('.cat-strip')).toHaveScreenshot('cat-strip-expanded.png');
});
test('暗室区 — 整体', async ({ page }) => {
await page.goto('/');
await page.locator('.darkroom').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await expect(page.locator('.darkroom')).toHaveScreenshot('darkroom.png');
});
// ... 其余场景
});
// 移动端（iPhone 14 viewport）
test.use({ viewport: { width: 390, height: 844 } });
test('英雄区 — 移动端', async ({ page }) => {
await page.goto('/');
await page.waitForTimeout(1000);
await expect(page.locator('.hero')).toHaveScreenshot('hero-mobile.png');
});
```

### 3.4 必须覆盖的视觉回归场景

|        |                 |                               |                          |
|--------|-----------------|-------------------------------|--------------------------|
| **#** | **页面/区域**   | **场景**                      | **视口**                 |
| VR-01  | 首页 - Hero     | 初始加载（动画完成后）        | 桌面 1440px / 移动 390px |
| VR-02  | 首页 - Hero     | 胶卷格悬停展开                | 桌面                     |
| VR-03  | 首页 - 情绪版   | 卡片默认态（一排完整）        | 桌面                     |
| VR-04  | 首页 - 情绪版   | Portrait 卡片悬停（信息出现） | 桌面                     |
| VR-05  | 首页 - 分类栏   | 第 3 格展开态                 | 桌面                     |
| VR-06  | 首页 - 编辑精选 | 主图悬停（背景缩放）          | 桌面                     |
| VR-07  | 首页 - 暗室     | 整体（深色背景）              | 桌面 / 移动              |
| VR-08  | 首页 - 暗室     | 大格悬停（信息出现）          | 桌面                     |
| VR-09  | 首页 - Join 区  | 上传区悬停（+旋转变色）       | 桌面                     |
| VR-10  | 首页 - Ticker   | 完整展示                      | 桌面                     |
| VR-11  | Nav             | 默认态                        | 桌面 / 移动              |
| VR-12  | Nav             | 滚动后状态（投影）            | 桌面                     |
| VR-13  | 搜索区          | 标签激活态                    | 桌面 / 移动              |
| VR-14  | Footer          | 完整布局                      | 桌面 / 移动              |
| VR-15  | 噪点纹理        | 确认覆盖全页                  | 桌面                     |

### 3.5 CI 集成配置

```
# .github/workflows/visual.yml
name: Visual Regression
on:
pull_request:
branches: [develop, main]
jobs:
visual-test:
runs-on: ubuntu-latest
steps:
\- uses: actions/checkout@v4
\- uses: pnpm/action-setup@v4
\- run: pnpm install --frozen-lockfile
\- run: pnpm build && pnpm start &
\- run: npx wait-on http://localhost:3000
\- run: pnpm playwright install --with-deps chromium
\- run: pnpm playwright test e2e/visual/
\- uses: actions/upload-artifact@v4
if: failure()
with:
name: visual-diff
path: test-results/ # 包含 diff 对比图，直接上传供查看
```

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>ℹ 注意</strong></p>
<p>CI 运行失败时会自动上传差异对比图（actual / expected / diff 三张）到 GitHub Artifacts，PR 作者和 Reviewer 直接在 GitHub Actions 页面下载查看，无需本地复现。</p></td>
</tr>
</tbody>
</table>

### 3.6 视觉测试失败处理流程

当视觉回归测试失败时，分两种情况处理：

### 情况 A：代码错误导致外观改变（Bug）

- 下载 CI Artifacts 中的 diff 图，确认改变是非预期的
- 定位改变原因（通常是样式覆盖、Token 使用错误、组件逻辑改动）
- 修复代码，推送后 CI 重新运行对比

### 情况 B：设计有意更新（计划中的改动）

- 设计师在 PR 描述中明确声明「此次 PR 包含设计更新」
- Tech Lead 在本地运行 pnpm playwright test --update-snapshots 更新基准
- 将新基准截图提交到 PR，并附上设计师确认截图
- Reviewer 核实后批准合并

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>⚠ 警告</strong></p>
<p>不能因为「测试烦人」就随意更新基准截图。每次 --update-snapshots 必须有设计师明确确认的记录（截图或 Slack 消息）。</p></td>
</tr>
</tbody>
</table>

## 4. 设计交接清单（每个功能模块上线前）

以下清单在每个功能模块进入开发前，由设计师和 Tech Lead 共同完成签字确认。未完成的项目不得开始开发。

### 4.1 设计师交付物清单

|     |                                                                             |            |               |
|-----|-----------------------------------------------------------------------------|------------|---------------|
|     | **检查项**                                                                  | **负责人** | **结果**      |
| ☐   | Figma 设计稿已标注所有间距 / 颜色 / 字体（使用 Figma Variables 对应 Token） | 设计师     | *通过 / 失败* |
| ☐   | 所有组件已提供默认态、悬停态、移动端三种状态                                | 设计师     | *通过 / 失败* |
| ☐   | 动画效果已录屏或在 Figma Prototype 中标注（时长 / 曲线 / 触发方式）         | 设计师     | *通过 / 失败* |
| ☐   | 响应式断点（Mobile 375 / Tablet 768 / Desktop 1440）均有设计稿              | 设计师     | *通过 / 失败* |
| ☐   | 颜色 / 字体已更新到 tailwind.config.ts Token 对照表（本文档 1.3 节）        | 设计师     | *通过 / 失败* |
| ☐   | 图片资源已导出并上传（SVG 矢量 / PNG @2x）                                  | 设计师     | *通过 / 失败* |
| ☐   | Figma 链接已共享给开发团队（可评论权限）                                    | 设计师     | *通过 / 失败* |

### 4.2 开发阶段 Review 清单

以下检查在 PR Code Review 阶段由 Reviewer 执行（使用 Vercel Preview URL）：

|     |                                                                   |            |               |
|-----|-------------------------------------------------------------------|------------|---------------|
|     | **检查项**                                                        | **负责人** | **结果**      |
| ☐   | 颜色：截图取色与设计稿 Token 值完全一致（允许 ±2 HEX 的渲染误差） | Reviewer   | *通过 / 失败* |
| ☐   | 字体：字重 / 字号 / 字间距与设计稿一致，无系统字体降级            | Reviewer   | *通过 / 失败* |
| ☐   | 间距：关键区域用 Dev Tools 测量，误差 ≤ 2px                       | Reviewer   | *通过 / 失败* |
| ☐   | 边框：全站边框为 1.5px solid #0A0804，无 1px 或 2px 混用         | Reviewer   | *通过 / 失败* |
| ☐   | 噪点纹理：覆盖全页，透明度约 3.8%                                 | Reviewer   | *通过 / 失败* |
| ☐   | 胶卷格展开：悬停后 flex 展开，时长约 550ms，曲线平滑              | Reviewer   | *通过 / 失败* |
| ☐   | 情绪卡 3D 倾斜：鼠标移动时有 perspective 旋转效果                 | Reviewer   | *通过 / 失败* |
| ☐   | 情绪卡信息滑入：底部信息从下方滑出，不是淡入                      | Reviewer   | *通过 / 失败* |
| ☐   | 分类栏展开：悬停格变宽，文字 letter-spacing 增加                  | Reviewer   | *通过 / 失败* |
| ☐   | 磁性按钮：光标接近时有吸附位移                                    | Reviewer   | *通过 / 失败* |
| ☐   | 暗室格 3D 倾斜：与情绪卡相同的 perspective 效果                   | Reviewer   | *通过 / 失败* |
| ☐   | Ticker 滚动：连续无缝，速度均匀，字色分三种（白/金/红）           | Reviewer   | *通过 / 失败* |
| ☐   | 噪点不因滚动而「跳动」（position: fixed）                         | Reviewer   | *通过 / 失败* |
| ☐   | 移动端：胶卷区正确折叠为竖排高度区域                              | Reviewer   | *通过 / 失败* |
| ☐   | 移动端：情绪卡信息常驻显示（无 hover）                            | Reviewer   | *通过 / 失败* |
| ☐   | 移动端：Nav 隐藏链接，保留 Logo + 上传按钮                        | Reviewer   | *通过 / 失败* |

### 4.3 上线前最终确认清单

在 develop → main 的发布 PR 合并前，由设计师在 Production Preview URL 完成最终确认：

|     |                                                   |            |               |
|-----|---------------------------------------------------|------------|---------------|
|     | **检查项**                                        | **负责人** | **结果**      |
| ☐   | 设计师在 Production Preview 中亲自浏览全部页面    | 设计师     | *通过 / 失败* |
| ☐   | 所有 15 条视觉回归测试（VR-01 至 VR-15）已通过    | Tech Lead  | *通过 / 失败* |
| ☐   | Lighthouse 性能分 ≥ 85（不因动画导致 CLS > 0.1） | Tech Lead  | *通过 / 失败* |
| ☐   | 在真实 iPhone（非模拟器）中验证移动端效果         | 设计师     | *通过 / 失败* |
| ☐   | 在真实 Android 设备中验证移动端效果               | 设计师     | *通过 / 失败* |
| ☐   | Safari 浏览器兼容性确认（CSS 前缀、字体渲染）     | Reviewer   | *通过 / 失败* |
| ☐   | 设计师签字确认：本次上线效果与确认稿一致          | 设计师     | *通过 / 失败* |

## 5. 常见视觉偏差问题与预防

|                      |                                           |                                                           |
|----------------------|-------------------------------------------|-----------------------------------------------------------|
| **常见问题**         | **根本原因**                              | **预防措施**                                              |
| 颜色偏差             | 直接写 HEX 而非引用 Token                 | ESLint 规则禁止硬编码颜色；Code Review [BLOCK]          |
| 字体降级为系统字体   | Google Fonts 加载失败 / 字体名拼写错误    | CI 中验证字体加载；font-display: swap 加速                |
| 间距比设计稿大 4px   | 误用 p-4（16px）而非设计值                | Token 化间距；Dev Tools 测量写入 Review 清单              |
| 动画消失或闪烁       | 'use client' 缺失 / SSR 水合错误          | GSAP 组件统一封装为 client component；Playwright 截图验证 |
| 移动端 overflow 溢出 | 固定宽度未做响应式                        | Playwright 在 390px viewport 运行完整测试                 |
| 噪点纹理滚动时抖动   | position: absolute 而非 fixed             | 视觉回归测试中滚动后截图对比                              |
| 边框粗细不一致       | 部分组件用 border（1px）而非 border-frame | Token 统一；全局 grep 检查非 frame 边框                   |
| 暗室深色区域颜色偏亮 | display 色彩空间差异（P3 vs sRGB）        | 设计稿导出时确认 sRGB；截图在 sRGB 环境对比               |
| 字间距与设计稿不符   | letter-spacing 单位（em vs px）转换错误   | Token 中统一使用 em；表格中注明换算值                     |

## 6. 工具链速查

|                     |                                             |                                   |
|---------------------|---------------------------------------------|-----------------------------------|
| **场景**            | **命令 / 工具**                             | **说明**                          |
| 查看组件 Story      | pnpm storybook                              | 本地 6006 端口                    |
| 生成视觉基准截图    | pnpm playwright test --update-snapshots     | 设计确认后执行                    |
| 运行视觉回归测试    | pnpm playwright test e2e/visual/            | 对比基准，失败则报告 diff         |
| 查看失败 diff 图    | 打开 test-results/ 目录                     | actual/expected/diff 三图         |
| 在 CI 中下载 diff   | GitHub Actions → Artifacts → visual-diff    | PR 失败时查看                     |
| 检查颜色 Token 使用 | grep -r '#[0-9A-Fa-f]' --include='*.tsx' | 找出硬编码颜色                    |
| 检查组件字体渲染    | Chrome Dev Tools → Computed → font-family   | 确认无系统字体降级                |
| 测量间距            | Chrome Dev Tools → Box Model                | 对比 Token 值                     |
| 多设备预览          | Vercel Preview URL + Chrome 设备模式        | iPhone / Android 双验             |
| 录制动画对比视频    | OBS / macOS 截屏工具录屏                    | 与设计师 Figma Prototype 帧率对比 |

*FRAME™ 视觉一致性保障方案 v1.0*

设计确认 → Token 固化 → Storybook 审查 → 视觉回归测试 → 上线确认

---
title: "FRAME™ 工程开发流程规范"
subtitle: "本地环境 · Git 工作流 · CI/CD · 测试 · 发布流程"
project: FRAME™
date: "2026-04"
---

# FRAME™ 工程开发流程规范

> 本地环境 · Git 工作流 · CI/CD · 测试 · 发布流程

---

## 1. 本地开发环境搭建

所有工程师在首次加入项目时，必须按以下步骤完整配置本地环境。统一环境版本可避免「在我机器上是好的」类问题。

### 1.1 前置依赖

|          |              |                       |                                         |
|----------|--------------|-----------------------|-----------------------------------------|
| **工具** | **推荐版本** | **安装方式**          | **说明**                                |
| Node.js  | ≥ 20 LTS     | nvm install 20        | 通过 nvm 管理版本，避免全局污染         |
| pnpm     | ≥ 9.x        | npm install -g pnpm   | 替代 npm/yarn，速度更快，硬链接节省磁盘 |
| Git      | ≥ 2.40       | brew install git      | 确保支持 Signed Commits                 |
| Docker   | ≥ 26         | Docker Desktop        | 本地运行 Supabase 容器                  |
| VS Code  | 最新稳定版   | code.visualstudio.com | 团队统一编辑器，共享配置                |

### 1.2 一键初始化脚本

克隆仓库后执行以下命令，自动完成依赖安装、Git hooks 注册、环境变量模板复制：

```
# 克隆仓库
git clone git@github.com:your-org/frame.git
cd frame
# 安装依赖（pnpm，使用 workspace 协议）
pnpm install
# 注册 Git Hooks（Husky）
pnpm prepare
# 复制环境变量模板
cp .env.example .env.local
# 然后在 .env.local 中填入各服务密钥（见第 5 节）
# 启动本地 Supabase（需要 Docker）
npx supabase start
# 执行数据库迁移
npx supabase db push
# 启动开发服务器
pnpm dev
# 访问 http://localhost:3000
```

### 1.3 推荐 VS Code 插件

项目根目录 .vscode/extensions.json 已配置，打开项目时 VS Code 会自动提示安装：

|                           |                           |                             |
|---------------------------|---------------------------|-----------------------------|
| **插件**                  | **ID**                    | **用途**                    |
| ESLint                    | dbaeumer.vscode-eslint    | 实时代码规范检查            |
| Prettier                  | esbenp.prettier-vscode    | 保存时自动格式化            |
| Tailwind CSS IntelliSense | bradlc.vscode-tailwindcss | Tailwind 类名自动补全       |
| TypeScript Error Lens     | usernamehw.errorlens      | 行内显示 TS 错误            |
| GitLens                   | eamodio.gitlens           | 行级 git blame，历史回溯    |
| Prisma                    | Prisma.prisma             | Supabase 类型感知（可选）   |
| i18n Ally                 | lokalise.i18n-ally        | 多语言字符串管理（v2 规划） |

### 1.4 本地服务端口规划

|                    |          |                                          |
|--------------------|----------|------------------------------------------|
| **服务**           | **端口** | **说明**                                 |
| Next.js Dev Server | 3000     | 主应用                                   |
| Supabase Studio    | 54323    | 本地数据库管理 UI                        |
| Supabase API       | 54321    | 本地 PostgREST API                       |
| Supabase Auth      | 54322    | 本地 GoTrue Auth                         |
| Supabase Inbucket  | 54324    | 本地邮件收件箱（调试 Resend/Magic Link） |
| Storybook（可选）  | 6006     | 组件文档                                 |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ 提示</strong></p>
<p>Supabase Inbucket（端口 54324）是本地邮件收件箱，开发阶段所有 Magic Link 邮件都会在这里捕获，无需真实发送。调试认证流程时请先检查这里。</p></td>
</tr>
</tbody>
</table>

## 2. Git 工作流

### 2.1 分支策略（GitHub Flow 变体）

FRAME™ 采用简化版 GitHub Flow，围绕两条长期分支构建，配合功能分支短生命周期原则：

|            |                                  |                         |                                        |
|------------|----------------------------------|-------------------------|----------------------------------------|
| **分支**   | **保护级别**                     | **对应环境**            | **说明**                               |
| main       | 强保护（需 2 人 Review + CI 绿） | Production (frame.app)  | 唯一生产分支，只接受来自 develop 的 PR |
| develop    | 保护（需 1 人 Review + CI 绿）   | Preview (dev.frame.app) | 集成分支，所有功能合入此处             |
| feat/xxx   | 无保护                           | Preview URL（自动）     | 功能开发分支，从 develop 切出          |
| fix/xxx    | 无保护                           | Preview URL（自动）     | Bug 修复分支                           |
| hotfix/xxx | 无保护                           | 本地测试                | 紧急修复，直接向 main 提 PR            |
| chore/xxx  | 无保护                           | —                       | 工程配置、依赖升级等                   |

### 2.2 分支命名规范

分支名全小写，使用连字符分隔，格式：{类型}/{issue 编号}-{简短描述}

```
# 正确示例
feat/42-horizontal-mood-scroll
fix/87-mobile-nav-overflow
hotfix/105-r2-presign-expiry
chore/update-gsap-to-3-12
# 错误示例（不要这样做）
Feature_NewCard # 大写 + 下划线
fix # 无描述
wangs-branch # 用人名命名
```

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>⚠ 警告</strong></p>
<p>分支名中不要包含个人名字，分支属于任务，不属于人。任何人都可能接手某个分支继续开发。</p></td>
</tr>
</tbody>
</table>

### 2.3 Commit 规范（Conventional Commits）

所有 commit message 必须遵循 Conventional Commits 规范，Husky pre-commit hook 会自动校验：

```
# 格式
<type>(<scope>): <简短描述（中文/英文均可，≤72字符）>
# 完整示例
feat(mood-board): add drag-to-scroll interaction
fix(r2): correct presigned url expiry to 300s
chore(deps): upgrade gsap to 3.12.5
docs(api): add wallpaper upload endpoint JSDoc
refactor(auth): extract magic-link token logic to lib/token.ts
test(upload): add unit test for file-size validation
style(hero): adjust headline letter-spacing on mobile
perf(gallery): lazy-init GSAP outside viewport
```

|          |                                              |
|----------|----------------------------------------------|
| **Type** | **使用场景**                                 |
| feat     | 新功能                                       |
| fix      | Bug 修复                                     |
| chore    | 工程配置、依赖更新、脚本等（不影响生产代码） |
| docs     | 文档、注释                                   |
| refactor | 重构（无功能变化）                           |
| test     | 测试相关                                     |
| style    | 代码格式（不影响逻辑）                       |
| perf     | 性能优化                                     |
| ci       | CI/CD 配置                                   |
| revert   | 回滚某个 commit                              |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>ℹ 注意</strong></p>
<p>Husky commit-msg hook 会拦截不符合规范的 commit message，并给出错误提示。这一步在本地发生，不会触发 CI，修改 message 后重新 commit 即可。</p></td>
</tr>
</tbody>
</table>

### 2.4 日常开发流程（完整步骤）

1.  从 develop 切出新功能分支

```
git checkout develop
git pull origin develop
git checkout -b feat/42-horizontal-mood-scroll
```

2.  开发 → 小步提交（每个逻辑单元一个 commit）

```
git add -p # 交互式暂存，避免提交无关修改
git commit -m 'feat(mood): add horizontal scroll container'
```

3.  推送分支前，先同步 develop 最新代码（rebase 保持线性历史）

```
git fetch origin
git rebase origin/develop
# 解决冲突后：git rebase --continue
```

4.  推送并创建 Pull Request

```
git push origin feat/42-horizontal-mood-scroll
# 在 GitHub 点击「Compare & pull request」
# 目标分支：develop
```

5.  等待 CI 通过 + Code Review 批准（≥ 1 人）

6.  Squash Merge 合入 develop（由 Reviewer 或 PR 作者执行）

```
# GitHub PR 界面选择「Squash and merge」
# merge commit message 格式：feat(mood): horizontal scroll (#42)
```

7.  删除已合入的功能分支

```
git push origin --delete feat/42-horizontal-mood-scroll
git branch -d feat/42-horizontal-mood-scroll
```

### 2.5 禁止行为

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✕ 重要</strong></p>
<p>以下行为会触发 Code Review 拒绝，严重情况会导致 CI 锁定：</p></td>
</tr>
</tbody>
</table>

- 直接向 main / develop 强推（force push）——任何情况下都不允许
- 在功能分支上使用 git merge develop（应使用 rebase）
- 一个 commit 包含多个不相关的修改（「大杂烩 commit」）
- commit message 使用 "fix bug"、"update"、"wip" 等无意义描述
- 将 .env.local 或任何包含密钥的文件提交到仓库
- 在主干分支上直接开发功能（绕过 PR 流程）

## 3. Code Review 规范

### 3.1 PR 创建标准

每个 PR 提交时必须填写模板，GitHub 已在 .github/pull_request_template.md 中预设：

```
## 变更内容
<!-- 用 1-3 句话描述这个 PR 做了什么 -->
## 关联 Issue
Closes #42
## 变更类型
\- [ ] feat 新功能
\- [ ] fix Bug 修复
\- [ ] chore 工程改动
\- [ ] refactor 重构
## 测试方法
<!-- Reviewer 如何在本地复现 / 验证 -->
1. 进入首页
2. 在情绪版区域用鼠标拖拽
3. 应可横向滚动，松手后惯性继续滑动
## 截图 / 录屏（UI 变更必填）
<!-- 拖入截图或 GIF -->
## Checklist
\- [ ] 代码已自测
\- [ ] 已添加 / 更新相关测试
\- [ ] 无 console.log 遗留
\- [ ] 无硬编码密钥或 URL
```

### 3.2 Reviewer 职责与标准

|              |                                |                               |
|--------------|--------------------------------|-------------------------------|
| **检查维度** | **关注点**                     | **通过标准**                  |
| 正确性       | 逻辑是否正确，边界情况是否处理 | 核心路径 + 异常路径都覆盖     |
| 可读性       | 命名、注释、函数长度           | 函数 ≤ 50 行，命名见名知意    |
| 类型安全     | TypeScript any 滥用、类型断言  | 无不合理的 as 强转，无 any    |
| 性能         | 不必要的 re-render、大包引入   | 无明显性能回退                |
| 安全         | SQL 注入、XSS、未鉴权 API      | Supabase RLS 验证，输入已转义 |
| 测试         | 关键逻辑是否有测试覆盖         | 新功能 / Bug 修复应有对应测试 |
| UI           | 移动端适配，与设计稿一致性     | 在 Preview URL 验证移动端     |

### 3.3 Review 评论规范（RFC 标签系统）

评论前缀使用标签区分严重程度，避免 Reviewer 和作者在「这是必须改的还是建议」上产生歧义：

|              |                                            |                               |
|--------------|--------------------------------------------|-------------------------------|
| **标签**     | **含义**                                   | **作者操作**                  |
| [BLOCK]    | 阻塞性问题，必须修复才能合并               | 修复后 request re-review      |
| [SUGGEST]  | 建议优化，不阻塞合并，可本次或后续处理     | 标记 resolve 或说明不采纳原因 |
| [QUESTION] | 提问，需要作者解释思路，不一定需要修改     | 回复解释即可                  |
| [NIT]      | 微小细节（拼写、格式），作者自行决定是否改 | 可忽略                        |
| [PRAISE]   | 肯定好的代码，鼓励文化                     | 无需操作，感谢即可            |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✓ 提示</strong></p>
<p>Code Review 不是挑错大会，而是知识传递和质量把关。[PRAISE] 标签鼓励好的实践，[QUESTION] 标签促进团队学习，不要只留 [BLOCK]。</p></td>
</tr>
</tbody>
</table>

### 3.4 SLA（Review 时效承诺）

- 工作日内收到 Review 请求 → 24 小时内完成首次 Review
- 作者收到 Review 意见 → 48 小时内响应（修复或回复说明）
- 紧急 Bug 修复（hotfix）→ 2 小时内完成 Review
- 长期无人 Review 的 PR → 作者可在 Slack #dev-review 频道 @提醒

## 4. CI/CD 流水线

### 4.1 流水线总览

所有 Push 和 PR 事件都会触发 GitHub Actions 流水线。以下是完整流程：

|                |                   |                                              |              |
|----------------|-------------------|----------------------------------------------|--------------|
| **阶段**       | **触发时机**      | **步骤**                                     | **预计耗时** |
| Lint & Format  | 所有 Push / PR    | ESLint + Prettier 检查 + TypeScript 类型检查 | ~30s         |
| Unit Test      | 所有 Push / PR    | Vitest 单元测试 + 覆盖率报告                 | ~60s         |
| E2E Test       | PR → develop/main | Playwright 端到端测试（核心流程）            | ~3min        |
| Build          | 所有 Push / PR    | next build + Bundle 体积分析                 | ~90s         |
| Preview Deploy | PR 创建 / 更新    | Vercel Preview URL 部署                      | ~2min        |
| Prod Deploy    | main 分支 push    | Vercel Production 部署                       | ~3min        |

### 4.2 GitHub Actions 配置

主要 workflow 文件位于 .github/workflows/ 目录：

```
# .github/workflows/ci.yml （在 PR 时触发）
name: CI
on:
pull_request:
branches: [main, develop]
jobs:
lint:
runs-on: ubuntu-latest
steps:
\- uses: actions/checkout@v4
\- uses: pnpm/action-setup@v4
\- run: pnpm install --frozen-lockfile
\- run: pnpm lint
\- run: pnpm type-check
test:
runs-on: ubuntu-latest
services:
supabase:
image: supabase/postgres:15
env: { POSTGRES_PASSWORD: postgres }
steps:
\- uses: actions/checkout@v4
\- run: pnpm test:unit --coverage
\- uses: codecov/codecov-action@v4
build:
runs-on: ubuntu-latest
steps:
\- run: pnpm build
\- name: Check bundle size
uses: andresz1/size-limit-action@v1
```

### 4.3 本地 Pre-commit Hooks（Husky）

在代码推送前，Husky 在本地执行轻量检查，快速反馈，避免明显问题进入 CI：

|            |                    |                                                   |
|------------|--------------------|---------------------------------------------------|
| **Hook**   | **触发时机**       | **执行内容**                                      |
| pre-commit | git commit 前      | lint-staged（只检查暂存文件的 ESLint + Prettier） |
| commit-msg | 输入 commit 信息后 | commitlint（校验 Conventional Commits 格式）      |
| pre-push   | git push 前        | pnpm type-check（TypeScript 全量类型检查）        |

```
# lint-staged 配置（package.json）
"lint-staged": {
"*.{ts,tsx}": ["eslint --fix", "prettier --write"],
"*.{css,md,json}": ["prettier --write"]
}
```

### 4.4 分支保护规则（GitHub 设置）

### main 分支

- 要求 PR（禁止直接 push）
- Required Reviews: 2
- Required status checks: lint, test, build（全部必须通过）
- Require branches to be up to date before merging
- Restrict who can merge: 仅 Tech Lead / Senior Engineer

### develop 分支

- 要求 PR（禁止直接 push）
- Required Reviews: 1
- Required status checks: lint, build（test 可选，加速迭代）
- Allow squash merge only（强制 Squash Merge，保持线性历史）

## 5. 环境变量管理

### 5.1 分层管理原则

- .env.example — 提交到 Git，只包含变量名和说明，值留空或填示例值
- .env.local — 不提交 Git（.gitignore），本地开发使用
- Vercel 环境变量 — 在 Vercel Dashboard 配置，分 Production / Preview / Development 三档
- GitHub Secrets — 仅 CI/CD 中使用的密钥（如 Vercel Token、Codecov Token）

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✕ 重要</strong></p>
<p>绝对禁止将任何真实密钥（API Key、Secret）提交到 Git 仓库，包括私有仓库。如已发生，必须立即在对应平台撤销并重新生成密钥。</p></td>
</tr>
</tbody>
</table>

### 5.2 .env.example 标准模板

```
# ── Cloudflare R2 ──────────────────────────────
CLOUDFLARE_R2_ACCOUNT_ID= # 在 R2 概览页面获取
CLOUDFLARE_R2_ACCESS_KEY_ID= # 创建 R2 API Token 时生成
CLOUDFLARE_R2_SECRET_ACCESS_KEY= # 创建 R2 API Token 时生成（只显示一次）
CLOUDFLARE_R2_BUCKET=frame-wallpapers
CLOUDFLARE_R2_PUBLIC_URL=https://img.frame.app
# ── Supabase ────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY= # 前端公开密钥（可暴露）
SUPABASE_SERVICE_ROLE_KEY= # 后端专用，绝不暴露给前端
# ── Resend ──────────────────────────────────────
RESEND_API_KEY=re_xxxx # Resend Dashboard 获取
RESEND_FROM_EMAIL=noreply@frame.app # 必须已在 Resend 验证域名
# ── NextAuth ────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000 # 生产改为 https://frame.app
NEXTAUTH_SECRET= # openssl rand -base64 32
# ── 可选（开发阶段可不填）──────────────────────
SENTRY_DSN= # 错误监控
UPSTASH_REDIS_URL= # 速率限制
UPSTASH_REDIS_TOKEN=
```

### 5.3 新增环境变量操作规范

8.  在 .env.example 中添加变量名 + 注释说明（必须）

9.  在 Vercel Dashboard 对应环境（Production / Preview / Development）中添加实际值

10. 更新开发文档（本文档 5.2 节 / README 中的环境变量章节）

11. 在 PR description 中注明「新增了环境变量 XXX，需要 Reviewer 确认已在 Vercel 配置」

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>⚠ 警告</strong></p>
<p>忘记在 Vercel 配置新增的环境变量是最常见的上线故障原因之一。每次 PR 合入前，Reviewer 必须确认此项。</p></td>
</tr>
</tbody>
</table>

## 6. 测试规范

### 6.1 测试分层

|            |                                 |                             |                         |               |
|------------|---------------------------------|-----------------------------|-------------------------|---------------|
| **层级**   | **框架**                        | **范围**                    | **覆盖目标**            | **运行时机**  |
| 单元测试   | Vitest                          | lib/ hooks/ utils/ 纯函数   | 核心工具函数 80% 覆盖率 | pre-push + CI |
| 组件测试   | Vitest + @testing-library/react | UI 组件交互逻辑             | 关键组件 60% 覆盖率     | CI            |
| 集成测试   | Vitest                          | API Routes / Server Actions | 主要 API 端点           | CI            |
| 端到端测试 | Playwright                      | 完整用户流程                | 5 条核心流程（见 6.3）  | PR → develop  |

### 6.2 测试文件放置规范

```
# 单元测试 / 组件测试：与被测文件同级，__tests__ 子目录
lib/
token.ts
__tests__/
token.test.ts
# E2E 测试：统一放在 e2e/ 目录
e2e/
auth.spec.ts # 认证流程
upload.spec.ts # 上传流程
download.spec.ts # 下载流程
```

### 6.3 必须覆盖的端到端测试场景

|        |                                |                                                 |
|--------|--------------------------------|-------------------------------------------------|
| **#** | **场景**                       | **关键断言**                                    |
| E2E-01 | 用户完整注册 + Magic Link 登录 | 收到邮件 → 点击链接 → 成功登录 → 显示用户名     |
| E2E-02 | 壁纸上传（创作者）             | 选择文件 → 上传进度 → 处理完成 → 出现在个人主页 |
| E2E-03 | 壁纸浏览与下载（访客）         | 首页进入详情 → 点击下载 → 文件成功下载          |
| E2E-04 | 搜索与过滤                     | 输入关键词 → 结果更新 → 切换标签 → 结果再次更新 |
| E2E-05 | 收藏壁纸（已登录用户）         | 点击收藏 → 图标变化 → 进入收藏夹页面 → 壁纸存在 |

## 7. 发布流程

### 7.1 常规发布（每两周一次）

采用两周迭代周期，每个迭代末进行一次正式发布：

|             |                |                                                  |            |
|-------------|----------------|--------------------------------------------------|------------|
| **步骤**    | **时间节点**   | **操作**                                         | **负责人** |
| 代码冻结    | 发布日 -2 天   | 停止向 develop 合入新功能 PR，只接受 bug fix     | Tech Lead  |
| 回归测试    | 发布日 -2 天   | 在 dev.frame.app 执行完整 E2E 测试清单           | QA / Dev   |
| 发布 PR     | 发布日 -1 天   | 创建 develop → main 的 PR，标题：release: v1.x.x | Tech Lead  |
| 二次 Review | 发布日 -1 天   | 至少 2 名 Senior 工程师 Review 发布 PR           | Senior Dev |
| 合并发布    | 发布日上午     | Squash Merge → main，CI 自动触发生产部署         | Tech Lead  |
| 发布验证    | 发布后 30 分钟 | 在 frame.app 验证核心功能正常                    | 全体 Dev   |
| 发布公告    | 发布后         | 在 Slack #announcements 发布 changelog          | Tech Lead  |

### 7.2 版本号规范（语义化版本）

遵循 SemVer 2.0.0 规范：MAJOR.MINOR.PATCH

- MAJOR（主版本）：不兼容的重大变更，如数据库结构大改、认证方式切换
- MINOR（次版本）：向后兼容的新功能，如新增上传功能、暗室精选页
- PATCH（补丁）：向后兼容的 Bug 修复

```
# Tag 规范（在发布 PR 合并后打 Tag）
git tag -a v1.2.0 -m 'release: add darkroom featured section'
git push origin v1.2.0
```

### 7.3 紧急热修复流程（Hotfix）

生产环境出现严重 Bug（核心功能不可用、数据错误、安全漏洞）时启用 Hotfix 流程：

12. 立即在 Slack #incidents 创建事故 Thread，@ 相关人员

13. 从 main 切出 hotfix 分支

```
git checkout main && git pull
git checkout -b hotfix/105-fix-r2-presign-crash
```

14. 快速开发修复，本地验证

15. 向 main 提 PR（不经过 develop），标题加 [HOTFIX] 前缀

16. Tech Lead 快速 Review（2小时内），CI 通过后立即合并

17. 合并后同步 cherry-pick 到 develop：

```
git checkout develop
git cherry-pick <hotfix-commit-hash>
git push origin develop
```

18. 发布 PATCH 版本 Tag，更新事故 Thread

19. 发布后 24 小时内完成事后复盘（Post-mortem）文档

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>✕ 重要</strong></p>
<p>Hotfix 不是「随便跳过流程」的许可证。即便是紧急修复，也必须经过 PR 和 CI。直接 push main 是严格禁止的。</p></td>
</tr>
</tbody>
</table>

## 8. 代码规范与最佳实践

### 8.1 TypeScript 规范

- 严格模式：tsconfig.json 中 strict: true，不得关闭
- 禁止 any：除非有充分注释说明，使用 unknown 配合类型守卫代替
- 类型优先声明：先定义接口 / 类型，再写实现
- 避免类型断言（as）：优先使用类型守卫或缩小类型范围
- API 响应类型：所有 API 返回值必须有显式类型定义

```
// ✅ 正确
interface Wallpaper {
id: string;
title: string;
status: 'processing' \| 'published' \| 'rejected';
}
// ❌ 错误
const wall: any = await fetch('/api/wallpapers');
```

### 8.2 React / Next.js 规范

- 优先 Server Components（RSC）：无需客户端状态的组件不加 'use client'
- 数据获取放在服务端：避免在客户端 fetch，利用 RSC 减少 JS 体积
- 'use client' 边界最小化：仅在真正需要浏览器 API / 事件处理时加
- 组件拆分原则：单一职责，超过 150 行考虑拆分子组件
- 自定义 Hook：复杂状态逻辑抽到 hooks/ 目录，组件只负责渲染
- 错误边界：关键 UI 区域包裹 <ErrorBoundary>

### 8.3 样式规范（Tailwind CSS）

- 类名顺序：布局 → 尺寸 → 间距 → 颜色 → 字体 → 动画（使用 prettier-plugin-tailwindcss 自动排序）
- 禁止内联 style：除非是动态计算值（如 GSAP 动画）
- 响应式优先：默认写移动端样式，用 sm: md: lg: 逐步增强
- 设计 Token：主题色、间距等在 tailwind.config.ts 中统一定义，不硬编码
- 复杂组件：超过 5 个 Tailwind 类的组合考虑抽为 CVA（Class Variance Authority）变体

### 8.4 API 规范

- 所有 API Route 必须：校验 Session → 校验输入（Zod）→ 执行操作 → 返回统一格式
- 错误返回统一结构：{ error: string; code: string; status: number }
- 成功返回统一结构：{ data: T; message?: string }
- HTTP 状态码语义化：200 成功，201 创建，400 客户端错误，401 未认证，403 无权限，500 服务器错误
- Zod 输入验证：所有 POST / PUT / PATCH 接口必须用 Zod schema 校验 body

```
// 标准 API Route 结构示例
export async function POST(req: Request) {
// 1. 鉴权
const session = await getServerSession(authOptions);
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
// 2. 输入校验
const body = await req.json();
const result = UploadSchema.safeParse(body);
if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 400 });
// 3. 业务逻辑
const presignedUrl = await generatePresignedUrl(result.data);
// 4. 返回
return Response.json({ data: { url: presignedUrl } }, { status: 201 });
}
```

## 9. 日志与监控

### 9.1 错误监控（Sentry）

- 前端：Sentry.init 在 instrumentation.ts 中配置，自动捕获未处理 Promise 和 React 渲染错误
- 后端：API Routes 中用 try-catch 包裹，异常传给 Sentry.captureException
- Source Map 上传：CI 构建时自动上传，保证错误堆栈可读
- 告警规则：错误率 > 1% 或新错误出现 → Slack #alerts 通知

### 9.2 日志规范

- 禁止 console.log 进入生产代码（ESLint 规则 no-console 强制）
- 服务端日志使用结构化日志（推荐 pino）：{ level, message, ...context }
- 关键操作记录：上传、下载、登录、发布均需记录日志（不包含个人敏感信息）
- Vercel Function Logs：可在 Vercel Dashboard → Logs 查看实时日志

### 9.3 性能监控

- Vercel Analytics：自动采集 Core Web Vitals（LCP / CLS / FID），在 Dashboard 查看
- Lighthouse CI：CI 流水线中集成 Lighthouse，LCP < 2.5s 为通过门槛
- Bundle 体积：size-limit 在 CI 中检查，超过阈值的 PR 会收到 Review comment

## 10. 团队协作规范

### 10.1 Slack 频道结构

|                 |                  |                                             |
|-----------------|------------------|---------------------------------------------|
| **频道**        | **用途**         | **使用规范**                                |
| #dev-general   | 日常技术讨论     | 技术问题、学习分享、非紧急讨论              |
| #dev-review    | Code Review 催促 | 超 24h 未获 Review 时在此 @提醒             |
| #dev-deploy    | 部署通知         | CI Bot 自动发布部署状态，不手动发消息       |
| #alerts        | 生产告警         | Sentry / Vercel 告警自动推送，@on-call 响应 |
| #incidents     | 线上事故处理     | 事故期间所有沟通集中在此，事后附复盘文档    |
| #product       | 产品需求讨论     | 需求澄清、优先级讨论、设计评审              |
| #announcements | 正式公告         | 仅 Tech Lead / PM 发布，发布 changelog 等   |

### 10.2 会议规范

|                |                    |          |                                  |
|----------------|--------------------|----------|----------------------------------|
| **会议**       | **频率**           | **时长** | **必须输出**                     |
| Sprint Kickoff | 每两周一次（周一） | 60 min   | Sprint Board 更新，任务分配到人  |
| Daily Standup  | 每工作日           | 15 min   | 阻塞项记录在 Slack，无需会议记录 |
| Sprint Review  | 每两周一次（周五） | 45 min   | Demo 录屏，Changelog 草稿        |
| Tech Sync      | 每周一次           | 30 min   | 技术决策记录（ADR 文档）         |
| Post-mortem    | 线上事故后 24h 内  | 60 min   | 复盘文档（根因 + 预防措施）      |

### 10.3 文档规范

- ADR（Architecture Decision Records）：重大技术决策记录在 docs/adr/ 目录，格式：标题、背景、决策、后果
- API 文档：API Routes 使用 JSDoc 注释，CI 自动生成文档
- README：保持最新，包含：项目简介、快速启动、环境变量、常见问题
- CHANGELOG：每次发布前更新，按 feat / fix / chore 分类
- 复盘文档：事故复盘存入 docs/incidents/ 目录，内容：时间线、根因、预防措施

*FRAME™ 工程开发流程规范 v1.0*

如有疑问，在 Slack #dev-general 讨论；如发现文档有误，直接提 PR 修正。

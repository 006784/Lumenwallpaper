# AI 协作规范

Claude Code 与 Codex 共同开发 Lumen 项目时遵守的通用规则。

---

## 黄金法则

1. **读队列再开工** — 每次会话开始，先读 `TASK_QUEUE.md`
2. **改共享区先备注** — 修改协作区文件前，在队列里写一行说明
3. **PR 而非直推** — 所有变更通过 PR 合入 `develop`，不直接 push
4. **类型是契约** — `types/` 里的接口是两者的 API 契约，修改必须双方知晓
5. **0 错误才提 PR** — `pnpm type-check` 和 `pnpm lint` 必须全部通过

---

## 目录所有权

详见 `OWNERSHIP.md`。简要：

| 目录 | 所有者 |
|------|--------|
| `components/` `styles/` `app/(main)/` `app/(auth)/` | Claude Code |
| `lib/` `app/api/` `supabase/` `types/` `e2e/` `hooks/` | Codex |
| `app/layout.tsx` `package.json` `next.config.mjs` | 协作区 |

---

## Git 工作流

```
main          ← 生产，只接受来自 develop 的 PR（需 2 人 review）
develop       ← 集成，所有功能合入此处（需 1 人 review + CI 绿）
claude/*      ← Claude Code 的功能分支
codex/*       ← Codex 的功能分支
```

**分支生命周期：**
```bash
# 从 develop 切出
git checkout develop && git pull
git checkout -b claude/feat-hero-panel

# 开发 → 提交
git add -p
git commit -m "feat(hero): add dynamic wallpaper panel"

# 同步最新 develop（rebase 保持线性）
git fetch origin && git rebase origin/develop

# 推送 → 创建 PR → 目标分支 develop
git push origin claude/feat-hero-panel
```

---

## 任务交接协议

### 交接格式（写入 TASK_QUEUE.md）

```markdown
### TASK-042 · 壁纸搜索 API
- **状态**: ✅ codex done → 🔜 claude pending
- **Codex 完成**: GET /api/wallpapers?q=&tags=&sort= 已上线
- **返回结构**: `{ data: WallpaperCard[], total: number, nextCursor: string }`
- **Claude 待做**: 探索页接入真实数据，替换 mock
- **类型位置**: `types/wallpaper.ts → WallpaperCard`
```

### 状态标记

| 标记 | 含义 |
|------|------|
| `📋 backlog` | 待规划 |
| `🔜 claude pending` | 等 Claude Code 处理 |
| `🔜 codex pending` | 等 Codex 处理 |
| `⚙️ claude wip` | Claude Code 进行中 |
| `⚙️ codex wip` | Codex 进行中 |
| `✅ claude done` | Claude Code 已完成 |
| `✅ codex done` | Codex 已完成 |
| `✅✅ done` | 双方完成，可关闭 |

---

## 冲突处理

**代码冲突（git merge conflict）**
1. 以文件所有者的版本为准
2. 所有者不在场时，保留更新的提交，在 PR 留评论说明

**设计冲突（实现方向不一致）**
1. 在 `docs/adr/` 创建 ADR 文档记录决策
2. 由用户最终裁决

**类型冲突（接口不匹配）**
1. Codex 定义数据层类型，Claude Code 定义 UI 层类型
2. 两者共用的类型（如 `MoodCardData`）放 `types/home.ts`，改动须双方确认

---

## 禁止事项

- ❌ 直接 push `main` 或 `develop`
- ❌ 在对方所有的文件里留下 TODO 而不通知
- ❌ 硬编码颜色 HEX / 环境变量明文
- ❌ 在同一个 commit 里混合无关改动
- ❌ `pnpm type-check` 有错误时提 PR

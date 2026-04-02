# ADR 0001: FRAME Frontend Scaffold

## 背景

仓库当前只有设计规范文档和两个原型文件，缺少真正可开发、可扩展的应用结构。

## 决策

- 使用 Next.js App Router 作为前端工程骨架
- 使用 TypeScript 做类型约束
- 使用 Tailwind CSS 承载设计 Token
- 先以静态数据完成首页骨架和主要路由占位
- 外部服务接入先保留为 `lib/` 层封装入口

## 影响

- 后续接入 Supabase / R2 / Resend 时不需要再大改目录
- 页面与组件可以按业务域继续拆分
- 原型视觉已经迁移为可复用组件，而不是继续堆叠静态 HTML

# 测评系统 — 安装与运行指南

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **后端**: Next.js API Routes
- **数据库**: 本地内存存储（开发测试）/ Supabase（生产）
- **认证**: JWT (jose)
- **图表**: 纯 SVG 实现（无外部依赖）
- **部署**: Cloudflare Pages / Vercel

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

打开 http://localhost:3000

## 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | admin123 |
| 普通用户 | 自行注册 | 自行设置 |

## 功能概览

### 用户端
- ✅ 注册 / 登录
- ✅ 问答评测（单选、多选、简答）
- ✅ 自动判分 + 分类得分分析
- ✅ 评测历史查看

### 管理后台
- ✅ 仪表盘（统计卡片 + 柱状图 + 环形图）
- ✅ 用户管理（增删改角色）
- ✅ 题库管理（增删改题目）
- ✅ 评测结果（分数分布饼图 + 题目正确率排行 + 逐条详情）

## 部署到 Cloudflare Pages

1. 推送代码到 GitHub
2. 在 Cloudflare Pages 中连接仓库
3. 构建设置：
   - 框架预设: Next.js
   - 构建命令: `npx @cloudflare/next-on-pages`
   - 输出目录: `.vercel/output/static`
4. 设置环境变量（同 `.env.local`）

## 数据库切换

本地开发使用内存存储，生产环境需接入 Supabase：

1. 创建 Supabase 项目
2. 在 `.env.local` 填入 Supabase URL 和 Key
3. 修改 `src/lib/db.ts` 替换为 Supabase 查询

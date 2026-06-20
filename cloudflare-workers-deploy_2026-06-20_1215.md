# Cloudflare Workers 部署适配

## Objective
将项目从 Cloudflare Pages 部署方案切换到 Workers + OpenNext 的正确方案。

## Key Decisions
1. **Cloudflare 官方文档**确认全栈 Next.js 应部署到 Workers（不是 Pages）
2. `@opennextjs/cloudflare` 输出 `.open-next/worker.js` + `.open-next/assets/`
3. Workers 格式的 wrangler.toml：`main` 指向 worker，`assets` 指向静态资源目录
4. `getD1()` 函数增加 OpenNext Workers 的 D1 绑定获取路径（通过 Symbol.for('__cloudflare-context__')）

## 文件变更
- `wrangler.toml` → Workers 格式（移除 pages_build_output_dir）
- `package.json` → build/deploy/preview 脚本
- `next.config.ts` → 加入 initOpenNextCloudflareForDev
- `open-next.config.ts` → 新建
- `src/lib/db-d1.ts` → 新增第3备选 D1 获取路径
- `.gitignore` → 忽略 .open-next/
- `.dev.vars.example` → 新建

## 当前状态
- 所有代码改动已 commit（`6f3caaa`）
- 等待网络恢复后 `git push origin main`
- 推送后可选：`npx wrangler deploy` 🔸 或设置 Workers Builds 自动部署

## 后续部署步骤（两种选择）

### 选择 A: 本地推送（最快）
```bash
git push origin main                # 推代码
npx wrangler deploy                 # 部署到 Workers（需要 CLOUDFLARE_API_TOKEN 含 Workers 权限）
```

### 选择 B: Workers Builds（自动部署）
1. Cloudflare Dashboard → Workers & Pages → Create → Worker
2. 连接 GitHub 仓库 `dawn-jg/cp`
3. 设置 D1 数据库绑定为 `cp-db`，变量名 `DB`
4. Build command: `npm run build`
5. 保存，自动触发构建和部署

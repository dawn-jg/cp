// D1 种子数据脚本
// 运行: wrangler d1 execute cp-db --file=src/lib/seed-d1.sql
// 或: npx tsx src/lib/seed-d1.ts (需要 D1 绑定)

// 此脚本生成 seed-d1.sql 文件供 wrangler 执行
// 也支持直接调用（需要运行时 D1 绑定）

import * as fs from 'fs';
import * as path from 'path';

// ==============================
// SQL 生成模式
// ==============================
function generateSeedSQL(): string {
  const now = new Date().toISOString();

  return `
-- ===== D1 Seed Data for Evaluation Platform =====
-- Generated at: ${now}

-- Groups
INSERT OR IGNORE INTO groups_t (id, name, description, created_at) VALUES
  ('g-default', '默认组', '所有新用户默认归属', '${now}'),
  ('g-frontend', '前端组', '前端方向技能评测', '${now}'),
  ('g-backend', '后端组', '后端方向技能评测', '${now}');

-- Admin user (password: admin123)
INSERT OR IGNORE INTO users (id, email, username, role, password_hash, created_at) VALUES
  ('admin-001', 'admin@eval.com', 'admin', 'admin', 'admin123', '${now}');

-- Test users (password: 123456)
INSERT OR IGNORE INTO users (id, email, username, role, group_id, password_hash, created_at) VALUES
  ('user-001', 'user01@test.com', 'user01', 'user', 'g-frontend', '123456', '${now}'),
  ('user-002', 'user02@test.com', 'user02', 'user', 'g-frontend', '123456', '${now}'),
  ('user-003', 'user03@test.com', 'user03', 'user', 'g-frontend', '123456', '${now}'),
  ('user-004', 'user04@test.com', 'user04', 'user', 'g-frontend', '123456', '${now}'),
  ('user-005', 'user05@test.com', 'user05', 'user', 'g-backend', '123456', '${now}'),
  ('user-006', 'user06@test.com', 'user06', 'user', 'g-backend', '123456', '${now}'),
  ('user-007', 'user07@test.com', 'user07', 'user', 'g-backend', '123456', '${now}'),
  ('user-008', 'user08@test.com', 'user08', 'user', 'g-backend', '123456', '${now}'),
  ('user-009', 'user09@test.com', 'user09', 'user', NULL, '123456', '${now}'),
  ('user-010', 'user10@test.com', 'user10', 'user', NULL, '123456', '${now}');

-- Questions
INSERT OR IGNORE INTO questions (id, title, type, options, correct_answer, score, category, group_ids, created_at) VALUES
  ('q1', 'Next.js 的 App Router 是基于什么构建的？', 'single',
   '["React Server Components","Vue","Angular","Svelte"]',
   '"React Server Components"', 10, '前端框架', '["g-frontend"]', '${now}'),
  ('q2', 'TypeScript 中 interface 和 type 的区别包括？（多选）', 'multiple',
   '["interface 可以被继承","type 可以表示联合类型","两者完全相同","interface 支持声明合并"]',
   '["interface 可以被继承","type 可以表示联合类型","interface 支持声明合并"]',
   15, 'TypeScript', '["g-frontend","g-backend"]', '${now}'),
  ('q3', '以下哪些是 React Hooks？（多选）', 'multiple',
   '["useState","useEffect","useRouter","useData"]',
   '["useState","useEffect"]',
   10, 'React', '["g-frontend"]', '${now}'),
  ('q4', 'CSS Flexbox 中，justify-content 的默认值是什么？', 'single',
   '["flex-start","center","space-between","flex-end"]',
   '"flex-start"', 5, 'CSS', '["g-frontend"]', '${now}'),
  ('q5', '请简述你对 SSR 和 SSG 的理解及适用场景。', 'text',
   '[]', '""', 20, '前端架构', '["g-frontend","g-backend"]', '${now}');

-- Rating targets
INSERT OR IGNORE INTO rating_targets (id, name, description, group_ids, created_at) VALUES
  ('rt-001', '张三', '前端团队 Leader，负责架构设计和技术评审', '["g-frontend"]', '${now}'),
  ('rt-002', '李四', '后端开发工程师，专注 API 和数据库', '["g-backend"]', '${now}');

-- Rating questions for rt-001 (张三)
INSERT OR IGNORE INTO rating_questions (id, target_id, title, options, score, created_at) VALUES
  ('rq-1', 'rt-001', '张三的代码质量如何？', '["优秀","良好","一般","较差"]', 10, '${now}'),
  ('rq-2', 'rt-001', '张三的沟通协作能力？', '["非常强","较强","一般","较弱"]', 10, '${now}'),
  ('rq-3', 'rt-001', '张三的技术指导是否有帮助？', '["帮助很大","有一定帮助","帮助不大","无帮助"]', 10, '${now}');

-- Rating questions for rt-002 (李四)
INSERT OR IGNORE INTO rating_questions (id, target_id, title, options, score, created_at) VALUES
  ('rq-4', 'rt-002', '李四的接口设计水平？', '["优秀","良好","一般","较差"]', 10, '${now}'),
  ('rq-5', 'rt-002', '李四的交付准时率？', '["总是准时","偶有延迟","经常延迟","严重延迟"]', 10, '${now}');

-- Settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('registration_enabled', 'true');
`;
}

// ==============================
// 主入口：生成 seed-d1.sql 文件
// ==============================
function main() {
  const sql = generateSeedSQL();
  const outputPath = path.resolve(__dirname, 'seed-d1.sql');
  fs.writeFileSync(outputPath, sql, 'utf-8');
  console.log(`✅ Seed SQL 已生成: ${outputPath}`);
  console.log('');
  console.log('运行种子数据：');
  console.log('  wrangler d1 execute cp-db --file=src/lib/seed-d1.sql');
  console.log('');
  console.log('或先初始化表结构再灌数据：');
  console.log('  wrangler d1 execute cp-db --file=src/lib/schema.sql');
  console.log('  wrangler d1 execute cp-db --file=src/lib/seed-d1.sql');
}

// 直接运行时生成 SQL 文件
const isMain = process.argv[1] && (process.argv[1].endsWith('seed-d1.ts') || process.argv[1].endsWith('seed-d1'));
if (isMain) {
  main();
}

export { generateSeedSQL };

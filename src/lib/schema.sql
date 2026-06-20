-- ===== D1 Schema for Evaluation Platform =====
-- Run: wrangler d1 execute cp-db --file=src/lib/schema.sql

-- Drop existing tables (idempotent reset)
DROP TABLE IF EXISTS rating_records;
DROP TABLE IF EXISTS rating_questions;
DROP TABLE IF EXISTS rating_targets;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS groups_t;
DROP TABLE IF EXISTS settings;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  group_id TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Groups
CREATE TABLE IF NOT EXISTS groups_t (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('single', 'multiple', 'text')),
  options TEXT NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL DEFAULT '',
  group_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  answers TEXT NOT NULL DEFAULT '[]',
  category_scores TEXT NOT NULL DEFAULT '[]',
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Rating targets (人物评分对象)
CREATE TABLE IF NOT EXISTS rating_targets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  group_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rating questions (人物评分题目)
CREATE TABLE IF NOT EXISTS rating_questions (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  title TEXT NOT NULL,
  options TEXT NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (target_id) REFERENCES rating_targets(id)
);

-- Rating records (人物评分记录)
CREATE TABLE IF NOT EXISTS rating_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  answers TEXT NOT NULL DEFAULT '[]',
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (target_id) REFERENCES rating_targets(id)
);

-- System settings (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_rating_records_user ON rating_records(user_id);
CREATE INDEX IF NOT EXISTS idx_rating_records_target ON rating_records(target_id);
CREATE INDEX IF NOT EXISTS idx_rating_questions_target ON rating_questions(target_id);

-- ===== Seed data =====

-- Groups
INSERT OR IGNORE INTO groups_t (id, name, description) VALUES
  ('g-default', '默认组', '所有新用户默认归属'),
  ('g-frontend', '前端组', '前端方向技能评测'),
  ('g-backend', '后端组', '后端方向技能评测');

-- Admin user (password: admin123)
INSERT OR IGNORE INTO users (id, email, username, role, password_hash) VALUES
  (1, 'admin@eval.com', 'admin', 'admin', 'admin123');

-- Test users (password: 123456)
INSERT OR IGNORE INTO users (id, email, username, role, group_id, password_hash) VALUES
  (2, 'user01@test.com', 'user01', 'user', 'g-frontend', '123456'),
  (3, 'user02@test.com', 'user02', 'user', 'g-frontend', '123456'),
  (4, 'user03@test.com', 'user03', 'user', 'g-frontend', '123456'),
  (5, 'user04@test.com', 'user04', 'user', 'g-frontend', '123456'),
  (6, 'user05@test.com', 'user05', 'user', 'g-backend', '123456'),
  (7, 'user06@test.com', 'user06', 'user', 'g-backend', '123456'),
  (8, 'user07@test.com', 'user07', 'user', 'g-backend', '123456'),
  (9, 'user08@test.com', 'user08', 'user', 'g-backend', '123456'),
  (10, 'user09@test.com', 'user09', 'user', NULL, '123456'),
  (11, 'user10@test.com', 'user10', 'user', NULL, '123456');

-- Questions
INSERT OR IGNORE INTO questions (id, title, type, options, correct_answer, score, category, group_ids) VALUES
  ('q1', 'Next.js 的 App Router 是基于什么构建的？', 'single', '["React Server Components","Vue","Angular","Svelte"]', '"React Server Components"', 10, '前端框架', '["g-frontend"]'),
  ('q2', 'TypeScript 中 interface 和 type 的区别包括？（多选）', 'multiple', '["interface 可以被继承","type 可以表示联合类型","两者完全相同","interface 支持声明合并"]', '["interface 可以被继承","type 可以表示联合类型","interface 支持声明合并"]', 15, 'TypeScript', '["g-frontend","g-backend"]'),
  ('q3', '以下哪些是 React Hooks？（多选）', 'multiple', '["useState","useEffect","useRinter","useData"]', '["useState","useEffect"]', 10, 'React', '["g-frontend"]'),
  ('q4', 'CSS Flexbox 中，justify-content 的默认值是什么？', 'single', '["flex-start","center","space-between","flex-end"]', '"flex-start"', 5, 'CSS', '["g-frontend"]'),
  ('q5', '请简述你对 SSR 和 SSG 的理解及适用场景。', 'text', '[]', '""', 20, '前端架构', '["g-frontend","g-backend"]');

-- Rating targets
INSERT OR IGNORE INTO rating_targets (id, name, description, group_ids) VALUES
  ('rt-001', '张三', '前端团队 Leader，负责架构设计和技术评审', '["g-frontend"]'),
  ('rt-002', '李四', '后端开发工程师，专注 API 和数据库', '["g-backend"]');

-- Rating questions for rt-001 (张三)
INSERT OR IGNORE INTO rating_questions (id, target_id, title, options, score) VALUES
  ('rq-1', 'rt-001', '张三的代码质量如何？', '["优秀","良好","一般","较差"]', 10),
  ('rq-2', 'rt-001', '张三的沟通协作能力？', '["非常强","较强","一般","较弱"]', 10),
  ('rq-3', 'rt-001', '张三的技术指导是否有帮助？', '["帮助很大","有一定帮助","帮助不大","无帮助"]', 10);

-- Rating questions for rt-002 (李四)
INSERT OR IGNORE INTO rating_questions (id, target_id, title, options, score) VALUES
  ('rq-4', 'rt-002', '李四的接口设计水平？', '["优秀","良好","一般","较差"]', 10),
  ('rq-5', 'rt-002', '李四的交付准时率？', '["总是准时","偶有延迟","经常延迟","严重延迟"]', 10);

-- Settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('registration_enabled', 'true');

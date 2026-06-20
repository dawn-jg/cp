// D1 数据库适配器 — Cloudflare D1 (SQLite) 实现
// 函数签名与 db.ts 完全一致，使用 SQL 操作代替内存操作

import type {
  User,
  Question,
  Evaluation,
  EvaluationSummary,
  Group,
  RatingTarget,
  RatingQuestion,
  RatingRecord,
  RatingStats,
} from '@/types';

// ===== D1 绑定获取 =====
// 优先级:
//   1. globalThis.__D1_BINDING__?.DB (标准 Cloudflare 环境)
//   2. 尝试从 @opennextjs/cloudflare 环境获取
//   3. 通过 process.env 中的绑定名获取 (wrangler 注入)
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(sql: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(col?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw(): Promise<unknown[][]>;
}

interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: {
    duration: number;
    changes: number;
    last_row_id: number;
    served_by: string;
  };
}

function getD1(): D1Database {
  // 优先级 1: 标准 Cloudflare 环境
  const binding = (globalThis as Record<string, unknown>).__D1_BINDING__ as
    | { DB: D1Database }
    | undefined;
  if (binding?.DB) return binding.DB;

  // 优先级 2: wrangler 直接注入的 binding（Pages Functions 环境）
  const db = (globalThis as Record<string, unknown>).DB as D1Database | undefined;
  if (db) return db;

  throw new Error(
    'D1 database binding not found. Ensure wrangler.toml has [[d1_databases]] binding = "DB"',
  );
}

function generateId(): string {
  return crypto.randomUUID();
}

function parseJsonField<T>(val: string | undefined | null, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function stringifyJson(val: unknown): string {
  return JSON.stringify(val);
}

// ===== 系统设置 =====
export async function getRegistrationEnabled(): Promise<boolean> {
  const db = getD1();
  const row = await db
    .prepare("SELECT value FROM settings WHERE key = 'registration_enabled'")
    .first<{ value: string }>();
  return row?.value === 'true';
}

export async function setRegistrationEnabled(enabled: boolean): Promise<void> {
  const db = getD1();
  await db
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .bind('registration_enabled', enabled ? 'true' : 'false')
    .run();
}

// ===== 用户操作 =====
export async function createUser(
  email: string,
  password: string,
  username: string,
  groupId?: string,
  role?: 'user' | 'admin',
): Promise<User | null> {
  const db = getD1();

  // 检查邮箱或用户名是否已存在
  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .bind(email, username)
    .first();
  if (existing) return null;

  const id = generateId();
  const now = new Date().toISOString();
  const finalRole = role || 'user';

  await db
    .prepare(
      'INSERT INTO users (id, email, username, role, group_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(id, email, username, finalRole, groupId || null, password, now)
    .run();

  return {
    id,
    email,
    username,
    role: finalRole,
    group_id: groupId || null,
    created_at: now,
  };
}

export async function createUsersBatch(
  users: { email: string; username: string; password: string; groupId?: string; role?: 'user' | 'admin' }[],
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const db = getD1();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const now = new Date().toISOString();

  for (const { email, username, password, groupId, role } of users) {
    if (!email || !username || !password) {
      skipped++;
      continue;
    }

    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
      .bind(email, username)
      .first();
    if (existing) {
      skipped++;
      errors.push(`跳过 ${username}（邮箱或用户名已存在）`);
      continue;
    }

    const id = generateId();
    const finalRole = role || 'user';

    await db
      .prepare(
        'INSERT INTO users (id, email, username, role, group_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, email, username, finalRole, groupId || null, password, now)
      .run();

    created++;
  }

  return { created, skipped, errors };
}

export async function authenticateUser(
  login: string,
  password: string,
): Promise<User | null> {
  const db = getD1();
  const row = await db
    .prepare(
      'SELECT id, email, username, role, group_id, password_hash, created_at FROM users WHERE (email = ? OR username = ?) AND password_hash = ?',
    )
    .bind(login, login, password)
    .first<{
      id: string;
      email: string;
      username: string;
      role: 'user' | 'admin';
      group_id: string | null;
      password_hash: string;
      created_at: string;
    }>();

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    group_id: row.group_id,
    created_at: row.created_at,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getD1();
  const row = await db
    .prepare('SELECT id, email, username, role, group_id, created_at FROM users WHERE id = ?')
    .bind(id)
    .first<{
      id: string;
      email: string;
      username: string;
      role: 'user' | 'admin';
      group_id: string | null;
      created_at: string;
    }>();

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    group_id: row.group_id,
    created_at: row.created_at,
  };
}

export async function getAllUsers(): Promise<User[]> {
  const db = getD1();
  const result = await db
    .prepare('SELECT id, email, username, role, group_id, created_at FROM users ORDER BY created_at ASC')
    .all<{
      id: string;
      email: string;
      username: string;
      role: 'user' | 'admin';
      group_id: string | null;
      created_at: string;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    group_id: row.group_id,
    created_at: row.created_at,
  }));
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = getD1();
  const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteUsers(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const db = getD1();
  // D1 不支持 IN 子句的参数化传参，分批执行
  let count = 0;
  for (const id of ids) {
    const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    count += result.meta?.changes ?? 0;
  }
  return count;
}

export async function updateUsersGroup(ids: string[], groupId: string | null): Promise<number> {
  if (ids.length === 0) return 0;
  const db = getD1();
  let count = 0;
  for (const id of ids) {
    const result = await db
      .prepare('UPDATE users SET group_id = ? WHERE id = ?')
      .bind(groupId, id)
      .run();
    count += result.meta?.changes ?? 0;
  }
  return count;
}

export async function updateUserRole(id: string, role: 'user' | 'admin'): Promise<boolean> {
  const db = getD1();
  const result = await db
    .prepare('UPDATE users SET role = ? WHERE id = ?')
    .bind(role, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function updateUserGroup(id: string, groupId: string | null): Promise<boolean> {
  const db = getD1();
  const result = await db
    .prepare('UPDATE users SET group_id = ? WHERE id = ?')
    .bind(groupId, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

// ===== 组别操作 =====
export async function getAllGroups(): Promise<Group[]> {
  const db = getD1();
  const result = await db
    .prepare('SELECT id, name, description, created_at FROM groups_t ORDER BY created_at ASC')
    .all<{ id: string; name: string; description: string; created_at: string }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
  }));
}

export async function createGroup(name: string, description: string): Promise<Group> {
  const db = getD1();
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare('INSERT INTO groups_t (id, name, description, created_at) VALUES (?, ?, ?, ?)')
    .bind(id, name, description, now)
    .run();

  return { id, name, description, created_at: now };
}

export async function updateGroup(
  id: string,
  data: Partial<Pick<Group, 'name' | 'description'>>,
): Promise<boolean> {
  const db = getD1();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    sets.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    sets.push('description = ?');
    values.push(data.description);
  }

  if (sets.length === 0) return false;

  values.push(id);
  const sql = `UPDATE groups_t SET ${sets.join(', ')} WHERE id = ?`;
  const result = await db.prepare(sql).bind(...values).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const db = getD1();
  // 将属于该组的用户 group_id 置空
  await db.prepare('UPDATE users SET group_id = NULL WHERE group_id = ?').bind(id).run();
  const result = await db.prepare('DELETE FROM groups_t WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getGroupById(id: string): Promise<Group | null> {
  const db = getD1();
  const row = await db
    .prepare('SELECT id, name, description, created_at FROM groups_t WHERE id = ?')
    .bind(id)
    .first<{ id: string; name: string; description: string; created_at: string }>();

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
  };
}

// ===== 题库操作 =====
export async function getAllQuestions(): Promise<Question[]> {
  const db = getD1();
  const result = await db
    .prepare(
      'SELECT id, title, type, options, correct_answer, score, category, group_ids, created_at FROM questions ORDER BY created_at ASC',
    )
    .all<{
      id: string;
      title: string;
      type: 'single' | 'multiple' | 'text';
      options: string;
      correct_answer: string;
      score: number;
      category: string;
      group_ids: string;
      created_at: string;
    }>();

  return (result.results ?? []).map(rowToQuestion);
}

export async function getQuestionsForGroup(groupId: string | null): Promise<Question[]> {
  const db = getD1();
  const result = await db
    .prepare(
      'SELECT id, title, type, options, correct_answer, score, category, group_ids, created_at FROM questions ORDER BY created_at ASC',
    )
    .all<{
      id: string;
      title: string;
      type: 'single' | 'multiple' | 'text';
      options: string;
      correct_answer: string;
      score: number;
      category: string;
      group_ids: string;
      created_at: string;
    }>();

  return (result.results ?? [])
    .map(rowToQuestion)
    .filter((q) => {
      if (!q.group_ids || q.group_ids.length === 0) return true;
      if (!groupId) return false;
      return q.group_ids.includes(groupId);
    });
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const db = getD1();
  const row = await db
    .prepare(
      'SELECT id, title, type, options, correct_answer, score, category, group_ids, created_at FROM questions WHERE id = ?',
    )
    .bind(id)
    .first<{
      id: string;
      title: string;
      type: 'single' | 'multiple' | 'text';
      options: string;
      correct_answer: string;
      score: number;
      category: string;
      group_ids: string;
      created_at: string;
    }>();

  if (!row) return null;
  return rowToQuestion(row);
}

export async function createQuestion(
  question: Omit<Question, 'id' | 'created_at'>,
): Promise<Question> {
  const db = getD1();
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      'INSERT INTO questions (id, title, type, options, correct_answer, score, category, group_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      question.title,
      question.type,
      stringifyJson(question.options || []),
      stringifyJson(question.correct_answer ?? ''),
      question.score ?? 10,
      question.category ?? '',
      stringifyJson(question.group_ids || []),
      now,
    )
    .run();

  return {
    ...question,
    id,
    created_at: now,
  };
}

export async function updateQuestion(
  id: string,
  data: Partial<Omit<Question, 'id' | 'created_at'>>,
): Promise<boolean> {
  const db = getD1();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.options !== undefined) { sets.push('options = ?'); values.push(stringifyJson(data.options)); }
  if (data.correct_answer !== undefined) { sets.push('correct_answer = ?'); values.push(stringifyJson(data.correct_answer)); }
  if (data.score !== undefined) { sets.push('score = ?'); values.push(data.score); }
  if (data.category !== undefined) { sets.push('category = ?'); values.push(data.category); }
  if (data.group_ids !== undefined) { sets.push('group_ids = ?'); values.push(stringifyJson(data.group_ids)); }

  if (sets.length === 0) return false;

  values.push(id);
  const sql = `UPDATE questions SET ${sets.join(', ')} WHERE id = ?`;
  const result = await db.prepare(sql).bind(...values).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const db = getD1();
  const result = await db.prepare('DELETE FROM questions WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

// ===== 评测操作 =====
export async function submitEvaluation(
  userId: string,
  answers: { question_id: string; user_answer: string | string[] }[],
  groupId?: string | null,
): Promise<Evaluation> {
  const db = getD1();

  // 获取所有题目
  const questionsResult = await db
    .prepare('SELECT * FROM questions')
    .all<{
      id: string;
      title: string;
      type: 'single' | 'multiple' | 'text';
      options: string;
      correct_answer: string;
      score: number;
      category: string;
      group_ids: string;
      created_at: string;
    }>();

  const allQuestions = (questionsResult.results ?? []).map(rowToQuestion);

  // 按组过滤题目
  const filteredQuestions = groupId !== undefined
    ? allQuestions.filter((q) => {
        if (!q.group_ids || q.group_ids.length === 0) return true;
        if (!groupId) return false;
        return q.group_ids.includes(groupId);
      })
    : allQuestions;

  let totalScore = 0;
  const maxScore = filteredQuestions.reduce((sum, q) => sum + q.score, 0);

  const detailAnswers = answers.map((a) => {
    const q = filteredQuestions.find((q) => q.id === a.question_id);
    if (!q) {
      return {
        question_id: a.question_id,
        question_title: '未知题目',
        user_answer: a.user_answer,
        correct_answer: '',
        is_correct: false,
        score: 0,
        max_score: 0,
      };
    }

    let isCorrect = false;
    if (q.type === 'text') {
      isCorrect = true;
    } else if (q.type === 'single') {
      isCorrect = a.user_answer === q.correct_answer;
    } else if (q.type === 'multiple') {
      const userAns = Array.isArray(a.user_answer) ? [...a.user_answer].sort() : [a.user_answer];
      const correct = Array.isArray(q.correct_answer) ? [...q.correct_answer].sort() : [q.correct_answer];
      isCorrect = JSON.stringify(userAns) === JSON.stringify(correct);
    }

    const score = isCorrect ? q.score : 0;
    totalScore += score;

    return {
      question_id: q.id,
      question_title: q.title,
      user_answer: a.user_answer,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
      score,
      max_score: q.score,
    };
  });

  // 按分类统计
  const categoryMap = new Map<string, { score: number; max: number }>();
  detailAnswers.forEach((a) => {
    const q = filteredQuestions.find((q) => q.id === a.question_id);
    const cat = q?.category ?? '其他';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { score: 0, max: 0 });
    }
    const c = categoryMap.get(cat)!;
    c.score += a.score;
    c.max += a.max_score;
  });

  const categoryScores = Array.from(categoryMap.entries()).map(([cat, val]) => ({
    category: cat,
    score: val.score,
    max_score: val.max,
    percentage: val.max > 0 ? Math.round((val.score / val.max) * 100) : 0,
  }));

  const id = generateId();
  const now = new Date().toISOString();

  // 保存评测记录
  await db
    .prepare(
      'INSERT INTO evaluations (id, user_id, total_score, max_score, answers, category_scores, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      userId,
      totalScore,
      maxScore,
      stringifyJson(detailAnswers),
      stringifyJson(categoryScores),
      now,
    )
    .run();

  return {
    id,
    user_id: userId,
    total_score: totalScore,
    max_score: maxScore,
    answers: detailAnswers,
    category_scores: categoryScores,
    completed_at: now,
  };
}

export async function getUserEvaluations(userId: string): Promise<Evaluation[]> {
  const db = getD1();
  const result = await db
    .prepare('SELECT * FROM evaluations WHERE user_id = ? ORDER BY completed_at DESC')
    .bind(userId)
    .all<EvaluationRow>();
  return (result.results ?? []).map(rowToEvaluation);
}

export async function getAllEvaluations(): Promise<Evaluation[]> {
  const db = getD1();
  const result = await db
    .prepare('SELECT * FROM evaluations ORDER BY completed_at DESC')
    .all<EvaluationRow>();
  return (result.results ?? []).map(rowToEvaluation);
}

export async function getEvaluationSummary(): Promise<EvaluationSummary> {
  const db = getD1();

  // 获取所有评测记录
  const evalsResult = await db
    .prepare('SELECT * FROM evaluations ORDER BY completed_at DESC')
    .all<EvaluationRow>();
  const evals = (evalsResult.results ?? []).map(rowToEvaluation);

  // 统计总用户数（非 admin）
  const usersResult = await db
    .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'user'")
    .first<{ cnt: number }>();
  const totalUsers = usersResult?.cnt ?? 0;

  const totalEvals = evals.length;
  const averageScore =
    totalEvals > 0
      ? Math.round(evals.reduce((s, e) => s + e.total_score, 0) / totalEvals)
      : 0;

  const completedUsers = new Set(evals.map((e) => e.user_id)).size;
  const completionRate = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;

  // 分类平均分
  const catMap = new Map<string, number[]>();
  evals.forEach((e) => {
    e.category_scores.forEach((cs) => {
      if (!catMap.has(cs.category)) catMap.set(cs.category, []);
      catMap.get(cs.category)!.push(cs.percentage);
    });
  });
  const categoryAverages = Array.from(catMap.entries()).map(([cat, scores]) => ({
    category: cat,
    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  return {
    total_users: totalUsers,
    total_evaluations: totalEvals,
    average_score: averageScore,
    completion_rate: completionRate,
    category_averages: categoryAverages,
    recent_evaluations: evals.slice(0, 10),
  };
}

// ===== 人物评分系统 =====

// 评分对象 CRUD
export async function getAllRatingTargets(): Promise<RatingTarget[]> {
  const db = getD1();
  const result = await db
    .prepare('SELECT id, name, description, group_ids, created_at FROM rating_targets ORDER BY created_at ASC')
    .all<{
      id: string;
      name: string;
      description: string;
      group_ids: string;
      created_at: string;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    group_ids: parseJsonField<string[]>(row.group_ids, []),
    created_at: row.created_at,
  }));
}

export async function getRatingTargetById(id: string): Promise<RatingTarget | null> {
  const db = getD1();
  const row = await db
    .prepare('SELECT id, name, description, group_ids, created_at FROM rating_targets WHERE id = ?')
    .bind(id)
    .first<{
      id: string;
      name: string;
      description: string;
      group_ids: string;
      created_at: string;
    }>();

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    group_ids: parseJsonField<string[]>(row.group_ids, []),
    created_at: row.created_at,
  };
}

export async function getRatingTargetsForGroup(groupId: string | null): Promise<RatingTarget[]> {
  const allTargets = await getAllRatingTargets();
  return allTargets.filter((t) => {
    if (!t.group_ids || t.group_ids.length === 0) return true;
    if (!groupId) return false;
    return t.group_ids.includes(groupId);
  });
}

export async function createRatingTarget(
  data: Omit<RatingTarget, 'id' | 'created_at'>,
): Promise<RatingTarget> {
  const db = getD1();
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      'INSERT INTO rating_targets (id, name, description, group_ids, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(id, data.name, data.description, stringifyJson(data.group_ids || []), now)
    .run();

  return {
    ...data,
    group_ids: data.group_ids || [],
    id,
    created_at: now,
  };
}

export async function updateRatingTarget(
  id: string,
  data: Partial<Omit<RatingTarget, 'id' | 'created_at'>>,
): Promise<boolean> {
  const db = getD1();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.group_ids !== undefined) { sets.push('group_ids = ?'); values.push(stringifyJson(data.group_ids)); }

  if (sets.length === 0) return false;

  values.push(id);
  const sql = `UPDATE rating_targets SET ${sets.join(', ')} WHERE id = ?`;
  const result = await db.prepare(sql).bind(...values).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteRatingTarget(id: string): Promise<boolean> {
  const db = getD1();
  // 级联删除关联的评分题目和记录
  await db.prepare('DELETE FROM rating_questions WHERE target_id = ?').bind(id).run();
  await db.prepare('DELETE FROM rating_records WHERE target_id = ?').bind(id).run();
  const result = await db.prepare('DELETE FROM rating_targets WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

// 评分题目 CRUD
export async function getRatingQuestions(targetId: string): Promise<RatingQuestion[]> {
  const db = getD1();
  const result = await db
    .prepare(
      'SELECT id, target_id, title, options, score, created_at FROM rating_questions WHERE target_id = ? ORDER BY created_at ASC',
    )
    .bind(targetId)
    .all<{
      id: string;
      target_id: string;
      title: string;
      options: string;
      score: number;
      created_at: string;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    target_id: row.target_id,
    title: row.title,
    options: parseJsonField<string[]>(row.options, []),
    score: row.score,
    created_at: row.created_at,
  }));
}

export async function createRatingQuestion(
  data: Omit<RatingQuestion, 'id' | 'created_at'>,
): Promise<RatingQuestion> {
  const db = getD1();
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      'INSERT INTO rating_questions (id, target_id, title, options, score, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(id, data.target_id, data.title, stringifyJson(data.options || []), data.score ?? 10, now)
    .run();

  return {
    ...data,
    id,
    created_at: now,
  };
}

export async function updateRatingQuestion(
  id: string,
  data: Partial<Omit<RatingQuestion, 'id' | 'created_at' | 'target_id'>>,
): Promise<boolean> {
  const db = getD1();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.options !== undefined) { sets.push('options = ?'); values.push(stringifyJson(data.options)); }
  if (data.score !== undefined) { sets.push('score = ?'); values.push(data.score); }

  if (sets.length === 0) return false;

  values.push(id);
  const sql = `UPDATE rating_questions SET ${sets.join(', ')} WHERE id = ?`;
  const result = await db.prepare(sql).bind(...values).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteRatingQuestion(id: string): Promise<boolean> {
  const db = getD1();
  const result = await db.prepare('DELETE FROM rating_questions WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

// 评分提交
export async function submitRating(
  userId: string,
  targetId: string,
  answers: { question_id: string; selected_option: string }[],
): Promise<RatingRecord> {
  const db = getD1();
  const questionsResult = await db
    .prepare('SELECT id, title, score FROM rating_questions WHERE target_id = ?')
    .bind(targetId)
    .all<{ id: string; title: string; score: number }>();
  const questions = questionsResult.results ?? [];

  const maxScore = questions.reduce((s, q) => s + q.score, 0);
  const totalScore = maxScore; // 人物评分所有题目都给满分

  const detailAnswers = answers.map((a) => {
    const q = questions.find((q) => q.id === a.question_id);
    return {
      question_id: a.question_id,
      question_title: q?.title ?? '未知题目',
      selected_option: a.selected_option,
    };
  });

  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      'INSERT INTO rating_records (id, user_id, target_id, answers, total_score, max_score, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(id, userId, targetId, stringifyJson(detailAnswers), totalScore, maxScore, now)
    .run();

  return {
    id,
    user_id: userId,
    target_id: targetId,
    answers: detailAnswers,
    total_score: totalScore,
    max_score: maxScore,
    completed_at: now,
  };
}

export async function getRatingRecordsByTarget(targetId: string): Promise<RatingRecord[]> {
  const db = getD1();
  const result = await db
    .prepare('SELECT * FROM rating_records WHERE target_id = ? ORDER BY completed_at DESC')
    .bind(targetId)
    .all<{
      id: string;
      user_id: string;
      target_id: string;
      answers: string;
      total_score: number;
      max_score: number;
      completed_at: string;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    target_id: row.target_id,
    answers: parseJsonField<
      { question_id: string; question_title: string; selected_option: string }[]
    >(row.answers, []),
    total_score: row.total_score,
    max_score: row.max_score,
    completed_at: row.completed_at,
  }));
}

export async function hasUserRated(userId: string, targetId: string): Promise<boolean> {
  const db = getD1();
  const row = await db
    .prepare('SELECT id FROM rating_records WHERE user_id = ? AND target_id = ?')
    .bind(userId, targetId)
    .first();
  return row !== null;
}

// 按组统计某人的评分分布
export async function getRatingStats(
  targetId: string,
  groupId?: string | null,
): Promise<RatingStats | null> {
  const db = getD1();
  const target = await getRatingTargetById(targetId);
  if (!target) return null;

  let records = await getRatingRecordsByTarget(targetId);

  // 按组过滤
  if (groupId) {
    const usersResult = await db
      .prepare('SELECT id FROM users WHERE group_id = ?')
      .bind(groupId)
      .all<{ id: string }>();
    const groupUserIds = new Set((usersResult.results ?? []).map((u) => u.id));
    records = records.filter((r) => groupUserIds.has(r.user_id));
  }

  const questions = await getRatingQuestions(targetId);
  const questionStats = questions.map((q) => {
    const optionCount = new Map<string, number>();
    q.options.forEach((opt) => optionCount.set(opt, 0));
    records.forEach((r) => {
      const ans = r.answers.find((a) => a.question_id === q.id);
      if (ans) {
        optionCount.set(ans.selected_option, (optionCount.get(ans.selected_option) ?? 0) + 1);
      }
    });
    const total = records.length || 1;
    const distribution = Array.from(optionCount.entries()).map(([option, count]) => ({
      option,
      count,
      percentage: Math.round((count / total) * 100),
    }));
    return { question_id: q.id, question_title: q.title, option_distribution: distribution };
  });

  return {
    target,
    total_raters: records.length,
    questions: questionStats,
  };
}

// ===== 内部帮助函数 =====

interface EvaluationRow {
  id: string;
  user_id: string;
  total_score: number;
  max_score: number;
  answers: string;
  category_scores: string;
  completed_at: string;
}

function rowToQuestion(row: {
  id: string;
  title: string;
  type: 'single' | 'multiple' | 'text';
  options: string;
  correct_answer: string;
  score: number;
  category: string;
  group_ids: string;
  created_at: string;
}): Question {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    options: parseJsonField<string[]>(row.options, []),
    correct_answer: parseJsonField<string | string[]>(row.correct_answer, ''),
    score: row.score,
    category: row.category,
    group_ids: parseJsonField<string[]>(row.group_ids, []),
    created_at: row.created_at,
  };
}

function rowToEvaluation(row: EvaluationRow): Evaluation {
  return {
    id: row.id,
    user_id: row.user_id,
    total_score: row.total_score,
    max_score: row.max_score,
    answers: parseJsonField<
      {
        question_id: string;
        question_title: string;
        user_answer: string | string[];
        correct_answer: string | string[];
        is_correct: boolean;
        score: number;
        max_score: number;
      }[]
    >(row.answers, []),
    category_scores: parseJsonField<
      { category: string; score: number; max_score: number; percentage: number }[]
    >(row.category_scores, []),
    completed_at: row.completed_at,
  };
}

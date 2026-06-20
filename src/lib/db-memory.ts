// 内存数据库适配器 — 本地开发测试用
// 纯内存实现，与 db-d1.ts 函数签名完全一致

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

// ===== 本地内存存储 =====
interface LocalDB {
  users: (User & { password_hash: string })[];
  questions: Question[];
  evaluations: Evaluation[];
  groups: Group[];
  ratingTargets: RatingTarget[];
  ratingQuestions: RatingQuestion[];
  ratingRecords: RatingRecord[];
  adminTokens: Set<string>;
}

declare global {
  // eslint-disable-next-line no-var
  var __localDB: LocalDB | undefined;
}

function getDB(): LocalDB {
  if (!globalThis.__localDB) {
    globalThis.__localDB = {
      users: [
        {
          id: '1',
          email: 'admin@eval.com',
          username: 'admin',
          role: 'admin',
          group_id: null,
          password_hash: 'admin123',
          created_at: new Date().toISOString(),
        },
        { id: '2', email: 'user01@test.com', username: 'user01', role: 'user', group_id: 'g-frontend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '3', email: 'user02@test.com', username: 'user02', role: 'user', group_id: 'g-frontend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '4', email: 'user03@test.com', username: 'user03', role: 'user', group_id: 'g-frontend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '5', email: 'user04@test.com', username: 'user04', role: 'user', group_id: 'g-frontend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '6', email: 'user05@test.com', username: 'user05', role: 'user', group_id: 'g-backend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '7', email: 'user06@test.com', username: 'user06', role: 'user', group_id: 'g-backend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '8', email: 'user07@test.com', username: 'user07', role: 'user', group_id: 'g-backend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '9', email: 'user08@test.com', username: 'user08', role: 'user', group_id: 'g-backend', password_hash: '123456', created_at: new Date().toISOString() },
        { id: '10', email: 'user09@test.com', username: 'user09', role: 'user', group_id: null, password_hash: '123456', created_at: new Date().toISOString() },
        { id: '11', email: 'user10@test.com', username: 'user10', role: 'user', group_id: null, password_hash: '123456', created_at: new Date().toISOString() },
      ],
      questions: [
        {
          id: 'q1',
          title: 'Next.js 的 App Router 是基于什么构建的？',
          type: 'single',
          options: ['React Server Components', 'Vue', 'Angular', 'Svelte'],
          correct_answer: 'React Server Components',
          score: 10,
          category: '前端框架',
          group_ids: ['g-frontend'],
          created_at: new Date().toISOString(),
        },
        {
          id: 'q2',
          title: 'TypeScript 中 interface 和 type 的区别包括？（多选）',
          type: 'multiple',
          options: [
            'interface 可以被继承',
            'type 可以表示联合类型',
            '两者完全相同',
            'interface 支持声明合并',
          ],
          correct_answer: ['interface 可以被继承', 'type 可以表示联合类型', 'interface 支持声明合并'],
          score: 15,
          category: 'TypeScript',
          group_ids: ['g-frontend', 'g-backend'],
          created_at: new Date().toISOString(),
        },
        {
          id: 'q3',
          title: '以下哪些是 React Hooks？（多选）',
          type: 'multiple',
          options: ['useState', 'useEffect', 'useRouter', 'useData'],
          correct_answer: ['useState', 'useEffect'],
          score: 10,
          category: 'React',
          group_ids: ['g-frontend'],
          created_at: new Date().toISOString(),
        },
        {
          id: 'q4',
          title: 'CSS Flexbox 中，justify-content 的默认值是什么？',
          type: 'single',
          options: ['flex-start', 'center', 'space-between', 'flex-end'],
          correct_answer: 'flex-start',
          score: 5,
          category: 'CSS',
          group_ids: ['g-frontend'],
          created_at: new Date().toISOString(),
        },
        {
          id: 'q5',
          title: '请简述你对 SSR（服务端渲染）和 SSG（静态站点生成）的理解及适用场景。',
          type: 'text',
          options: [],
          correct_answer: '',
          score: 20,
          category: '前端架构',
          group_ids: ['g-frontend', 'g-backend'],
          created_at: new Date().toISOString(),
        },
      ],
      evaluations: [],
      groups: [
        { id: 'g-default', name: '默认组', description: '所有新用户默认归属', created_at: new Date().toISOString() },
        { id: 'g-frontend', name: '前端组', description: '前端方向技能评测', created_at: new Date().toISOString() },
        { id: 'g-backend', name: '后端组', description: '后端方向技能评测', created_at: new Date().toISOString() },
      ],
      adminTokens: new Set(),
      ratingTargets: [
        {
          id: 'rt-001',
          name: '张三',
          description: '前端团队 Leader，负责架构设计和技术评审',
          group_ids: ['g-frontend'],
          created_at: new Date().toISOString(),
        },
        {
          id: 'rt-002',
          name: '李四',
          description: '后端开发工程师，专注 API 和数据库',
          group_ids: ['g-backend'],
          created_at: new Date().toISOString(),
        },
      ],
      ratingQuestions: [
        { id: 'rq-1', target_id: 'rt-001', title: '张三的代码质量如何？', options: ['优秀', '良好', '一般', '较差'], score: 10, created_at: new Date().toISOString() },
        { id: 'rq-2', target_id: 'rt-001', title: '张三的沟通协作能力？', options: ['非常强', '较强', '一般', '较弱'], score: 10, created_at: new Date().toISOString() },
        { id: 'rq-3', target_id: 'rt-001', title: '张三的技术指导是否有帮助？', options: ['帮助很大', '有一定帮助', '帮助不大', '无帮助'], score: 10, created_at: new Date().toISOString() },
        { id: 'rq-4', target_id: 'rt-002', title: '李四的接口设计水平？', options: ['优秀', '良好', '一般', '较差'], score: 10, created_at: new Date().toISOString() },
        { id: 'rq-5', target_id: 'rt-002', title: '李四的交付准时率？', options: ['总是准时', '偶有延迟', '经常延迟', '严重延迟'], score: 10, created_at: new Date().toISOString() },
      ],
      ratingRecords: [],
    };
  }
  return globalThis.__localDB;
}

let _nextUserId = 12; // 从 seed 之后开始计数

function generateId(): string {
  return (_nextUserId++).toString();
}

// ===== 系统设置 =====
let registrationEnabled = true;

export function getRegistrationEnabled(): boolean {
  return registrationEnabled;
}

export function setRegistrationEnabled(enabled: boolean): void {
  registrationEnabled = enabled;
}

// ===== 用户操作 =====
export async function createUser(
  email: string,
  password: string,
  username: string,
  groupId?: string,
  role?: 'user' | 'admin',
): Promise<User | null> {
  const db = getDB();
  if (db.users.find((u) => u.email === email)) return null;
  if (db.users.find((u) => u.username === username)) return null;
  const user: User = {
    id: generateId(),
    email,
    username,
    role: role || 'user',
    group_id: groupId || null,
    created_at: new Date().toISOString(),
  };
  (user as unknown as Record<string, string>).password_hash = password;
  db.users.push(user as User & { password_hash: string });
  return user;
}

export async function createUsersBatch(
  users: { email: string; username: string; password: string; groupId?: string; role?: 'user' | 'admin' }[],
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const db = getDB();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const { email, username, password, groupId, role } of users) {
    if (!email || !username || !password) {
      skipped++;
      continue;
    }
    if (db.users.find((u) => u.email === email || u.username === username)) {
      skipped++;
      errors.push(`跳过 ${username}（邮箱或用户名已存在）`);
      continue;
    }
    const user: User = {
      id: generateId(),
      email,
      username,
      role: role || 'user',
      group_id: groupId || null,
      created_at: new Date().toISOString(),
    };
    (user as unknown as Record<string, string>).password_hash = password;
    db.users.push(user as User & { password_hash: string });
    created++;
  }
  return { created, skipped, errors };
}

export async function authenticateUser(
  login: string,
  password: string,
): Promise<User | null> {
  const db = getDB();
  const user = db.users.find(
    (u) =>
      (u.email === login || u.username === login) &&
      u.password_hash === password,
  );
  return user ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDB();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function getAllUsers(): Promise<User[]> {
  return getDB().users;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = getDB();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  db.users.splice(idx, 1);
  return true;
}

export async function deleteUsers(ids: string[]): Promise<number> {
  const db = getDB();
  const before = db.users.length;
  db.users = db.users.filter((u) => !ids.includes(u.id));
  return before - db.users.length;
}

export async function updateUsersGroup(ids: string[], groupId: string | null): Promise<number> {
  const db = getDB();
  let count = 0;
  for (const u of db.users) {
    if (ids.includes(u.id)) {
      u.group_id = groupId;
      count++;
    }
  }
  return count;
}

export async function updateUserRole(id: string, role: 'user' | 'admin'): Promise<boolean> {
  const db = getDB();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;
  user.role = role;
  return true;
}

export async function updateUserGroup(id: string, groupId: string | null): Promise<boolean> {
  const db = getDB();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;
  user.group_id = groupId;
  return true;
}

export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const db = getDB();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;
  user.password_hash = newPassword;
  return true;
}

// ===== 组别操作 =====
export async function getAllGroups(): Promise<Group[]> {
  return getDB().groups;
}

export async function createGroup(name: string, description: string): Promise<Group> {
  const db = getDB();
  const group: Group = {
    id: generateId(),
    name,
    description,
    created_at: new Date().toISOString(),
  };
  db.groups.push(group);
  return group;
}

export async function updateGroup(id: string, data: Partial<Pick<Group, 'name' | 'description'>>): Promise<boolean> {
  const db = getDB();
  const g = db.groups.find((g) => g.id === id);
  if (!g) return false;
  Object.assign(g, data);
  return true;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const db = getDB();
  const idx = db.groups.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  db.groups.splice(idx, 1);
  db.users.forEach((u) => { if (u.group_id === id) u.group_id = null; });
  return true;
}

export async function getGroupById(id: string): Promise<Group | null> {
  return getDB().groups.find((g) => g.id === id) ?? null;
}

// ===== 题库操作 =====
export async function getAllQuestions(): Promise<Question[]> {
  return getDB().questions;
}

export async function getQuestionsForGroup(groupId: string | null): Promise<Question[]> {
  const db = getDB();
  return db.questions.filter((q) => {
    if (!q.group_ids || q.group_ids.length === 0) return true;
    if (!groupId) return false;
    return q.group_ids.includes(groupId);
  });
}

export async function getQuestionById(id: string): Promise<Question | null> {
  return getDB().questions.find((q) => q.id === id) ?? null;
}

export async function createQuestion(
  question: Omit<Question, 'id' | 'created_at'>,
): Promise<Question> {
  const db = getDB();
  const newQ: Question = {
    ...question,
    group_ids: question.group_ids || [],
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  db.questions.push(newQ);
  return newQ;
}

export async function updateQuestion(
  id: string,
  data: Partial<Omit<Question, 'id' | 'created_at'>>,
): Promise<boolean> {
  const db = getDB();
  const q = db.questions.find((q) => q.id === id);
  if (!q) return false;
  Object.assign(q, data);
  return true;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const db = getDB();
  const idx = db.questions.findIndex((q) => q.id === id);
  if (idx === -1) return false;
  db.questions.splice(idx, 1);
  return true;
}

// ===== 评测操作 =====
export async function submitEvaluation(
  userId: string,
  answers: { question_id: string; user_answer: string | string[] }[],
  groupId?: string | null,
): Promise<Evaluation> {
  const db = getDB();
  const allQuestions = groupId !== undefined
    ? db.questions.filter((q) => {
        if (!q.group_ids || q.group_ids.length === 0) return true;
        if (!groupId) return false;
        return q.group_ids.includes(groupId);
      })
    : db.questions;
  let totalScore = 0;
  const maxScore = allQuestions.reduce((sum, q) => sum + q.score, 0);
  const detailAnswers = answers.map((a) => {
    const q = allQuestions.find((q) => q.id === a.question_id);
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
      const userAns = Array.isArray(a.user_answer) ? a.user_answer.sort() : [a.user_answer];
      const correct = Array.isArray(q.correct_answer) ? q.correct_answer.sort() : [q.correct_answer];
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

  const categoryMap = new Map<string, { score: number; max: number }>();
  detailAnswers.forEach((a) => {
    const q = allQuestions.find((q) => q.id === a.question_id);
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

  const evaluation: Evaluation = {
    id: generateId(),
    user_id: userId,
    total_score: totalScore,
    max_score: maxScore,
    answers: detailAnswers,
    category_scores: categoryScores,
    completed_at: new Date().toISOString(),
  };

  db.evaluations.push(evaluation);
  return evaluation;
}

export async function getUserEvaluations(userId: string): Promise<Evaluation[]> {
  return getDB().evaluations.filter((e) => e.user_id === userId);
}

export async function getAllEvaluations(): Promise<Evaluation[]> {
  return getDB().evaluations;
}

export async function getEvaluationSummary(): Promise<EvaluationSummary> {
  const db = getDB();
  const evals = db.evaluations;
  const totalEvals = evals.length;
  const totalUsers = db.users.filter((u) => u.role === 'user').length;
  const averageScore =
    totalEvals > 0
      ? Math.round(evals.reduce((s, e) => s + e.total_score, 0) / totalEvals)
      : 0;

  const completedUsers = new Set(evals.map((e) => e.user_id)).size;
  const completionRate = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;

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
    recent_evaluations: evals.slice(-10).reverse(),
  };
}

// ===== 人物评分系统 =====

export async function getAllRatingTargets(): Promise<RatingTarget[]> {
  return getDB().ratingTargets;
}

export async function getRatingTargetById(id: string): Promise<RatingTarget | null> {
  return getDB().ratingTargets.find((t) => t.id === id) ?? null;
}

export async function getRatingTargetsForGroup(groupId: string | null): Promise<RatingTarget[]> {
  const db = getDB();
  return db.ratingTargets.filter((t) => {
    if (!t.group_ids || t.group_ids.length === 0) return true;
    if (!groupId) return false;
    return t.group_ids.includes(groupId);
  });
}

export async function createRatingTarget(data: Omit<RatingTarget, 'id' | 'created_at'>): Promise<RatingTarget> {
  const db = getDB();
  const target: RatingTarget = {
    ...data,
    group_ids: data.group_ids || [],
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  db.ratingTargets.push(target);
  return target;
}

export async function updateRatingTarget(id: string, data: Partial<Omit<RatingTarget, 'id' | 'created_at'>>): Promise<boolean> {
  const db = getDB();
  const t = db.ratingTargets.find((t) => t.id === id);
  if (!t) return false;
  Object.assign(t, data);
  return true;
}

export async function deleteRatingTarget(id: string): Promise<boolean> {
  const db = getDB();
  const idx = db.ratingTargets.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  db.ratingTargets.splice(idx, 1);
  db.ratingQuestions = db.ratingQuestions.filter((q) => q.target_id !== id);
  db.ratingRecords = db.ratingRecords.filter((r) => r.target_id !== id);
  return true;
}

export async function getRatingQuestions(targetId: string): Promise<RatingQuestion[]> {
  return getDB().ratingQuestions.filter((q) => q.target_id === targetId);
}

export async function createRatingQuestion(data: Omit<RatingQuestion, 'id' | 'created_at'>): Promise<RatingQuestion> {
  const db = getDB();
  const q: RatingQuestion = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  db.ratingQuestions.push(q);
  return q;
}

export async function updateRatingQuestion(id: string, data: Partial<Omit<RatingQuestion, 'id' | 'created_at' | 'target_id'>>): Promise<boolean> {
  const db = getDB();
  const q = db.ratingQuestions.find((q) => q.id === id);
  if (!q) return false;
  Object.assign(q, data);
  return true;
}

export async function deleteRatingQuestion(id: string): Promise<boolean> {
  const db = getDB();
  const idx = db.ratingQuestions.findIndex((q) => q.id === id);
  if (idx === -1) return false;
  db.ratingQuestions.splice(idx, 1);
  return true;
}

export async function submitRating(
  userId: string,
  targetId: string,
  answers: { question_id: string; selected_option: string }[],
): Promise<RatingRecord> {
  const db = getDB();
  const questions = db.ratingQuestions.filter((q) => q.target_id === targetId);
  const maxScore = questions.reduce((s, q) => s + q.score, 0);

  const detailAnswers = answers.map((a) => {
    const q = questions.find((q) => q.id === a.question_id);
    return {
      question_id: a.question_id,
      question_title: q?.title ?? '未知题目',
      selected_option: a.selected_option,
    };
  });

  const totalScore = maxScore;

  const record: RatingRecord = {
    id: generateId(),
    user_id: userId,
    target_id: targetId,
    answers: detailAnswers,
    total_score: totalScore,
    max_score: maxScore,
    completed_at: new Date().toISOString(),
  };
  db.ratingRecords.push(record);
  return record;
}

export async function getRatingRecordsByTarget(targetId: string): Promise<RatingRecord[]> {
  return getDB().ratingRecords.filter((r) => r.target_id === targetId);
}

export async function hasUserRated(userId: string, targetId: string): Promise<boolean> {
  return getDB().ratingRecords.some((r) => r.user_id === userId && r.target_id === targetId);
}

export async function getRatingStats(targetId: string, groupId?: string | null): Promise<RatingStats | null> {
  const db = getDB();
  const target = db.ratingTargets.find((t) => t.id === targetId);
  if (!target) return null;

  let records = db.ratingRecords.filter((r) => r.target_id === targetId);

  if (groupId) {
    const groupUserIds = db.users.filter((u) => u.group_id === groupId).map((u) => u.id);
    records = records.filter((r) => groupUserIds.includes(r.user_id));
  }

  const questions = db.ratingQuestions.filter((q) => q.target_id === targetId);
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

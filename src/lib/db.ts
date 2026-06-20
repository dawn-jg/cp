// 数据库适配器 — 自动环境检测切换
// Cloudflare Workers / Edge Runtime → D1 (SQLite via db-d1.ts)
// Node.js (开发环境) → 内存数据库 (via db-memory.ts)

// 环境检测：Cloudflare/Edge 时用 D1，否则用内存
const useD1 =
  typeof process !== 'undefined' &&
  (process.env.CLOUDFLARE === '1' ||
    process.env.NEXT_RUNTIME === 'edge' ||
    process.env.CF_PAGES === '1' ||
    process.env.CF_PAGES_BRANCH !== undefined);

const impl = useD1
  ? await import('./db-d1')
  : await import('./db-memory');

// ===== 系统设置 =====
export const getRegistrationEnabled: typeof impl.getRegistrationEnabled = impl.getRegistrationEnabled;
export const setRegistrationEnabled: typeof impl.setRegistrationEnabled = impl.setRegistrationEnabled;

// ===== 用户操作 =====
export const createUser: typeof impl.createUser = impl.createUser;
export const createUsersBatch: typeof impl.createUsersBatch = impl.createUsersBatch;
export const authenticateUser: typeof impl.authenticateUser = impl.authenticateUser;
export const getUserById: typeof impl.getUserById = impl.getUserById;
export const getAllUsers: typeof impl.getAllUsers = impl.getAllUsers;
export const deleteUser: typeof impl.deleteUser = impl.deleteUser;
export const deleteUsers: typeof impl.deleteUsers = impl.deleteUsers;
export const updateUsersGroup: typeof impl.updateUsersGroup = impl.updateUsersGroup;
export const updateUserRole: typeof impl.updateUserRole = impl.updateUserRole;
export const updateUserGroup: typeof impl.updateUserGroup = impl.updateUserGroup;

// ===== 组别操作 =====
export const getAllGroups: typeof impl.getAllGroups = impl.getAllGroups;
export const createGroup: typeof impl.createGroup = impl.createGroup;
export const updateGroup: typeof impl.updateGroup = impl.updateGroup;
export const deleteGroup: typeof impl.deleteGroup = impl.deleteGroup;
export const getGroupById: typeof impl.getGroupById = impl.getGroupById;

// ===== 题库操作 =====
export const getAllQuestions: typeof impl.getAllQuestions = impl.getAllQuestions;
export const getQuestionsForGroup: typeof impl.getQuestionsForGroup = impl.getQuestionsForGroup;
export const getQuestionById: typeof impl.getQuestionById = impl.getQuestionById;
export const createQuestion: typeof impl.createQuestion = impl.createQuestion;
export const updateQuestion: typeof impl.updateQuestion = impl.updateQuestion;
export const deleteQuestion: typeof impl.deleteQuestion = impl.deleteQuestion;

// ===== 评测操作 =====
export const submitEvaluation: typeof impl.submitEvaluation = impl.submitEvaluation;
export const getUserEvaluations: typeof impl.getUserEvaluations = impl.getUserEvaluations;
export const getAllEvaluations: typeof impl.getAllEvaluations = impl.getAllEvaluations;
export const getEvaluationSummary: typeof impl.getEvaluationSummary = impl.getEvaluationSummary;

// ===== 评分操作 =====
export const getAllRatingTargets: typeof impl.getAllRatingTargets = impl.getAllRatingTargets;
export const getRatingTargetById: typeof impl.getRatingTargetById = impl.getRatingTargetById;
export const getRatingTargetsForGroup: typeof impl.getRatingTargetsForGroup = impl.getRatingTargetsForGroup;
export const createRatingTarget: typeof impl.createRatingTarget = impl.createRatingTarget;
export const updateRatingTarget: typeof impl.updateRatingTarget = impl.updateRatingTarget;
export const deleteRatingTarget: typeof impl.deleteRatingTarget = impl.deleteRatingTarget;
export const getRatingQuestions: typeof impl.getRatingQuestions = impl.getRatingQuestions;
export const createRatingQuestion: typeof impl.createRatingQuestion = impl.createRatingQuestion;
export const updateRatingQuestion: typeof impl.updateRatingQuestion = impl.updateRatingQuestion;
export const deleteRatingQuestion: typeof impl.deleteRatingQuestion = impl.deleteRatingQuestion;
export const submitRating: typeof impl.submitRating = impl.submitRating;
export const getRatingRecordsByTarget: typeof impl.getRatingRecordsByTarget = impl.getRatingRecordsByTarget;
export const hasUserRated: typeof impl.hasUserRated = impl.hasUserRated;
export const getRatingStats: typeof impl.getRatingStats = impl.getRatingStats;

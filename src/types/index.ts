// 评测数据类型定义
export interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  group_id: string | null;
  created_at: string;
}

export interface QuestionSet {
  id: string;
  name: string;
  created_at: string;
}

export interface Question {
  id: string;
  title: string;
  type: 'single' | 'multiple' | 'text';
  options: string[];
  correct_answer: string | string[];
  score: number;
  category: string;
  group_ids: string[];
  set_id?: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  user_id: string;
  total_score: number;
  max_score: number;
  answers: Answer[];
  category_scores: CategoryScore[];
  completed_at: string;
}

export interface Answer {
  question_id: string;
  question_title: string;
  user_answer: string | string[];
  correct_answer: string | string[];
  is_correct: boolean;
  score: number;
  max_score: number;
}

export interface CategoryScore {
  category: string;
  score: number;
  max_score: number;
  percentage: number;
}

export interface EvaluationSummary {
  total_users: number;
  total_evaluations: number;
  average_score: number;
  completion_rate: number;
  category_averages: { category: string; average: number }[];
  recent_evaluations: Evaluation[];
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

// ===== 人物评分系统 =====
export interface RatingGroup {
  id: string;
  name: string;
  created_at: string;
}

export interface RatingTarget {
  id: string;
  name: string;
  description: string;
  group_ids: string[];
  group_id?: string;
  created_at: string;
}

export interface RatingQuestion {
  id: string;
  target_id: string;
  title: string;
  options: string[];
  score: number;
  created_at: string;
}

export interface RatingRecord {
  id: string;
  user_id: string;
  target_id: string;
  answers: RatingAnswer[];
  total_score: number;
  max_score: number;
  completed_at: string;
}

export interface RatingAnswer {
  question_id: string;
  question_title: string;
  selected_option: string;
}

export interface RatingStats {
  target: RatingTarget;
  total_raters: number;
  questions: {
    question_id: string;
    question_title: string;
    option_distribution: { option: string; count: number; percentage: number }[];
  }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

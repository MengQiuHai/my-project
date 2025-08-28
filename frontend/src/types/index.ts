// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 用户相关类型
export interface User {
  user_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: any;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin';
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  totalSessions: number;
  totalCoins: number;
  currentBalance: number;
  achievementCount: number;
  streakDays: number;
}

export interface UserProfile {
  user: User;
  stats: UserStats;
}

// 认证相关类型
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 学习会话类型
export interface LearningSession {
  session_id: string;
  user_id: string;
  task_id: string;
  difficulty_id: string;
  session_date: string;
  focus_time_minutes: number;
  result_quantity: number;
  focus_coins: number;
  result_coins: number;
  total_coins: number;
  notes?: string;
  metadata?: any;
  status: 'completed' | 'partial' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface SessionWithDetails extends LearningSession {
  task_name: string;
  task_subject: string;
  difficulty_label: string;
  difficulty_coefficient: number;
}

export interface CreateSessionData {
  task_id: string;
  difficulty_id: string;
  session_date: string;
  focus_time_minutes: number;
  result_quantity: number;
  notes?: string;
  metadata?: any;
}

// 任务定义类型
export interface TaskDefinition {
  task_id: string;
  name: string;
  subject: string;
  description?: string;
  base_coin: number;
  unit_name: string;
  validation_rule?: string;
  task_type: 'study' | 'practice' | 'exam' | 'reading' | 'coding' | 'other';
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// 难度等级类型
export interface Difficulty {
  difficulty_id: string;
  label: string;
  coefficient: number;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 成就类型
export interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  condition_expression: string;
  icon?: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  user_achievement_id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: string;
  achievement_data?: any;
  created_at: string;
  updated_at: string;
}

// 奖励类型
export interface Reward {
  reward_id: string;
  user_id: string;
  name: string;
  description?: string;
  cost_coins: number;
  category: 'entertainment' | 'food' | 'shopping' | 'activity' | 'rest' | 'other';
  icon?: string;
  is_active: boolean;
  usage_limit: number;
  cooldown_hours: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateRewardData {
  name: string;
  description?: string;
  cost_coins: number;
  category: 'entertainment' | 'food' | 'shopping' | 'activity' | 'rest' | 'other';
  icon?: string;
  usage_limit?: number;
  cooldown_hours?: number;
  metadata?: any;
}

// 兑换记录类型
export interface Redemption {
  redemption_id: string;
  user_id: string;
  reward_id: string;
  coins_spent: number;
  redeemed_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  completed_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// 统计数据类型
export interface SessionStats {
  totalSessions: number;
  totalFocusTime: number;
  totalCoins: number;
  avgSessionTime: number;
  subjectStats: SubjectStat[];
  dailyStats: DailyStat[];
}

export interface SubjectStat {
  subject: string;
  sessionCount: number;
  focusTime: number;
  coins: number;
}

export interface DailyStat {
  date: string;
  sessionCount: number;
  focusTime: number;
  coins: number;
}

// 分页查询参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SessionListParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  taskId?: string;
  subject?: string;
  status?: string;
}

// 错误类型
export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
}

// 表单状态类型
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// 模态框类型
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export interface TaskDuration {
  estimated: number; // in minutes
  actual: number; // in minutes
  sessions: TaskSession[];
}

export interface TaskSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in milliseconds
  type: 'focus' | 'break';
  completed: boolean;
}

export interface TaskNote {
  id: string;
  content: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskColumn {
  id: string;
  title: string;
  order: number;
  color?: string;
}

export interface TaskAnalytics {
  totalTimeSpent: number;
  sessionsCompleted: number;
  averageSessionDuration: number;
  productivityScore: number;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
}

export interface DailyStats {
  date: string;
  timeSpent: number;
  tasksCompleted: number;
  sessionsCompleted: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  timeSpent: number;
  tasksCompleted: number;
  averageDaily: number;
}

// Extended Task properties for gamification
export interface TaskGameData {
  xp: number;
  taskType: 'frog' | 'quest' | 'regular';
  difficulty: 'easy' | 'medium' | 'hard';
  coinReward: number;
  completionXP: number;
}

// Gamification data models for Phase 3 features

export interface AccountabilityReflection {
  id: string;
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  reflectionText?: string;
  voiceNoteUrl?: string;
  mood: 'frustrated' | 'satisfied' | 'motivated' | 'neutral';
  blockers: string[];
  createdAt: string;
}

export interface ShadowSelf {
  id: string;
  date: string;
  predictedTasks: number;
  predictedFocusTime: number; // in minutes
  actualTasks: number;
  actualFocusTime: number; // in minutes
  userWon: boolean;
  score: number; // difference percentage
  createdAt: string;
}

export interface DuelResult {
  userScore: number;
  shadowScore: number;
  winner: 'user' | 'shadow' | 'tie';
  category: 'tasks' | 'focus_time' | 'overall';
}

export interface GameStats {
  totalXP: number;
  level: number;
  coins: number;
  streak: number;
  totalReflections: number;
  shadowWins: number;
  shadowLosses: number;
  shadowTies: number;
  averageMood: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPrediction {
  tasksToComplete: number;
  focusTimeMinutes: number;
  basedOnDays: number; // how many past days used for prediction
  confidence: number; // 0-1 confidence score
}

// Extended Task interface with gamification properties
export interface GameTask {
  xp: number;
  taskType: 'frog' | 'quest' | 'regular';
  difficulty: 'easy' | 'medium' | 'hard';
  coinReward: number;
  isCompleted: boolean;
  completionXP: number;
}
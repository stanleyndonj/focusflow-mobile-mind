/**
 * Habit Tracker Types and Interfaces
 * Core data models for the FocusFlow Habit Tracker micro-app
 */

export type HabitType = 'good' | 'bad';
export type TrackMode = 'binary' | 'count' | 'duration';
export type Period = 'daily' | 'weekly';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface LogMap {
  [isoDate: string]: number; // date ISO -> value
}

export interface Target {
  period: Period;
  times?: number;
  minutes?: number;
}

export interface HabitSettings {
  graceDays?: number;
  timezone?: string;
  color?: string;
  notificationTime?: string;
  replacement?: string; // For bad habits - what to do instead
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  consistency: number; // 0..1
  score: number; // 0..1
  lastUpdated: string;
  totalCompletions?: number;
  averageValue?: number;
}

export interface HabitBreakReason {
  date: string;
  time: string;
  reason: string;
  trigger?: string;
  mood?: string;
  preventionPlan?: string;
}

export interface Habit {
  id: string;
  title: string;
  type: HabitType;
  trackMode: TrackMode;
  target: Target;
  logs: LogMap;
  timestamps?: Record<string, string>; // date -> ISO timestamp for precise tracking
  breakReasons?: HabitBreakReason[]; // For bad habits - reasons why habit was broken
  avoidedStreak?: number; // Current streak of days avoided (for bad habits)
  bestAvoidedStreak?: number; // Best streak of days avoided (for bad habits)
  schedule?: DayOfWeek[];
  settings: HabitSettings;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  stats: HabitStats;
  createdAt: string;
  updatedAt: string;
}

export interface NewHabit {
  title: string;
  type: HabitType;
  trackMode: TrackMode;
  target: Target;
  schedule?: DayOfWeek[];
  difficulty?: number;
  settings?: HabitSettings;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'suggestion' | 'warning' | 'achievement';
  habitId?: string;
  priority: number; // 0-10
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface HabitAnalytics {
  totalGoodHabitsCompleted: number;
  totalBadHabitOccurrences: number;
  overallConsistency: number;
  overallScore: number;
  topStreaks: Array<{
    habitId: string;
    title: string;
    streak: number;
  }>;
  recommendations: Recommendation[];
}

// Storage schema version for migrations
export interface HabitStorageSchema {
  version: number;
  habits: Habit[];
  lastSync?: string;
  settings?: {
    alpha?: number; // EWMA alpha parameter
    streakMultiplier?: number;
  };
}

// Export/Import format
export interface HabitExportData {
  version: string;
  exportedAt: string;
  habits: Habit[];
  settings?: Record<string, any>;
}

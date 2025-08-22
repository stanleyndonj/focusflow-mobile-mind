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

// Phase 1 Features - Mini Focus Quests
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'focus_session' | 'task_completion' | 'daily_goal' | 'streak';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  xpReward: number;
  coinReward: number;
  requirements: {
    target: number; // minutes for focus, count for tasks, etc.
    current: number;
  };
  isCompleted: boolean;
  isActive: boolean;
  expiresAt?: string; // for daily/weekly quests
  completedAt?: string;
  createdAt: string;
}

// Phase 1 Features - Productivity Companion
export interface ProductivityCompanion {
  id: string;
  name: string;
  type: 'pet' | 'avatar' | 'character';
  species: 'dragon' | 'phoenix' | 'owl' | 'fox' | 'cat' | 'robot';
  level: number;
  experience: number;
  experienceToNext: number;
  mood: 'happy' | 'excited' | 'focused' | 'sleepy' | 'sad' | 'motivated';
  state: 'active' | 'sleeping' | 'growing' | 'celebrating';
  lastInteraction: string;
  evolution: {
    stage: number; // 1-5 (egg, baby, teen, adult, master)
    nextEvolutionXP: number;
  };
  customization: {
    color: string;
    accessories: string[];
  };
  stats: {
    totalFocusTime: number;
    tasksCompleted: number;
    streakDays: number;
    questsCompleted: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Phase 1 Features - Reward Store
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  category: 'theme' | 'sound' | 'companion' | 'badge' | 'quote' | 'feature';
  type: 'theme' | 'ambient_sound' | 'companion_skin' | 'achievement_badge' | 'motivational_quote' | 'premium_feature';
  price: number; // in coins
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isUnlocked: boolean;
  isPurchased: boolean;
  isEquipped?: boolean;
  requirements?: {
    level?: number;
    questsCompleted?: number;
    streakDays?: number;
  };
  previewUrl?: string;
  iconUrl?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  itemId: string;
  userId: string;
  price: number;
  purchasedAt: string;
}

// Enhanced GameStats for Phase 1
export interface EnhancedGameStats extends GameStats {
  totalQuestsCompleted: number;
  companionLevel: number;
  itemsPurchased: number;
  themesUnlocked: number;
  achievementBadges: string[];
  currentTheme?: string;
  equippedItems: string[];
}

// Phase 2 Features - Mind Lock Mode
export interface MindLockSession {
  id: string;
  taskId?: string;
  commitment: string;
  duration: number; // in minutes
  startTime: string;
  endTime?: string;
  isCompleted: boolean;
  wasAbandoned: boolean;
  abandonedAt?: string;
  abandonReason?: string;
  coinPenalty: number;
  coinReward: number;
  xpReward: number;
  createdAt: string;
}

export interface MindLockCommitment {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  penalty: number; // coins lost if abandoned
  reward: number; // extra coins if completed
  isActive: boolean;
  createdAt: string;
}

// Phase 2 Features - Eat That Frog Mode
export interface FrogTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  estimatedTime: number; // in minutes
  isCompleted: boolean;
  completedAt?: string;
  selectedAt: string;
  date: string; // YYYY-MM-DD format
  coinBonus: number;
  xpBonus: number;
  streakBonus?: number;
  // New repetitive frog fields
  isRepeating?: boolean;
  repeatType?: 'daily' | 'weekdays'; // daily = all days, weekdays = Mon-Fri only
  parentFrogId?: string; // Link to the original repeating frog template
  isTemplate?: boolean; // True for the original repeating frog definition
}

export interface RepeatableFrogTemplate {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  estimatedTime: number; // in minutes
  repeatType: 'daily' | 'weekdays';
  isActive: boolean;
  createdAt: string;
  coinBonus: number;
  xpBonus: number;
}

export interface FrogModeState {
  isActive: boolean;
  todaysFrog: FrogTask | null;
  todaysRepeatingFrogs: FrogTask[]; // Up to 3 repeating frogs for today
  interfaceLocked: boolean;
  canOverride: boolean;
  overrideUsed: boolean;
  consecutiveDays: number;
  lastFrogDate?: string;
  repeatableFrogTemplates: RepeatableFrogTemplate[]; // User's repeating frog templates
}

// Enhanced GameStats for Phase 2
export interface Phase2GameStats extends EnhancedGameStats {
  mindLockSessionsCompleted: number;
  mindLockSessionsAbandoned: number;
  mindLockSuccessRate: number;
  frogsEaten: number;
  frogStreak: number;
  longestFrogStreak: number;
  totalCommitmentPenalties: number;
  totalFrogBonuses: number;
}

// Shadow Mode for Real-time Session Monitoring
export interface ShadowModeState {
  isEnabled: boolean;
  isActive: boolean; // Currently monitoring a session
  sessionId: string | null;
  sessionStartTime: string | null;
  expectedDuration: number; // in minutes
  shadowObserverVisible: boolean;
  currentSessionWins: number;
  currentSessionLosses: number;
  totalShadowWins: number;
  totalShadowLosses: number;
  lastSessionResult: 'win' | 'loss' | null;
}

// Day Streak Tracking
export interface DayStreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakSavedWithCoins: number; // How many times streak was saved
  coinsSavedStreak: number; // Total coins spent on saving streaks
  streakSaveCost: number; // Current cost to save streak (increases each time)
  canSaveStreak: boolean;
  todayCompleted: boolean;
  requiredDailyGoal: {
    tasksCompleted?: number;
    focusMinutes?: number;
    anyActivity: boolean; // If true, any task or focus session counts
  };
}

// Session Monitoring for Shadow Mode
export interface ShadowSession {
  id: string;
  startTime: string;
  expectedEndTime: string;
  actualEndTime?: string;
  duration: number; // in minutes
  taskId?: string;
  taskTitle?: string;
  completed: boolean;
  exitedEarly: boolean;
  shadowResult: 'win' | 'loss' | 'pending';
  createdAt: string;
}
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState, ReactNode } from 'react';
import { useTasks } from './TaskContext';
import { useTimer } from './TimerContext';
import GamificationStorage from '@/services/GamificationStorage';
import GamificationTimerIntegration from '@/services/GamificationTimerIntegration';
import GamificationIntegrationService from '@/services/GamificationIntegrationService';
import { toast } from '@/components/ui/use-toast';
import { 
  AccountabilityReflection, 
  ShadowSelf, 
  GameStats, 
  DailyPrediction,
  DuelResult,
  GameTask,
  Quest,
  ProductivityCompanion,
  StoreItem,
  Purchase,
  EnhancedGameStats,
  ShadowModeState,
  DayStreakState,
  ShadowSession
} from '@/types/GameTypes';

// Helper function to safely create ISO date strings with fallback
const safeISOString = (date?: Date | string | number): string => {
  try {
    const dateObj = date ? new Date(date) : new Date();
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date detected, using current time as fallback');
      return new Date().toISOString();
    }
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error creating ISO string, using current time as fallback:', error);
    return new Date().toISOString();
  }
};

// Helper function to safely get today's date string
const safeTodayString = (): string => {
  try {
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error('Error getting today string, using fallback:', error);
    return '2023-01-01'; // Fallback date
  }
};

interface GameAction {
  type: 
    | 'ADD_REFLECTION'
    | 'UPDATE_REFLECTION' 
    | 'CREATE_SHADOW_CHALLENGE'
    | 'COMPLETE_SHADOW_DUEL'
    | 'UPDATE_GAME_STATS'
    | 'ADD_XP'
    | 'ADD_COINS'
    | 'INCREMENT_STREAK'
    | 'RESET_STREAK'
    | 'LEVEL_UP'
    | 'SET_DAILY_PREDICTION'
    // Phase 1 Actions
    | 'CREATE_QUEST'
    | 'UPDATE_QUEST'
    | 'COMPLETE_QUEST'
    | 'UPDATE_COMPANION'
    | 'EVOLVE_COMPANION'
    | 'PURCHASE_ITEM'
    | 'EQUIP_ITEM'
    | 'UNLOCK_ITEM'
    // Shadow Mode Actions
    | 'TOGGLE_SHADOW_MODE'
    | 'START_SHADOW_SESSION'
    | 'END_SHADOW_SESSION'
    | 'SHADOW_WIN'
    | 'SHADOW_LOSS'
    | 'LOAD_SHADOW_MODE'
    | 'UPDATE_SHADOW_STATE'
    // Day Streak Actions
    | 'UPDATE_DAY_STREAK'
    | 'SAVE_STREAK_WITH_COINS'
    | 'RESET_DAY_STREAK'
    // Force Update
    | 'FORCE_UPDATE'
    | 'COMPLETE_DAILY_GOAL';
  payload: any;
}

interface GameState {
  reflections: AccountabilityReflection[];
  shadowChallenges: ShadowSelf[];
  gameStats: EnhancedGameStats;
  dailyPrediction: DailyPrediction | null;
  todaysShadow: ShadowSelf | null;
  loading: boolean;
  // Phase 1 Features
  quests: Quest[];
  companion: ProductivityCompanion | null;
  storeItems: StoreItem[];
  purchases: Purchase[];
  // Shadow Mode & Day Streak
  shadowMode: ShadowModeState;
  dayStreak: DayStreakState;
  shadowSessions: ShadowSession[];
}

const initialGameStats: EnhancedGameStats = {
  totalXP: 0,
  level: 1,
  coins: 0,
  streak: 0,
  totalReflections: 0,
  shadowWins: 0,
  shadowLosses: 0,
  shadowTies: 0,
  averageMood: 0,
  createdAt: safeISOString(),
  updatedAt: safeISOString(),
  // Enhanced GameStats properties
  totalQuestsCompleted: 0,
  companionLevel: 1,
  itemsPurchased: 0,
  themesUnlocked: 0,
  achievementBadges: [],
  currentTheme: 'default',
  equippedItems: []
};

const initialShadowMode: ShadowModeState = {
  isEnabled: true, // Shadow Mode enabled by default
  isActive: false,
  sessionId: null,
  sessionStartTime: null,
  expectedDuration: 0,
  shadowObserverVisible: false,
  currentSessionWins: 0,
  currentSessionLosses: 0,
  totalShadowWins: 0,
  totalShadowLosses: 0,
  lastSessionResult: null
};

const initialDayStreak: DayStreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  streakSavedWithCoins: 0,
  coinsSavedStreak: 0,
  streakSaveCost: 50, // Base cost of 50 coins
  canSaveStreak: false,
  todayCompleted: false,
  requiredDailyGoal: {
    anyActivity: true // By default, any task or focus session counts
  }
};

const defaultStoreItems: StoreItem[] = [
  // Themes
  {
    id: 'theme_ocean',
    name: 'Ocean Breeze',
    description: 'Calming blue theme with wave animations',
    price: 50,
    category: 'theme',
    type: 'theme',
    rarity: 'common',
    isUnlocked: true,
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'theme_forest',
    name: 'Forest Zen',
    description: 'Green nature theme with leaf particles',
    price: 75,
    category: 'theme',
    type: 'theme',
    rarity: 'rare',
    isUnlocked: true,
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  // Sounds
  {
    id: 'sound_rain',
    name: 'Gentle Rain',
    description: 'Peaceful rain sounds for focus',
    price: 30,
    category: 'sound',
    type: 'ambient_sound',
    rarity: 'common',
    isUnlocked: true,
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sound_lofi',
    name: 'Lo-Fi Beats',
    description: 'Chill lo-fi music for productivity',
    price: 60,
    category: 'sound',
    type: 'ambient_sound',
    rarity: 'rare',
    isUnlocked: true,
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  // Companion Items
  {
    id: 'companion_crown',
    name: 'Golden Crown',
    description: 'A majestic crown for your companion',
    price: 100,
    category: 'companion',
    type: 'companion_skin',
    rarity: 'epic',
    isUnlocked: true,
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  // Badges
  {
    id: 'badge_focus',
    name: 'Focus Master',
    description: 'Badge for completing 50 focus sessions',
    price: 80,
    category: 'badge',
    type: 'achievement_badge',
    rarity: 'rare',
    isUnlocked: true,
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  // Quotes
  {
    id: 'quotes_productivity',
    name: 'Productivity Quotes',
    description: '25 inspiring productivity quotes',
    price: 25,
    category: 'quote',
    type: 'motivational_quote',
    rarity: 'common',
    isUnlocked: true,
    isPurchased: false,
    createdAt: new Date().toISOString()
  }
];

const initialState: GameState = {
  reflections: [],
  shadowChallenges: [],
  gameStats: initialGameStats,
  dailyPrediction: null,
  todaysShadow: null,
  loading: false,
  // Phase 1 Features
  quests: [],
  companion: null,
  storeItems: defaultStoreItems,
  purchases: [],
  // Shadow Mode & Day Streak
  shadowMode: initialShadowMode,
  dayStreak: initialDayStreak,
  shadowSessions: []
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_REFLECTION':
      return {
        ...state,
        reflections: [...state.reflections, action.payload],
        gameStats: {
          ...state.gameStats,
          totalReflections: state.gameStats.totalReflections + 1,
          updatedAt: safeISOString()
        }
      };

    case 'UPDATE_REFLECTION':
      return {
        ...state,
        reflections: state.reflections.map(reflection =>
          reflection.id === action.payload.id ? action.payload : reflection
        )
      };

    case 'CREATE_SHADOW_CHALLENGE':
      return {
        ...state,
        todaysShadow: action.payload,
        shadowChallenges: [...state.shadowChallenges, action.payload]
      };

    case 'COMPLETE_SHADOW_DUEL':
      const { userWon } = action.payload;
      return {
        ...state,
        todaysShadow: action.payload,
        shadowChallenges: state.shadowChallenges.map(shadow =>
          shadow.id === action.payload.id ? action.payload : shadow
        ),
        gameStats: {
          ...state.gameStats,
          shadowWins: userWon ? state.gameStats.shadowWins + 1 : state.gameStats.shadowWins,
          shadowLosses: !userWon && action.payload.winner !== 'tie' ? state.gameStats.shadowLosses + 1 : state.gameStats.shadowLosses,
          shadowTies: action.payload.winner === 'tie' ? state.gameStats.shadowTies + 1 : state.gameStats.shadowTies,
          updatedAt: safeISOString()
        }
      };

    case 'ADD_XP':
      const newXP = state.gameStats.totalXP + action.payload;
      const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level
      const leveledUp = newLevel > state.gameStats.level;
      
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          totalXP: newXP,
          level: newLevel,
          coins: leveledUp ? state.gameStats.coins + (newLevel * 10) : state.gameStats.coins,
          updatedAt: safeISOString()
        }
      };

    case 'ADD_COINS':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          coins: state.gameStats.coins + action.payload,
          updatedAt: safeISOString()
        }
      };

    case 'INCREMENT_STREAK':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          streak: state.gameStats.streak + 1,
          updatedAt: safeISOString()
        }
      };

    case 'RESET_STREAK':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          streak: 0,
          updatedAt: safeISOString()
        }
      };

    case 'SET_DAILY_PREDICTION':
      return {
        ...state,
        dailyPrediction: action.payload
      };

    case 'UPDATE_GAME_STATS':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          ...action.payload,
          updatedAt: safeISOString()
        }
      };

    // Shadow Mode Actions
    case 'TOGGLE_SHADOW_MODE':
      return {
        ...state,
        shadowMode: {
          ...state.shadowMode,
          isEnabled: action.payload
        }
      };

    case 'START_SHADOW_SESSION':
      // Validate duration parameter to prevent invalid time values
      const duration = typeof action.payload.duration === 'number' && action.payload.duration > 0 
        ? action.payload.duration 
        : 30; // Default to 30 minutes if invalid
      
      const sessionId = `shadow_${Date.now()}`;
      const startTime = new Date();
      const expectedEndTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      // Additional validation to ensure valid dates
      if (isNaN(startTime.getTime()) || isNaN(expectedEndTime.getTime())) {
        console.error('❌ Invalid time values in START_SHADOW_SESSION, using current time');
        const fallbackTime = new Date();
        const fallbackEndTime = new Date(fallbackTime.getTime() + 30 * 60 * 1000);
        
        const newSession: ShadowSession = {
          id: sessionId,
          startTime: fallbackTime.toISOString(),
          expectedEndTime: fallbackEndTime.toISOString(),
          duration: 30,
          taskId: action.payload.taskId || '',
          taskTitle: action.payload.taskTitle || 'Unknown Task',
          completed: false,
          exitedEarly: false,
          shadowResult: 'pending',
          createdAt: fallbackTime.toISOString()
        };
        
        return {
          ...state,
          shadowMode: {
            ...state.shadowMode,
            isActive: true,
            sessionId: sessionId,
            sessionStartTime: fallbackTime.toISOString(),
            expectedDuration: 30,
            shadowObserverVisible: true
          },
          shadowSessions: [...state.shadowSessions, newSession]
        };
      }
      
      const newSession: ShadowSession = {
        id: sessionId,
        startTime: startTime.toISOString(),
        expectedEndTime: expectedEndTime.toISOString(),
        duration: duration,
        taskId: action.payload.taskId || '',
        taskTitle: action.payload.taskTitle || 'Unknown Task',
        completed: false,
        exitedEarly: false,
        shadowResult: 'pending',
        createdAt: startTime.toISOString()
      };
      return {
        ...state,
        shadowMode: {
          ...state.shadowMode,
          isActive: true,
          sessionId: sessionId,
          sessionStartTime: startTime.toISOString(),
          expectedDuration: duration,
          shadowObserverVisible: true
        },
        shadowSessions: [...state.shadowSessions, newSession]
      };

    case 'END_SHADOW_SESSION':
      const { completed, exitedEarly } = action.payload;
      const result = completed && !exitedEarly ? 'win' : 'loss';
      return {
        ...state,
        shadowMode: {
          ...state.shadowMode,
          isActive: false,
          sessionId: null,
          sessionStartTime: null,
          expectedDuration: 0,
          shadowObserverVisible: false,
          currentSessionWins: result === 'win' ? state.shadowMode.currentSessionWins + 1 : state.shadowMode.currentSessionWins,
          currentSessionLosses: result === 'loss' ? state.shadowMode.currentSessionLosses + 1 : state.shadowMode.currentSessionLosses,
          // Fix: result 'win' = user win = shadow loss, result 'loss' = shadow win = user loss
          totalShadowWins: result === 'loss' ? state.shadowMode.totalShadowWins + 1 : state.shadowMode.totalShadowWins,
          totalShadowLosses: result === 'win' ? state.shadowMode.totalShadowLosses + 1 : state.shadowMode.totalShadowLosses,
          lastSessionResult: result
        },
        shadowSessions: state.shadowSessions.map(session =>
          session.id === state.shadowMode.sessionId
            ? { ...session, completed, exitedEarly, shadowResult: result, actualEndTime: safeISOString() }
            : session
        )
      };

    case 'SHADOW_WIN':
      return {
        ...state,
        shadowMode: {
          ...state.shadowMode,
          totalShadowWins: state.shadowMode.totalShadowWins + 1,
          lastSessionResult: 'win'
        }
      };

    case 'SHADOW_LOSS':
      return {
        ...state,
        shadowMode: {
          ...state.shadowMode,
          totalShadowLosses: state.shadowMode.totalShadowLosses + 1,
          lastSessionResult: 'loss'
        }
      };

    case 'LOAD_SHADOW_MODE':
      console.log('🥷 LOAD_SHADOW_MODE: Loading shadow data:', action.payload.shadowMode);
      return {
        ...state,
        shadowMode: {
          ...initialShadowMode,
          ...action.payload.shadowMode,
          // Ensure critical stats are preserved from loaded data
          totalShadowWins: action.payload.shadowMode?.totalShadowWins || 0,
          totalShadowLosses: action.payload.shadowMode?.totalShadowLosses || 0,
          isEnabled: action.payload.shadowMode?.isEnabled !== undefined ? action.payload.shadowMode.isEnabled : true
        },
        shadowSessions: action.payload.shadowSessions || []
      };

    // Day Streak Actions
    case 'UPDATE_DAY_STREAK':
      const today = safeTodayString();
      const lastDate = state.dayStreak.lastActiveDate;
      const yesterday = safeISOString(Date.now() - 24 * 60 * 60 * 1000).split('T')[0];
      
      let newStreak = state.dayStreak.currentStreak;
      if (!lastDate || lastDate === yesterday) {
        // Continue or start streak
        newStreak = lastDate === yesterday ? state.dayStreak.currentStreak + 1 : 1;
      } else if (lastDate !== today) {
        // Streak broken
        newStreak = 1;
      }
      
      return {
        ...state,
        dayStreak: {
          ...state.dayStreak,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.dayStreak.longestStreak),
          lastActiveDate: today,
          todayCompleted: true,
          canSaveStreak: false // Reset after completing daily goal
        }
      };

    case 'FORCE_UPDATE':
      // Force a state update to trigger UI re-render
      return {
        ...state,
        loading: false // Ensure loading is false after data load
      };

    case 'SAVE_STREAK_WITH_COINS':
      const saveCost = state.dayStreak.streakSaveCost;
      if (state.gameStats.coins >= saveCost) {
        return {
          ...state,
          gameStats: {
            ...state.gameStats,
            coins: state.gameStats.coins - saveCost
          },
          dayStreak: {
            ...state.dayStreak,
            streakSavedWithCoins: state.dayStreak.streakSavedWithCoins + 1,
            coinsSavedStreak: state.dayStreak.coinsSavedStreak + saveCost,
            streakSaveCost: Math.floor(saveCost * 1.5), // Increase cost each time
            canSaveStreak: false,
            lastActiveDate: safeTodayString() // Mark today as active
          }
        };
      }
      return state;

    case 'RESET_DAY_STREAK':
      return {
        ...state,
        dayStreak: {
          ...state.dayStreak,
          currentStreak: 0,
          canSaveStreak: true // Allow saving when streak is about to break
        }
      };

    case 'COMPLETE_DAILY_GOAL':
      return {
        ...state,
        dayStreak: {
          ...state.dayStreak,
          todayCompleted: true
        }
      };

    // Phase 1 Actions
    case 'CREATE_QUEST':
      return {
        ...state,
        quests: [...state.quests, action.payload]
      };

    case 'UPDATE_QUEST':
      return {
        ...state,
        quests: state.quests.map(quest =>
          quest.id === action.payload.id ? action.payload : quest
        )
      };

    case 'COMPLETE_QUEST':
      return {
        ...state,
        quests: state.quests.map(quest =>
          quest.id === action.payload
            ? { ...quest, isCompleted: true, completedAt: safeISOString() }
            : quest
        ),
        gameStats: {
          ...state.gameStats,
          totalQuestsCompleted: state.gameStats.totalQuestsCompleted + 1
        }
      };

    case 'UPDATE_COMPANION':
      return {
        ...state,
        companion: action.payload
      };

    case 'EVOLVE_COMPANION':
      if (!state.companion) return state;
      return {
        ...state,
        companion: {
          ...state.companion,
          evolution: {
            ...state.companion.evolution,
            stage: Math.min(state.companion.evolution.stage + 1, 5)
          }
        },
        gameStats: {
          ...state.gameStats,
          companionLevel: state.companion.level + 1
        }
      };

    case 'PURCHASE_ITEM':
      const item = state.storeItems.find(item => item.id === action.payload);
      if (!item || state.gameStats.coins < item.price) return state;
      
      return {
        ...state,
        storeItems: state.storeItems.map(storeItem =>
          storeItem.id === action.payload
            ? { ...storeItem, isPurchased: true }
            : storeItem
        ),
        purchases: [...state.purchases, {
          id: `purchase_${Date.now()}`,
          itemId: action.payload,
          userId: 'current_user',
          price: item.price,
          purchasedAt: safeISOString()
        }],
        gameStats: {
          ...state.gameStats,
          coins: state.gameStats.coins - item.price,
          itemsPurchased: state.gameStats.itemsPurchased + 1
        }
      };

    case 'EQUIP_ITEM':
      return {
        ...state,
        storeItems: state.storeItems.map(item =>
          item.id === action.payload
            ? { ...item, isEquipped: true }
            : { ...item, isEquipped: false } // Unequip others in same category
        ),
        gameStats: {
          ...state.gameStats,
          equippedItems: [...state.gameStats.equippedItems.filter(id => id !== action.payload), action.payload]
        }
      };

    case 'UNLOCK_ITEM':
      return {
        ...state,
        storeItems: state.storeItems.map(item =>
          item.id === action.payload
            ? { ...item, isUnlocked: true }
            : item
        )
      };

    case 'FORCE_UPDATE':
      // Force a re-render by creating a new state object
      return {
        ...state,
        loading: false // Ensure loading is false after data load
      };

    default:
      return state;
  }
}

export interface GameContextType {
  // State
  reflections: AccountabilityReflection[];
  shadowChallenges: ShadowSelf[];
  gameStats: EnhancedGameStats;
  dailyPrediction: DailyPrediction | null;
  todaysShadow: ShadowSelf | null;
  loading: boolean;
  
  // Phase 1 Features
  quests: Quest[];
  companion: ProductivityCompanion | null;
  storeItems: StoreItem[];
  purchases: Purchase[];
  
  // Shadow Mode & Day Streak
  shadowMode: ShadowModeState;
  dayStreak: DayStreakState;
  shadowSessions: ShadowSession[];

  // Actions
  addReflection: (reflection: Omit<AccountabilityReflection, 'id' | 'createdAt'>) => void;
  updateReflection: (reflection: AccountabilityReflection) => void;
  createShadowChallenge: (prediction: DailyPrediction) => void;
  completeShadowDuel: (actualTasks: number, actualFocusTime: number) => DuelResult | null;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  generateDailyPrediction: (pastTasks: any[], pastFocusTime: number[]) => DailyPrediction;
  getTodaysReflection: () => AccountabilityReflection | null;
  getReflectionStreak: () => number;
  calculateDuelResult: (predicted: DailyPrediction, actual: { tasks: number; focusTime: number }) => DuelResult;
  
  // Phase 1 Actions
  createQuest: (quest: Quest) => void;
  updateQuest: (quest: Quest) => void;
  completeQuest: (questId: string) => void;
  updateCompanion: (companion: ProductivityCompanion) => void;
  evolveCompanion: () => void;
  purchaseItem: (itemId: string) => void;
  equipItem: (itemId: string) => void;
  unlockItem: (itemId: string) => void;
  
  // Shadow Mode Actions
  toggleShadowMode: (enabled: boolean) => void;
  startShadowSession: (duration: number, taskId?: string, taskTitle?: string) => void;
  endShadowSession: (completed: boolean, exitedEarly: boolean) => void;
  recordShadowWin: () => void;
  recordShadowLoss: () => void;
  
  // Day Streak Actions
  updateDayStreak: () => void;
  saveStreakWithCoins: () => boolean;
  resetDayStreak: () => void;
  completeDailyGoal: () => void;
  checkDailyProgress: () => boolean;
  
  // Computed properties
  tasks: number;
  focusTime: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Safely get context states with fallbacks
  let taskState: any = { tasks: [], addTask: () => {}, updateTask: () => {} };
  let timerState: any = { isRunning: false, timeLeft: 0 };
  
  try {
    const taskContext = useTasks();
    if (taskContext) taskState = taskContext.state;
  } catch (error) {
    console.warn('TaskContext not available in GameProvider');
  }
  
  try {
    const timerContext = useTimer();
    if (timerContext) timerState = timerContext.state;
  } catch (error) {
    console.warn('TimerContext not available in GameProvider');
  }
  
  const storage = GamificationStorage.getInstance();
  const timerIntegration = GamificationTimerIntegration.getInstance();
  const integrationService = GamificationIntegrationService.getInstance();

  // Load game data from localStorage on mount - only once
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization
    
    const loadGameData = async () => {
      try {
        console.log('🔄 Loading gamification data from storage...');
        
        // Initialize storage first
        await storage.initialize();
        
        // Load game stats (including coins) first
        const gameStats = await storage.loadGameStats();
        if (gameStats) {
          console.log('💰 Loaded game stats:', gameStats);
          dispatch({ type: 'UPDATE_GAME_STATS', payload: gameStats });
        } else {
          console.log('💰 No saved game stats found, using defaults');
        }
        
        // Load reflections and challenges
        const reflectionsData = await storage.loadReflectionsAndChallenges();
        if (reflectionsData.reflections && reflectionsData.reflections.length > 0) {
          reflectionsData.reflections.forEach((reflection: AccountabilityReflection) => {
            dispatch({ type: 'ADD_REFLECTION', payload: reflection });
          });
        }
        
        if (reflectionsData.challenges && reflectionsData.challenges.length > 0) {
          reflectionsData.challenges.forEach((challenge: ShadowSelf) => {
            dispatch({ type: 'CREATE_SHADOW_CHALLENGE', payload: challenge });
          });
        }
        
        // Load quests
        const quests = await storage.loadQuests();
        if (quests && quests.length > 0) {
          quests.forEach((quest: any) => {
            dispatch({ type: 'CREATE_QUEST', payload: quest });
          });
        }
        
        // Load companion
        const companion = await storage.loadCompanion();
        if (companion) {
          dispatch({ type: 'UPDATE_COMPANION', payload: companion });
        }
        
        // Load store data
        const storeData = await storage.loadStore();
        if (storeData.items && storeData.items.length > 0) {
          storeData.items.forEach((item: any) => {
            if (item.isUnlocked) {
              dispatch({ type: 'UNLOCK_ITEM', payload: item.id });
            }
          });
        }
        
        // Load shadow mode state
        const shadowData = await storage.loadShadowMode();
        console.log('🥷 Loading shadow data:', shadowData);
        if (shadowData.shadowMode) {
          // Restore full shadow mode state including wins/losses
          dispatch({ 
            type: 'LOAD_SHADOW_MODE', 
            payload: {
              shadowMode: shadowData.shadowMode,
              shadowSessions: shadowData.sessions || []
            }
          });
          console.log('✅ Shadow mode restored:', shadowData.shadowMode);
        }
        
        // Load day streak
        const dayStreak = await storage.loadDayStreak();
        if (dayStreak) {
          dispatch({ type: 'UPDATE_DAY_STREAK', payload: null });
        }
        
        // Force UI update after all data is loaded
        setTimeout(() => {
          dispatch({ type: 'FORCE_UPDATE', payload: null });
          console.log('✅ GameContext: All data loaded, UI force updated');
        }, 100);
        
        // Initialize integration service after data is loaded
        setTimeout(() => {
          const gameActions = {
            // Game actions
            addXP: (amount: number) => dispatch({ type: 'ADD_XP', payload: amount }),
            addCoins: (amount: number) => dispatch({ type: 'ADD_COINS', payload: amount }),
            updateQuest: (quest: any) => dispatch({ type: 'UPDATE_QUEST', payload: quest }),
            completeQuest: (questId: string) => dispatch({ type: 'COMPLETE_QUEST', payload: questId }),
            updateDayStreak: () => dispatch({ type: 'UPDATE_DAY_STREAK', payload: null }),
            // Shadow Mode functions
            startShadowSession: (duration: number, taskId?: string, taskTitle?: string) => 
              dispatch({ type: 'START_SHADOW_SESSION', payload: { duration, taskId, taskTitle } }),
            endShadowSession: (completed: boolean, exitedEarly: boolean) => 
              dispatch({ type: 'END_SHADOW_SESSION', payload: { completed, exitedEarly } }),
            recordShadowWin: () => dispatch({ type: 'SHADOW_WIN', payload: null }),
            recordShadowLoss: () => dispatch({ type: 'SHADOW_LOSS', payload: null }),
            // State access
            quests: state.quests,
            companion: state.companion,
            shadowMode: state.shadowMode
          };
          
          const taskActions = {
            // Task actions
            addTask: taskState.addTask,
            updateTask: taskState.updateTask,
            getTasks: () => taskState.tasks,
            getTask: (id: string) => taskState.tasks.find(t => t.id === id)
          };
          
          // Initialize both services
          integrationService.initialize(gameActions, taskActions);
          timerIntegration.initialize(gameActions, taskActions);
          
          console.log('✅ Timer integration and scheduled task monitoring initialized!');
        }, 100);
        
        // Force a state update to trigger UI re-render
        dispatch({ type: 'FORCE_UPDATE', payload: null });
        
        // Mark as initialized to prevent re-loading
        setIsInitialized(true);
        console.log('✅ Gamification data loading complete!');
        console.log('📊 Final loaded state:', {
          coins: gameStats?.coins || 0,
          totalXP: gameStats?.totalXP || 0,
          shadowWins: shadowData?.shadowMode?.totalShadowWins || 0,
          shadowLosses: shadowData?.shadowMode?.totalShadowLosses || 0,
          quests: quests?.length || 0
        });
        
      } catch (error) {
        console.error('❌ Error loading game data:', error);
        setIsInitialized(true); // Still mark as initialized to prevent infinite retries
      }
    };

    loadGameData();
  }, [isInitialized]);

  // Save game data using GamificationStorage when state changes
  useEffect(() => {
    // Save reflections and challenges together
    storage.saveReflectionsAndChallenges(state.reflections, state.shadowChallenges, state.dailyPrediction);
  }, [state.reflections, state.shadowChallenges, state.dailyPrediction, storage]);

  useEffect(() => {
    // This is critical for coin persistence!
    storage.saveGameStats(state.gameStats);
    console.log('💰 Game stats saved:', state.gameStats); // Debug log
  }, [state.gameStats, storage]);
  
  useEffect(() => {
    storage.saveQuests(state.quests);
  }, [state.quests, storage]);
  
  useEffect(() => {
    if (state.companion) {
      storage.saveCompanion(state.companion);
    }
  }, [state.companion, storage]);
  
  useEffect(() => {
    // Save shadow mode with sessions
    storage.saveShadowMode(state.shadowMode, state.shadowSessions);
  }, [state.shadowMode, state.shadowSessions, storage]);
  
  useEffect(() => {
    storage.saveDayStreak(state.dayStreak);
  }, [state.dayStreak, storage]);

  const addReflection = useCallback((reflectionData: Omit<AccountabilityReflection, 'id' | 'createdAt'>) => {
    const reflection: AccountabilityReflection = {
      ...reflectionData,
      id: `reflection-${Date.now()}`,
      createdAt: safeISOString()
    };
    
    dispatch({ type: 'ADD_REFLECTION', payload: reflection });
    toast({
      title: "Reflection Added",
      description: "Your daily reflection has been saved.",
    });
  }, []);

  const updateReflection = useCallback((reflection: AccountabilityReflection) => {
    dispatch({ type: 'UPDATE_REFLECTION', payload: reflection });
  }, []);

  const generateDailyPrediction = useCallback((pastTasks: any[], pastFocusTime: number[]): DailyPrediction => {
    const recentDays = 7; // Use last 7 days for prediction
    const recentTasks = pastTasks.slice(-recentDays);
    const recentFocus = pastFocusTime.slice(-recentDays);
    
    const avgTasks = recentTasks.length > 0 ? 
      recentTasks.reduce((sum, day) => sum + day.completed, 0) / recentTasks.length : 3;
    
    const avgFocus = recentFocus.length > 0 ? 
      recentFocus.reduce((sum, time) => sum + time, 0) / recentFocus.length : 120;
    
    const confidence = Math.min(recentTasks.length / recentDays, 1);
    
    return {
      tasksToComplete: Math.max(1, Math.round(avgTasks)),
      focusTimeMinutes: Math.max(30, Math.round(avgFocus)),
      basedOnDays: recentTasks.length,
      confidence
    };
  }, []);

  const createShadowChallenge = useCallback((prediction: DailyPrediction) => {
    const today = safeTodayString();
    
    const shadowChallenge: ShadowSelf = {
      id: `shadow-${Date.now()}`,
      date: today,
      predictedTasks: prediction.tasksToComplete,
      predictedFocusTime: prediction.focusTimeMinutes,
      actualTasks: 0,
      actualFocusTime: 0,
      userWon: false,
      score: 0,
      createdAt: safeISOString()
    };
    
    dispatch({ type: 'CREATE_SHADOW_CHALLENGE', payload: shadowChallenge });
    dispatch({ type: 'SET_DAILY_PREDICTION', payload: prediction });
    
    toast({
      title: "Shadow Challenge Created",
      description: `Your shadow predicts ${prediction.tasksToComplete} tasks and ${prediction.focusTimeMinutes} minutes of focus time.`,
    });
  }, []);

  const calculateDuelResult = useCallback((predicted: DailyPrediction, actual: { tasks: number; focusTime: number }): DuelResult => {
    const taskScore = (actual.tasks / predicted.tasksToComplete) * 100;
    const focusScore = (actual.focusTime / predicted.focusTimeMinutes) * 100;
    const overallScore = (taskScore + focusScore) / 2;
    
    return {
      userScore: Math.round(overallScore),
      shadowScore: 100,
      winner: overallScore >= 100 ? 'user' : overallScore >= 90 ? 'tie' : 'shadow',
      category: 'overall'
    };
  }, []);

  const completeShadowDuel = useCallback((actualTasks: number, actualFocusTime: number): DuelResult | null => {
    if (!state.todaysShadow || !state.dailyPrediction) return null;
    
    const duelResult = calculateDuelResult(state.dailyPrediction, { tasks: actualTasks, focusTime: actualFocusTime });
    
    const completedShadow: ShadowSelf = {
      ...state.todaysShadow,
      actualTasks,
      actualFocusTime,
      userWon: duelResult.winner === 'user',
      score: duelResult.userScore
    };
    
    dispatch({ type: 'COMPLETE_SHADOW_DUEL', payload: completedShadow });
    
    // Award XP and coins based on performance
    const xpReward = Math.max(10, Math.round(duelResult.userScore / 10));
    const coinReward = duelResult.winner === 'user' ? 50 : duelResult.winner === 'tie' ? 25 : 10;
    
    dispatch({ type: 'ADD_XP', payload: xpReward });
    dispatch({ type: 'ADD_COINS', payload: coinReward });
    
    if (duelResult.winner === 'user') {
      dispatch({ type: 'INCREMENT_STREAK', payload: null });
    }
    
    toast({
      title: duelResult.winner === 'user' ? "Victory!" : duelResult.winner === 'tie' ? "Draw!" : "Shadow Wins",
      description: `You scored ${duelResult.userScore}%. Earned ${xpReward} XP and ${coinReward} coins.`,
    });
    
    return duelResult;
  }, [state.todaysShadow, state.dailyPrediction, calculateDuelResult]);

  const addXP = useCallback((amount: number) => {
    dispatch({ type: 'ADD_XP', payload: amount });
  }, []);

  const addCoins = useCallback((amount: number) => {
    dispatch({ type: 'ADD_COINS', payload: amount });
  }, []);

  const incrementStreak = useCallback(() => {
    dispatch({ type: 'INCREMENT_STREAK', payload: null });
  }, []);

  const resetStreak = useCallback(() => {
    dispatch({ type: 'RESET_STREAK', payload: null });
  }, []);

  const getTodaysReflection = useCallback((): AccountabilityReflection | null => {
    const today = safeTodayString();
    return state.reflections.find(r => r.date.startsWith(today)) || null;
  }, [state.reflections]);

  const getReflectionStreak = useCallback((): number => {
    let streak = 0;
    const sortedReflections = [...state.reflections].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    for (let i = 0; i < sortedReflections.length; i++) {
      const reflectionDate = new Date(sortedReflections[i].date);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (reflectionDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [state.reflections]);

  // Phase 1 Functions
  const createQuest = useCallback((quest: Quest) => {
    dispatch({ type: 'CREATE_QUEST', payload: quest });
  }, []);

  const updateQuest = useCallback((quest: Quest) => {
    dispatch({ type: 'UPDATE_QUEST', payload: quest });
  }, []);

  const completeQuest = useCallback((questId: string) => {
    dispatch({ type: 'COMPLETE_QUEST', payload: questId });
  }, []);

  const updateCompanion = useCallback((companion: ProductivityCompanion) => {
    dispatch({ type: 'UPDATE_COMPANION', payload: companion });
  }, []);

  const evolveCompanion = useCallback(() => {
    dispatch({ type: 'EVOLVE_COMPANION', payload: null });
  }, []);

  const purchaseItem = useCallback((itemId: string) => {
    dispatch({ type: 'PURCHASE_ITEM', payload: itemId });
  }, []);

  const equipItem = useCallback((itemId: string) => {
    dispatch({ type: 'EQUIP_ITEM', payload: itemId });
  }, []);

  const unlockItem = useCallback((itemId: string) => {
    dispatch({ type: 'UNLOCK_ITEM', payload: itemId });
  }, []);

  // Shadow Mode Functions
  const toggleShadowMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_SHADOW_MODE', payload: enabled });
  }, []);

  const startShadowSession = useCallback((duration: number, taskId?: string, taskTitle?: string) => {
    dispatch({ 
      type: 'START_SHADOW_SESSION', 
      payload: { duration, taskId, taskTitle } 
    });
  }, []);

  const endShadowSession = useCallback((completed: boolean, exitedEarly: boolean) => {
    dispatch({ 
      type: 'END_SHADOW_SESSION', 
      payload: { completed, exitedEarly } 
    });
  }, []);

  const recordShadowWin = useCallback(() => {
    dispatch({ type: 'SHADOW_WIN', payload: null });
  }, []);

  const recordShadowLoss = useCallback(() => {
    dispatch({ type: 'SHADOW_LOSS', payload: null });
  }, []);

  // Day Streak Functions
  const updateDayStreak = useCallback(() => {
    dispatch({ type: 'UPDATE_DAY_STREAK', payload: null });
  }, []);

  const saveStreakWithCoins = useCallback((): boolean => {
    if (state.gameStats.coins >= state.dayStreak.streakSaveCost) {
      dispatch({ type: 'SAVE_STREAK_WITH_COINS', payload: null });
      return true;
    }
    return false;
  }, [state.gameStats.coins, state.dayStreak.streakSaveCost]);

  const resetDayStreak = useCallback(() => {
    dispatch({ type: 'RESET_DAY_STREAK', payload: null });
  }, []);

  const completeDailyGoal = useCallback(() => {
    dispatch({ type: 'COMPLETE_DAILY_GOAL', payload: null });
  }, []);

  const checkDailyProgress = useCallback((): boolean => {
    const today = safeTodayString();
    return state.dayStreak.lastActiveDate === today || state.dayStreak.todayCompleted;
  }, [state.dayStreak.lastActiveDate, state.dayStreak.todayCompleted]);

  const value = useMemo(() => ({
    // State
    ...state,
    // Actions
    addReflection,
    updateReflection,
    createShadowChallenge,
    completeShadowDuel,
    addXP,
    addCoins,
    incrementStreak,
    resetStreak,
    generateDailyPrediction,
    getTodaysReflection,
    getReflectionStreak,
    calculateDuelResult,
    // Phase 1 Actions
    createQuest,
    updateQuest,
    completeQuest,
    updateCompanion,
    evolveCompanion,
    purchaseItem,
    equipItem,
    unlockItem,
    // Shadow Mode Actions
    toggleShadowMode,
    startShadowSession,
    endShadowSession,
    recordShadowWin,
    recordShadowLoss,
    // Day Streak Actions
    updateDayStreak,
    saveStreakWithCoins,
    resetDayStreak,
    completeDailyGoal,
    checkDailyProgress,
    // Computed properties
    tasks: 0, // Will be updated with real task integration
    focusTime: 0 // Will be updated with real timer integration
  }), [
    state,
    addReflection,
    updateReflection,
    createShadowChallenge,
    completeShadowDuel,
    addXP,
    addCoins,
    incrementStreak,
    resetStreak,
    generateDailyPrediction,
    getTodaysReflection,
    getReflectionStreak,
    calculateDuelResult,
    createQuest,
    updateQuest,
    completeQuest,
    updateCompanion,
    evolveCompanion,
    purchaseItem,
    equipItem,
    unlockItem,
    toggleShadowMode,
    startShadowSession,
    endShadowSession,
    recordShadowWin,
    recordShadowLoss,
    updateDayStreak,
    saveStreakWithCoins,
    resetDayStreak,
    completeDailyGoal,
    checkDailyProgress
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
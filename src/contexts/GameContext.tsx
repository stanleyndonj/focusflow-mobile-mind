import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { 
  AccountabilityReflection, 
  ShadowSelf, 
  GameStats, 
  DailyPrediction,
  DuelResult,
  GameTask 
} from '@/types/GameTypes';

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
    | 'SET_DAILY_PREDICTION';
  payload: any;
}

interface GameState {
  reflections: AccountabilityReflection[];
  shadowChallenges: ShadowSelf[];
  gameStats: GameStats;
  dailyPrediction: DailyPrediction | null;
  todaysShadow: ShadowSelf | null;
  loading: boolean;
}

const initialGameStats: GameStats = {
  totalXP: 0,
  level: 1,
  coins: 0,
  streak: 0,
  totalReflections: 0,
  shadowWins: 0,
  shadowLosses: 0,
  shadowTies: 0,
  averageMood: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const initialState: GameState = {
  reflections: [],
  shadowChallenges: [],
  gameStats: initialGameStats,
  dailyPrediction: null,
  todaysShadow: null,
  loading: false
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
          updatedAt: new Date().toISOString()
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
          updatedAt: new Date().toISOString()
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
          updatedAt: new Date().toISOString()
        }
      };

    case 'ADD_COINS':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          coins: state.gameStats.coins + action.payload,
          updatedAt: new Date().toISOString()
        }
      };

    case 'INCREMENT_STREAK':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          streak: state.gameStats.streak + 1,
          updatedAt: new Date().toISOString()
        }
      };

    case 'RESET_STREAK':
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          streak: 0,
          updatedAt: new Date().toISOString()
        }
      };

    case 'SET_DAILY_PREDICTION':
      return {
        ...state,
        dailyPrediction: action.payload
      };

    default:
      return state;
  }
}

export interface GameContextType {
  // State
  reflections: AccountabilityReflection[];
  shadowChallenges: ShadowSelf[];
  gameStats: GameStats;
  dailyPrediction: DailyPrediction | null;
  todaysShadow: ShadowSelf | null;
  loading: boolean;

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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load game data from localStorage on mount
  useEffect(() => {
    const loadGameData = () => {
      try {
        const savedReflections = localStorage.getItem('focusflow-reflections');
        const savedShadowChallenges = localStorage.getItem('focusflow-shadow-challenges');
        const savedGameStats = localStorage.getItem('focusflow-game-stats');
        
        if (savedReflections) {
          const reflections = JSON.parse(savedReflections);
          reflections.forEach((reflection: AccountabilityReflection) => {
            dispatch({ type: 'ADD_REFLECTION', payload: reflection });
          });
        }
        
        if (savedShadowChallenges) {
          const challenges = JSON.parse(savedShadowChallenges);
          challenges.forEach((challenge: ShadowSelf) => {
            dispatch({ type: 'CREATE_SHADOW_CHALLENGE', payload: challenge });
          });
        }
        
        if (savedGameStats) {
          const stats = JSON.parse(savedGameStats);
          dispatch({ type: 'UPDATE_GAME_STATS', payload: stats });
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };

    loadGameData();
  }, []);

  // Save game data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('focusflow-reflections', JSON.stringify(state.reflections));
  }, [state.reflections]);

  useEffect(() => {
    localStorage.setItem('focusflow-shadow-challenges', JSON.stringify(state.shadowChallenges));
  }, [state.shadowChallenges]);

  useEffect(() => {
    localStorage.setItem('focusflow-game-stats', JSON.stringify(state.gameStats));
  }, [state.gameStats]);

  const addReflection = useCallback((reflectionData: Omit<AccountabilityReflection, 'id' | 'createdAt'>) => {
    const reflection: AccountabilityReflection = {
      ...reflectionData,
      id: `reflection-${Date.now()}`,
      createdAt: new Date().toISOString()
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
    const today = new Date().toISOString().split('T')[0];
    
    const shadowChallenge: ShadowSelf = {
      id: `shadow-${Date.now()}`,
      date: today,
      predictedTasks: prediction.tasksToComplete,
      predictedFocusTime: prediction.focusTimeMinutes,
      actualTasks: 0,
      actualFocusTime: 0,
      userWon: false,
      score: 0,
      createdAt: new Date().toISOString()
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
    const today = new Date().toISOString().split('T')[0];
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

  const value = useMemo(() => ({
    // State
    reflections: state.reflections,
    shadowChallenges: state.shadowChallenges,
    gameStats: state.gameStats,
    dailyPrediction: state.dailyPrediction,
    todaysShadow: state.todaysShadow,
    loading: state.loading,

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
    calculateDuelResult
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
    calculateDuelResult
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
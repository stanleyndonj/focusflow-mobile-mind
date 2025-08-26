/**
 * useHabitTracker Hook - Core habit tracking logic
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { Habit, NewHabit, Recommendation, HabitStats, DayOfWeek } from '../types/habit';
import { habitStorage } from '../utils/habitStorage';

type HabitAction =
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: { id: string; habit: Habit } }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'LOG_HABIT'; payload: { id: string; date: string; value: number } }
  | { type: 'UPDATE_STATS'; payload: { id: string; stats: HabitStats } };

function habitReducer(state: Habit[], action: HabitAction): Habit[] {
  switch (action.type) {
    case 'SET_HABITS':
      return action.payload;
    case 'ADD_HABIT':
      return [...state, action.payload];
    case 'UPDATE_HABIT':
      return state.map(h => h.id === action.payload.id ? action.payload.habit : h);
    case 'DELETE_HABIT':
      return state.filter(h => h.id !== action.payload);
    case 'LOG_HABIT':
      return state.map(habit => {
        if (habit.id === action.payload.id) {
          let updates: any = {
            logs: { ...habit.logs, [action.payload.date]: action.payload.value },
            updatedAt: new Date().toISOString()
          };
          
          // Handle bad habit specific tracking
          if (habit.type === 'bad') {
            const now = new Date();
            updates.timestamps = { ...habit.timestamps, [action.payload.date]: now.toISOString() };
            
            if (action.payload.value > 0 && action.payload.breakReason) {
              // Habit was broken - reset avoided streak and add break reason
              updates.avoidedStreak = 0;
              updates.breakReasons = [...(habit.breakReasons || []), action.payload.breakReason];
            } else if (action.payload.value === 0) {
              // Habit was avoided - increment streak
              const currentStreak = (habit.avoidedStreak || 0) + 1;
              updates.avoidedStreak = currentStreak;
              updates.bestAvoidedStreak = Math.max(currentStreak, habit.bestAvoidedStreak || 0);
            }
          }
          
          return { ...habit, ...updates };
        }
        return habit;
      });
    case 'UPDATE_STATS':
      return state.map(h => h.id === action.payload.id ? { ...h, stats: action.payload.stats } : h);
    default:
      return state;
  }
}

// Helper functions
const getDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
};

const isScheduledDay = (date: Date, schedule?: DayOfWeek[]): boolean => {
  if (!schedule || schedule.length === 0) return true;
  return schedule.includes(getDayOfWeek(date));
};

const getDateString = (date: Date | string): string => {
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export function useHabitTracker() {
  const [habits, dispatch] = useReducer(habitReducer, []);
  const updateTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const stored = habitStorage.getHabits();
    dispatch({ type: 'SET_HABITS', payload: stored });
  }, []);

  useEffect(() => {
    habitStorage.setHabits(habits);
  }, [habits]);

  const getHabits = useCallback((): Habit[] => habits, [habits]);

  const addHabit = useCallback((habitInput: NewHabit): Habit => {
    const newHabit: Habit = {
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...habitInput,
      logs: {},
      stats: {
        currentStreak: 0,
        bestStreak: 0,
        consistency: 0,
        score: 0,
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_HABIT', payload: newHabit });
    return newHabit;
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Habit>): void => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const updated = { ...habit, ...patch, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_HABIT', payload: { id, habit: updated } });
    queueStatsUpdate(id);
  }, [habits]);

  const deleteHabit = useCallback((id: string): void => {
    dispatch({ type: 'DELETE_HABIT', payload: id });
  }, []);

  const logHabit = useCallback((habitId: string, date: string, value: number | boolean, breakReason?: any) => {
    const numValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
    dispatch({ type: 'LOG_HABIT', payload: { id: habitId, date, value: numValue, breakReason } });
    queueStatsUpdate(habitId);
  }, []);

  const calculateStreak = useCallback((habit: Habit, asOf?: string): number => {
    const endDate = asOf ? new Date(asOf) : new Date();
    let currentStreak = 0;
    let checkDate = new Date(endDate);

    while (currentStreak < 365) {
      const dateStr = getDateString(checkDate);
      if (!isScheduledDay(checkDate, habit.schedule)) {
        checkDate = addDays(checkDate, -1);
        continue;
      }

      const logValue = habit.logs[dateStr];
      const hasCompleted = habit.type === 'good'
        ? (logValue !== undefined && logValue > 0)
        : (logValue === undefined || logValue === 0);

      if (hasCompleted) {
        currentStreak++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    }
    return currentStreak;
  }, []);

  const calculateConsistency = useCallback((habit: Habit, days: number = 30, asOf?: string): number => {
    const endDate = asOf ? new Date(asOf) : new Date();
    const startDate = addDays(endDate, -days + 1);
    let scheduledDays = 0;
    let completedDays = 0;

    for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
      if (!isScheduledDay(d, habit.schedule)) continue;
      scheduledDays++;
      const dateStr = getDateString(d);
      const logValue = habit.logs[dateStr];

      if (habit.type === 'good') {
        if (habit.trackMode === 'binary' && logValue === 1) completedDays++;
        else if (habit.trackMode === 'count' && logValue >= (habit.target.times || 1)) completedDays++;
        else if (habit.trackMode === 'duration' && logValue >= (habit.target.minutes || 0)) completedDays++;
      } else {
        if (logValue === undefined || logValue === 0) completedDays++;
      }
    }
    return scheduledDays > 0 ? completedDays / scheduledDays : 0;
  }, []);

  const updateHabitScore = useCallback((habit: Habit): number => {
    const settings = habitStorage.getSettings();
    const alpha = settings?.alpha || 0.25;
    const streakMultiplier = settings?.streakMultiplier || 0.02;
    const today = getDateString(new Date());
    const todayValue = habit.logs[today];
    
    let todayMet = 0;
    if (habit.type === 'good') {
      if (habit.trackMode === 'binary') todayMet = todayValue === 1 ? 1 : 0;
      else if (habit.trackMode === 'count') todayMet = (todayValue || 0) >= (habit.target.times || 1) ? 1 : 0;
      else if (habit.trackMode === 'duration') todayMet = (todayValue || 0) >= (habit.target.minutes || 0) ? 1 : 0;
    } else {
      todayMet = (todayValue === undefined || todayValue === 0) ? 1 : 0;
    }

    const previousScore = habit.stats.score || 0;
    const baseScore = alpha * todayMet + (1 - alpha) * previousScore;
    const currentStreak = calculateStreak(habit);
    const streakBonus = Math.min(0.25, currentStreak * streakMultiplier);
    return Math.min(1, baseScore + streakBonus);
  }, [calculateStreak]);

  const getRecommendations = useCallback((habitList: Habit[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    let priority = 10;

    habitList.forEach(habit => {
      const consistency = calculateConsistency(habit);
      const streak = calculateStreak(habit);

      if (consistency < 0.3) {
        recommendations.push({
          id: `rec-low-${habit.id}`,
          title: `Struggling with "${habit.title}"`,
          description: `${Math.round(consistency * 100)}% consistency. Consider adjusting targets.`,
          type: 'warning',
          habitId: habit.id,
          priority: priority--
        });
      }

      if (streak > 7 && streak % 7 === 0) {
        recommendations.push({
          id: `rec-streak-${habit.id}`,
          title: `${streak}-day streak!`,
          description: habit.title,
          type: 'achievement',
          habitId: habit.id,
          priority: priority--
        });
      }
    });

    if (habitList.length === 0) {
      recommendations.push({
        id: 'rec-start',
        title: 'Start your habit journey!',
        description: 'Add your first habit to begin tracking.',
        type: 'suggestion',
        priority: 10
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }, [calculateConsistency, calculateStreak]);

  const queueStatsUpdate = useCallback((habitId: string) => {
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const newStats: HabitStats = {
        currentStreak: calculateStreak(habit),
        bestStreak: Math.max(habit.stats.bestStreak || 0, calculateStreak(habit)),
        consistency: calculateConsistency(habit),
        score: updateHabitScore(habit),
        lastUpdated: new Date().toISOString()
      };
      dispatch({ type: 'UPDATE_STATS', payload: { id: habitId, stats: newStats } });
    }, 100);
  }, [habits, calculateStreak, calculateConsistency, updateHabitScore]);

  return {
    habits,
    getHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    logHabit,
    calculateStreak,
    calculateConsistency,
    updateHabitScore,
    getRecommendations
  };
}

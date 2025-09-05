/**
 * useHabitTracker Hook - Core habit tracking logic
 */

import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
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
              // Habit was broken - add break reason
              updates.breakReasons = [...(habit.breakReasons || []), action.payload.breakReason];
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
  const midnightTimerRef = useRef<NodeJS.Timeout>();
  const hasHydratedStatsRef = useRef<boolean>(false);

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
    const today = new Date().toISOString().split('T')[0];
    const endDateStr = getDateString(endDate);
    const createdDate = new Date(habit.createdAt);
    const createdDateStr = getDateString(createdDate);
    let currentStreak = 0;
    let checkDate = new Date(endDate);

    // For current streak calculation:
    // If today isn't logged yet, skip counting today for BOTH good and bad habits
    if (!asOf && endDateStr === today) {
      const todayValue = habit.logs[today];
      const shouldSkipToday = todayValue === undefined;
      if (shouldSkipToday) {
        checkDate = addDays(checkDate, -1);
      }
    }

    while (currentStreak < 365) {
      const dateStr = getDateString(checkDate);
      // Do not count days before the habit existed
      if (dateStr < createdDateStr) break;
      if (!isScheduledDay(checkDate, habit.schedule)) {
        checkDate = addDays(checkDate, -1);
        continue;
      }

      const logValue = habit.logs[dateStr];
      let hasCompleted = false;
      
      if (habit.type === 'good') {
        if (habit.trackMode === 'binary') {
          hasCompleted = logValue === 1;
        } else if (habit.trackMode === 'count') {
          hasCompleted = (logValue || 0) >= (habit.target.times || 1);
        } else if (habit.trackMode === 'duration') {
          hasCompleted = (logValue || 0) >= (habit.target.minutes || 0);
        }
      } else {
        // Bad habit: completed means explicitly avoided (log exists and is 0)
        hasCompleted = (logValue !== undefined && logValue === 0);
      }

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
    const createdDate = new Date(habit.createdAt);
    const createdDateStr = getDateString(createdDate);
    let scheduledDays = 0;
    let completedDays = 0;

    for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
      // Skip days before habit existed
      if (getDateString(d) < createdDateStr) continue;
      if (!isScheduledDay(d, habit.schedule)) continue;
      scheduledDays++;
      const dateStr = getDateString(d);
      const logValue = habit.logs[dateStr];

      if (habit.type === 'good') {
        if (habit.trackMode === 'binary' && logValue === 1) completedDays++;
        else if (habit.trackMode === 'count' && logValue >= (habit.target.times || 1)) completedDays++;
        else if (habit.trackMode === 'duration' && logValue >= (habit.target.minutes || 0)) completedDays++;
      } else {
        if (logValue !== undefined && logValue === 0) completedDays++;
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
      todayMet = (todayValue !== undefined && todayValue === 0) ? 1 : 0;
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
      // Get fresh habit data from current state
      const currentHabits = getHabits();
      const habit = currentHabits.find(h => h.id === habitId);
      if (!habit) return;

      const currentStreak = calculateStreak(habit);
      const newStats: HabitStats = {
        currentStreak,
        bestStreak: Math.max(habit.stats.bestStreak || 0, currentStreak),
        consistency: calculateConsistency(habit),
        score: updateHabitScore(habit),
        lastUpdated: new Date().toISOString(),
        totalCompletions: Object.values(habit.logs).filter(v => {
          if (habit.type === 'good') {
            if (habit.trackMode === 'binary') return v === 1;
            if (habit.trackMode === 'count') return v >= (habit.target.times || 1);
            if (habit.trackMode === 'duration') return v >= (habit.target.minutes || 0);
          } else {
            return v === 0;
          }
          return false;
        }).length,
        averageValue: Object.values(habit.logs).length > 0 
          ? Object.values(habit.logs).reduce((a, b) => a + (b || 0), 0) / Object.values(habit.logs).length 
          : 0
      };
      
      // Update avoided streak for bad habits
      if (habit.type === 'bad') {
        const updatedHabit = {
          ...habit,
          avoidedStreak: currentStreak,
          bestAvoidedStreak: Math.max(habit.bestAvoidedStreak || 0, currentStreak)
        };
        dispatch({ type: 'UPDATE_HABIT', payload: { id: habitId, habit: updatedHabit } });
      }
      
      dispatch({ type: 'UPDATE_STATS', payload: { id: habitId, stats: newStats } });
    }, 10); // Reduced timeout for faster updates
  }, [getHabits, calculateStreak, calculateConsistency, updateHabitScore]);

  // Recompute stats for all habits (used on app load and at midnight)
  const recomputeAllStats = useCallback(() => {
    const currentHabits = getHabits();
    currentHabits.forEach(h => {
      const currentStreak = calculateStreak(h);
      const newStats: HabitStats = {
        currentStreak,
        bestStreak: Math.max(h.stats.bestStreak || 0, currentStreak),
        consistency: calculateConsistency(h),
        score: updateHabitScore(h),
        lastUpdated: new Date().toISOString(),
        totalCompletions: Object.values(h.logs).filter(v => {
          if (h.type === 'good') {
            if (h.trackMode === 'binary') return v === 1;
            if (h.trackMode === 'count') return v >= (h.target.times || 1);
            if (h.trackMode === 'duration') return v >= (h.target.minutes || 0);
          } else {
            return v === 0;
          }
          return false;
        }).length,
        averageValue: Object.values(h.logs).length > 0 
          ? Object.values(h.logs).reduce((a, b) => a + (b || 0), 0) / Object.values(h.logs).length 
          : 0
      };

      if (h.type === 'bad') {
        const updatedHabit = {
          ...h,
          avoidedStreak: currentStreak,
          bestAvoidedStreak: Math.max(h.bestAvoidedStreak || 0, currentStreak)
        };
        dispatch({ type: 'UPDATE_HABIT', payload: { id: h.id, habit: updatedHabit } });
      }

      dispatch({ type: 'UPDATE_STATS', payload: { id: h.id, stats: newStats } });
    });
  }, [getHabits, calculateStreak, calculateConsistency, updateHabitScore]);

  // Hydrate stats once after habits load
  useEffect(() => {
    if (!hasHydratedStatsRef.current && habits.length > 0) {
      hasHydratedStatsRef.current = true;
      recomputeAllStats();
    }
  }, [habits.length, recomputeAllStats]);

  // Recompute at local midnight to keep "Active" and "Consistency" fresh daily
  useEffect(() => {
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 5, 0, 0); // a few minutes past midnight
      const timeoutMs = next.getTime() - now.getTime();
      midnightTimerRef.current = setTimeout(() => {
        recomputeAllStats();
        scheduleMidnight();
      }, Math.max(60_000, timeoutMs));
    };
    scheduleMidnight();
    return () => {
      if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
    };
  }, [recomputeAllStats]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => h.stats.currentStreak > 0).length;
    const avgConsistency = totalHabits > 0 
      ? habits.reduce((acc, h) => acc + h.stats.consistency, 0) / totalHabits 
      : 0;
    const totalCompletions = habits.reduce((acc, h) => acc + (h.stats.totalCompletions || 0), 0);
    
    return {
      totalHabits,
      activeHabits,
      avgConsistency,
      totalCompletions,
      completionRate: avgConsistency
    };
  }, [habits]);

  return {
    habits,
    stats,
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

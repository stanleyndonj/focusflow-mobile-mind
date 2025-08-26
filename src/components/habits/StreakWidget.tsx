/**
 * StreakWidget Component
 * Displays streak statistics and achievements
 */

import React, { memo } from 'react';
import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { Habit } from '../../types/habit';

interface StreakWidgetProps {
  habits: Habit[];
  className?: string;
}

export const StreakWidget = memo<StreakWidgetProps>(({ habits, className = '' }) => {
  const stats = React.useMemo(() => {
    const goodHabits = habits.filter(h => h.type === 'good');
    const badHabits = habits.filter(h => h.type === 'bad');
    
    const currentStreaks = habits.map(h => h.stats.currentStreak);
    const bestStreaks = habits.map(h => h.stats.bestStreak);
    
    const totalDaysTracked = Math.max(
      ...habits.map(h => Object.keys(h.logs).length),
      1
    );
    
    const perfectDays = new Set<string>();
    const today = new Date();
    
    for (let i = 0; i < totalDaysTracked; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const allGoodCompleted = goodHabits.every(h => {
        const value = h.logs[dateStr];
        if (h.trackMode === 'binary') return value === 1;
        if (h.trackMode === 'count') return value >= (h.target.times || 0);
        if (h.trackMode === 'duration') return value >= (h.target.minutes || 0);
        return false;
      });
      
      const noBadHabits = badHabits.every(h => {
        const value = h.logs[dateStr];
        return value === 0 || value === undefined;
      });
      
      if (allGoodCompleted && noBadHabits) {
        perfectDays.add(dateStr);
      }
    }
    
    return {
      totalActive: habits.filter(h => h.stats.currentStreak > 0).length,
      longestStreak: Math.max(...currentStreaks, 0),
      bestEverStreak: Math.max(...bestStreaks, 0),
      perfectDays: perfectDays.size,
      avgConsistency: habits.reduce((acc, h) => acc + h.stats.consistency, 0) / (habits.length || 1)
    };
  }, [habits]);

  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-gray-400 dark:text-gray-600';
    if (streak < 7) return 'text-orange-500 dark:text-orange-400';
    if (streak < 30) return 'text-yellow-500 dark:text-yellow-400';
    if (streak < 100) return 'text-green-500 dark:text-green-400';
    return 'text-purple-500 dark:text-purple-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Flame className="text-orange-500" size={20} />
        Streak Stats
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Current Streak */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className={getStreakColor(stats.longestStreak)} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Current Best</span>
          </div>
          <div className={`text-2xl font-bold ${getStreakColor(stats.longestStreak)}`}>
            {stats.longestStreak}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">days</div>
        </div>
        
        {/* Best Ever */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-yellow-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Best Ever</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.bestEverStreak}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">days</div>
        </div>
        
        {/* Active Habits */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalActive}/{habits.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">habits</div>
        </div>
        
        {/* Perfect Days */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Perfect Days</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.perfectDays}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">total</div>
        </div>
      </div>
      
      {/* Consistency Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Overall Consistency</span>
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {Math.round(stats.avgConsistency * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
            style={{ width: `${stats.avgConsistency * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
});

StreakWidget.displayName = 'StreakWidget';

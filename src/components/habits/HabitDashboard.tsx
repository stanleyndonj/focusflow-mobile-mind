/**
 * HabitDashboard Component
 * Main dashboard for habit tracking
 */

import React, { useState, useMemo } from 'react';
import { Plus, Filter, Calendar, TrendingUp, Target, Shield, AlertTriangle, Trophy, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitTracker } from '../../hooks/useHabitTracker';
import { HabitCardEnhanced } from './HabitCardEnhanced';
import { StreakWidget } from './StreakWidget';
import { RecommendationsPanel } from './RecommendationsPanel';
import { AddEditHabitModal } from './AddEditHabitModal';
import { HabitDetail } from './HabitDetail';
import { Habit, HabitType, HabitBreakReason } from '../../types/habit';

interface HabitDashboardProps {
  className?: string;
}

export const HabitDashboard: React.FC<HabitDashboardProps> = ({ className = '' }) => {
  const { habits, addHabit, updateHabit, deleteHabit, logHabit, stats } = useHabitTracker();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [detailHabit, setDetailHabit] = useState<Habit | undefined>();
  const [filterType, setFilterType] = useState<'all' | 'good' | 'bad'>('all');
  const [sortBy, setSortBy] = useState<'streak' | 'consistency' | 'name'>('streak');

  const today = new Date().toISOString().split('T')[0];

  const filteredAndSortedHabits = useMemo(() => {
    let filtered = habits;
    
    if (filterType !== 'all') {
      filtered = habits.filter(h => h.type === filterType);
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'streak':
          return b.stats.currentStreak - a.stats.currentStreak;
        case 'consistency':
          return b.stats.consistency - a.stats.consistency;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [habits, filterType, sortBy]);

  const handleQuickLog = (habitId: string, value: number | boolean, breakReason?: HabitBreakReason) => {
    logHabit(habitId, today, value, breakReason);
  };

  const handleEditSave = (habit: Habit) => {
    updateHabit(habit);
    setEditingHabit(undefined);
  };

  const handleAddSave = (habit: any) => {
    addHabit(habit);
  };

  const todayProgress = useMemo(() => {
    const goodHabits = habits.filter(h => h.type === 'good');
    const completed = goodHabits.filter(h => {
      const value = h.logs[today];
      if (h.trackMode === 'binary') return value === 1;
      if (h.trackMode === 'count') return value >= (h.target.times || 0);
      if (h.trackMode === 'duration') return value >= (h.target.minutes || 0);
      return false;
    });
    
    return {
      completed: completed.length,
      total: goodHabits.length,
      percentage: goodHabits.length > 0 ? Math.round((completed.length / goodHabits.length) * 100) : 0
    };
  }, [habits, today]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Habit Tracker
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Build consistency, break bad habits
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
              text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            <span>Add Habit</span>
          </button>
        </div>

        {/* Today's Progress */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Today's Progress
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {todayProgress.completed}/{todayProgress.total} Complete
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress.percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
            {todayProgress.percentage}% Complete
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StreakWidget habits={habits} />
        <RecommendationsPanel habits={habits} />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All ({habits.length})
            </button>
            <button
              onClick={() => setFilterType('good')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'good'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Good ({habits.filter(h => h.type === 'good').length})
            </button>
            <button
              onClick={() => setFilterType('bad')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'bad'
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Bad ({habits.filter(h => h.type === 'bad').length})
            </button>
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="streak">Sort by Streak</option>
              <option value="consistency">Sort by Consistency</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      {filteredAndSortedHabits.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filterType === 'all' ? 'No habits yet' : `No ${filterType} habits`}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {filterType === 'all' 
                ? 'Start building better habits today!' 
                : `Add some ${filterType} habits to track`}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Add Your First Habit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedHabits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <HabitCardEnhanced
                  habit={habit}
                  onQuickLog={handleQuickLog}
                  onDetail={setDetailHabit}
                  today={today}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AddEditHabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSave}
      />
      
      <AddEditHabitModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(undefined)}
        onSave={handleEditSave}
        habit={editingHabit}
      />
      
      {detailHabit && (
        <HabitDetail
          habit={detailHabit}
          isOpen={!!detailHabit}
          onClose={() => setDetailHabit(undefined)}
          onEdit={setEditingHabit}
          onDelete={deleteHabit}
          onLog={logHabit}
        />
      )}
    </div>
  );
};

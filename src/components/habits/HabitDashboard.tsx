/**
 * HabitDashboard Component
 * Main dashboard for habit tracking
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, Calendar, TrendingUp, Target, Shield, AlertTriangle, Trophy, Zap, Sparkles, Brain, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitTracker } from '../../hooks/useHabitTracker';
import { HabitCardEnhanced } from './HabitCardEnhanced';
import { StreakWidget } from './StreakWidget';
import { RecommendationsPanel } from './RecommendationsPanel';
import { AddEditHabitModal } from './AddEditHabitModal';
import { HabitDetail } from './HabitDetail';
import { Habit, HabitType, HabitBreakReason } from '../../types/habit';
import { aiInsightGenerator } from '../../services/ai/AIInsightGenerator';

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
  const [aiMotivation, setAiMotivation] = useState<string>('');
  const [loadingMotivation, setLoadingMotivation] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Load AI motivation message
  useEffect(() => {
    const loadMotivation = async () => {
      if (habits.length === 0) return;
      
      setLoadingMotivation(true);
      try {
        const motivation = await aiInsightGenerator.getAIMotivation(habits);
        setAiMotivation(motivation);
      } catch (error) {
        console.log('AI motivation temporarily unavailable');
      } finally {
        setLoadingMotivation(false);
      }
    };

    loadMotivation();
    
    // Refresh motivation every 4 hours
    const interval = setInterval(loadMotivation, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [habits]);

  // Notification scheduling is handled centrally in the notifications hook and settings page.

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
    const completed = habits.filter(h => {
      const value = h.logs[today];
      const hasLogToday = value !== undefined;
      if (h.type === 'good') {
        if (h.trackMode === 'binary') return value === 1;
        if (h.trackMode === 'count') return (value || 0) >= (h.target.times || 0);
        if (h.trackMode === 'duration') return (value || 0) >= (h.target.minutes || 0);
        return false;
      } else {
        // Bad habit: completed means explicitly avoided today (has log and is 0)
        return hasLogToday && value === 0;
      }
    });
    const total = habits.length;
    return {
      completed: completed.length,
      total,
      percentage: total > 0 ? Math.round((completed.length / total) * 100) : 0
    };
  }, [habits, today]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header with Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-white/90 via-blue-50/80 to-purple-50/70 
          dark:from-gray-800/90 dark:via-blue-900/30 dark:to-purple-900/20 
          backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6"
      >
        {/* Animated background elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-xl" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Habit Mastery
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Transform your life, one habit at a time
              </p>
              {aiMotivation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-2 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 
                    rounded-lg border border-blue-200/50 dark:border-blue-700/50 relative"
                >
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="AI Generated"></div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <Brain size={12} className="text-purple-600" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">AI</span>
                    {aiMotivation}
                  </p>
                  {loadingMotivation && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-blue-600">Analyzing...</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
              hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all 
              shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            <span>Create Habit</span>
          </motion.button>
        </div>

        {/* Enhanced Today's Progress */}
        <div className="relative mt-6 p-4 bg-gradient-to-r from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-900/60 
          backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Today's Progress
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {todayProgress.completed}/{todayProgress.total}
              </span>
              <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {todayProgress.percentage}%
                </span>
              </div>
            </div>
          </div>
          <div className="relative h-4 bg-gray-200/60 dark:bg-gray-700/60 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
              animate-pulse opacity-50" />
          </div>
          {todayProgress.percentage === 100 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"
            >
              <Trophy className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* AI Quick Insight Banner */}
      {habits.length > 0 && aiMotivation && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 
            backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-4 relative overflow-hidden"
        >
          {/* Subtle animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-400/5 to-pink-400/5 animate-pulse" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">AI</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Smart Insights</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {aiMotivation}
              </p>
            </div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Enhanced Stats Row */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <StreakWidget habits={habits} />
        <RecommendationsPanel habits={habits} />
      </motion.div>

      {/* Enhanced Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg 
          border border-white/20 dark:border-gray-700/50 p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-1 overflow-x-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({habits.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterType('good')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filterType === 'good'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Good ({habits.filter(h => h.type === 'good').length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterType('bad')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filterType === 'bad'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Bad ({habits.filter(h => h.type === 'bad').length})
            </motion.button>
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 text-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl
                bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white 
                focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              <option value="streak">Sort by Streak</option>
              <option value="consistency">Sort by Consistency</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Habits Grid */}
      {filteredAndSortedHabits.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 
            backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-12"
        >
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl 
                flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Target size={40} className="text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {filterType === 'all' ? 'Ready to start your journey?' : `No ${filterType} habits yet`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {filterType === 'all' 
                ? 'Transform your life one habit at a time. Every expert was once a beginner.' 
                : `Create your first ${filterType} habit and begin building momentum.`}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl 
                transform hover:-translate-y-0.5 transition-all"
            >
              Create Your First Habit
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedHabits.map((habit, index) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 100
                }}
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
        </motion.div>
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
          onEdit={(h) => {
            // Close detail first, then open edit to avoid stacking behind
            setDetailHabit(undefined);
            setTimeout(() => setEditingHabit(h), 0);
          }}
          onDelete={deleteHabit}
          onLog={logHabit}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Habit, HabitBreakReason } from '../../types/habit';
import { Shield, AlertTriangle, Flame, Star, BarChart3, Plus, Minus, CheckCircle2 } from 'lucide-react';

interface HabitCardEnhancedProps {
  habit: Habit;
  onQuickLog: (habitId: string, value: number | boolean, breakReason?: HabitBreakReason) => void;
  onDetail: (habit: Habit) => void;
  today: string;
}

export const HabitCardEnhanced: React.FC<HabitCardEnhancedProps> = ({ habit, onQuickLog, onDetail, today }) => {
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakReason, setBreakReason] = useState('');
  const [breakTrigger, setBreakTrigger] = useState('');
  const [breakMood, setBreakMood] = useState('');
  
  const todayValue = habit.logs[today] || 0;
  const isCompleted = todayValue > 0;
  const percentage = habit.target.times ? (todayValue / habit.target.times) * 100
    : habit.target.minutes ? (todayValue / habit.target.minutes) * 100 : isCompleted ? 100 : 0;

  const avoidedToday = habit.type === 'bad' && !isCompleted;
  const currentStreak = habit.type === 'bad' ? (habit.avoidedStreak || 0) : habit.stats.currentStreak;

  const handleBreakBadHabit = () => {
    const now = new Date();
    const breakData: HabitBreakReason = {
      date: today,
      time: now.toLocaleTimeString(),
      reason: breakReason,
      trigger: breakTrigger,
      mood: breakMood
    };
    onQuickLog(habit.id, 1, breakData);
    setShowBreakModal(false);
    setBreakReason('');
    setBreakTrigger('');
    setBreakMood('');
  };

  const getStreakIcon = () => {
    if (currentStreak >= 30) return <Flame className="text-orange-500" size={16} />;
    if (currentStreak >= 7) return <Star className="text-yellow-500" size={16} />;
    return null;
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative rounded-2xl p-5 shadow-lg transition-all
          ${habit.type === 'good' 
            ? 'bg-gradient-to-br from-white via-blue-50/50 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/10' 
            : 'bg-gradient-to-br from-white via-red-50/50 to-orange-50/30 dark:from-gray-800 dark:via-red-900/20 dark:to-orange-900/10'}
          border-2 ${isCompleted 
            ? habit.type === 'good' ? 'border-green-400/50' : 'border-red-400/50'
            : 'border-gray-200 dark:border-gray-700'}`}>
        
        {/* Glass effect overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-lg" 
                style={{ backgroundColor: habit.settings?.color || '#3b82f6' }} />
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{habit.title}</h3>
              {getStreakIcon()}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                {currentStreak} day streak
              </span>
              <span>{Math.round(habit.stats.consistency * 100)}% consistent</span>
            </div>
          </div>
        </div>

        {/* Modern Progress Bar */}
        <div className="mb-4">
          <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur">
            <motion.div
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              className={`h-full rounded-full shadow-lg bg-gradient-to-r ${
                habit.type === 'good' ? 'from-blue-400 to-purple-500'
                  : avoidedToday ? 'from-green-400 to-emerald-500' : 'from-red-400 to-pink-500'
              }`} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {habit.type === 'good' ? (
            habit.trackMode === 'binary' ? (
              <button onClick={() => onQuickLog(habit.id, !isCompleted)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all shadow-md
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30'
                    : 'bg-white dark:bg-gray-700 hover:shadow-lg'}`}>
                {isCompleted ? '✓ Done' : 'Mark Done'}
              </button>
            ) : (
              <>
                <button onClick={() => onQuickLog(habit.id, Math.max(0, todayValue - 1))}
                  className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg">
                  <Minus size={18} />
                </button>
                <div className="flex-1 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <span className="font-bold text-xl">{todayValue}
                    <span className="text-xs ml-1">{habit.trackMode === 'count' ? 'x' : 'min'}</span>
                  </span>
                </div>
                <button onClick={() => onQuickLog(habit.id, todayValue + 1)}
                  className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-md hover:shadow-lg">
                  <Plus size={18} />
                </button>
              </>
            )
          ) : (
            <>
              <button onClick={() => onQuickLog(habit.id, 0)}
                className={`flex-1 py-2.5 rounded-xl font-semibold shadow-md
                  ${avoidedToday 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-white dark:bg-gray-700'}`}>
                <Shield className="mx-auto" size={18} />
              </button>
              <button onClick={() => setShowBreakModal(true)}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold shadow-md">
                <AlertTriangle className="mx-auto" size={18} />
              </button>
            </>
          )}
          <button onClick={() => onDetail(habit)}
            className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg">
            <BarChart3 size={18} />
          </button>
        </div>

        {/* Replacement suggestion for bad habits */}
        {habit.type === 'bad' && habit.settings?.replacement && (
          <div className="mt-3 p-2.5 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg backdrop-blur">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              💡 Try instead: {habit.settings.replacement}
            </p>
          </div>
        )}
      </motion.div>

      {/* Break Reason Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Log Break Reason</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">What happened?</label>
                <textarea value={breakReason} onChange={(e) => setBreakReason(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700" rows={2}
                  placeholder="Describe what led to breaking the habit..." />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trigger</label>
                <input value={breakTrigger} onChange={(e) => setBreakTrigger(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700"
                  placeholder="What triggered this?" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mood</label>
                <select value={breakMood} onChange={(e) => setBreakMood(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700">
                  <option value="">Select mood...</option>
                  <option value="stressed">😰 Stressed</option>
                  <option value="bored">😑 Bored</option>
                  <option value="tired">😴 Tired</option>
                  <option value="anxious">😟 Anxious</option>
                  <option value="angry">😤 Angry</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleBreakBadHabit}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-semibold">
                Log Break
              </button>
              <button onClick={() => setShowBreakModal(false)}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

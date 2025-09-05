import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Habit, HabitBreakReason } from '../../types/habit';
import { Shield, AlertTriangle, Flame, Star, BarChart3, Plus, Minus, CheckCircle2, Zap, Crown, Diamond } from 'lucide-react';

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
  
  const rawTodayValue = habit.logs[today];
  const hasLogToday = rawTodayValue !== undefined;
  const todayValue = (typeof rawTodayValue === 'number' ? rawTodayValue : 0);
  const isGood = habit.type === 'good';
  const isAvoided = !isGood && hasLogToday && todayValue === 0;
  const isCompleted = isGood ? todayValue > 0 : isAvoided; // normalize for UI
  const percentage = isGood
    ? (habit.target.times ? (todayValue / (habit.target.times || 1)) * 100
      : habit.target.minutes ? (todayValue / (habit.target.minutes || 1)) * 100
      : isCompleted ? 100 : 0)
    : (isAvoided ? 100 : 0);

  const avoidedToday = !isGood && isAvoided;
  const currentStreak = !isGood ? (habit.avoidedStreak || 0) : habit.stats.currentStreak;

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
    if (currentStreak >= 100) return <Crown className="text-purple-500" size={16} />;
    if (currentStreak >= 50) return <Diamond className="text-blue-500" size={16} />;
    if (currentStreak >= 30) return <Flame className="text-orange-500" size={16} />;
    if (currentStreak >= 7) return <Star className="text-yellow-500" size={16} />;
    if (currentStreak >= 3) return <Zap className="text-green-500" size={16} />;
    return null;
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`relative rounded-3xl p-6 shadow-xl transition-all duration-300 backdrop-blur-xl
          ${habit.type === 'good' 
            ? 'bg-gradient-to-br from-white/95 via-blue-50/80 to-purple-50/60 dark:from-gray-800/95 dark:via-blue-900/30 dark:to-purple-900/20' 
            : 'bg-gradient-to-br from-white/95 via-red-50/80 to-orange-50/60 dark:from-gray-800/95 dark:via-red-900/30 dark:to-orange-900/20'}
          border-2 ${isCompleted 
            ? habit.type === 'good' ? 'border-green-400/60 shadow-green-500/20' : 'border-red-400/60 shadow-red-500/20'
            : 'border-white/30 dark:border-gray-700/50'} hover:shadow-2xl`}>
        
        {/* Enhanced glass effect overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent pointer-events-none" />
        
        {/* Completion glow effect */}
        {isCompleted && (
          <div className={`absolute inset-0 rounded-3xl ${habit.type === 'good' ? 'bg-green-400/10' : 'bg-red-400/10'} pointer-events-none animate-pulse`} />
        )}
        
        {/* Enhanced Header */}
        <div className="relative flex justify-between items-start mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-4 h-4 rounded-full shadow-lg animate-pulse" 
                  style={{ backgroundColor: habit.settings?.color || '#3b82f6' }} />
                {isCompleted && (
                  <div className="absolute -inset-1 rounded-full bg-green-400/30 animate-ping" />
                )}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{habit.title}</h3>
              <div className="flex items-center gap-1">
                {getStreakIcon()}
                {currentStreak >= 7 && (
                  <div className="px-2 py-0.5 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 rounded-full">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">🔥</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100/60 dark:bg-blue-900/30 rounded-lg">
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {currentStreak} day streak
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100/60 dark:bg-purple-900/30 rounded-lg">
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  {Math.round(habit.stats.consistency * 100)}% rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-5">
          <div className="relative h-4 bg-gray-200/40 dark:bg-gray-700/40 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full shadow-lg relative ${
                habit.type === 'good' 
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                  : avoidedToday 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                animate-pulse opacity-60" />
            </motion.div>
            {/* Progress indicator */}
            {percentage > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {Math.round(percentage)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Actions */}
        <div className="flex gap-3">
          {habit.type === 'good' ? (
            habit.trackMode === 'binary' ? (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQuickLog(habit.id, !isCompleted)}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all shadow-lg backdrop-blur-sm
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/40 border border-green-400/50'
                    : 'bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-white/50 dark:border-gray-600/50 hover:shadow-xl'}`}>
                {isCompleted ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} />
                    <span>Completed</span>
                  </div>
                ) : (
                  <span>Mark Done</span>
                )}
              </motion.button>
            ) : (
              <>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onQuickLog(habit.id, Math.max(0, todayValue - 1))}
                  className="p-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl shadow-lg 
                    hover:shadow-xl border border-white/50 dark:border-gray-600/50 transition-all">
                  <Minus size={18} />
                </motion.button>
                <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-white/60 to-gray-50/60 
                  dark:from-gray-800/60 dark:to-gray-700/60 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-600/30">
                  <span className="font-bold text-2xl text-gray-900 dark:text-white">{todayValue}
                    <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">
                      {habit.trackMode === 'count' ? 'times' : 'min'}
                    </span>
                  </span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onQuickLog(habit.id, todayValue + 1)}
                  className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg 
                    hover:shadow-xl border border-blue-400/50 transition-all">
                  <Plus size={18} />
                </motion.button>
              </>
            )
          ) : (
            <>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQuickLog(habit.id, 0)}
                className={`flex-1 py-3 rounded-2xl font-bold shadow-lg backdrop-blur-sm transition-all
                  ${avoidedToday 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/40 border border-green-400/50'
                    : 'bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-white/50 dark:border-gray-600/50'}`}>
                <div className="flex items-center justify-center gap-2">
                  <Shield size={18} />
                  <span>{avoidedToday ? 'Avoided!' : 'Resist'}</span>
                </div>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBreakModal(true)}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl 
                  font-bold shadow-lg hover:shadow-xl border border-red-400/50 transition-all">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle size={18} />
                  <span>Broke</span>
                </div>
              </motion.button>
            </>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDetail(habit)}
            className="p-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl shadow-lg 
              hover:shadow-xl border border-white/50 dark:border-gray-600/50 transition-all">
            <BarChart3 size={18} />
          </motion.button>
        </div>

        {/* Enhanced replacement suggestion for bad habits */}
        {habit.type === 'bad' && habit.settings?.replacement && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-gradient-to-r from-blue-100/60 to-purple-100/60 
              dark:from-blue-900/40 dark:to-purple-900/40 rounded-2xl backdrop-blur-sm 
              border border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-500 rounded-lg">
                <span className="text-xs">💡</span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-200 font-semibold">
                Try instead: <span className="font-bold">{habit.settings.replacement}</span>
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Break Reason Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full 
              shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Log Break Details</h3>
            </div>
            
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

            <div className="flex gap-3 mt-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBreakBadHabit}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl 
                  font-bold shadow-lg hover:shadow-xl transition-all">
                Log Break
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBreakModal(false)}
                className="flex-1 py-3 bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl 
                  font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

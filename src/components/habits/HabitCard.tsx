/**
 * HabitCard Component
 * Mobile-first card for displaying individual habit with quick actions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Plus, Minus, Clock, Target, TrendingUp, Calendar, AlertTriangle, Shield, Zap, Brain, Award, ChevronRight } from 'lucide-react';
import { Habit } from '../../types/habit';

interface HabitCardProps {
  habit: Habit;
  onQuickLog: (habitId: string, value: number | boolean, breakReason?: any) => void;
  onEdit: (habit: Habit) => void;
  onDetail: (habit: Habit) => void;
  today: string;
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  onQuickLog, 
  onEdit, 
  onDetail,
  today 
}) => {
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakReason, setBreakReason] = useState('');
  const [breakTrigger, setBreakTrigger] = useState('');
  const [breakMood, setBreakMood] = useState('');
  const [preventionPlan, setPreventionPlan] = useState('');
  
  const todayValue = habit.logs[today] || 0;
  const isCompleted = todayValue > 0;
  const percentage = habit.target.times 
    ? (todayValue / habit.target.times) * 100
    : habit.target.minutes
    ? (todayValue / habit.target.minutes) * 100  
    : isCompleted ? 100 : 0;

  // For bad habits, calculate avoided streak
  const avoidedToday = habit.type === 'bad' && !isCompleted;
  const currentAvoidedStreak = habit.avoidedStreak || 0;

  const progressPercentage = React.useMemo(() => {
    if (habit.trackMode === 'binary') {
      return isCompleted ? 100 : 0;
    }
    if (habit.trackMode === 'count' && habit.target.times) {
      return Math.min(100, ((todayValue || 0) / habit.target.times) * 100);
    }
    if (habit.trackMode === 'duration' && habit.target.minutes) {
      return Math.min(100, ((todayValue || 0) / habit.target.minutes) * 100);
    }
    return 0;
  }, [habit, todayValue, isCompleted]);

  const handleQuickLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (habit.trackMode === 'binary') {
      onQuickLog(habit.id, !hasLoggedToday || !isCompleted);
    } else if (habit.trackMode === 'count') {
      const newValue = (todayValue || 0) + 1;
      onQuickLog(habit.id, newValue);
    } else if (habit.trackMode === 'duration') {
      // For duration, open detail modal for input
      onDetail(habit);
    }
  };

  const habitColor = habit.settings?.color || (habit.type === 'good' ? '#10b981' : '#ef4444');

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer ${className}`}
      onClick={() => onDetail(habit)}
      style={{
        borderLeft: `4px solid ${habitColor}`
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1">
            {habit.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {habit.type === 'bad' && (
              <span className="text-xs text-red-500 dark:text-red-400">Avoid</span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {habit.trackMode === 'count' ? `${todayValue || 0}/${habit.target.times || 0}` :
               habit.trackMode === 'duration' ? `${todayValue || 0}/${habit.target.minutes || 0}m` :
               isCompleted ? 'Done' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Quick Log Button */}
        <button
          onClick={handleQuickLog}
          className={`ml-2 p-2 rounded-lg transition-colors ${
            isCompleted 
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {habit.type === 'good' ? (
            <Check size={20} className={isCompleted ? 'text-green-600 dark:text-green-400' : ''} />
          ) : (
            <X size={20} className={!hasLoggedToday || todayValue === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'} />
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {habit.trackMode !== 'binary' && (
        <div className="mb-3">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: habitColor
              }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <TrendingUp size={12} />
            <span>{habit.stats.currentStreak}d</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Target size={12} />
            <span>{Math.round(habit.stats.consistency * 100)}%</span>
          </div>
        </div>
        {habit.settings?.replacement && habit.type === 'bad' && (
          <span className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[100px]">
            → {habit.settings.replacement}
          </span>
        )}
      </div>
    </motion.div>
  );
});

HabitCard.displayName = 'HabitCard';

/**
 * HabitDetail Component  
 * Detailed view and logging interface for individual habits
 */

import React, { useState } from 'react';
import { X, Edit, Trash, Check, Plus, Minus, Calendar, TrendingUp, Target, Clock } from 'lucide-react';
import { Habit } from '../../types/habit';
import { HeatmapCalendar } from './HeatmapCalendar';

interface HabitDetailProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onLog: (habitId: string, date: string, value: number | boolean) => void;
}

export const HabitDetail: React.FC<HabitDetailProps> = ({
  habit,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onLog
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputValue, setInputValue] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentValue = habit.logs[selectedDate];
  const hasValue = currentValue !== undefined;

  const handleLog = () => {
    if (habit.trackMode === 'binary') {
      onLog(habit.id, selectedDate, !hasValue || currentValue === 0 ? 1 : 0);
    } else {
      onLog(habit.id, selectedDate, inputValue);
      setInputValue(0);
    }
  };

  const handleQuickIncrement = (delta: number) => {
    const newValue = (currentValue || 0) + delta;
    if (newValue >= 0) {
      onLog(habit.id, selectedDate, newValue);
    }
  };

  const handleDelete = () => {
    onDelete(habit.id);
    onClose();
  };

  if (!isOpen) return null;

  const completionRate = Math.round(habit.stats.consistency * 100);
  const isCompleted = habit.type === 'good' 
    ? (habit.trackMode === 'binary' ? currentValue === 1 : currentValue >= (habit.target.times || habit.target.minutes || 0))
    : currentValue === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl my-8 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-8 rounded-full"
              style={{ backgroundColor: habit.settings?.color || '#10b981' }}
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {habit.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                  {habit.type === 'good' ? '✅ Good' : '❌ Bad'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                  {habit.trackMode}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(habit)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash size={18} className="text-red-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[70vh]">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Current</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {habit.stats.currentStreak}
              </div>
              <div className="text-xs text-gray-500">days</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} className="text-blue-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Best</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {habit.stats.bestStreak}
              </div>
              <div className="text-xs text-gray-500">days</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-purple-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Consistency</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {completionRate}%
              </div>
              <div className="text-xs text-gray-500">overall</div>
            </div>
          </div>

          {/* Date Selector & Logger */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Log for Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Current Status */}
            <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`text-sm font-medium ${
                  isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {isCompleted ? '✅ Complete' : '⏳ Pending'}
                </span>
              </div>
              {habit.trackMode !== 'binary' && (
                <div className="mt-2">
                  <div className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                    {currentValue || 0} / {habit.target.times || habit.target.minutes || 0}
                    {habit.trackMode === 'duration' ? ' min' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Log Controls */}
            {habit.trackMode === 'binary' ? (
              <button
                onClick={handleLog}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  hasValue && currentValue
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                }`}
              >
                {hasValue && currentValue ? '✅ Completed' : 'Mark as Done'}
              </button>
            ) : habit.trackMode === 'count' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickIncrement(-1)}
                  className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={() => handleQuickIncrement(1)}
                  className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Add 1
                </button>
                <button
                  onClick={() => handleQuickIncrement(5)}
                  className="px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  +5
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Minutes..."
                  />
                  <button
                    onClick={handleLog}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Log
                  </button>
                </div>
                <div className="flex gap-2">
                  {[15, 30, 60].map(min => (
                    <button
                      key={min}
                      onClick={() => {
                        setInputValue(min);
                        onLog(habit.id, selectedDate, min);
                      }}
                      className="flex-1 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Activity Pattern */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Activity Pattern & Insights
            </h3>
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
              <HeatmapCalendar habit={habit} weeks={24} interactive={true} />
              
              {/* Pattern Analysis */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Recent Pattern</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                    {habit.type === 'good' ? 
                      `Last 7 days: ${Object.entries(habit.logs).slice(-7).filter(([_, v]) => {
                        if (habit.trackMode === 'binary') return v === 1;
                        return v >= (habit.target.times || habit.target.minutes || 0);
                      }).length}/7 completed` :
                      `Last 7 days: ${Object.entries(habit.logs).slice(-7).filter(([_, v]) => v === 0).length}/7 avoided`
                    }
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Longest Streak</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                    {habit.stats.bestStreak} days
                    {habit.stats.bestStreak > 21 && ' 🏆'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Replacement Reminder */}
          {habit.type === 'bad' && habit.settings?.replacement && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Remember: Instead of "{habit.title}", try "{habit.settings.replacement}"
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Delete Habit?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This will permanently delete "{habit.title}" and all its data.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

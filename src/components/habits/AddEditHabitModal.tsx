import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Target, Calendar, Clock, Palette, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Habit, NewHabit, HabitType, TrackMode, DayOfWeek } from '../../types/habit';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: NewHabit | Habit) => void;
  habit?: Habit;
}

const DAYS: { value: DayOfWeek; label: string; full: string }[] = [
  { value: 'mon', label: 'M', full: 'Monday' },
  { value: 'tue', label: 'T', full: 'Tuesday' },
  { value: 'wed', label: 'W', full: 'Wednesday' },
  { value: 'thu', label: 'T', full: 'Thursday' },
  { value: 'fri', label: 'F', full: 'Friday' },
  { value: 'sat', label: 'S', full: 'Saturday' },
  { value: 'sun', label: 'S', full: 'Sunday' }
];

const COLORS = [
  { value: '#10b981', name: 'Emerald' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#ef4444', name: 'Red' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#84cc16', name: 'Lime' }
];

const TRACK_MODES = [
  { value: 'binary', label: 'Simple Yes/No', description: 'Just mark it done or not done', icon: '✓' },
  { value: 'count', label: 'Count Repetitions', description: 'Track number of times (e.g., 10 push-ups)', icon: '#' },
  { value: 'duration', label: 'Track Duration', description: 'Track time spent (e.g., 30 minutes)', icon: '⏱' }
];

export const AddEditHabitModal: React.FC<Props> = ({ isOpen, onClose, onSave, habit }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<HabitType>('good');
  const [trackMode, setTrackMode] = useState<TrackMode>('binary');
  const [targetTimes, setTargetTimes] = useState(1);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [schedule, setSchedule] = useState<DayOfWeek[]>([]);
  const [color, setColor] = useState(COLORS[0].value);
  const [replacement, setReplacement] = useState('');

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setType(habit.type);
      setTrackMode(habit.trackMode);
      setTargetTimes(habit.target.times || 1);
      setTargetMinutes(habit.target.minutes || 30);
      setSchedule(habit.schedule || []);
      setColor(habit.settings?.color || COLORS[0].value);
      setReplacement(habit.settings?.replacement || '');
    } else {
      // Reset form for new habit
      setTitle('');
      setType('good');
      setTrackMode('binary');
      setTargetTimes(1);
      setTargetMinutes(30);
      setSchedule([]);
      setColor(COLORS[0].value);
      setReplacement('');
    }
  }, [habit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const habitData: any = {
      ...(habit ? habit : {}),
      title: title.trim(),
      type,
      trackMode,
      target: {
        period: 'daily',
        ...(trackMode === 'count' && { times: targetTimes }),
        ...(trackMode === 'duration' && { minutes: targetMinutes })
      },
      schedule: schedule.length > 0 ? schedule : undefined,
      settings: { color, ...(type === 'bad' && replacement && { replacement }) }
    };

    onSave(habitData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] grid place-items-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 
            backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 
            my-8 flex flex-col min-h-0"
        >
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 
            backdrop-blur-sm border-b border-white/30 dark:border-gray-700/30 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {habit ? 'Edit Habit' : 'Create New Habit'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {habit ? 'Refine your routine' : 'Build something amazing'}
                  </p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm 
                  border border-gray-200/50 dark:border-gray-600/50 transition-all"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </motion.button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh]">
            {/* Habit Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <Target className="w-4 h-4" />
                Habit Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning meditation, Daily exercise..."
                className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-2xl 
                  bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white 
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all 
                  placeholder:text-gray-400 dark:placeholder:text-gray-500"
                required
              />
            </div>

            {/* Habit Type */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Habit Type</label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setType('good')}
                  className={`p-4 rounded-2xl font-semibold transition-all border-2 ${
                    type === 'good' 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400/50 shadow-lg shadow-green-500/25' 
                      : 'bg-white/60 dark:bg-gray-700/60 border-gray-200/50 dark:border-gray-600/50 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span>Good Habit</span>
                    <span className="text-xs opacity-75">Build positive routines</span>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setType('bad')}
                  className={`p-4 rounded-2xl font-semibold transition-all border-2 ${
                    type === 'bad' 
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white border-red-400/50 shadow-lg shadow-red-500/25' 
                      : 'bg-white/60 dark:bg-gray-700/60 border-gray-200/50 dark:border-gray-600/50 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🚫</span>
                    <span>Bad Habit</span>
                    <span className="text-xs opacity-75">Break negative patterns</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Track Mode */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <Clock className="w-4 h-4" />
                How do you want to track progress?
              </label>
              <div className="space-y-2">
                {TRACK_MODES.map((mode) => (
                  <motion.button
                    key={mode.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => setTrackMode(mode.value as TrackMode)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      trackMode === mode.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/50 shadow-lg'
                        : 'bg-white/60 dark:bg-gray-700/60 border-gray-200/50 dark:border-gray-600/50 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mode.icon}</span>
                      <div>
                        <div className="font-semibold">{mode.label}</div>
                        <div className={`text-sm ${trackMode === mode.value ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                          {mode.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Target Settings */}
            <AnimatePresence>
              {trackMode === 'count' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Target Count</label>
                  <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-white/60 to-gray-50/60 
                    dark:from-gray-800/60 dark:to-gray-700/60 rounded-2xl border border-white/30 dark:border-gray-600/30">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button" 
                      onClick={() => setTargetTimes(Math.max(1, targetTimes - 1))} 
                      className="p-3 rounded-xl bg-white/80 dark:bg-gray-700/80 shadow-lg hover:shadow-xl 
                        border border-gray-200/50 dark:border-gray-600/50 transition-all"
                    >
                      <Minus size={18} />
                    </motion.button>
                    <div className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg">
                      <span className="text-2xl font-bold">{targetTimes}</span>
                      <span className="text-sm ml-2 opacity-80">times</span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button" 
                      onClick={() => setTargetTimes(targetTimes + 1)} 
                      className="p-3 rounded-xl bg-white/80 dark:bg-gray-700/80 shadow-lg hover:shadow-xl 
                        border border-gray-200/50 dark:border-gray-600/50 transition-all"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {trackMode === 'duration' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Target Duration</label>
                  <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-white/60 to-gray-50/60 
                    dark:from-gray-800/60 dark:to-gray-700/60 rounded-2xl border border-white/30 dark:border-gray-600/30">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button" 
                      onClick={() => setTargetMinutes(Math.max(5, targetMinutes - 5))} 
                      className="p-3 rounded-xl bg-white/80 dark:bg-gray-700/80 shadow-lg hover:shadow-xl 
                        border border-gray-200/50 dark:border-gray-600/50 transition-all"
                    >
                      <Minus size={18} />
                    </motion.button>
                    <div className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl shadow-lg">
                      <span className="text-2xl font-bold">{targetMinutes}</span>
                      <span className="text-sm ml-2 opacity-80">min</span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button" 
                      onClick={() => setTargetMinutes(targetMinutes + 5)} 
                      className="p-3 rounded-xl bg-white/80 dark:bg-gray-700/80 shadow-lg hover:shadow-xl 
                        border border-gray-200/50 dark:border-gray-600/50 transition-all"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Schedule */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <Calendar className="w-4 h-4" />
                Schedule (leave empty for daily)
              </label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map(({ value, label, full }) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setSchedule(prev => 
                      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
                    )}
                    className={`py-3 text-sm rounded-2xl font-semibold transition-all border-2 ${
                      schedule.includes(value) 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-400/50 shadow-lg' 
                        : 'bg-white/60 dark:bg-gray-700/60 border-gray-200/50 dark:border-gray-600/50 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                    title={full}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
              {schedule.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  Active on: {schedule.map(d => DAYS.find(day => day.value === d)?.full).join(', ')}
                </p>
              )}
            </div>

            {/* Color Theme */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <Palette className="w-4 h-4" />
                Choose a color theme
              </label>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((c) => (
                  <motion.button
                    key={c.value}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`relative w-full aspect-square rounded-2xl border-3 transition-all ${
                      color === c.value 
                        ? 'border-gray-900 dark:border-white shadow-lg scale-110' 
                        : 'border-white/50 dark:border-gray-600/50 hover:border-gray-400 dark:hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {color === c.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <span className="text-xs">✓</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Replacement Activity for Bad Habits */}
            <AnimatePresence>
              {type === 'bad' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    <Lightbulb className="w-4 h-4" />
                    Replacement Activity (optional)
                  </label>
                  <input
                    type="text"
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="e.g., Take deep breaths, go for a walk, drink water..."
                    className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-2xl 
                      bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white 
                      focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all 
                      placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    💡 Suggest a healthy alternative when you feel tempted
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fixed Action Buttons */}
          <div className="border-t border-white/30 dark:border-gray-700/30 p-6 bg-gradient-to-r from-white/80 to-gray-50/80 
            dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm">
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 px-6 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-2xl 
                  font-semibold hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all backdrop-blur-sm"
              >
                Cancel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 
                  hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold 
                  shadow-lg hover:shadow-xl transition-all"
              >
                {habit ? 'Update Habit' : 'Create Habit'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

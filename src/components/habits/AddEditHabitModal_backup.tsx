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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {habit ? 'Edit' : 'New'} Habit
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('good')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium ${
                type === 'good' ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              ✅ Good
            </button>
            <button
              type="button"
              onClick={() => setType('bad')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium ${
                type === 'bad' ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              ❌ Bad
            </button>
          </div>

          <select
            value={trackMode}
            onChange={(e) => setTrackMode(e.target.value as TrackMode)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="binary">Yes/No</option>
            <option value="count">Count</option>
            <option value="duration">Duration</option>
          </select>

          {trackMode === 'count' && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setTargetTimes(Math.max(1, targetTimes - 1))} 
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Minus size={16} />
              </button>
              <input type="number" value={targetTimes} onChange={(e) => setTargetTimes(parseInt(e.target.value) || 1)}
                className="w-20 text-center px-2 py-1 border rounded-lg bg-white dark:bg-gray-700" />
              <button type="button" onClick={() => setTargetTimes(targetTimes + 1)} 
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Plus size={16} />
              </button>
            </div>
          )}

          {trackMode === 'duration' && (
            <div className="flex items-center gap-2">
              <input type="number" value={targetMinutes} 
                onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 30)}
                className="w-20 text-center px-2 py-1 border rounded-lg bg-white dark:bg-gray-700" />
              <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
            </div>
          )}

          <div className="flex gap-1">
            {DAYS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSchedule(prev => 
                  prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
                )}
                className={`flex-1 py-2 text-xs rounded-lg font-medium ${
                  schedule.includes(value) ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-lg border-2 ${
                  color === c ? 'border-gray-900 dark:border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {type === 'bad' && (
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement activity..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          )}

            </form>
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
                type="submit"
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

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Habit, NewHabit, HabitType, TrackMode, DayOfWeek } from '../../types/habit';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: NewHabit | Habit) => void;
  habit?: Habit;
}

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'M' },
  { value: 'tue', label: 'T' },
  { value: 'wed', label: 'W' },
  { value: 'thu', label: 'T' },
  { value: 'fri', label: 'F' },
  { value: 'sat', label: 'S' },
  { value: 'sun', label: 'S' }
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

export const AddEditHabitModal: React.FC<Props> = ({ isOpen, onClose, onSave, habit }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<HabitType>('good');
  const [trackMode, setTrackMode] = useState<TrackMode>('binary');
  const [targetTimes, setTargetTimes] = useState(1);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [schedule, setSchedule] = useState<DayOfWeek[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [replacement, setReplacement] = useState('');

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setType(habit.type);
      setTrackMode(habit.trackMode);
      setTargetTimes(habit.target.times || 1);
      setTargetMinutes(habit.target.minutes || 30);
      setSchedule(habit.schedule || []);
      setColor(habit.settings?.color || COLORS[0]);
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

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

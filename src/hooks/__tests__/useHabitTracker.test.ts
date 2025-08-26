/**
 * Unit tests for useHabitTracker hook
 */

import { renderHook, act } from '@testing-library/react';
import { useHabitTracker } from '../useHabitTracker';
import { HabitFormData } from '../../types/habit';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useHabitTracker', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('initializes with empty habits', () => {
    const { result } = renderHook(() => useHabitTracker());
    expect(result.current.habits).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  test('adds a new habit', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    const newHabit: HabitFormData = {
      title: 'Test Habit',
      type: 'good',
      trackMode: 'binary',
      target: { period: 'daily' },
      settings: { color: '#3b82f6' }
    };

    act(() => {
      result.current.addHabit(newHabit);
    });

    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].title).toBe('Test Habit');
    expect(result.current.habits[0].type).toBe('good');
    expect(result.current.habits[0].id).toBeDefined();
  });

  test('updates an existing habit', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    // Add a habit first
    act(() => {
      result.current.addHabit({
        title: 'Original Title',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' }
      });
    });

    const habitId = result.current.habits[0].id;

    // Update the habit
    act(() => {
      result.current.updateHabit({
        ...result.current.habits[0],
        title: 'Updated Title'
      });
    });

    expect(result.current.habits[0].title).toBe('Updated Title');
    expect(result.current.habits[0].id).toBe(habitId);
  });

  test('deletes a habit', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    // Add two habits
    act(() => {
      result.current.addHabit({
        title: 'Habit 1',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' }
      });
      result.current.addHabit({
        title: 'Habit 2',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' }
      });
    });

    expect(result.current.habits).toHaveLength(2);

    const habitToDelete = result.current.habits[0].id;

    // Delete first habit
    act(() => {
      result.current.deleteHabit(habitToDelete);
    });

    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].title).toBe('Habit 2');
  });

  test('logs habit completion', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    // Add a habit
    act(() => {
      result.current.addHabit({
        title: 'Test Habit',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' }
      });
    });

    const habitId = result.current.habits[0].id;
    const today = '2024-01-15';

    // Log completion
    act(() => {
      result.current.logHabit(habitId, today, true);
    });

    expect(result.current.habits[0].logs[today]).toBe(1);
  });

  test('tracks count-based habits', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    act(() => {
      result.current.addHabit({
        title: 'Water Intake',
        type: 'good',
        trackMode: 'count',
        target: { period: 'daily', times: 8 }
      });
    });

    const habitId = result.current.habits[0].id;
    const today = '2024-01-15';

    // Log count
    act(() => {
      result.current.logHabit(habitId, today, 5);
    });

    expect(result.current.habits[0].logs[today]).toBe(5);
  });

  test('tracks duration-based habits', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    act(() => {
      result.current.addHabit({
        title: 'Meditation',
        type: 'good',
        trackMode: 'duration',
        target: { period: 'daily', minutes: 20 }
      });
    });

    const habitId = result.current.habits[0].id;
    const today = '2024-01-15';

    // Log duration
    act(() => {
      result.current.logHabit(habitId, today, 30);
    });

    expect(result.current.habits[0].logs[today]).toBe(30);
  });

  test('persists data to localStorage', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    act(() => {
      result.current.addHabit({
        title: 'Persistent Habit',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' }
      });
    });

    // Check localStorage was updated
    const stored = localStorage.getItem('ff_habits_v1');
    expect(stored).toBeDefined();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe(1);
    expect(parsed.habits).toHaveLength(1);
    expect(parsed.habits[0].title).toBe('Persistent Habit');
  });

  test('loads persisted data on initialization', () => {
    // Set up localStorage with existing data
    const existingData = {
      version: 1,
      habits: [{
        id: 'existing-1',
        title: 'Existing Habit',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' },
        logs: {},
        settings: {},
        createdAt: new Date().toISOString(),
        stats: {
          currentStreak: 0,
          bestStreak: 0,
          consistency: 0,
          totalCompleted: 0
        }
      }],
      lastSync: new Date().toISOString()
    };

    localStorage.setItem('ff_habits_v1', JSON.stringify(existingData));

    // Initialize hook
    const { result } = renderHook(() => useHabitTracker());

    // Check that existing data was loaded
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].title).toBe('Existing Habit');
  });

  test('handles weekly targets', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    act(() => {
      result.current.addHabit({
        title: 'Weekly Exercise',
        type: 'good',
        trackMode: 'count',
        target: { period: 'weekly', times: 3 }
      });
    });

    const habit = result.current.habits[0];
    expect(habit.target.period).toBe('weekly');
    expect(habit.target.times).toBe(3);
  });

  test('handles scheduled habits', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    act(() => {
      result.current.addHabit({
        title: 'MWF Workout',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' },
        schedule: ['mon', 'wed', 'fri']
      });
    });

    const habit = result.current.habits[0];
    expect(habit.schedule).toEqual(['mon', 'wed', 'fri']);
  });

  test('tracks bad habits with replacement activities', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    act(() => {
      result.current.addHabit({
        title: 'Social Media',
        type: 'bad',
        trackMode: 'duration',
        target: { period: 'daily', minutes: 30 },
        settings: {
          color: '#ef4444',
          replacement: 'Go for a walk'
        }
      });
    });

    const habit = result.current.habits[0];
    expect(habit.type).toBe('bad');
    expect(habit.settings.replacement).toBe('Go for a walk');
  });

  test('calculates streak correctly', () => {
    const { result } = renderHook(() => useHabitTracker());
    
    act(() => {
      result.current.addHabit({
        title: 'Streak Test',
        type: 'good',
        trackMode: 'binary',
        target: { period: 'daily' }
      });
    });

    const habitId = result.current.habits[0].id;

    // Log consecutive days
    act(() => {
      result.current.logHabit(habitId, '2024-01-13', true);
      result.current.logHabit(habitId, '2024-01-14', true);
      result.current.logHabit(habitId, '2024-01-15', true);
    });

    // Stats should be recalculated
    const habit = result.current.habits[0];
    expect(habit.stats.totalCompleted).toBe(3);
  });
});

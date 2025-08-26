/**
 * Demo data generator for Habit Tracker
 */

import { Habit, HabitType, TrackMode } from '../types/habit';

const generateLogs = (days: number, consistency: number, trackMode: TrackMode, target?: number) => {
  const logs: Record<string, number> = {};
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (Math.random() < consistency) {
      if (trackMode === 'binary') {
        logs[dateStr] = 1;
      } else if (trackMode === 'count' && target) {
        logs[dateStr] = Math.floor(Math.random() * (target * 1.5)) + 1;
      } else if (trackMode === 'duration' && target) {
        logs[dateStr] = Math.floor(Math.random() * (target * 1.5)) + 5;
      }
    } else {
      logs[dateStr] = 0;
    }
  }
  
  return logs;
};

export const DEMO_HABITS: Habit[] = [
  {
    id: 'demo-1',
    title: 'Morning Meditation',
    type: 'good',
    trackMode: 'duration',
    target: { period: 'daily', minutes: 20 },
    logs: generateLogs(60, 0.7, 'duration', 20),
    settings: { color: '#8b5cf6' },
    difficulty: 3,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      currentStreak: 7,
      bestStreak: 21,
      consistency: 0.7,
      totalCompleted: 42
    }
  },
  {
    id: 'demo-2',
    title: 'Read Technical Books',
    type: 'good',
    trackMode: 'duration',
    target: { period: 'daily', minutes: 30 },
    logs: generateLogs(45, 0.8, 'duration', 30),
    settings: { color: '#3b82f6' },
    difficulty: 2,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      currentStreak: 12,
      bestStreak: 15,
      consistency: 0.8,
      totalCompleted: 36
    }
  },
  {
    id: 'demo-3',
    title: 'Exercise',
    type: 'good',
    trackMode: 'binary',
    target: { period: 'daily' },
    schedule: ['mon', 'wed', 'fri'],
    logs: generateLogs(90, 0.85, 'binary'),
    settings: { color: '#10b981' },
    difficulty: 4,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      currentStreak: 5,
      bestStreak: 30,
      consistency: 0.85,
      totalCompleted: 38
    }
  },
  {
    id: 'demo-4',
    title: 'Drink Water',
    type: 'good',
    trackMode: 'count',
    target: { period: 'daily', times: 8 },
    logs: generateLogs(30, 0.9, 'count', 8),
    settings: { color: '#06b6d4' },
    difficulty: 1,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      currentStreak: 14,
      bestStreak: 14,
      consistency: 0.9,
      totalCompleted: 27
    }
  },
  {
    id: 'demo-5',
    title: 'Social Media Scrolling',
    type: 'bad',
    trackMode: 'duration',
    target: { period: 'daily', minutes: 30 },
    logs: generateLogs(30, 0.6, 'duration', 30),
    settings: { 
      color: '#ef4444',
      replacement: 'Go for a walk or read a book'
    },
    difficulty: 5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      currentStreak: 3,
      bestStreak: 7,
      consistency: 0.4, // Lower is better for bad habits
      totalCompleted: 12
    }
  },
  {
    id: 'demo-6',
    title: 'Late Night Snacking',
    type: 'bad',
    trackMode: 'binary',
    target: { period: 'daily' },
    logs: generateLogs(45, 0.3, 'binary'),
    settings: { 
      color: '#f59e0b',
      replacement: 'Drink herbal tea instead'
    },
    difficulty: 4,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      currentStreak: 8,
      bestStreak: 12,
      consistency: 0.3,
      totalCompleted: 14
    }
  }
];

export const loadDemoData = () => {
  const storageKey = 'ff_habits_v1';
  const existingData = localStorage.getItem(storageKey);
  
  if (!existingData) {
    localStorage.setItem(storageKey, JSON.stringify({
      version: 1,
      habits: DEMO_HABITS,
      lastSync: new Date().toISOString()
    }));
    return true;
  }
  return false;
};

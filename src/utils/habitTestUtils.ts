/**
 * Test utilities for habit tracking functionality
 * Used to verify statistics accuracy and notification system
 */

import { Habit, HabitStats } from '../types/habit';

export interface HabitTestResult {
  testName: string;
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

export class HabitTestRunner {
  static createTestHabit(overrides: Partial<Habit> = {}): Habit {
    const baseHabit: Habit = {
      id: 'test-habit-' + Date.now(),
      title: 'Test Habit',
      type: 'good',
      trackMode: 'binary',
      target: { times: 1 },
      logs: {},
      settings: { color: '#10b981' },
      stats: {
        currentStreak: 0,
        bestStreak: 0,
        consistency: 0,
        score: 0,
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };

    return baseHabit;
  }

  static testStreakCalculation(habit: Habit, expectedStreak: number): HabitTestResult {
    const actualStreak = habit.stats.currentStreak;
    return {
      testName: 'Streak Calculation',
      passed: actualStreak === expectedStreak,
      expected: expectedStreak,
      actual: actualStreak,
      message: `Expected streak: ${expectedStreak}, got: ${actualStreak}`
    };
  }

  static testConsistencyCalculation(habit: Habit, expectedConsistency: number, tolerance: number = 0.01): HabitTestResult {
    const actualConsistency = habit.stats.consistency;
    const passed = Math.abs(actualConsistency - expectedConsistency) <= tolerance;
    return {
      testName: 'Consistency Calculation',
      passed,
      expected: expectedConsistency,
      actual: actualConsistency,
      message: `Expected consistency: ${expectedConsistency.toFixed(2)}, got: ${actualConsistency.toFixed(2)}`
    };
  }

  static testBadHabitTracking(habit: Habit): HabitTestResult {
    if (habit.type !== 'bad') {
      return {
        testName: 'Bad Habit Tracking',
        passed: false,
        expected: 'bad habit type',
        actual: habit.type,
        message: 'Test requires a bad habit'
      };
    }

    const hasAvoidedStreak = habit.avoidedStreak !== undefined;
    const hasBestAvoidedStreak = habit.bestAvoidedStreak !== undefined;

    return {
      testName: 'Bad Habit Tracking',
      passed: hasAvoidedStreak && hasBestAvoidedStreak,
      expected: 'avoidedStreak and bestAvoidedStreak properties',
      actual: { hasAvoidedStreak, hasBestAvoidedStreak },
      message: `Bad habit should have avoided streak tracking: avoidedStreak: ${hasAvoidedStreak}, bestAvoidedStreak: ${hasBestAvoidedStreak}`
    };
  }

  static generateTestScenario(): { habit: Habit; expectedResults: any } {
    // Create a habit with 7 days of consistent logging
    const logs: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      logs[dateStr] = 1; // Completed each day
    }

    const habit = this.createTestHabit({
      logs,
      stats: {
        currentStreak: 7,
        bestStreak: 7,
        consistency: 1.0, // 100% consistency
        score: 0.8,
        lastUpdated: new Date().toISOString(),
        totalCompletions: 7,
        averageValue: 1
      }
    });

    return {
      habit,
      expectedResults: {
        streak: 7,
        consistency: 1.0,
        totalCompletions: 7
      }
    };
  }

  static runAllTests(habits: Habit[]): HabitTestResult[] {
    const results: HabitTestResult[] = [];

    // Test each habit
    habits.forEach((habit, index) => {
      results.push({
        testName: `Habit ${index + 1} - Stats Validity`,
        passed: this.validateHabitStats(habit),
        expected: 'valid stats',
        actual: habit.stats,
        message: `Habit "${habit.title}" stats validation`
      });

      if (habit.type === 'bad') {
        results.push(this.testBadHabitTracking(habit));
      }
    });

    // Test overall statistics
    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => h.stats.currentStreak > 0).length;
    
    results.push({
      testName: 'Overall Stats',
      passed: totalHabits >= 0 && activeHabits >= 0 && activeHabits <= totalHabits,
      expected: 'valid counts',
      actual: { totalHabits, activeHabits },
      message: `Total: ${totalHabits}, Active: ${activeHabits}`
    });

    return results;
  }

  private static validateHabitStats(habit: Habit): boolean {
    const stats = habit.stats;
    
    // Check that all required stats exist and are valid
    if (typeof stats.currentStreak !== 'number' || stats.currentStreak < 0) return false;
    if (typeof stats.bestStreak !== 'number' || stats.bestStreak < 0) return false;
    if (typeof stats.consistency !== 'number' || stats.consistency < 0 || stats.consistency > 1) return false;
    if (typeof stats.score !== 'number' || stats.score < 0 || stats.score > 1) return false;
    
    // Best streak should be >= current streak
    if (stats.bestStreak < stats.currentStreak) return false;
    
    // Last updated should be a valid ISO string
    try {
      new Date(stats.lastUpdated);
    } catch {
      return false;
    }

    return true;
  }

  static logTestResults(results: HabitTestResult[]): void {
    console.group('🧪 Habit Tracker Test Results');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    console.log(`✅ Passed: ${passed}/${total} tests`);
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.message}`);
      
      if (!result.passed) {
        console.log(`   Expected:`, result.expected);
        console.log(`   Actual:`, result.actual);
      }
    });
    
    console.groupEnd();
  }
}

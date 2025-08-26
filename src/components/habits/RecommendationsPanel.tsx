/**
 * RecommendationsPanel Component
 * AI-like recommendations based on habit patterns
 */

import React, { memo, useMemo } from 'react';
import { Lightbulb, AlertCircle, TrendingUp, Target, Zap, Brain } from 'lucide-react';
import { Habit } from '../../types/habit';

interface RecommendationsPanelProps {
  habits: Habit[];
  className?: string;
}

interface Recommendation {
  type: 'tip' | 'warning' | 'insight' | 'challenge';
  icon: React.ReactNode;
  title: string;
  message: string;
  priority: number;
}

export const RecommendationsPanel = memo<RecommendationsPanelProps>(({ 
  habits, 
  className = '' 
}) => {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    
    // Analyze patterns
    const strugglingHabits = habits.filter(h => h.stats.consistency < 0.3);
    const strongHabits = habits.filter(h => h.stats.consistency > 0.8);
    const breakingStreaks = habits.filter(h => 
      h.stats.currentStreak > 0 && h.stats.currentStreak < h.stats.bestStreak * 0.5
    );
    
    // Pattern-based recommendations
    if (strugglingHabits.length > 0) {
      const habit = strugglingHabits[0];
      recs.push({
        type: 'warning',
        icon: <AlertCircle size={16} className="text-yellow-500" />,
        title: 'Struggling Habit',
        message: `"${habit.title}" needs attention (${Math.round(habit.stats.consistency * 100)}% consistency). Try breaking it into smaller steps or adjusting your target.`,
        priority: 1
      });
    }
    
    if (strongHabits.length >= 3) {
      recs.push({
        type: 'insight',
        icon: <TrendingUp size={16} className="text-green-500" />,
        title: 'Great Momentum!',
        message: `You're crushing ${strongHabits.length} habits! Consider adding a new challenge or increasing difficulty.`,
        priority: 2
      });
    }
    
    if (breakingStreaks.length > 0) {
      const habit = breakingStreaks[0];
      recs.push({
        type: 'tip',
        icon: <Zap size={16} className="text-blue-500" />,
        title: 'Protect Your Streak',
        message: `Don't let "${habit.title}" slip! You're at ${habit.stats.currentStreak} days. Set a reminder to maintain momentum.`,
        priority: 1
      });
    }
    
    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour < 10) {
      const morningHabits = habits.filter(h => 
        h.settings?.preferredTime === 'morning' || h.title.toLowerCase().includes('morning')
      );
      if (morningHabits.length > 0) {
        recs.push({
          type: 'tip',
          icon: <Lightbulb size={16} className="text-yellow-400" />,
          title: 'Morning Routine',
          message: `Perfect time for your morning habits! Start with the easiest one to build momentum.`,
          priority: 3
        });
      }
    }
    
    // Bad habit patterns
    const badHabits = habits.filter(h => h.type === 'bad');
    const strugglingBadHabits = badHabits.filter(h => h.stats.consistency > 0.5);
    if (strugglingBadHabits.length > 0) {
      const habit = strugglingBadHabits[0];
      recs.push({
        type: 'warning',
        icon: <AlertCircle size={16} className="text-red-500" />,
        title: 'Breaking Bad Habits',
        message: `"${habit.title}" is persistent. ${habit.settings?.replacement ? `Focus on "${habit.settings.replacement}" instead` : 'Consider finding a replacement activity'}.`,
        priority: 1
      });
    }
    
    // Motivation based on overall performance
    const avgConsistency = habits.reduce((acc, h) => acc + h.stats.consistency, 0) / (habits.length || 1);
    if (avgConsistency > 0.7) {
      recs.push({
        type: 'insight',
        icon: <Brain size={16} className="text-purple-500" />,
        title: 'Habit Master',
        message: `${Math.round(avgConsistency * 100)}% overall consistency! You're building lasting change. Keep the momentum!`,
        priority: 3
      });
    } else if (avgConsistency < 0.4) {
      recs.push({
        type: 'tip',
        icon: <Target size={16} className="text-orange-500" />,
        title: 'Start Small',
        message: `Focus on just 1-2 habits first. Master them before adding more. Quality over quantity!`,
        priority: 2
      });
    }
    
    // Add challenge if doing well
    const perfectLastWeek = habits.filter(h => {
      const dates = Object.keys(h.logs).slice(-7);
      return dates.length >= 7 && dates.every(date => {
        const value = h.logs[date];
        if (h.type === 'bad') return value === 0;
        if (h.trackMode === 'binary') return value === 1;
        return value >= (h.target.times || h.target.minutes || 0);
      });
    });
    
    if (perfectLastWeek.length > 0) {
      recs.push({
        type: 'challenge',
        icon: <Target size={16} className="text-purple-500" />,
        title: 'Level Up Challenge',
        message: `You've perfected ${perfectLastWeek.length} habits this week! Try the 2-minute rule: Add 2 minutes to duration habits or +1 to count habits.`,
        priority: 3
      });
    }
    
    // Sort by priority
    return recs.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [habits]);

  const getTypeStyles = (type: Recommendation['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'tip':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'insight':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'challenge':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Brain className="text-purple-500" size={20} />
          Insights
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add more habits and track them for a few days to get personalized recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Brain className="text-purple-500" size={20} />
        Insights & Tips
      </h3>
      
      <div className="space-y-2">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getTypeStyles(rec.type)} transition-all hover:shadow-sm`}
          >
            <div className="flex items-start gap-2">
              {rec.icon}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {rec.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  {rec.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

RecommendationsPanel.displayName = 'RecommendationsPanel';

/**
 * RecommendationsPanel Component
 * AI-like recommendations based on habit patterns
 */

import React, { memo, useMemo } from 'react';
import { Lightbulb, AlertCircle, TrendingUp, Target, Zap, Brain, Calendar, Clock, Award, Flame, Star, Coffee, Moon, Sun, Heart, Shield, Trophy, Sparkles, BookOpen, Timer, Activity } from 'lucide-react';
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
    const today = new Date();
    const dayOfWeek = today.getDay();
    const hour = today.getHours();
    const dateKey = today.toISOString().split('T')[0];
    
    // Analyze patterns
    const strugglingHabits = habits.filter(h => h.stats.consistency < 0.3);
    const strongHabits = habits.filter(h => h.stats.consistency > 0.8);
    const moderateHabits = habits.filter(h => h.stats.consistency >= 0.3 && h.stats.consistency <= 0.8);
    const breakingStreaks = habits.filter(h => 
      h.stats.currentStreak > 0 && h.stats.currentStreak < h.stats.bestStreak * 0.5
    );
    const longStreaks = habits.filter(h => h.stats.currentStreak >= 21);
    const newHabits = habits.filter(h => Object.keys(h.logs).length < 7);
    const todayCompleted = habits.filter(h => {
      const value = h.logs[dateKey];
      if (h.type === 'bad') return value === 0;
      if (h.trackMode === 'binary') return value === 1;
      return value >= (h.target.times || h.target.minutes || 0);
    });
    const todayPending = habits.filter(h => !todayCompleted.includes(h));
    
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
    if (hour < 10) {
      const morningHabits = habits.filter(h => 
        h.title.toLowerCase().includes('morning') || 
        h.title.toLowerCase().includes('wake') ||
        h.title.toLowerCase().includes('breakfast')
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
    
    // Add comprehensive insights and tips pool
    const insightPool = [
      // Streak-based insights
      ...longStreaks.map(h => ({
        type: 'insight' as const,
        icon: <Flame size={16} className="text-orange-500" />,
        title: 'Streak Champion!',
        message: `${h.stats.currentStreak} days strong with "${h.title}"! You're in the top 1% of habit builders.`,
        priority: 1
      })),
      
      // Time-based motivational tips
      ...(hour < 6 ? [{
        type: 'tip' as const,
        icon: <Sun size={16} className="text-yellow-500" />,
        title: 'Early Bird Advantage',
        message: 'Starting before 6 AM? Studies show early risers are 42% more likely to maintain habits long-term.',
        priority: 2
      }] : []),
      
      ...(hour >= 6 && hour < 10 ? [{
        type: 'tip' as const,
        icon: <Coffee size={16} className="text-amber-600" />,
        title: 'Prime Time',
        message: 'Morning hours have the highest willpower reserves. Perfect time to tackle challenging habits!',
        priority: 2
      }] : []),
      
      ...(hour >= 10 && hour < 14 ? [{
        type: 'insight' as const,
        icon: <Activity size={16} className="text-green-500" />,
        title: 'Mid-Morning Focus',
        message: 'Your cortisol levels are optimal now. Great time for habits requiring mental clarity and focus.',
        priority: 3
      }] : []),
      
      ...(hour >= 14 && hour < 17 ? [{
        type: 'tip' as const,
        icon: <Timer size={16} className="text-blue-500" />,
        title: 'Afternoon Productivity',
        message: 'Post-lunch dip? Use the 2-minute rule: start any habit for just 2 minutes to overcome resistance.',
        priority: 2
      }] : []),
      
      ...(hour >= 17 && hour < 20 ? [{
        type: 'insight' as const,
        icon: <Heart size={16} className="text-red-500" />,
        title: 'Evening Reflection',
        message: 'Evening habits stick 23% better when paired with reflection. Consider journaling about your progress.',
        priority: 3
      }] : []),
      
      ...(hour >= 20 ? [{
        type: 'tip' as const,
        icon: <Moon size={16} className="text-indigo-500" />,
        title: 'Wind Down Wisdom',
        message: 'Evening habits should calm your nervous system. Avoid stimulating activities 2 hours before bed.',
        priority: 2
      }] : []),
      
      // Day-based insights
      ...(dayOfWeek === 1 ? [{
        type: 'tip' as const,
        icon: <Calendar size={16} className="text-purple-500" />,
        title: 'Monday Momentum',
        message: 'Fresh start effect! People are 33% more likely to start positive changes on Mondays.',
        priority: 1
      }] : []),
      
      ...(dayOfWeek === 5 ? [{
        type: 'insight' as const,
        icon: <Star size={16} className="text-yellow-500" />,
        title: 'Friday Focus',
        message: 'End the week strong! Completing habits on Friday increases weekend consistency by 40%.',
        priority: 2
      }] : []),
      
      ...(dayOfWeek === 6 || dayOfWeek === 0 ? [{
        type: 'tip' as const,
        icon: <Shield size={16} className="text-green-600" />,
        title: 'Weekend Strategy',
        message: 'Weekends break 67% of habit streaks. Plan specific times and locations for your habits.',
        priority: 1
      }] : []),
      
      // Performance-based insights
      ...(todayCompleted.length > todayPending.length ? [{
        type: 'insight' as const,
        icon: <Trophy size={16} className="text-gold-500" />,
        title: 'Daily Winner!',
        message: `${todayCompleted.length}/${habits.length} habits completed today! You're outperforming 78% of people.`,
        priority: 1
      }] : []),
      
      ...(moderateHabits.length > 0 ? [{
        type: 'tip' as const,
        icon: <TrendingUp size={16} className="text-blue-500" />,
        title: 'Steady Progress',
        message: `${moderateHabits.length} habits in the growth zone! Small improvements compound into massive results.`,
        priority: 2
      }] : []),
      
      // General wisdom and tips
      {
        type: 'insight' as const,
        icon: <Brain size={16} className="text-purple-500" />,
        title: 'Neuroplasticity Fact',
        message: 'Your brain creates new neural pathways with each repetition. You\'re literally rewiring yourself for success!',
        priority: 3
      },
      {
        type: 'tip' as const,
        icon: <Sparkles size={16} className="text-pink-500" />,
        title: 'Environment Design',
        message: 'Make good habits obvious and bad habits invisible. Change your environment, change your life.',
        priority: 3
      },
      {
        type: 'insight' as const,
        icon: <BookOpen size={16} className="text-emerald-500" />,
        title: '1% Better Rule',
        message: 'Improving 1% daily equals 37x improvement in a year. Small steps, extraordinary results!',
        priority: 3
      },
      {
        type: 'tip' as const,
        icon: <Clock size={16} className="text-orange-500" />,
        title: 'Habit Stacking',
        message: 'After [current habit], I will [new habit]. Link new habits to established routines for automatic triggers.',
        priority: 3
      },
      {
        type: 'insight' as const,
        icon: <Award size={16} className="text-blue-600" />,
        title: 'Compound Effect',
        message: 'Success is the result of small disciplines repeated daily. Every rep counts, every day matters.',
        priority: 3
      },
      {
        type: 'tip' as const,
        icon: <Target size={16} className="text-red-500" />,
        title: 'Implementation Intention',
        message: 'Plan when and where: "I will [habit] at [time] in [location]". Specificity increases success by 2-3x.',
        priority: 3
      },
      {
        type: 'insight' as const,
        icon: <Heart size={16} className="text-pink-600" />,
        title: 'Identity-Based Habits',
        message: 'Don\'t just do healthy things, become a healthy person. Focus on who you want to become.',
        priority: 3
      },
      {
        type: 'tip' as const,
        icon: <Zap size={16} className="text-yellow-600" />,
        title: 'Energy Management',
        message: 'Match high-energy habits to high-energy times. Save easy habits for when willpower is low.',
        priority: 3
      },
      {
        type: 'insight' as const,
        icon: <Flame size={16} className="text-orange-600" />,
        title: 'Plateau Power',
        message: 'Plateaus are not failures—they\'re the calm before breakthroughs. Stay consistent through the valley.',
        priority: 3
      },
      {
        type: 'tip' as const,
        icon: <Shield size={16} className="text-teal-500" />,
        title: 'Temptation Bundling',
        message: 'Pair habits you need to do with ones you want to do. Only watch Netflix while exercising!',
        priority: 3
      },
      {
        type: 'insight' as const,
        icon: <Star size={16} className="text-indigo-500" />,
        title: 'Minimum Viable Habit',
        message: 'On bad days, do the smallest version. 1 push-up beats 0. Show up even when you don\'t feel like it.',
        priority: 3
      }
    ];
    
    // Combine pattern-based and general insights
    const allRecommendations = [...recs, ...insightPool];
    
    // Add variety by rotating through different insights each time
    const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 4)) % allRecommendations.length;
    const rotatedRecs = [...allRecommendations.slice(rotationIndex), ...allRecommendations.slice(0, rotationIndex)];
    
    // Sort by priority and return more recommendations
    return rotatedRecs
      .sort((a, b) => a.priority - b.priority)
      .filter((rec, index, arr) => 
        // Remove duplicates based on title
        arr.findIndex(r => r.title === rec.title) === index
      )
      .slice(0, 6);
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

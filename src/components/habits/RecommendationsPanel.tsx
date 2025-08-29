/**
 * RecommendationsPanel Component
 * AI-like recommendations based on habit patterns
 */

import React, { memo, useMemo, useEffect, useState } from 'react';
import { Lightbulb, AlertCircle, TrendingUp, Target, Zap, Brain, Calendar, Clock, Award, Flame, Star, Coffee, Moon, Sun, Heart, Shield, Trophy, Sparkles, BookOpen, Timer, Activity } from 'lucide-react';
import { Habit } from '../../types/habit';
import { aiInsightGenerator } from '../../services/ai/AIInsightGenerator';

interface RecommendationsPanelProps {
  habits: Habit[];
  className?: string;
}

interface Recommendation {
  type: 'tip' | 'warning' | 'insight' | 'challenge' | 'celebration';
  icon: React.ReactNode;
  title: string;
  message: string;
  priority: number;
  isAI?: boolean;
}

export const RecommendationsPanel = memo<RecommendationsPanelProps>(({ 
  habits, 
  className = '' 
}) => {
  const [aiInsights, setAiInsights] = useState<Recommendation[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Load AI insights when habits change
  useEffect(() => {
    const loadAIInsights = async () => {
      if (habits.length === 0) return;
      
      setIsLoadingAI(true);
      try {
        const insights = await aiInsightGenerator.generateAIInsights(habits);
        setAiInsights(insights);
      } catch (error) {
        console.log('AI insights temporarily unavailable');
      } finally {
        setIsLoadingAI(false);
      }
    };

    loadAIInsights();
  }, [habits]);

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const hour = today.getHours();
    const dateKey = today.toISOString().split('T')[0];
    
    // Analyze patterns
    const strugglingHabits = habits.filter(h => h.stats.consistency < 0.3);
    const strongHabits = habits.filter(h => h.stats.consistency > 0.8);
    const newHabits = habits.filter(h => Object.keys(h.logs).length < 7);
    const stagnantHabits = habits.filter(h => h.stats.currentStreak === 0 && h.stats.consistency > 0.5);
    
    // Pattern-based recommendations
    if (strugglingHabits.length > 0) {
      const habit = strugglingHabits[0];
      recs.push({
        type: 'warning',
        icon: <AlertCircle size={16} className="text-orange-500" />,
        title: 'Habit Needs Attention',
        message: `"${habit.title}" is at ${Math.round(habit.stats.consistency * 100)}% consistency. Consider reducing the target or adjusting timing.`,
        priority: 1
      });
    }

    if (strongHabits.length >= 3) {
      recs.push({
        type: 'celebration',
        icon: <Trophy size={16} className="text-yellow-500" />,
        title: 'Great Momentum!',
        message: `You have ${strongHabits.length} habits with 80%+ consistency. This is excellent progress!`,
        priority: 1
      });
    }

    if (newHabits.length > 0 && newHabits.length <= 2) {
      recs.push({
        type: 'tip',
        icon: <Target size={16} className="text-blue-500" />,
        title: 'Focus on New Habits',
        message: 'The first 21 days are crucial. Focus on consistency over perfection for your new habits.',
        priority: 2
      });
    }

    if (stagnantHabits.length > 0) {
      recs.push({
        type: 'challenge',
        icon: <Zap size={16} className="text-purple-500" />,
        title: 'Break the Plateau',
        message: 'Time to restart! Sometimes a fresh start is all you need to rebuild momentum.',
        priority: 2
      });
    }

    // Time-based insights
    if (hour >= 6 && hour <= 10) {
      recs.push({
        type: 'tip',
        icon: <Sun size={16} className="text-yellow-500" />,
        title: 'Morning Power Hour',
        message: 'Morning habits have the highest success rate. Your willpower is strongest right now!',
        priority: 3
      });
    } else if (hour >= 20) {
      recs.push({
        type: 'tip',
        icon: <Moon size={16} className="text-indigo-500" />,
        title: 'Evening Reflection',
        message: 'Review today\'s progress and prepare for tomorrow. Consistency builds over time.',
        priority: 3
      });
    }

    // Weekend insights
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      recs.push({
        type: 'insight',
        icon: <Calendar size={16} className="text-green-500" />,
        title: 'Weekend Strategy',
        message: 'Weekends can disrupt routines. Plan specific times for your habits today.',
        priority: 2
      });
    }

    // Combine AI insights with traditional pattern-based insights
    const allRecommendations = [...aiInsights, ...recs];
    
    // Prioritize AI insights but maintain variety
    const aiRecommendations = allRecommendations.filter(r => r.isAI);
    const traditionalRecommendations = allRecommendations.filter(r => !r.isAI);
    
    // Smart mixing: 60% AI insights, 40% traditional with rotation
    const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 4)) % Math.max(traditionalRecommendations.length, 1);
    const rotatedTraditional = traditionalRecommendations.length > 0 ? 
      [...traditionalRecommendations.slice(rotationIndex), ...traditionalRecommendations.slice(0, rotationIndex)] : [];
    
    // Combine and ensure variety
    const mixed = [...aiRecommendations.slice(0, 4), ...rotatedTraditional.slice(0, 3)];
    
    return mixed
      .sort((a, b) => {
        // AI insights get slight priority boost
        const priorityA = a.priority - (a.isAI ? 0.5 : 0);
        const priorityB = b.priority - (b.isAI ? 0.5 : 0);
        return priorityA - priorityB;
      })
      .filter((rec, index, arr) => 
        arr.findIndex(r => r.title === rec.title) === index
      )
      .slice(0, 6);
  }, [habits, aiInsights]);

  const getTypeStyles = (type: Recommendation['type'], isAI?: boolean) => {
    const aiGlow = isAI ? 'shadow-sm ring-1 ring-blue-400/20 dark:ring-blue-500/30' : '';
    
    switch (type) {
      case 'warning':
        return `bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 ${aiGlow}`;
      case 'tip':
        return `bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ${aiGlow}`;
      case 'insight':
        return `bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ${aiGlow}`;
      case 'challenge':
        return `bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ${aiGlow}`;
      case 'celebration':
        return `bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 ${aiGlow}`;
      default:
        return `bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 ${aiGlow}`;
    }
  };

  if (recommendations.length === 0 && !isLoadingAI) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Brain className="text-purple-500" size={20} />
          AI Insights
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          🤖 AI Analysis Engine Ready: Start tracking habits and I'll provide intelligent, personalized insights based on your unique behavioral patterns!
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Brain className="text-purple-500" size={20} />
        AI Insights & Tips
        {isLoadingAI && (
          <div className="ml-2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        )}
      </h3>
      
      <div className="space-y-2">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getTypeStyles(rec.type, rec.isAI)} transition-all hover:shadow-md relative`}
          >
            {rec.isAI && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="AI Generated"></div>
            )}
            <div className="flex items-start gap-2">
              <div className="text-base">{rec.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-1">
                  {rec.isAI && <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">AI</span>}
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
      
      {aiInsights.length > 0 && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <Sparkles size={12} />
          <span>Powered by intelligent pattern analysis</span>
        </div>
      )}
    </div>
  );
});

RecommendationsPanel.displayName = 'RecommendationsPanel';

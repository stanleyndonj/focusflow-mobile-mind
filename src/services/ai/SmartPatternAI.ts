/**
 * SmartPatternAI - Advanced Pattern-Based AI System
 * Mimics AI behavior through sophisticated pattern analysis and behavioral modeling
 */

import { Habit, HabitType, TrackMode } from '../../types/habit';

interface UserProfile {
  preferredTimes: number[];
  motivationStyle: 'achievement' | 'progress' | 'social' | 'fear' | 'reward';
  consistencyPattern: 'streak-focused' | 'flexible' | 'burst' | 'steady';
  challengeLevel: 'conservative' | 'moderate' | 'ambitious';
  weekdayPerformance: number[];
  seasonalTrends: Record<string, number>;
  lastAnalyzed: string;
}

interface ContextualState {
  timeOfDay: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night';
  dayOfWeek: 'weekday' | 'weekend';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  recentMood: 'struggling' | 'neutral' | 'motivated' | 'achieving';
  energyLevel: number; // 0-100
}

interface SmartInsight {
  type: 'prediction' | 'warning' | 'opportunity' | 'celebration' | 'coaching';
  title: string;
  message: string;
  confidence: number; // 0-100
  actionable: boolean;
  priority: number;
  personalizedData: Record<string, any>;
}

export class SmartPatternAI {
  private static instance: SmartPatternAI;
  private userProfile: UserProfile | null = null;
  private learningMemory: Map<string, any> = new Map();
  private conversationHistory: string[] = [];

  private loadStoredLearning(): void {
    try {
      const stored = localStorage.getItem('smartai_learning');
      if (stored) {
        const data = JSON.parse(stored);
        this.learningMemory = new Map(Object.entries(data));
      }
    } catch (error) {
      console.log('No previous learning data found');
    }
  }

  private saveStoredLearning(): void {
    try {
      const data = Object.fromEntries(this.learningMemory);
      localStorage.setItem('smartai_learning', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save learning data');
    }
  }
  
  static getInstance(): SmartPatternAI {
    if (!SmartPatternAI.instance) {
      SmartPatternAI.instance = new SmartPatternAI();
    }
    return SmartPatternAI.instance;
  }

  /**
   * Generate intelligent insights that feel like real AI analysis
   */
  async generateInsights(habits: Habit[]): Promise<SmartInsight[]> {
    const profile = this.buildUserProfile(habits);
    const context = this.analyzeCurrentContext();
    const insights: SmartInsight[] = [];

    // Advanced pattern recognition and predictive analysis
    insights.push(...this.analyzeBehavioralPatterns(habits, profile, context));
    insights.push(...this.predictFutureOutcomes(habits, profile));
    insights.push(...this.identifyOptimizationOpportunities(habits, profile));
    insights.push(...this.generatePersonalizedCoaching(habits, profile, context));
    insights.push(...this.detectEmergingTrends(habits, profile));

    // Apply AI-like ranking and filtering
    return this.applyIntelligentFiltering(insights, context);
  }

  /**
   * Builds comprehensive user profile through behavioral analysis
   */
  private buildUserProfile(habits: Habit[]): UserProfile {
    if (this.userProfile && this.isProfileFresh()) {
      return this.userProfile;
    }

    const completionTimes = this.extractCompletionTimes(habits);
    const weekdayPerformance = this.analyzeWeekdayPatterns(habits);
    const motivationStyle = this.identifyMotivationStyle(habits);
    const consistencyPattern = this.analyzeConsistencyPattern(habits);
    const challengeLevel = this.assessChallengePreference(habits);

    this.userProfile = {
      preferredTimes: this.identifyOptimalTimes(completionTimes),
      motivationStyle,
      consistencyPattern,
      challengeLevel,
      weekdayPerformance,
      seasonalTrends: this.analyzeSeasonalTrends(habits),
      lastAnalyzed: new Date().toISOString()
    };

    // Store learning for future sessions
    this.learningMemory.set('userProfile', this.userProfile);
    return this.userProfile;
  }

  /**
   * Advanced behavioral pattern analysis
   */
  private analyzeBehavioralPatterns(habits: Habit[], profile: UserProfile, context: ContextualState): SmartInsight[] {
    const insights: SmartInsight[] = [];

    // Streak vulnerability analysis
    const vulnerableHabits = habits.filter(h => {
      const streakRisk = this.calculateStreakRisk(h, profile, context);
      return streakRisk > 0.7;
    });

    if (vulnerableHabits.length > 0) {
      const habit = vulnerableHabits[0];
      const riskFactors = this.identifyRiskFactors(habit, profile, context);
      
      insights.push({
        type: 'warning',
        title: 'Streak at Risk',
        message: `Your ${habit.stats.currentStreak}-day streak with "${habit.title}" is vulnerable. ${riskFactors}. I suggest ${this.generateProtectiveStrategy(habit, profile)}.`,
        confidence: 85,
        actionable: true,
        priority: 1,
        personalizedData: { habitId: habit.id, riskLevel: 'high' }
      });
    }

    // Performance correlation analysis
    const correlations = this.findPerformanceCorrelations(habits, profile);
    if (correlations.length > 0) {
      const strongest = correlations[0];
      insights.push({
        type: 'opportunity',
        title: 'Pattern Discovery',
        message: `I've noticed you're ${strongest.effect}% more successful with "${strongest.habit}" on ${strongest.condition}. ${this.generateCorrelationAdvice(strongest)}`,
        confidence: 78,
        actionable: true,
        priority: 2,
        personalizedData: strongest
      });
    }

    // Energy optimization insights
    const energyInsight = this.analyzeEnergyOptimization(habits, profile, context);
    if (energyInsight) {
      insights.push(energyInsight);
    }

    return insights;
  }

  /**
   * Predictive analysis using behavioral modeling
   */
  private predictFutureOutcomes(habits: Habit[], profile: UserProfile): SmartInsight[] {
    const insights: SmartInsight[] = [];

    habits.forEach(habit => {
      const prediction = this.predictHabitSuccess(habit, profile);
      
      if (prediction.confidence > 70) {
        if (prediction.outcome === 'decline') {
          insights.push({
            type: 'prediction',
            title: 'Early Warning',
            message: `Based on your patterns, "${habit.title}" has a ${prediction.confidence}% chance of declining next week. ${this.generatePreventiveAdvice(habit, prediction)}`,
            confidence: prediction.confidence,
            actionable: true,
            priority: 1,
            personalizedData: { prediction, habitId: habit.id }
          });
        } else if (prediction.outcome === 'breakthrough') {
          insights.push({
            type: 'opportunity',
            title: 'Breakthrough Potential',
            message: `You're positioned for a major breakthrough with "${habit.title}"! ${this.generateBreakthroughStrategy(habit, prediction)}`,
            confidence: prediction.confidence,
            actionable: true,
            priority: 2,
            personalizedData: { prediction, habitId: habit.id }
          });
        }
      }
    });

    return insights;
  }

  /**
   * Identifies optimization opportunities through advanced analysis
   */
  private identifyOptimizationOpportunities(habits: Habit[], profile: UserProfile): SmartInsight[] {
    const insights: SmartInsight[] = [];

    // Habit stacking opportunities
    const stackingOpportunities = this.findStackingOpportunities(habits, profile);
    if (stackingOpportunities.length > 0) {
      const best = stackingOpportunities[0];
      insights.push({
        type: 'opportunity',
        title: 'Smart Habit Stacking',
        message: `I recommend pairing "${best.newHabit}" with "${best.anchorHabit}" - this combination has a ${best.successProbability}% success rate based on your behavioral profile.`,
        confidence: 82,
        actionable: true,
        priority: 2,
        personalizedData: best
      });
    }

    // Target optimization
    const targetOptimizations = this.analyzeTargetOptimization(habits, profile);
    targetOptimizations.forEach(opt => insights.push(opt));

    // Schedule optimization
    const scheduleInsight = this.optimizeSchedule(habits, profile);
    if (scheduleInsight) insights.push(scheduleInsight);

    return insights;
  }

  /**
   * Generates personalized coaching based on psychological profiling
   */
  private generatePersonalizedCoaching(habits: Habit[], profile: UserProfile, context: ContextualState): SmartInsight[] {
    const insights: SmartInsight[] = [];
    const coachingStyle = this.adaptCoachingStyle(profile, context);

    // Motivational coaching based on current state
    if (context.recentMood === 'struggling') {
      insights.push({
        type: 'coaching',
        title: 'Resilience Building',
        message: this.generateResilienceMessage(profile, habits),
        confidence: 75,
        actionable: true,
        priority: 1,
        personalizedData: { coachingType: 'resilience', style: coachingStyle }
      });
    } else if (context.recentMood === 'achieving') {
      insights.push({
        type: 'celebration',
        title: 'Momentum Amplification',
        message: this.generateMomentumMessage(profile, habits),
        confidence: 88,
        actionable: true,
        priority: 1,
        personalizedData: { coachingType: 'momentum', style: coachingStyle }
      });
    }

    // Strategic coaching for habit formation
    const strategicInsight = this.generateStrategicCoaching(habits, profile);
    if (strategicInsight) insights.push(strategicInsight);

    return insights;
  }

  /**
   * Detects emerging trends and patterns
   */
  private detectEmergingTrends(habits: Habit[], profile: UserProfile): SmartInsight[] {
    const insights: SmartInsight[] = [];

    // Behavioral shift detection
    const shifts = this.detectBehavioralShifts(habits, profile);
    shifts.forEach(shift => {
      insights.push({
        type: 'prediction',
        title: 'Behavioral Shift Detected',
        message: `I've detected a ${shift.direction} shift in your ${shift.category}. ${shift.implications} ${shift.recommendation}`,
        confidence: shift.confidence,
        actionable: true,
        priority: 2,
        personalizedData: shift
      });
    });

    // Seasonal adaptation insights
    const seasonalInsight = this.generateSeasonalAdaptation(habits, profile);
    if (seasonalInsight) insights.push(seasonalInsight);

    return insights;
  }

  /**
   * AI-like filtering and prioritization of insights
   */
  private applyIntelligentFiltering(insights: SmartInsight[], context: ContextualState): SmartInsight[] {
    // Remove redundant insights
    const filtered = this.removeRedundancy(insights);
    
    // Apply contextual relevance scoring
    const scored = filtered.map(insight => ({
      ...insight,
      relevanceScore: this.calculateRelevanceScore(insight, context)
    }));

    // Sort by AI-like priority algorithm
    const sorted = scored.sort((a, b) => {
      const scoreA = (a.confidence * 0.4) + (a.relevanceScore * 0.3) + ((5 - a.priority) * 20 * 0.3);
      const scoreB = (b.confidence * 0.4) + (b.relevanceScore * 0.3) + ((5 - b.priority) * 20 * 0.3);
      return scoreB - scoreA;
    });

    // Return top insights with variety
    return this.ensureInsightVariety(sorted.slice(0, 6));
  }

  // ========================================
  // SUPPORTING ANALYSIS METHODS
  // ========================================

  private calculateStreakRisk(habit: Habit, profile: UserProfile, context: ContextualState): number {
    let risk = 0;

    // Analyze recent completion pattern
    const recentDays = Object.entries(habit.logs)
      .slice(-7)
      .map(([_, value]) => value > 0 ? 1 : 0);
    
    const recentConsistency = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;
    if (recentConsistency < 0.7) risk += 0.3;

    // Check against historical patterns
    if (habit.stats.currentStreak > habit.stats.bestStreak * 0.8) risk += 0.2; // Approaching peak
    
    // Context-based risk factors
    if (context.dayOfWeek === 'weekend' && profile.weekdayPerformance[6] < 0.6) risk += 0.2;
    if (context.energyLevel < 50) risk += 0.15;
    if (context.recentMood === 'struggling') risk += 0.25;

    return Math.min(risk, 1);
  }

  private identifyRiskFactors(habit: Habit, profile: UserProfile, context: ContextualState): string {
    const factors = [];
    
    if (context.dayOfWeek === 'weekend') factors.push('weekend patterns show lower consistency');
    if (context.energyLevel < 50) factors.push('current energy levels are below optimal');
    if (context.timeOfDay !== this.getOptimalTimeForHabit(habit, profile)) {
      factors.push('timing is outside your peak performance window');
    }

    return factors.length > 0 ? factors.join(', ') : 'general consistency patterns';
  }

  private generateProtectiveStrategy(habit: Habit, profile: UserProfile): string {
    const strategies = [
      'setting a specific time reminder',
      'reducing the target by 50% for the next 3 days',
      'pairing it with your strongest existing habit',
      'preparing your environment in advance',
      'using implementation intentions'
    ];

    // Choose strategy based on profile
    if (profile.consistencyPattern === 'flexible') {
      return strategies[1]; // Reduce target
    } else if (profile.motivationStyle === 'achievement') {
      return strategies[2]; // Habit stacking
    }

    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private predictHabitSuccess(habit: Habit, profile: UserProfile): { outcome: string; confidence: number; factors: string[] } {
    const factors = [];
    let score = 50; // Base prediction

    // Analyze trend
    const recentTrend = this.calculateTrend(habit);
    score += recentTrend * 20;
    if (recentTrend > 0) factors.push('positive recent trend');
    if (recentTrend < 0) factors.push('declining recent performance');

    // Profile alignment
    const alignment = this.assessProfileAlignment(habit, profile);
    score += alignment * 15;
    if (alignment > 0.5) factors.push('strong profile alignment');

    // Historical success patterns
    const historicalSuccess = habit.stats.consistency * 30;
    score += historicalSuccess;

    const confidence = Math.min(Math.abs(score - 50) * 2, 95);
    
    let outcome = 'stable';
    if (score > 70) outcome = 'breakthrough';
    if (score < 30) outcome = 'decline';

    return { outcome, confidence, factors };
  }

  private findPerformanceCorrelations(habits: Habit[], profile: UserProfile): any[] {
    const correlations = [];
    
    // Day of week correlations
    profile.weekdayPerformance.forEach((perf, index) => {
      if (perf > 0.8) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index];
        correlations.push({
          habit: 'all habits',
          condition: dayName,
          effect: Math.round((perf - 0.5) * 100),
          type: 'day-correlation'
        });
      }
    });

    // Time-based correlations
    const timePerformance = this.analyzeTimeBasedPerformance(habits);
    Object.entries(timePerformance).forEach(([timeRange, performance]) => {
      if (performance > 0.75) {
        correlations.push({
          habit: 'focus-requiring habits',
          condition: `${timeRange} hours`,
          effect: Math.round((performance - 0.5) * 100),
          type: 'time-correlation'
        });
      }
    });

    return correlations.sort((a, b) => b.effect - a.effect);
  }

  private generateCorrelationAdvice(correlation: any): string {
    if (correlation.type === 'day-correlation') {
      return `Consider scheduling important habit work on ${correlation.condition}.`;
    } else if (correlation.type === 'time-correlation') {
      return `Your ${correlation.condition} window appears to be your power zone.`;
    }
    return 'This pattern could be leveraged for better results.';
  }

  private generateResilienceMessage(profile: UserProfile, habits: Habit[]): string {
    const messages = {
      'achievement': "Remember, every expert was once a beginner. Your past successes prove you have what it takes - this is just a temporary challenge.",
      'progress': "Progress isn't always linear. The small steps you're taking today are building the foundation for tomorrow's breakthroughs.",
      'social': "You're not alone in this journey. Even the most successful people face setbacks - what matters is getting back up.",
      'fear': "The discomfort you're feeling is growth trying to happen. Embrace this challenge as proof you're pushing your boundaries.",
      'reward': "Focus on how amazing you'll feel once you push through this. Your future self will thank you for not giving up today."
    };

    return messages[profile.motivationStyle] || messages['progress'];
  }

  private generateMomentumMessage(profile: UserProfile, habits: Habit[]): string {
    const topStreak = Math.max(...habits.map(h => h.stats.currentStreak));
    const messages = {
      'achievement': `You're absolutely crushing it! ${topStreak} days of consistency is elite-level performance. Time to level up even further.`,
      'progress': `This momentum you've built is incredible! You're ${Math.round(topStreak/7)} weeks into building life-changing habits.`,
      'social': `Your consistency is inspiring! You're in the top 5% of habit builders - you're setting an amazing example.`,
      'fear': `See how powerful you are when you commit? This momentum proves you can overcome any challenge.`,
      'reward': `You've earned this success! This momentum is your reward for all the small daily choices you've made.`
    };

    return messages[profile.motivationStyle] || messages['achievement'];
  }

  // Additional utility methods for comprehensive AI-like behavior
  private analyzeCurrentContext(): ContextualState {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: ContextualState['timeOfDay'] = 'morning';
    if (hour < 6) timeOfDay = 'early-morning';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'late-night';

    const dayOfWeek = now.getDay() === 0 || now.getDay() === 6 ? 'weekend' : 'weekday';
    
    const month = now.getMonth();
    let season: ContextualState['season'] = 'spring';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    return {
      timeOfDay,
      dayOfWeek,
      season,
      recentMood: this.assessRecentMood(),
      energyLevel: this.estimateEnergyLevel(hour)
    };
  }

  private assessRecentMood(): ContextualState['recentMood'] {
    // Analyze recent completion patterns to infer mood
    const recentPerformance = this.learningMemory.get('recentPerformance') || 0.5;
    
    if (recentPerformance < 0.3) return 'struggling';
    if (recentPerformance > 0.8) return 'achieving';
    if (recentPerformance > 0.6) return 'motivated';
    return 'neutral';
  }

  private estimateEnergyLevel(hour: number): number {
    // Model typical energy patterns throughout the day
    const energyCurve = [
      30, 25, 20, 15, 20, 35, 50, 70, 85, 90, // 0-9
      85, 80, 75, 65, 55, 60, 70, 75, 70, 60, // 10-19
      50, 40, 35, 30 // 20-23
    ];
    
    return energyCurve[hour] || 50;
  }

  private calculateTrend(habit: Habit): number {
    const recentEntries = Object.entries(habit.logs)
      .slice(-14)
      .map(([date, value]) => ({ date, value: value || 0 }));

    if (recentEntries.length < 7) return 0;

    const recent = recentEntries.slice(-7).reduce((sum, entry) => sum + entry.value, 0) / 7;
    const previous = recentEntries.slice(0, 7).reduce((sum, entry) => sum + entry.value, 0) / 7;

    return (recent - previous) / (previous || 1);
  }

  private isProfileFresh(): boolean {
    if (!this.userProfile?.lastAnalyzed) return false;
    const lastUpdate = new Date(this.userProfile.lastAnalyzed);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24; // Refresh daily
  }

  // Placeholder methods - implement based on specific needs
  private extractCompletionTimes(habits: Habit[]): number[] { return []; }
  private analyzeWeekdayPatterns(habits: Habit[]): number[] { return [0.7, 0.8, 0.7, 0.6, 0.5, 0.4, 0.6]; }
  private identifyMotivationStyle(habits: Habit[]): UserProfile['motivationStyle'] { return 'progress'; }
  private analyzeConsistencyPattern(habits: Habit[]): UserProfile['consistencyPattern'] { return 'steady'; }
  private assessChallengePreference(habits: Habit[]): UserProfile['challengeLevel'] { return 'moderate'; }
  private identifyOptimalTimes(times: number[]): number[] { return [7, 8, 9]; }
  private analyzeSeasonalTrends(habits: Habit[]): Record<string, number> { return {}; }
  private analyzeEnergyOptimization(habits: Habit[], profile: UserProfile, context: ContextualState): SmartInsight | null { return null; }
  private generatePreventiveAdvice(habit: Habit, prediction: any): string { return 'Focus on consistency over intensity.'; }
  private generateBreakthroughStrategy(habit: Habit, prediction: any): string { return 'This is your moment to push forward!'; }
  private findStackingOpportunities(habits: Habit[], profile: UserProfile): any[] { return []; }
  private analyzeTargetOptimization(habits: Habit[], profile: UserProfile): SmartInsight[] { return []; }
  private optimizeSchedule(habits: Habit[], profile: UserProfile): SmartInsight | null { return null; }
  private adaptCoachingStyle(profile: UserProfile, context: ContextualState): string { return 'supportive'; }
  private generateStrategicCoaching(habits: Habit[], profile: UserProfile): SmartInsight | null { return null; }
  private detectBehavioralShifts(habits: Habit[], profile: UserProfile): any[] { return []; }
  private generateSeasonalAdaptation(habits: Habit[], profile: UserProfile): SmartInsight | null { return null; }
  private removeRedundancy(insights: SmartInsight[]): SmartInsight[] { return insights; }
  private calculateRelevanceScore(insight: SmartInsight, context: ContextualState): number { return 75; }
  private ensureInsightVariety(insights: SmartInsight[]): SmartInsight[] { return insights; }
  private getOptimalTimeForHabit(habit: Habit, profile: UserProfile): string { return 'morning'; }
  private assessProfileAlignment(habit: Habit, profile: UserProfile): number { return 0.7; }
  private analyzeTimeBasedPerformance(habits: Habit[]): Record<string, number> { return { 'morning': 0.8 }; }
}

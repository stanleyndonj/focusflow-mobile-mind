import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Calendar, 
  Coins, 
  Target,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import { useTimer } from '@/contexts/TimerContext';

interface DayStreakTrackerProps {
  className?: string;
}

const DayStreakTracker: React.FC<DayStreakTrackerProps> = ({ className = '' }) => {
  const { 
    dayStreak, 
    updateDayStreak, 
    saveStreakWithCoins, 
    resetDayStreak,
    completeDailyGoal,
    checkDailyProgress,
    gameStats
  } = useGame();
  
  const { state: taskState } = useTasks();
  const { state: timerState } = useTimer();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [todayProgress, setTodayProgress] = useState({ tasks: 0, focusMinutes: 0 });

  // Calculate today's progress
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = taskState.tasks.filter(task => 
      task.createdAt.startsWith(today) || 
      (task.completedAt && task.completedAt.startsWith(today))
    );
    const completedTasks = todaysTasks.filter(task => task.completed).length;
    const totalFocusTime = todaysTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
    const focusMinutes = Math.round(totalFocusTime / (1000 * 60));

    setTodayProgress({ tasks: completedTasks, focusMinutes });

    // Check if daily goal is met
    const goalMet = dayStreak.requiredDailyGoal.anyActivity 
      ? (completedTasks > 0 || focusMinutes > 0)
      : (completedTasks >= (dayStreak.requiredDailyGoal.tasksCompleted || 1) && 
         focusMinutes >= (dayStreak.requiredDailyGoal.focusMinutes || 25));

    if (goalMet && !dayStreak.todayCompleted) {
      completeDailyGoal();
      updateDayStreak();
    }
  }, [
    taskState.tasks, 
    dayStreak.requiredDailyGoal, 
    dayStreak.todayCompleted,
    completeDailyGoal,
    updateDayStreak
  ]);

  // Check for streak break and show save prompt
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dayStreak.lastActiveDate && 
        dayStreak.lastActiveDate !== today && 
        dayStreak.lastActiveDate !== yesterday &&
        dayStreak.currentStreak > 0 &&
        dayStreak.canSaveStreak &&
        gameStats.coins >= dayStreak.streakSaveCost) {
      setShowSavePrompt(true);
    }
  }, [
    dayStreak.lastActiveDate, 
    dayStreak.currentStreak, 
    dayStreak.canSaveStreak,
    dayStreak.streakSaveCost,
    gameStats.coins
  ]);

  const handleSaveStreak = () => {
    const success = saveStreakWithCoins();
    if (success) {
      setShowSavePrompt(false);
    }
  };

  const handleDeclineStreak = () => {
    resetDayStreak();
    setShowSavePrompt(false);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-blue-500';
    if (streak >= 7) return 'text-green-500';
    if (streak >= 3) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { label: 'Legend', color: 'bg-purple-500' };
    if (streak >= 14) return { label: 'Champion', color: 'bg-blue-500' };
    if (streak >= 7) return { label: 'Warrior', color: 'bg-green-500' };
    if (streak >= 3) return { label: 'Fighter', color: 'bg-yellow-500' };
    return { label: 'Beginner', color: 'bg-gray-500' };
  };

  const streakBadge = getStreakBadge(dayStreak.currentStreak);
  const progressPercentage = dayStreak.requiredDailyGoal.anyActivity 
    ? (todayProgress.tasks > 0 || todayProgress.focusMinutes > 0 ? 100 : 0)
    : Math.min(
        ((todayProgress.tasks / (dayStreak.requiredDailyGoal.tasksCompleted || 1)) * 50) +
        ((todayProgress.focusMinutes / (dayStreak.requiredDailyGoal.focusMinutes || 25)) * 50),
        100
      );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Save Streak Prompt */}
      <AnimatePresence>
        {showSavePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-1">
                      Streak in Danger!
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your {dayStreak.currentStreak}-day streak is about to break. 
                      Save it for {dayStreak.streakSaveCost} coins?
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveStreak}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Coins className="w-4 h-4 mr-1" />
                        Save ({dayStreak.streakSaveCost})
                      </Button>
                      <Button 
                        onClick={handleDeclineStreak}
                        variant="outline" 
                        size="sm"
                      >
                        Reset Streak
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Streak Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${getStreakColor(dayStreak.currentStreak)}`} />
            Day Streak
            <Badge className={`ml-auto ${streakBadge.color} text-white`}>
              {streakBadge.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Streak */}
          <div className="text-center">
            <motion.div
              key={dayStreak.currentStreak}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-4xl font-bold ${getStreakColor(dayStreak.currentStreak)}`}
            >
              {dayStreak.currentStreak}
            </motion.div>
            <div className="text-sm text-muted-foreground">
              Current Streak
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-lg font-bold text-purple-500">
                {dayStreak.longestStreak}
              </div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-lg font-bold text-blue-500">
                {dayStreak.streakSavedWithCoins}
              </div>
              <div className="text-xs text-muted-foreground">Times Saved</div>
            </div>
          </div>

          {/* Today's Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Goal</span>
              <Badge variant={dayStreak.todayCompleted ? "default" : "outline"}>
                {dayStreak.todayCompleted ? 'Complete' : 'In Progress'}
              </Badge>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{todayProgress.tasks} tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{todayProgress.focusMinutes} min</span>
              </div>
            </div>
          </div>

          {/* Goal Requirements */}
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Daily Goal Requirements:
            </div>
            {dayStreak.requiredDailyGoal.anyActivity ? (
              <div className="text-sm">Complete any task or focus session</div>
            ) : (
              <div className="space-y-1 text-sm">
                {dayStreak.requiredDailyGoal.tasksCompleted && (
                  <div>• {dayStreak.requiredDailyGoal.tasksCompleted} tasks completed</div>
                )}
                {dayStreak.requiredDailyGoal.focusMinutes && (
                  <div>• {dayStreak.requiredDailyGoal.focusMinutes} minutes of focus</div>
                )}
              </div>
            )}
          </div>

          {/* Streak Save Info */}
          {dayStreak.currentStreak > 0 && (
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 dark:text-blue-400">
                  Streak save cost: {dayStreak.streakSaveCost} coins
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DayStreakTracker;

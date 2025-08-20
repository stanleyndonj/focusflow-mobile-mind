import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sword, 
  Trophy, 
  Target,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';

interface ShadowAnalyticsProps {
  onClose?: () => void;
}

interface TaskAnalysis {
  taskTitle: string;
  scheduledFor: string;
  completedAt?: string;
  shadowWon: boolean;
  minutesLate: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
}

const ShadowAnalytics: React.FC<ShadowAnalyticsProps> = ({ onClose }) => {
  const gameContext = useGame();
  const { shadowMode, shadowSessions } = gameContext;
  const { state } = useTasks();
  const { tasks } = state;
  
  const [taskAnalyses, setTaskAnalyses] = useState<TaskAnalysis[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ date: string; shadowWins: number; userWins: number }[]>([]);

  useEffect(() => {
    // Analyze all completed tasks for shadow duels
    const analyses: TaskAnalysis[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    tasks.forEach(task => {
      if (task.scheduledFor && task.completed) {
        const scheduledTime = new Date(task.scheduledFor);
        const completedTime = new Date(task.completedAt || task.updatedAt);
        const timeDiff = completedTime.getTime() - scheduledTime.getTime();
        const minutesLate = Math.floor(timeDiff / (60 * 1000));
        
        // Only include tasks from the last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (scheduledTime >= thirtyDaysAgo) {
          analyses.push({
            taskTitle: task.title,
            scheduledFor: task.scheduledFor,
            completedAt: task.completedAt,
            shadowWon: minutesLate > 15,
            minutesLate: Math.max(0, minutesLate),
            category: task.category,
            priority: task.priority,
            date: scheduledTime.toISOString().split('T')[0]
          });
        }
      }
    });

    // Sort by most recent first
    analyses.sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
    setTaskAnalyses(analyses);

    // Calculate weekly trend
    const trend: { [key: string]: { shadowWins: number; userWins: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trend[dateStr] = { shadowWins: 0, userWins: 0 };
    }

    analyses.forEach(analysis => {
      if (trend[analysis.date]) {
        if (analysis.shadowWon) {
          trend[analysis.date].shadowWins++;
        } else {
          trend[analysis.date].userWins++;
        }
      }
    });

    const trendArray = Object.entries(trend).map(([date, stats]) => ({
      date,
      ...stats
    }));
    setWeeklyTrend(trendArray);
  }, [tasks]);

  const totalDuels = taskAnalyses.length;
  const shadowWins = taskAnalyses.filter(t => t.shadowWon).length;
  const userWins = totalDuels - shadowWins;
  const winRate = totalDuels > 0 ? Math.round((userWins / totalDuels) * 100) : 0;
  
  // Calculate patterns
  const categoryStats = taskAnalyses.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = { total: 0, shadowWins: 0 };
    }
    acc[task.category].total++;
    if (task.shadowWon) acc[task.category].shadowWins++;
    return acc;
  }, {} as { [key: string]: { total: number; shadowWins: number } });

  const priorityStats = taskAnalyses.reduce((acc, task) => {
    if (!acc[task.priority]) {
      acc[task.priority] = { total: 0, shadowWins: 0 };
    }
    acc[task.priority].total++;
    if (task.shadowWon) acc[task.priority].shadowWins++;
    return acc;
  }, {} as { [key: string]: { total: number; shadowWins: number } });

  const averageLateness = taskAnalyses.length > 0 
    ? Math.round(taskAnalyses.reduce((sum, t) => sum + t.minutesLate, 0) / taskAnalyses.length)
    : 0;

  const mostProblematicCategory = Object.entries(categoryStats)
    .sort(([,a], [,b]) => (b.shadowWins / b.total) - (a.shadowWins / a.total))[0];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-full">
            <Sword className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Shadow Analytics</h2>
            <p className="text-muted-foreground">Deep insights into your shadow duels</p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{userWins}</div>
            <div className="text-sm text-muted-foreground">Your Wins</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="p-4 text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{shadowWins}</div>
            <div className="text-sm text-muted-foreground">Shadow Wins</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{winRate}%</div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{averageLateness}m</div>
            <div className="text-sm text-muted-foreground">Avg Lateness</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              7-Day Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weeklyTrend.map((day, index) => {
                const total = day.shadowWins + day.userWins;
                const userWinPercentage = total > 0 ? (day.userWins / total) * 100 : 0;
                const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
                
                return (
                  <div key={day.date} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{dayName}</div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                      {total > 0 && (
                        <>
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-green-500 transition-all duration-300"
                            style={{ height: `${userWinPercentage}%` }}
                          />
                          <div 
                            className="absolute top-0 left-0 right-0 bg-red-500 transition-all duration-300"
                            style={{ height: `${100 - userWinPercentage}%` }}
                          />
                        </>
                      )}
                    </div>
                    <div className="text-xs mt-1 font-semibold">
                      {day.userWins}/{total}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pattern Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const winRate = Math.round((stats.total - stats.shadowWins) / stats.total * 100);
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-xs text-muted-foreground">{winRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {winRate < 50 && (
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-red-600">Shadow Dominance</div>
                    <div className="text-xs text-muted-foreground">
                      Your shadow is winning {100 - winRate}% of duels. Consider setting more realistic schedules.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {mostProblematicCategory && mostProblematicCategory[1].total > 2 && (
              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-orange-600">Weak Category</div>
                    <div className="text-xs text-muted-foreground">
                      "{mostProblematicCategory[0]}" tasks need attention. Shadow wins {Math.round((mostProblematicCategory[1].shadowWins / mostProblematicCategory[1].total) * 100)}% here.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {averageLateness > 30 && (
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-600">Time Management</div>
                    <div className="text-xs text-muted-foreground">
                      You're averaging {averageLateness} minutes late. Try adding buffer time to schedules.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {winRate >= 70 && (
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-600">Shadow Slayer</div>
                    <div className="text-xs text-muted-foreground">
                      Excellent! You're dominating your shadow with a {winRate}% win rate.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Duels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Shadow Duels ({taskAnalyses.slice(0, 10).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {taskAnalyses.slice(0, 10).map((analysis, index) => (
                <motion.div
                  key={`${analysis.taskTitle}-${analysis.scheduledFor}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-3 rounded-lg border ${
                    analysis.shadowWon 
                      ? 'bg-red-500/5 border-red-500/20' 
                      : 'bg-green-500/5 border-green-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {analysis.shadowWon ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className="font-medium text-sm">{analysis.taskTitle}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            analysis.priority === 'high' ? 'border-red-500 text-red-600' :
                            analysis.priority === 'medium' ? 'border-yellow-500 text-yellow-600' :
                            'border-green-500 text-green-600'
                          }`}
                        >
                          {analysis.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Scheduled: {new Date(analysis.scheduledFor).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Category: {analysis.category} • {analysis.minutesLate > 0 ? `${analysis.minutesLate}m late` : 'On time'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        analysis.shadowWon ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {analysis.shadowWon ? 'Shadow Won' : 'You Won'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(analysis.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {taskAnalyses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sword className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <div className="text-sm">No shadow duels yet</div>
                  <div className="text-xs">Schedule some tasks to start battling your shadow!</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ShadowAnalytics;

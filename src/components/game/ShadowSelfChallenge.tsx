import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sword, Target, Zap, Crown, Timer, Calendar, Eye, BarChart3 } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import DuelSummary from './DuelSummary';

interface ShadowSelfChallengeProps {
  onClose?: () => void;
}

const ShadowSelfChallenge: React.FC<ShadowSelfChallengeProps> = ({ onClose }) => {
  const { 
    shadowChallenges, 
    gameStats, 
    todaysShadow, 
    dailyPrediction,
    createShadowChallenge, 
    completeShadowDuel,
    generateDailyPrediction 
  } = useGame();
  const { state } = useTasks();
  const { tasks } = state;

  const [showDuelAnimation, setShowDuelAnimation] = useState(false);
  const [duelResult, setDuelResult] = useState<any>(null);
  const [showDuelSummary, setShowDuelSummary] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Calculate actual performance for today
  const todaysTasks = tasks.filter(task => 
    task.createdAt.startsWith(today) || 
    (task.completedAt && task.completedAt.startsWith(today))
  );
  const actualTasksCompleted = todaysTasks.filter(task => task.completed).length;
  const actualFocusTime = todaysTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);

  // Generate prediction if none exists
  useEffect(() => {
    if (!todaysShadow && !dailyPrediction) {
      // Get past 7 days of data for prediction
      const pastDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i - 1);
        return date.toISOString().split('T')[0];
      });

      const pastTaskData = pastDays.map(date => {
        const dayTasks = tasks.filter(task => 
          task.createdAt.startsWith(date) || 
          (task.completedAt && task.completedAt.startsWith(date))
        );
        return {
          date,
          completed: dayTasks.filter(task => task.completed).length,
          total: dayTasks.length
        };
      });

      const pastFocusData = pastDays.map(date => {
        const dayTasks = tasks.filter(task => 
          task.createdAt.startsWith(date) || 
          (task.completedAt && task.completedAt.startsWith(date))
        );
        return dayTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
      });

      const prediction = generateDailyPrediction(pastTaskData, pastFocusData);
      createShadowChallenge(prediction);
    }
  }, [todaysShadow, dailyPrediction, tasks, generateDailyPrediction, createShadowChallenge]);

  const handleCompleteChallenge = () => {
    if (!todaysShadow) return;

    setShowDuelAnimation(true);
    
    setTimeout(() => {
      const result = completeShadowDuel(actualTasksCompleted, Math.round(actualFocusTime / 60));
      setDuelResult(result);
      setShowDuelAnimation(false);
    }, 2000);
  };

  const renderShadowAvatar = (isWinner: boolean) => (
    <div className={`relative w-16 h-16 rounded-full ${isWinner ? 'ring-4 ring-warning animate-pulse' : 'opacity-70'}`}>
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${isWinner ? 'from-warning to-warning/60' : 'from-muted to-muted/60'} flex items-center justify-center`}>
        <Sword className={`h-8 w-8 ${isWinner ? 'text-warning-foreground' : 'text-muted-foreground'}`} />
      </div>
      {isWinner && (
        <Crown className="absolute -top-2 -right-2 h-6 w-6 text-warning" />
      )}
    </div>
  );

  const renderUserAvatar = (isWinner: boolean) => (
    <div className={`relative w-16 h-16 rounded-full ${isWinner ? 'ring-4 ring-primary animate-pulse' : 'opacity-70'}`}>
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${isWinner ? 'from-primary to-primary/60' : 'from-muted to-muted/60'} flex items-center justify-center`}>
        <Target className={`h-8 w-8 ${isWinner ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
      </div>
      {isWinner && (
        <Crown className="absolute -top-2 -right-2 h-6 w-6 text-primary" />
      )}
    </div>
  );

  if (showDuelAnimation) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-primary to-warning flex items-center justify-center"
          >
            <Zap className="h-12 w-12 text-white" />
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Calculating Duel Results...</h2>
            <p className="text-muted-foreground">The shadow awaits judgment</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (duelResult && todaysShadow) {
    const isUserWinner = duelResult.winner === 'user';
    const isDraw = duelResult.winner === 'tie';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Sword className="h-5 w-5 text-primary" />
              Duel Results
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Duel Result Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="text-center space-y-4"
            >
              <div className="flex items-center justify-center gap-8">
                {renderUserAvatar(isUserWinner)}
                
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold">VS</div>
                  <div className="text-sm text-muted-foreground">
                    {isDraw ? 'Draw!' : isUserWinner ? 'Victory!' : 'Defeat'}
                  </div>
                </div>
                
                {renderShadowAvatar(!isUserWinner && !isDraw)}
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{duelResult.userScore}%</div>
                <div className="text-sm text-muted-foreground">Performance Score</div>
              </div>
            </motion.div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground">Tasks</div>
                  <div className="text-lg font-bold">
                    {actualTasksCompleted} / {todaysShadow.predictedTasks}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground">Focus Time</div>
                  <div className="text-lg font-bold">
                    {Math.round(actualFocusTime / 60)}m / {todaysShadow.predictedFocusTime}m
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Update */}
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="font-medium">Shadow Duel Record</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-success">{gameStats.shadowWins}</div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{gameStats.shadowTies}</div>
                  <div className="text-xs text-muted-foreground">Draws</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-destructive">{gameStats.shadowLosses}</div>
                  <div className="text-xs text-muted-foreground">Losses</div>
                </div>
              </div>
              
              {/* View Duel Button */}
              <div className="mt-3">
                <Button 
                  onClick={() => setShowDuelSummary(true)}
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Duel
                </Button>
              </div>
            </div>

            <Button onClick={onClose} className="w-full">
              Continue Your Journey
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (todaysShadow && !todaysShadow.userWon && actualTasksCompleted === 0 && actualFocusTime === 0) {
    // Show current challenge
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Sword className="h-5 w-5 text-primary" />
              Shadow Self Challenge
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your shadow has set today's goals. Can you beat them?
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Shadow's Prediction */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Shadow's Prediction</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-muted/50 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{todaysShadow.predictedTasks}</div>
                    <div className="text-sm text-muted-foreground">Tasks</div>
                  </div>
                  
                  <div className="p-4 rounded-md bg-muted/50 text-center">
                    <Timer className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{todaysShadow.predictedFocusTime}m</div>
                    <div className="text-sm text-muted-foreground">Focus Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Progress */}
            <div className="space-y-4">
              <h4 className="font-medium">Your Current Progress</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Tasks Completed</span>
                  <span>{actualTasksCompleted} / {todaysShadow.predictedTasks}</span>
                </div>
                <Progress 
                  value={(actualTasksCompleted / todaysShadow.predictedTasks) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Focus Time</span>
                  <span>{Math.round(actualFocusTime / 60)}m / {todaysShadow.predictedFocusTime}m</span>
                </div>
                <Progress 
                  value={(actualFocusTime / 60 / todaysShadow.predictedFocusTime) * 100} 
                  className="h-2"
                />
              </div>
            </div>

            <div className="p-4 rounded-md bg-primary/10 text-center">
              <p className="text-sm text-primary">
                Complete your tasks and focus sessions to challenge your shadow at the end of the day!
              </p>
            </div>

            <Button 
              onClick={handleCompleteChallenge}
              className="w-full"
              variant={actualTasksCompleted > 0 || actualFocusTime > 0 ? "default" : "outline"}
            >
              {actualTasksCompleted > 0 || actualFocusTime > 0 ? "Complete Shadow Duel" : "End Day Early"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // No challenge today - create one
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sword className="h-5 w-5 text-primary" />
            Shadow Self Challenge
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Face your shadow in a daily productivity duel
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
              <Sword className="h-10 w-10 text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Shadow Awaits</h3>
              <p className="text-sm text-muted-foreground">
                Your shadow has analyzed your past habits and is ready to challenge you. 
                Are you ready to prove yourself?
              </p>
            </div>
          </div>

          {/* Shadow Battle Record */}
          {(gameStats.shadowWins > 0 || gameStats.shadowLosses > 0 || gameStats.shadowTies > 0) && (
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="font-medium text-center">Previous Duels</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-success">{gameStats.shadowWins}</div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{gameStats.shadowTies}</div>
                  <div className="text-xs text-muted-foreground">Draws</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-destructive">{gameStats.shadowLosses}</div>
                  <div className="text-xs text-muted-foreground">Losses</div>
                </div>
              </div>
              
              {/* View Duel Button */}
              <div className="mt-3">
                <Button 
                  onClick={() => setShowDuelSummary(true)}
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Duel History
                </Button>
              </div>
            </div>
          )}

          <Button 
            onClick={() => {
              const pastTaskData = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i - 1);
                const dateStr = date.toISOString().split('T')[0];
                const dayTasks = tasks.filter(task => 
                  task.createdAt.startsWith(dateStr) || 
                  (task.completedAt && task.completedAt.startsWith(dateStr))
                );
                return {
                  date: dateStr,
                  completed: dayTasks.filter(task => task.completed).length,
                  total: dayTasks.length
                };
              });

              const pastFocusData = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i - 1);
                const dateStr = date.toISOString().split('T')[0];
                const dayTasks = tasks.filter(task => 
                  task.createdAt.startsWith(dateStr) || 
                  (task.completedAt && task.completedAt.startsWith(dateStr))
                );
                return dayTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
              });

              const prediction = generateDailyPrediction(pastTaskData, pastFocusData);
              createShadowChallenge(prediction);
            }}
            className="w-full"
            size="lg"
          >
            Accept Shadow Challenge
          </Button>
        </CardContent>
      </Card>
      
      {/* Duel Summary Modal */}
      <DuelSummary 
        isOpen={showDuelSummary}
        onClose={() => setShowDuelSummary(false)}
        onRematch={() => {
          setShowDuelSummary(false);
          // Additional rematch logic can be added here
        }}
      />
    </motion.div>
  );
};

export default ShadowSelfChallenge;
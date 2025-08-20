import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Target, 
  Clock, 
  CheckCircle, 
  Star, 
  Coins,
  Trophy,
  Flame,
  Calendar,
  Plus
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import { Quest } from '@/types/GameTypes';

interface MiniFocusQuestsProps {
  onClose?: () => void;
}

const MiniFocusQuests: React.FC<MiniFocusQuestsProps> = ({ onClose }) => {
  const { gameStats, quests, createQuest, updateQuest, completeQuest, addCoins, addXP } = useGame();
  const { state } = useTasks();
  const { tasks } = state;
  
  const [showCompletionEffect, setShowCompletionEffect] = useState<string | null>(null);
  
  // Separate active and completed quests from GameContext
  const activeQuests = quests.filter(quest => !quest.isCompleted);
  const completedQuests = quests.filter(quest => quest.isCompleted);

  // Initialize daily quests if none exist
  useEffect(() => {
    const initializeDailyQuests = () => {
      const today = new Date().toISOString().split('T')[0];
      const todayQuests = quests.filter(quest => quest.createdAt.startsWith(today));
      
      // Only create new quests if none exist for today
      if (todayQuests.length === 0) {
        generateDailyQuests();
      }
    };
    
    const generateDailyQuests = () => {
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = tasks.filter(task => task.createdAt.startsWith(today));
      const completedTasks = todaysTasks.filter(task => task.completed);
      const totalFocusTime = todaysTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
      const focusMinutes = Math.round(totalFocusTime / (1000 * 60));

      // Create real daily quests using GameContext
      const dailyQuests = [
        {
          id: `focus_${today}`,
          title: 'Focus Master',
          description: 'Complete 25 minutes of focused work',
          type: 'focus_session' as const,
          difficulty: 'easy' as const,
          xpReward: 50,
          coinReward: 10,
          requirements: {
            target: 25,
            current: focusMinutes
          },
          isCompleted: false,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: today
        },
        {
          id: `tasks_${today}`,
          title: 'Task Crusher',
          description: 'Complete 3 tasks today',
          type: 'task_completion' as const,
          difficulty: 'medium' as const,
          xpReward: 75,
          coinReward: 15,
          requirements: {
            target: 3,
            current: completedTasks.length
          },
          isCompleted: false,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: today
        },
        {
          id: `streak_${today}`,
          title: 'Productivity Streak',
          description: 'Maintain a 7-day streak',
          type: 'streak' as const,
          difficulty: 'hard' as const,
          xpReward: 150,
          coinReward: 30,
          requirements: {
            target: 7,
            current: gameStats.streak
          },
          isCompleted: false,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: today
        },
        {
          id: `deep_${today}`,
          title: 'Deep Work Champion',
          description: 'Focus for 2 hours straight',
          type: 'focus_session' as const,
          difficulty: 'legendary' as const,
          xpReward: 300,
          coinReward: 50,
          requirements: {
            target: 120,
            current: focusMinutes
          },
          isCompleted: false,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: today
        }
      ];

      // Create quests in GameContext
      dailyQuests.forEach(quest => {
        createQuest(quest);
      });
      
      console.log(`✅ Created ${dailyQuests.length} daily quests for ${today}`);
    };

    initializeDailyQuests();
  }, [tasks, gameStats.streak]);

  // Real-time quest progress tracking
  useEffect(() => {
    const updateQuestProgress = () => {
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = tasks.filter(task => task.createdAt.startsWith(today));
      const completedTasks = todaysTasks.filter(task => task.completed);
      const totalFocusTime = todaysTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
      const focusMinutes = Math.round(totalFocusTime / (1000 * 60));
      
      // Update quest progress in real-time
      activeQuests.forEach(quest => {
        let newCurrent = quest.requirements.current;
        let shouldComplete = false;
        
        switch (quest.type) {
          case 'focus_session':
            newCurrent = focusMinutes;
            shouldComplete = focusMinutes >= quest.requirements.target;
            break;
          case 'task_completion':
            newCurrent = completedTasks.length;
            shouldComplete = completedTasks.length >= quest.requirements.target;
            break;
          case 'streak':
            newCurrent = gameStats.streak;
            shouldComplete = gameStats.streak >= quest.requirements.target;
            break;
        }
        
        // Update quest if progress changed
        if (newCurrent !== quest.requirements.current) {
          const updatedQuest = {
            ...quest,
            requirements: {
              ...quest.requirements,
              current: newCurrent
            }
          };
          updateQuest(updatedQuest);
        }
        
        // Complete quest if target reached
        if (shouldComplete && !quest.isCompleted) {
          completeQuest(quest.id);
          setShowCompletionEffect(quest.id);
          
          // Award rewards
          addCoins(quest.coinReward);
          addXP(quest.xpReward);
          
          console.log(`🎉 Quest completed: ${quest.title} (+${quest.coinReward} coins, +${quest.xpReward} XP)`);
          
          // Clear completion effect after animation
          setTimeout(() => setShowCompletionEffect(null), 3000);
        }
      });
    };
    
    updateQuestProgress();
  }, [tasks, gameStats, activeQuests, updateQuest, completeQuest, addCoins, addXP]);

  const getDifficultyColor = (difficulty: Quest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'hard': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'legendary': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getDifficultyIcon = (difficulty: Quest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return <Target className="w-4 h-4" />;
      case 'medium': return <Zap className="w-4 h-4" />;
      case 'hard': return <Star className="w-4 h-4" />;
      case 'legendary': return <Trophy className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: Quest['type']) => {
    switch (type) {
      case 'focus_session': return <Clock className="w-4 h-4" />;
      case 'task_completion': return <CheckCircle className="w-4 h-4" />;
      case 'streak': return <Flame className="w-4 h-4" />;
      case 'daily_goal': return <Calendar className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const claimReward = (quest: Quest) => {
    setShowCompletionEffect(quest.id);
    // Here you would normally call the GameContext to claim rewards
    setTimeout(() => {
      setShowCompletionEffect(null);
      // Move quest to completed
      setActiveQuests(prev => prev.filter(q => q.id !== quest.id));
      setCompletedQuests(prev => [...prev, { ...quest, completedAt: new Date().toISOString() }]);
    }, 2000);
  };

  const QuestCard: React.FC<{ quest: Quest; isCompleted?: boolean }> = ({ quest, isCompleted = false }) => {
    const progress = Math.min((quest.requirements.current / quest.requirements.target) * 100, 100);
    const canClaim = quest.isCompleted && !isCompleted;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative"
      >
        <Card className={`transition-all duration-300 ${canClaim ? 'ring-2 ring-yellow-500/50 shadow-lg' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getDifficultyColor(quest.difficulty)}`}>
                  {getDifficultyIcon(quest.difficulty)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{quest.title}</h3>
                  <p className="text-xs text-muted-foreground">{quest.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                  {quest.difficulty}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getTypeIcon(quest.type)}
                  <span>{quest.requirements.current}/{quest.requirements.target}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-blue-500">
                    <Zap className="w-3 h-3" />
                    <span>{quest.xpReward}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Coins className="w-3 h-3" />
                    <span>{quest.coinReward}</span>
                  </div>
                </div>
              </div>

              <Progress value={progress} className="h-2" />

              {canClaim && (
                <Button 
                  onClick={() => claimReward(quest)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  size="sm"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Claim Reward!
                </Button>
              )}

              {isCompleted && (
                <div className="flex items-center justify-center gap-2 text-green-500 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completion Effect */}
        {showCompletionEffect === quest.id && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full"
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mini Focus Quests</h2>
          <p className="text-muted-foreground">Complete quests to earn XP and coins</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{gameStats.totalXP || 0}</div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{gameStats.coins || 0}</div>
            <div className="text-xs text-muted-foreground">Coins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{gameStats.level || 1}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </CardContent>
        </Card>
      </div>

      {/* Quest Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active ({activeQuests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedQuests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <AnimatePresence>
            {activeQuests.length > 0 ? (
              activeQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active quests available</p>
                <Button className="mt-4" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Quests
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <AnimatePresence>
            {completedQuests.length > 0 ? (
              completedQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} isCompleted />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed quests yet</p>
                <p className="text-sm text-muted-foreground">Complete active quests to see them here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MiniFocusQuests;

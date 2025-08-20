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

  // Enhanced quest generation system - unlimited and persistent
  useEffect(() => {
    const initializeUnlimitedQuests = () => {
      const today = new Date().toISOString().split('T')[0];
      const activeQuestsCount = activeQuests.length;
      
      // Always maintain at least 8-12 active quests
      if (activeQuestsCount < 8) {
        const questsToGenerate = 12 - activeQuestsCount;
        generateDynamicQuests(questsToGenerate);
      }
    };
    
    const generateDynamicQuests = (count: number) => {
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = tasks.filter(task => task.createdAt.startsWith(today));
      const completedTasks = todaysTasks.filter(task => task.completed);
      const totalFocusTime = todaysTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
      const focusMinutes = Math.round(totalFocusTime / (1000 * 60));
      
      // Comprehensive quest templates for unlimited generation
      const questTemplates = [
        // Focus-based quests
        { title: 'Quick Focus', description: 'Complete 15 minutes of focused work', type: 'focus_session', difficulty: 'easy', target: 15, xp: 30, coins: 8 },
        { title: 'Focus Master', description: 'Complete 25 minutes of focused work', type: 'focus_session', difficulty: 'easy', target: 25, xp: 50, coins: 10 },
        { title: 'Power Hour', description: 'Focus for 60 minutes straight', type: 'focus_session', difficulty: 'medium', target: 60, xp: 100, coins: 20 },
        { title: 'Deep Work Session', description: 'Focus for 90 minutes straight', type: 'focus_session', difficulty: 'hard', target: 90, xp: 200, coins: 35 },
        { title: 'Deep Work Champion', description: 'Focus for 2 hours straight', type: 'focus_session', difficulty: 'legendary', target: 120, xp: 300, coins: 50 },
        { title: 'Marathon Focus', description: 'Focus for 3 hours today', type: 'focus_session', difficulty: 'legendary', target: 180, xp: 500, coins: 80 },
        
        // Task completion quests
        { title: 'Task Starter', description: 'Complete 1 task today', type: 'task_completion', difficulty: 'easy', target: 1, xp: 25, coins: 5 },
        { title: 'Task Crusher', description: 'Complete 3 tasks today', type: 'task_completion', difficulty: 'medium', target: 3, xp: 75, coins: 15 },
        { title: 'Task Dominator', description: 'Complete 5 tasks today', type: 'task_completion', difficulty: 'hard', target: 5, xp: 150, coins: 25 },
        { title: 'Task Machine', description: 'Complete 7 tasks today', type: 'task_completion', difficulty: 'legendary', target: 7, xp: 250, coins: 40 },
        { title: 'Task Overlord', description: 'Complete 10 tasks today', type: 'task_completion', difficulty: 'legendary', target: 10, xp: 400, coins: 65 },
        
        // Streak-based quests
        { title: 'Consistency Start', description: 'Maintain a 3-day streak', type: 'streak', difficulty: 'easy', target: 3, xp: 60, coins: 12 },
        { title: 'Streak Builder', description: 'Maintain a 7-day streak', type: 'streak', difficulty: 'medium', target: 7, xp: 150, coins: 30 },
        { title: 'Streak Master', description: 'Maintain a 14-day streak', type: 'streak', difficulty: 'hard', target: 14, xp: 300, coins: 50 },
        { title: 'Streak Legend', description: 'Maintain a 30-day streak', type: 'streak', difficulty: 'legendary', target: 30, xp: 600, coins: 100 },
        
        // Daily goal quests
        { title: 'Morning Warrior', description: 'Complete 2 tasks before noon', type: 'daily_goal', difficulty: 'medium', target: 2, xp: 80, coins: 16 },
        { title: 'Early Bird', description: 'Start working before 9 AM', type: 'daily_goal', difficulty: 'easy', target: 1, xp: 40, coins: 8 },
        { title: 'Night Owl', description: 'Complete a task after 8 PM', type: 'daily_goal', difficulty: 'easy', target: 1, xp: 35, coins: 7 },
        { title: 'Productivity Sprint', description: 'Complete 3 tasks in 2 hours', type: 'daily_goal', difficulty: 'hard', target: 3, xp: 180, coins: 30 },
        
        // Special challenge quests
        { title: 'Zero Procrastination', description: 'Complete all planned tasks today', type: 'daily_goal', difficulty: 'legendary', target: 100, xp: 500, coins: 75 },
        { title: 'Focus Flow', description: 'Have 3 focus sessions today', type: 'focus_session', difficulty: 'medium', target: 3, xp: 120, coins: 24 },
        { title: 'Task Variety', description: 'Complete tasks from 3 different categories', type: 'daily_goal', difficulty: 'medium', target: 3, xp: 90, coins: 18 },
        { title: 'Speed Runner', description: 'Complete 5 tasks in under 3 hours', type: 'daily_goal', difficulty: 'hard', target: 5, xp: 200, coins: 35 },
        
        // Weekly challenges
        { title: 'Weekly Warrior', description: 'Complete 20 tasks this week', type: 'task_completion', difficulty: 'hard', target: 20, xp: 400, coins: 60 },
        { title: 'Focus Week', description: 'Focus for 10 hours this week', type: 'focus_session', difficulty: 'hard', target: 600, xp: 350, coins: 55 },
        
        // Habit-building quests
        { title: 'Habit Starter', description: 'Do the same productive activity 3 days in a row', type: 'streak', difficulty: 'medium', target: 3, xp: 100, coins: 20 },
        { title: 'Routine Master', description: 'Follow your morning routine for 5 days', type: 'streak', difficulty: 'hard', target: 5, xp: 180, coins: 32 }
      ];
      
      // Generate random quests from templates
      const newQuests = [];
      for (let i = 0; i < count; i++) {
        const template = questTemplates[Math.floor(Math.random() * questTemplates.length)];
        const questId = `quest_${Date.now()}_${i}`;
        
        // Calculate current progress based on quest type
        let currentProgress = 0;
        if (template.type === 'focus_session') {
          currentProgress = focusMinutes;
        } else if (template.type === 'task_completion') {
          currentProgress = completedTasks.length;
        } else if (template.type === 'streak') {
          currentProgress = gameStats.streak || 0;
        } else if (template.type === 'daily_goal') {
          currentProgress = Math.floor(Math.random() * template.target); // Simulate progress
        }
        
        const newQuest = {
          id: questId,
          title: template.title,
          description: template.description,
          type: template.type as Quest['type'],
          difficulty: template.difficulty as Quest['difficulty'],
          xpReward: template.xp,
          coinReward: template.coins,
          requirements: {
            target: template.target,
            current: currentProgress
          },
          isCompleted: currentProgress >= template.target,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        
        newQuests.push(newQuest);
      }

      // Create quests in GameContext
      newQuests.forEach(quest => {
        createQuest(quest);
      });
      
      console.log(`✅ Generated ${newQuests.length} new dynamic quests`);
    };

    initializeUnlimitedQuests();
  }, [tasks, gameStats.streak, activeQuests.length]);

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
          handleCompleteQuest(quest.id);
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

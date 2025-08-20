import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Zap, 
  Star, 
  Crown, 
  Sparkles,
  MessageCircle,
  Settings,
  TrendingUp,
  Clock,
  Target,
  Gift
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import { ProductivityCompanion } from '@/types/GameTypes';

interface ProductivityCompanionProps {
  onClose?: () => void;
}

const ProductivityCompanion: React.FC<ProductivityCompanionProps> = ({ onClose }) => {
  const { gameStats } = useGame();
  const { state } = useTasks();
  const { tasks } = state;
  
  const [companion, setCompanion] = useState<ProductivityCompanion | null>(null);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Initialize companion
  useEffect(() => {
    const initializeCompanion = () => {
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = tasks.filter(task => task.createdAt.startsWith(today));
      const completedTasks = todaysTasks.filter(task => task.completed);
      const totalFocusTime = todaysTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);

      const sampleCompanion: ProductivityCompanion = {
        id: 'companion-1',
        name: 'Zara',
        type: 'pet',
        species: 'dragon',
        level: Math.max(1, Math.floor(gameStats.totalXP / 100) + 1),
        experience: gameStats.totalXP % 100,
        experienceToNext: 100,
        mood: completedTasks.length > 2 ? 'excited' : completedTasks.length > 0 ? 'happy' : 'motivated',
        state: totalFocusTime > 0 ? 'active' : 'sleeping',
        lastInteraction: new Date().toISOString(),
        evolution: {
          stage: Math.min(5, Math.max(1, Math.floor(gameStats.level / 5) + 1)),
          nextEvolutionXP: (Math.floor(gameStats.level / 5) + 1) * 500
        },
        customization: {
          color: '#8B5CF6',
          accessories: ['crown', 'sparkles']
        },
        stats: {
          totalFocusTime: Math.round(totalFocusTime / (1000 * 60)),
          tasksCompleted: completedTasks.length,
          streakDays: gameStats.streak,
          questsCompleted: gameStats.totalQuestsCompleted || 0
        },
        createdAt: today,
        updatedAt: new Date().toISOString()
      };

      setCompanion(sampleCompanion);
    };

    initializeCompanion();
  }, [gameStats, tasks]);

  const getCompanionEmoji = (species: string, stage: number) => {
    const stages = {
      dragon: ['🥚', '🐲', '🐉', '🔥🐉', '👑🐉'],
      phoenix: ['🥚', '🐣', '🦅', '🔥🦅', '👑🦅'],
      owl: ['🥚', '🦉', '🦉', '🌟🦉', '👑🦉'],
      fox: ['🥚', '🦊', '🦊', '⭐🦊', '👑🦊'],
      cat: ['🥚', '🐱', '🐈', '✨🐈', '👑🐈'],
      robot: ['⚙️', '🤖', '🤖', '⚡🤖', '👑🤖']
    };
    return stages[species as keyof typeof stages]?.[stage - 1] || '🐲';
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'excited': return 'text-yellow-500 bg-yellow-500/10';
      case 'happy': return 'text-green-500 bg-green-500/10';
      case 'focused': return 'text-blue-500 bg-blue-500/10';
      case 'motivated': return 'text-purple-500 bg-purple-500/10';
      case 'sleepy': return 'text-gray-500 bg-gray-500/10';
      case 'sad': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getMotivationalMessage = (mood: string, state: string) => {
    const messages = {
      excited: [
        "🎉 You're crushing it today! Let's keep this energy going!",
        "⚡ Amazing progress! I'm so proud of your dedication!",
        "🌟 You're on fire! Nothing can stop us now!"
      ],
      happy: [
        "😊 Great work! I love seeing you succeed!",
        "🌈 You're doing wonderful! Keep up the good work!",
        "💫 Every task completed makes me happier!"
      ],
      motivated: [
        "💪 Ready to tackle today's challenges together?",
        "🎯 Let's turn those goals into achievements!",
        "🚀 I believe in you! Let's make today count!"
      ],
      focused: [
        "🧘 I'm here to help you stay focused!",
        "⏰ Deep work mode activated! You've got this!",
        "🎯 Laser focus engaged! Let's achieve greatness!"
      ],
      sleepy: [
        "😴 Maybe it's time for a short break?",
        "☕ A little rest might help us recharge!",
        "🌙 Even champions need their rest!"
      ]
    };
    
    const moodMessages = messages[mood as keyof typeof messages] || messages.motivated;
    return moodMessages[Math.floor(Math.random() * moodMessages.length)];
  };

  const interactWithCompanion = () => {
    if (!companion) return;
    
    setIsInteracting(true);
    const message = getMotivationalMessage(companion.mood, companion.state);
    setShowMessage(message);
    
    setTimeout(() => {
      setIsInteracting(false);
      setShowMessage(null);
    }, 3000);
  };

  const getEvolutionStageName = (stage: number) => {
    const stages = ['Egg', 'Baby', 'Teen', 'Adult', 'Master'];
    return stages[stage - 1] || 'Unknown';
  };

  if (!companion) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your companion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Productivity Companion</h2>
          <p className="text-muted-foreground">Your personal motivation buddy</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Companion Display */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Companion Avatar */}
            <motion.div
              animate={isInteracting ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="text-8xl mb-4">
                {getCompanionEmoji(companion.species, companion.evolution.stage)}
              </div>
              {companion.state === 'celebrating' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </motion.div>
              )}
            </motion.div>

            {/* Companion Info */}
            <div>
              <h3 className="text-xl font-bold">{companion.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="outline" className={getMoodColor(companion.mood)}>
                  {companion.mood}
                </Badge>
                <Badge variant="outline">
                  Level {companion.level}
                </Badge>
                <Badge variant="outline">
                  {getEvolutionStageName(companion.evolution.stage)}
                </Badge>
              </div>
            </div>

            {/* Experience Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Experience</span>
                <span>{companion.experience}/{companion.experienceToNext}</span>
              </div>
              <Progress 
                value={(companion.experience / companion.experienceToNext) * 100} 
                className="h-2"
              />
            </div>

            {/* Interaction Button */}
            <Button 
              onClick={interactWithCompanion}
              disabled={isInteracting}
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {isInteracting ? 'Chatting...' : 'Talk to ' + companion.name}
            </Button>

            {/* Message Display */}
            <AnimatePresence>
              {showMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-muted p-4 rounded-lg"
                >
                  <p className="text-sm">{showMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Details */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{companion.stats.totalFocusTime}</div>
                <div className="text-xs text-muted-foreground">Minutes Focused</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{companion.stats.tasksCompleted}</div>
                <div className="text-xs text-muted-foreground">Tasks Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{companion.stats.streakDays}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{companion.stats.questsCompleted}</div>
                <div className="text-xs text-muted-foreground">Quests Done</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Evolution Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {getCompanionEmoji(companion.species, companion.evolution.stage)}
                </div>
                <p className="font-semibold">
                  Stage {companion.evolution.stage}: {getEvolutionStageName(companion.evolution.stage)}
                </p>
              </div>
              
              {companion.evolution.stage < 5 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Next Evolution</span>
                    <span>{gameStats.totalXP}/{companion.evolution.nextEvolutionXP} XP</span>
                  </div>
                  <Progress 
                    value={(gameStats.totalXP / companion.evolution.nextEvolutionXP) * 100} 
                    className="h-2"
                  />
                  <div className="text-center">
                    <div className="text-2xl">
                      {getCompanionEmoji(companion.species, companion.evolution.stage + 1)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getEvolutionStageName(companion.evolution.stage + 1)}
                    </p>
                  </div>
                </div>
              )}
              
              {companion.evolution.stage === 5 && (
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                  <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                    Maximum Evolution Reached!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your companion has reached its final form!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Companion Name</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{companion.name}</span>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Color Theme</label>
                <div className="flex gap-2">
                  {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        companion.customization.color === color ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setCompanion(prev => prev ? {
                          ...prev,
                          customization: { ...prev.customization, color }
                        } : null);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Accessories</label>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Unlock accessories by completing quests and reaching milestones!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductivityCompanion;

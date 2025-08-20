import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Frown,
  Crown,
  Lock,
  Unlock,
  Star,
  Clock,
  Target,
  Zap,
  Coins,
  CheckCircle,
  AlertCircle,
  Flame,
  Trophy,
  Plus,
  Eye,
  EyeOff,
  Calendar
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import { FrogTask, FrogModeState } from '@/types/GameTypes';

interface EatThatFrogModeProps {
  onClose?: () => void;
}

const EatThatFrogMode: React.FC<EatThatFrogModeProps> = ({ onClose }) => {
  const { gameStats, addCoins, addXP, incrementStreak } = useGame();
  const { state: taskState, addTask, updateTask } = useTasks();
  const { tasks } = taskState;
  
  const [frogMode, setFrogMode] = useState<FrogModeState>({
    isActive: false,
    todaysFrog: null,
    interfaceLocked: false,
    canOverride: true,
    overrideUsed: false,
    consecutiveDays: 0
  });
  
  const [newFrogTitle, setNewFrogTitle] = useState('');
  const [newFrogDescription, setNewFrogDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(60);
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [frogHistory, setFrogHistory] = useState<FrogTask[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 6 && currentHour < 12;

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        // Load frog history from localStorage
        const savedHistory = localStorage.getItem('focusflow_frog_history');
        if (savedHistory) {
          const history: FrogTask[] = JSON.parse(savedHistory);
          setFrogHistory(history);
          
          // Check if there's already a frog for today
          const todaysFrog = history.find(frog => frog.date === today);
          
          const state: FrogModeState = {
            isActive: !!todaysFrog,
            todaysFrog: todaysFrog || null,
            interfaceLocked: !!todaysFrog && !todaysFrog.isCompleted,
            canOverride: true,
            overrideUsed: false,
            consecutiveDays: calculateStreakFromHistory(history),
            lastFrogDate: todaysFrog?.date
          };
          
          setFrogMode(state);
        }
      } catch (error) {
        console.error('Failed to load frog mode state:', error);
      }
    };

    loadPersistedState();
  }, [today]);
  
  // Persist frog history whenever it changes
  useEffect(() => {
    if (frogHistory.length > 0) {
      try {
        localStorage.setItem('focusflow_frog_history', JSON.stringify(frogHistory));
      } catch (error) {
        console.error('Failed to save frog history:', error);
      }
    }
  }, [frogHistory]);

  const calculateStreakFromHistory = (history: FrogTask[]) => {
    // Calculate consecutive days of completed frogs
    let streak = 0;
    const sortedHistory = [...history]
      .filter(frog => frog.isCompleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentDate = new Date();
    for (const frog of sortedHistory) {
      const frogDate = new Date(frog.date);
      const daysDiff = Math.floor((currentDate.getTime() - frogDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = frogDate;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const calculateStreak = () => {
    return calculateStreakFromHistory(frogHistory);
  };

  const getPrioritySettings = (priority: 'critical' | 'high' | 'medium') => {
    switch (priority) {
      case 'critical':
        return { 
          coinBonus: 100, 
          xpBonus: 200, 
          color: 'text-red-500 bg-red-500/10 border-red-500/20',
          emoji: '🔥'
        };
      case 'high':
        return { 
          coinBonus: 75, 
          xpBonus: 150, 
          color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
          emoji: '⚡'
        };
      case 'medium':
        return { 
          coinBonus: 50, 
          xpBonus: 100, 
          color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
          emoji: '⭐'
        };
    }
  };

  const selectFrogTask = (taskId?: string, isNewTask = false) => {
    let frogTask: FrogTask;
    
    if (isNewTask) {
      // Create new task and frog
      const newTaskId = `task-${Date.now()}`;
      const newTask = {
        title: newFrogTitle,
        description: newFrogDescription,
        completed: false,
        updatedAt: new Date().toISOString(),
        priority: priority as 'low' | 'medium' | 'high',
        category: 'frog-task',
        tags: ['frog', priority],
        subtasks: [],
        isPriority: true,
        totalTimeSpent: 0,
        focusSessions: [],
        notes: [],
        links: [],
        taskType: 'frog' as const,
        difficulty: (priority === 'critical' ? 'hard' : priority === 'high' ? 'medium' : 'easy') as 'easy' | 'medium' | 'hard',
        coinReward: getPrioritySettings(priority).coinBonus,
        completionXP: getPrioritySettings(priority).xpBonus
      };
      
      addTask(newTask);
      
      frogTask = {
        id: `frog-${Date.now()}`,
        taskId: newTaskId,
        title: newFrogTitle,
        description: newFrogDescription,
        priority,
        estimatedTime,
        isCompleted: false,
        selectedAt: new Date().toISOString(),
        date: today,
        coinBonus: getPrioritySettings(priority).coinBonus,
        xpBonus: getPrioritySettings(priority).xpBonus
      };
    } else {
      // Use existing task
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      frogTask = {
        id: `frog-${Date.now()}`,
        taskId: task.id,
        title: task.title,
        description: task.description || '',
        priority,
        estimatedTime,
        isCompleted: false,
        selectedAt: new Date().toISOString(),
        date: today,
        coinBonus: getPrioritySettings(priority).coinBonus,
        xpBonus: getPrioritySettings(priority).xpBonus
      };
    }
    
    const updatedHistory = [...frogHistory, frogTask];
    setFrogHistory(updatedHistory);
    setFrogMode(prev => ({
      ...prev,
      isActive: true,
      todaysFrog: frogTask,
      interfaceLocked: true
    }));
    
    // Save to localStorage immediately
    localStorage.setItem('focusflow_frog_history', JSON.stringify(updatedHistory));
    
    // Reset form
    setNewFrogTitle('');
    setNewFrogDescription('');
  };

  const completeFrog = () => {
    if (!frogMode.todaysFrog) return;
    
    const completedFrog: FrogTask = {
      ...frogMode.todaysFrog,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      streakBonus: frogMode.consecutiveDays >= 7 ? 50 : 0
    };
    
    const updatedHistory = frogHistory.map(frog => 
      frog.id === completedFrog.id ? completedFrog : frog
    );
    setFrogHistory(updatedHistory);
    
    // Save to localStorage immediately
    localStorage.setItem('focusflow_frog_history', JSON.stringify(updatedHistory));
    
    setFrogMode(prev => ({
      ...prev,
      todaysFrog: completedFrog,
      interfaceLocked: false,
      consecutiveDays: prev.consecutiveDays + 1
    }));
    
    // Mark the associated task as completed
    if (completedFrog.taskId) {
      updateTask(completedFrog.taskId, { completed: true });
    }
    
    // Add rewards to GameContext
    const totalCoins = completedFrog.coinBonus + (completedFrog.streakBonus || 0);
    addCoins(totalCoins);
    addXP(completedFrog.xpBonus);
    
    // Update streak if consecutive days >= 1
    if (frogMode.consecutiveDays >= 1) {
      incrementStreak();
    }
  };

  const overrideLock = () => {
    setFrogMode(prev => ({
      ...prev,
      interfaceLocked: false,
      overrideUsed: true
    }));
    setShowOverrideWarning(false);
  };

  const availableTasks = tasks.filter(task => !task.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Frown className="w-6 h-6" />
            Eat That Frog Mode
          </h2>
          <p className="text-muted-foreground">
            {frogMode.isActive ? 'Focus on your most important task' : 'Pick your single most important task'}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Streak Display */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {frogMode.consecutiveDays}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            {frogMode.consecutiveDays >= 7 && (
              <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                <Crown className="w-3 h-3 mr-1" />
                Streak Bonus!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Frog */}
      {frogMode.todaysFrog && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <Card className={`border-2 ${
            frogMode.todaysFrog.isCompleted 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-orange-500/50 bg-orange-500/5'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {frogMode.todaysFrog.isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Target className="w-5 h-5 text-orange-500" />
                )}
                Today's Frog
                {getPrioritySettings(frogMode.todaysFrog.priority).emoji}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{frogMode.todaysFrog.title}</h3>
                {frogMode.todaysFrog.description && (
                  <p className="text-muted-foreground">{frogMode.todaysFrog.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Badge className={getPrioritySettings(frogMode.todaysFrog.priority).color}>
                  {frogMode.todaysFrog.priority}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{frogMode.todaysFrog.estimatedTime} min</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-yellow-500">
                    {frogMode.todaysFrog.coinBonus}
                    {frogMode.todaysFrog.streakBonus && `+${frogMode.todaysFrog.streakBonus}`}
                  </div>
                  <div className="text-xs text-muted-foreground">Coins</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-500">{frogMode.todaysFrog.xpBonus}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-500">
                    {new Date(frogMode.todaysFrog.selectedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">Selected</div>
                </div>
              </div>

              {!frogMode.todaysFrog.isCompleted && (
                <Button 
                  onClick={completeFrog}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  size="lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  🐸 Frog Eaten! Mark Complete
                </Button>
              )}

              {frogMode.todaysFrog.isCompleted && (
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    Congratulations! You've eaten your frog! 🎉
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Full interface access restored
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Interface Lock Warning */}
      {frogMode.interfaceLocked && !frogMode.todaysFrog?.isCompleted && (
        <Card className="border-2 border-red-500/50 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-red-500" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-600 dark:text-red-400">Interface Locked</h4>
                <p className="text-sm text-muted-foreground">
                  Complete your frog task to unlock full app access
                </p>
              </div>
              {frogMode.canOverride && !frogMode.overrideUsed && (
                <Button 
                  onClick={() => setShowOverrideWarning(true)}
                  variant="outline"
                  size="sm"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Override
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frog Selection */}
      {!frogMode.todaysFrog && (
        <div className="space-y-6">
          {isMorning && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  🌅 Perfect time to pick your frog for the day!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Priority Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {(['critical', 'high', 'medium'] as const).map((p) => {
                  const settings = getPrioritySettings(p);
                  return (
                    <Card 
                      key={p}
                      className={`cursor-pointer transition-all ${
                        priority === p ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setPriority(p)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{settings.emoji}</div>
                        <Badge className={`mb-2 ${settings.color}`}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Badge>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-center gap-1 text-yellow-500">
                            <Coins className="w-3 h-3" />
                            <span>{settings.coinBonus}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-blue-500">
                            <Zap className="w-3 h-3" />
                            <span>{settings.xpBonus}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Create New Frog Task */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Frog Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="What's your most important task today?"
                value={newFrogTitle}
                onChange={(e) => setNewFrogTitle(e.target.value)}
              />
              
              <Textarea
                placeholder="Describe the task (optional)"
                value={newFrogDescription}
                onChange={(e) => setNewFrogDescription(e.target.value)}
                className="min-h-[60px]"
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Estimated Time: {estimatedTime} minutes
                </label>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button 
                onClick={() => selectFrogTask(undefined, true)}
                disabled={!newFrogTitle.trim()}
                className="w-full"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                🐸 Make This My Frog
              </Button>
            </CardContent>
          </Card>

          {/* Select Existing Task */}
          {availableTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Or Choose Existing Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted hover:bg-muted/80 rounded-md cursor-pointer transition-colors"
                    onClick={() => selectFrogTask(task.id)}
                  >
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Override Warning Modal */}
      <AnimatePresence>
        {showOverrideWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
                <h3 className="text-xl font-bold">Override Frog Lock?</h3>
                <p className="text-muted-foreground">
                  This will unlock the full interface, but you'll lose the focus benefits of Frog Mode for today.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowOverrideWarning(false)}
                    variant="outline" 
                    className="flex-1"
                  >
                    Stay Focused
                  </Button>
                  <Button 
                    onClick={overrideLock}
                    variant="secondary" 
                    className="flex-1"
                  >
                    Override Lock
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EatThatFrogMode;

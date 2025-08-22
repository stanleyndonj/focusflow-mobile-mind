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
  Calendar,
  Coffee,
  Trash2,
  Settings,
  Pause,
  Play,
  PauseCircle,
  AlertTriangle
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import { FrogTask, FrogModeState, RepeatableFrogTemplate } from '@/types/GameTypes';

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
    todaysRepeatingFrogs: [],
    interfaceLocked: false,
    canOverride: true,
    overrideUsed: false,
    consecutiveDays: 0,
    repeatableFrogTemplates: []
  });
  
  const [newFrogTitle, setNewFrogTitle] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateRepeatType, setNewTemplateRepeatType] = useState<'daily' | 'weekdays'>('daily');
  const [showRepeatingFrogs, setShowRepeatingFrogs] = useState(true);
  const [newFrogDescription, setNewFrogDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(60);
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [showOverride, setShowOverride] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'critical' | 'high' | 'medium',
    repeatType: 'daily' as 'daily' | 'weekdays',
    estimatedTime: 30,
    coinBonus: 50,
    xpBonus: 100
  });
  const [frogHistory, setFrogHistory] = useState<FrogTask[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 6 && currentHour < 12;

  // Helper function to check if a date should have repeating frogs
  const shouldGenerateRepeatingFrog = (template: RepeatableFrogTemplate, date: string): boolean => {
    if (!template.isActive) return false;
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (template.repeatType === 'weekdays') {
      // Only Monday to Friday (1-5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    } else {
      // Daily includes all days
      return true;
    }
  };

  // Generate today's repeating frogs from templates
  const generateTodaysRepeatingFrogs = (templates: RepeatableFrogTemplate[], existingHistory: FrogTask[]): FrogTask[] => {
    const todaysRepeatingFrogs: FrogTask[] = [];
    
    // Check if we already have today's repeating frogs
    const existingTodayRepeatingFrogs = existingHistory.filter(frog => 
      frog.date === today && frog.isRepeating && !frog.isTemplate
    );
    
    if (existingTodayRepeatingFrogs.length > 0) {
      return existingTodayRepeatingFrogs;
    }
    
    // Generate new ones from active templates
    for (const template of templates) {
      if (shouldGenerateRepeatingFrog(template, today)) {
        const taskId = `frog-${template.id}-${today}`;
        
        // Create associated task (map frog priority to task priority)
        const taskPriority: 'high' | 'medium' | 'low' = 
          template.priority === 'critical' ? 'high' :
          template.priority === 'high' ? 'high' : 'medium';
          
        const newTask = {
          title: template.title,
          description: template.description || '',
          completed: false,
          priority: taskPriority,
          dueDate: today,
          category: 'work',
          subtasks: [],
          isPriority: template.priority === 'critical' || template.priority === 'high',
          totalTimeSpent: 0,
          focusSessions: [],
          notes: [],
          links: [],
          taskType: 'frog' as const,
          difficulty: (template.priority === 'critical' ? 'hard' : template.priority === 'high' ? 'medium' : 'easy') as 'easy' | 'medium' | 'hard',
          coinReward: template.coinBonus,
          completionXP: template.xpBonus,
          updatedAt: new Date().toISOString(),
          tags: []
        };
        
        addTask(newTask);
        
        const frogTask: FrogTask = {
          id: `${template.id}-${today}`,
          taskId: taskId,
          title: template.title,
          description: template.description,
          priority: template.priority,
          estimatedTime: template.estimatedTime,
          isCompleted: false,
          selectedAt: new Date().toISOString(),
          date: today,
          coinBonus: template.coinBonus,
          xpBonus: template.xpBonus,
          isRepeating: true,
          repeatType: template.repeatType,
          parentFrogId: template.id,
          isTemplate: false
        };
        
        todaysRepeatingFrogs.push(frogTask);
      }
    }
    
    return todaysRepeatingFrogs;
  };

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        // Load frog history from localStorage
        const savedHistory = localStorage.getItem('focusflow_frog_history');
        const savedTemplates = localStorage.getItem('focusflow_repeating_frog_templates');
        
        let history: FrogTask[] = [];
        let templates: RepeatableFrogTemplate[] = [];
        
        if (savedHistory) {
          history = JSON.parse(savedHistory);
          setFrogHistory(history);
        }
        
        if (savedTemplates) {
          templates = JSON.parse(savedTemplates);
        }
        
        // Check if there's already a one-time frog for today
        const todaysFrog = history.find(frog => frog.date === today && !frog.isRepeating);
        
        // Generate today's repeating frogs
        const todaysRepeatingFrogs = generateTodaysRepeatingFrogs(templates, history);
        
        // Add newly generated repeating frogs to history
        if (todaysRepeatingFrogs.length > 0) {
          const newHistory = [...history, ...todaysRepeatingFrogs];
          setFrogHistory(newHistory);
          history = newHistory;
        }
        
        const state: FrogModeState = {
          isActive: !!(todaysFrog || todaysRepeatingFrogs.length > 0),
          todaysFrog: todaysFrog || null,
          todaysRepeatingFrogs: todaysRepeatingFrogs,
          interfaceLocked: (!!todaysFrog && !todaysFrog.isCompleted) || 
                          todaysRepeatingFrogs.some(frog => !frog.isCompleted),
          canOverride: true,
          overrideUsed: false,
          consecutiveDays: calculateStreakFromHistory(history),
          lastFrogDate: todaysFrog?.date || (todaysRepeatingFrogs.length > 0 ? today : undefined),
          repeatableFrogTemplates: templates
        };
        
        setFrogMode(state);
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

  // Persist repeating frog templates whenever they change
  useEffect(() => {
    if (frogMode.repeatableFrogTemplates.length > 0) {
      try {
        localStorage.setItem('focusflow_repeating_frog_templates', JSON.stringify(frogMode.repeatableFrogTemplates));
      } catch (error) {
        console.error('Failed to save repeating frog templates:', error);
      }
    }
  }, [frogMode.repeatableFrogTemplates]);

  const calculateStreakFromHistory = (history: FrogTask[]) => {
    // Calculate consecutive days where ALL frogs were completed
    // Group frogs by date and check if all frogs for each date are completed
    const frogsByDate = history.reduce((acc, frog) => {
      if (!acc[frog.date]) {
        acc[frog.date] = [];
      }
      acc[frog.date].push(frog);
      return acc;
    }, {} as Record<string, FrogTask[]>);
    
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const frogsForDate = frogsByDate[dateStr] || [];
      
      if (frogsForDate.length === 0) {
        // No frogs for this date, check if it's a future date
        if (currentDate > today) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        } else {
          break; // No frogs in the past, streak broken
        }
      }
      
      // Check if ALL frogs for this date are completed
      const allCompleted = frogsForDate.every(frog => frog.isCompleted);
      
      if (allCompleted) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
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

  // Create a new repeating frog template
  const createRepeatableFrogTemplate = () => {
    if (!newFrogTitle.trim()) return;
    
    // Check if we already have 3 active templates
    const activeTemplates = frogMode.repeatableFrogTemplates.filter(t => t.isActive);
    if (activeTemplates.length >= 3) {
      alert('You can only have up to 3 active repeating frogs. Please deactivate one first.');
      return;
    }
    
    const prioritySettings = getPrioritySettings(priority);
    
    const newTemplate: RepeatableFrogTemplate = {
      id: `template-${Date.now()}`,
      title: newFrogTitle.trim(),
      description: newFrogDescription.trim(),
      priority: priority,
      estimatedTime: estimatedTime,
      repeatType: newTemplateRepeatType,
      isActive: true,
      createdAt: new Date().toISOString(),
      coinBonus: prioritySettings.coinBonus,
      xpBonus: prioritySettings.xpBonus
    };
    
    const updatedTemplates = [...frogMode.repeatableFrogTemplates, newTemplate];
    
    setFrogMode(prev => ({
      ...prev,
      repeatableFrogTemplates: updatedTemplates
    }));
    
    // Reset form
    setNewFrogTitle('');
    setNewFrogDescription('');
    setEstimatedTime(60);
    setPriority('high');
    setIsCreatingTemplate(false);
    
    console.log(`🐸 Created repeating frog template: "${newTemplate.title}" (${newTemplate.repeatType})`);
  };

  // Toggle a repeating frog template's active status
  const toggleRepeatableFrogTemplate = (templateId: string) => {
    const updatedTemplates = frogMode.repeatableFrogTemplates.map(template =>
      template.id === templateId
        ? { ...template, isActive: !template.isActive }
        : template
    );
    
    setFrogMode(prev => ({
      ...prev,
      repeatableFrogTemplates: updatedTemplates
    }));
    
    console.log(`🐸 Toggled repeating frog template: ${templateId}`);
  };

  // Delete a repeating frog template
  const deleteRepeatableFrogTemplate = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this repeating frog template?')) {
      return;
    }
    
    const updatedTemplates = frogMode.repeatableFrogTemplates.filter(template => template.id !== templateId);
    
    setFrogMode(prev => ({
      ...prev,
      repeatableFrogTemplates: updatedTemplates
    }));
    
    console.log(`🐸 Deleted repeating frog template: ${templateId}`);
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

  const completeFrog = (frogId: string) => {
    // Find the frog to complete (could be one-time frog or repeating frog)
    let targetFrog: FrogTask | null = null;
    let isRepeatingFrog = false;
    
    if (frogMode.todaysFrog && frogMode.todaysFrog.id === frogId) {
      targetFrog = frogMode.todaysFrog;
    } else {
      const repeatingFrog = frogMode.todaysRepeatingFrogs.find(frog => frog.id === frogId);
      if (repeatingFrog) {
        targetFrog = repeatingFrog;
        isRepeatingFrog = true;
      }
    }
    
    if (!targetFrog) return;
    
    const completedFrog: FrogTask = {
      ...targetFrog,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      streakBonus: frogMode.consecutiveDays >= 7 ? 50 : 0
    };
    
    // Update history
    const updatedHistory = frogHistory.map(frog => 
      frog.id === completedFrog.id ? completedFrog : frog
    );
    setFrogHistory(updatedHistory);
    
    // Save to localStorage immediately
    localStorage.setItem('focusflow_frog_history', JSON.stringify(updatedHistory));
    
    // Update frog mode state
    if (isRepeatingFrog) {
      const updatedRepeatingFrogs = frogMode.todaysRepeatingFrogs.map(frog =>
        frog.id === completedFrog.id ? completedFrog : frog
      );
      
      setFrogMode(prev => ({
        ...prev,
        todaysRepeatingFrogs: updatedRepeatingFrogs,
        interfaceLocked: prev.todaysFrog?.isCompleted === false || 
                        updatedRepeatingFrogs.some(frog => !frog.isCompleted)
      }));
    } else {
      setFrogMode(prev => ({
        ...prev,
        todaysFrog: completedFrog,
        interfaceLocked: prev.todaysRepeatingFrogs.some(frog => !frog.isCompleted)
      }));
    }
    
    // Mark the associated task as completed
    if (completedFrog.taskId) {
      updateTask(completedFrog.taskId, { completed: true });
    }
    
    // Add rewards to GameContext
    const totalCoins = completedFrog.coinBonus + (completedFrog.streakBonus || 0);
    addCoins(totalCoins);
    addXP(completedFrog.xpBonus);
    
    // Check if ALL frogs for today are now completed for streak calculation
    const allFrogsToday = [
      ...(frogMode.todaysFrog ? [frogMode.todaysFrog.id === frogId ? completedFrog : frogMode.todaysFrog] : []),
      ...(isRepeatingFrog ? 
          frogMode.todaysRepeatingFrogs.map(frog => frog.id === frogId ? completedFrog : frog) :
          frogMode.todaysRepeatingFrogs
      )
    ];
    
    const allFrogsCompleted = allFrogsToday.every(frog => frog.isCompleted);
    
    if (allFrogsCompleted) {
      // All frogs for today completed - this counts as a day win
      const newConsecutiveDays = calculateStreakFromHistory(updatedHistory);
      setFrogMode(prev => ({
        ...prev,
        consecutiveDays: newConsecutiveDays
      }));
      
      incrementStreak();
      
      console.log(`🎉 All frogs completed for ${today}! Day win recorded.`);
    }
    
    console.log(`🐸 Completed frog: "${completedFrog.title}" (+${totalCoins} coins, +${completedFrog.xpBonus} XP)`);
  };

  const overrideLock = () => {
    setFrogMode(prev => ({
      ...prev,
      interfaceLocked: false,
      overrideUsed: true
    }));
    setShowOverride(false);
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
                  onClick={() => completeFrog(frogMode.todaysFrog!.id)}
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

      {/* Today's Repeating Frogs */}
      {frogMode.todaysRepeatingFrogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Repeating Frogs ({frogMode.todaysRepeatingFrogs.filter(f => f.isCompleted).length}/{frogMode.todaysRepeatingFrogs.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRepeatingFrogs(!showRepeatingFrogs)}
            >
              {showRepeatingFrogs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {showRepeatingFrogs && (
            <div className="grid gap-3">
              {frogMode.todaysRepeatingFrogs.map((frog) => (
                <Card key={frog.id} className={`border ${
                  frog.isCompleted 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-blue-500/50 bg-blue-500/5'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {frog.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Target className="w-5 h-5 text-blue-500" />
                          )}
                          <h4 className="font-semibold">{frog.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {frog.repeatType === 'daily' ? '📅 Daily' : '🏢 Weekdays'}
                          </Badge>
                        </div>
                        
                        {frog.description && (
                          <p className="text-sm text-muted-foreground mb-2">{frog.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <Badge className={getPrioritySettings(frog.priority).color}>
                            {frog.priority}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{frog.estimatedTime} min</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Coins className="w-3 h-3" />
                            <span>{frog.coinBonus}</span>
                          </div>
                        </div>
                      </div>

                      {!frog.isCompleted && (
                        <Button 
                          onClick={() => completeFrog(frog.id)}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Repeating Frog Template Management */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Repeating Frog Templates ({frogMode.repeatableFrogTemplates.filter(t => t.isActive).length}/3)
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplateManager(!showTemplateManager)}
          >
            {showTemplateManager ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {showTemplateManager && (
          <div className="space-y-4">
            {/* Active Templates */}
            {frogMode.repeatableFrogTemplates.filter(t => t.isActive).length > 0 && (
              <div className="grid gap-3">
                <h4 className="font-medium text-sm text-muted-foreground">Active Templates</h4>
                {frogMode.repeatableFrogTemplates
                  .filter(t => t.isActive)
                  .map((template) => (
                    <Card key={template.id} className="border-emerald-500/50 bg-emerald-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-emerald-500" />
                              <h5 className="font-semibold">{template.title}</h5>
                              <Badge variant="secondary" className="text-xs">
                                {template.repeatType === 'daily' ? '📅 Daily' : '🏢 Weekdays'}
                              </Badge>
                            </div>
                            
                            {template.description && (
                              <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-sm">
                              <Badge className={getPrioritySettings(template.priority).color}>
                                {template.priority}
                              </Badge>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{template.estimatedTime} min</span>
                              </div>
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Coins className="w-3 h-3" />
                                <span>{template.coinBonus}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRepeatableFrogTemplate(template.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteRepeatableFrogTemplate(template.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Inactive Templates */}
            {frogMode.repeatableFrogTemplates.filter(t => !t.isActive).length > 0 && (
              <div className="grid gap-3">
                <h4 className="font-medium text-sm text-muted-foreground">Inactive Templates</h4>
                {frogMode.repeatableFrogTemplates
                  .filter(t => !t.isActive)
                  .map((template) => (
                    <Card key={template.id} className="border-gray-500/30 bg-gray-500/5 opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <PauseCircle className="w-5 h-5 text-gray-500" />
                              <h5 className="font-semibold text-gray-600">{template.title}</h5>
                              <Badge variant="secondary" className="text-xs opacity-75">
                                {template.repeatType === 'daily' ? '📅 Daily' : '🏢 Weekdays'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant="secondary" className="opacity-75">
                                {template.priority}
                              </Badge>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{template.estimatedTime} min</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRepeatableFrogTemplate(template.id)}
                              className="text-green-600 hover:text-green-700"
                              disabled={frogMode.repeatableFrogTemplates.filter(t => t.isActive).length >= 3}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteRepeatableFrogTemplate(template.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Add New Template */}
            {frogMode.repeatableFrogTemplates.filter(t => t.isActive).length < 3 && (
              <Card className="border-dashed border-2 border-blue-500/30">
                <CardContent className="p-4">
                  {!isCreatingTemplate ? (
                    <Button
                      onClick={() => setIsCreatingTemplate(true)}
                      variant="ghost"
                      className="w-full h-20 text-blue-600 hover:text-blue-700 hover:bg-blue-500/5"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Plus className="w-6 h-6" />
                        <span>Add New Repeating Frog</span>
                      </div>
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Create Repeating Frog Template</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Title</label>
                          <Input
                            value={newTemplateData.title}
                            onChange={(e) => setNewTemplateData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Morning workout"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Description (optional)</label>
                          <Input
                            value={newTemplateData.description}
                            onChange={(e) => setNewTemplateData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description..."
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium">Priority</label>
                            <select
                              value={newTemplateData.priority}
                              onChange={(e) => setNewTemplateData(prev => ({ ...prev, priority: e.target.value as 'critical' | 'high' | 'medium' }))}
                              className="w-full mt-1 p-2 border rounded-md bg-background"
                            >
                              <option value="critical">🔴 Critical</option>
                              <option value="high">🟡 High</option>
                              <option value="medium">🟢 Medium</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Repeat Type</label>
                            <select
                              value={newTemplateData.repeatType}
                              onChange={(e) => setNewTemplateData(prev => ({ ...prev, repeatType: e.target.value as 'daily' | 'weekdays' }))}
                              className="w-full mt-1 p-2 border rounded-md bg-background"
                            >
                              <option value="daily">📅 Daily</option>
                              <option value="weekdays">🏢 Weekdays</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Estimated Time (minutes)</label>
                          <Input
                            type="number"
                            value={newTemplateData.estimatedTime}
                            onChange={(e) => setNewTemplateData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                            min="5"
                            max="180"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => {
                            if (newTemplateData.title.trim()) {
                              // Set the state variables that createRepeatableFrogTemplate uses
                              setNewFrogTitle(newTemplateData.title);
                              setNewFrogDescription(newTemplateData.description);
                              setPriority(newTemplateData.priority);
                              setNewTemplateRepeatType(newTemplateData.repeatType);
                              setEstimatedTime(newTemplateData.estimatedTime);
                              
                              // Call the function
                              createRepeatableFrogTemplate();
                              setNewTemplateData({
                                title: '',
                                description: '',
                                priority: 'medium',
                                repeatType: 'daily',
                                estimatedTime: 30,
                                coinBonus: 50,
                                xpBonus: 100
                              });
                              setIsCreatingTemplate(false);
                            }
                          }}
                          className="flex-1"
                          disabled={!newTemplateData.title.trim()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Template
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreatingTemplate(false);
                            setNewTemplateData({
                              title: '',
                              description: '',
                              priority: 'medium',
                              repeatType: 'daily',
                              estimatedTime: 30,
                              coinBonus: 50,
                              xpBonus: 100
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {frogMode.repeatableFrogTemplates.filter(t => t.isActive).length >= 3 && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    You've reached the maximum of 3 active repeating frogs. Deactivate one to add a new template.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </motion.div>

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
                  onClick={() => setShowOverride(true)}
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
        {showOverride && (
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
                    onClick={() => setShowOverride(false)}
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

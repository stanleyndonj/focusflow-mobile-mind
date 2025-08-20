/**
 * Gamification Integration Service
 * Handles bidirectional sync between gamification features and main app
 */

export interface TaskCompletionData {
  taskId: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  timeSpent: number; // in minutes
  isFrogTask: boolean;
  isQuestTask: boolean;
  completedAt: string;
}

export interface FocusSessionData {
  sessionId: string;
  taskId?: string;
  duration: number; // in minutes
  completed: boolean;
  startTime: string;
  endTime?: string;
}

class GamificationIntegrationService {
  private static instance: GamificationIntegrationService;
  private gameActions: any = null;
  private taskActions: any = null;

  private constructor() {}

  static getInstance(): GamificationIntegrationService {
    if (!GamificationIntegrationService.instance) {
      GamificationIntegrationService.instance = new GamificationIntegrationService();
    }
    return GamificationIntegrationService.instance;
  }

  /**
   * Initialize with context actions
   */
  initialize(gameActions: any, taskActions: any): void {
    this.gameActions = gameActions;
    this.taskActions = taskActions;
  }

  /**
   * Handle task completion from main app
   */
  onTaskCompleted(data: TaskCompletionData): void {
    if (!this.gameActions) return;

    // Base rewards for task completion
    const baseXP = this.calculateTaskXP(data);
    const baseCoins = this.calculateTaskCoins(data);

    // Add base rewards
    this.gameActions.addXP(baseXP);
    this.gameActions.addCoins(baseCoins);

    // Handle special task types
    if (data.isFrogTask) {
      this.handleFrogTaskCompletion(data);
    }

    if (data.isQuestTask) {
      this.handleQuestTaskCompletion(data);
    }

    // Update day streak progress
    this.gameActions.updateDayStreak?.();

    // Update companion mood (positive)
    this.updateCompanionMood('positive', data);

    // Check for quest progress updates
    this.updateQuestProgress(data);

    console.log(`Task completed: +${baseXP} XP, +${baseCoins} coins`);
  }

  /**
   * Handle focus session completion from timer
   */
  onFocusSessionCompleted(data: FocusSessionData): void {
    if (!this.gameActions) return;

    // Focus session rewards
    const sessionXP = Math.floor(data.duration / 5) * 2; // 2 XP per 5 minutes
    const sessionCoins = Math.floor(data.duration / 10) * 1; // 1 coin per 10 minutes

    this.gameActions.addXP(sessionXP);
    this.gameActions.addCoins(sessionCoins);

    // Update companion mood
    this.updateCompanionMood('positive', { timeSpent: data.duration });

    // Check for focus-related quests
    this.updateFocusQuests(data);

    console.log(`Focus session completed: +${sessionXP} XP, +${sessionCoins} coins`);
  }

  /**
   * Handle task creation from gamification features
   */
  createTaskFromGamification(taskData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    tags?: string[];
    taskType?: 'frog' | 'quest' | 'regular';
  }): string {
    if (!this.taskActions?.addTask) return '';

    const newTask = {
      title: taskData.title,
      description: taskData.description || '',
      completed: false,
      updatedAt: new Date().toISOString(),
      priority: taskData.priority || 'medium',
      category: taskData.category || 'gamification',
      tags: taskData.tags || [],
      subtasks: [],
      isPriority: taskData.priority === 'high',
      totalTimeSpent: 0,
      focusSessions: [],
      notes: [],
      links: [],
      taskType: taskData.taskType || 'regular',
      difficulty: taskData.priority === 'high' ? 'medium' : 'easy',
    };

    const taskId = this.taskActions.addTask(newTask);
    console.log(`Task created from gamification: ${taskData.title}`);
    return taskId;
  }

  /**
   * Sync gamification data with task completion
   */
  syncTaskCompletion(taskId: string): void {
    // This would be called when a task is marked as completed
    // to ensure all gamification features are updated accordingly
    
    if (!this.gameActions || !this.taskActions) return;

    // Get task details
    const task = this.taskActions.getTask?.(taskId);
    if (!task) return;

    const completionData: TaskCompletionData = {
      taskId: task.id,
      title: task.title,
      category: task.category || 'general',
      priority: task.priority,
      timeSpent: task.totalTimeSpent || 0,
      isFrogTask: task.taskType === 'frog',
      isQuestTask: task.taskType === 'quest',
      completedAt: new Date().toISOString()
    };

    this.onTaskCompleted(completionData);
  }

  /**
   * Get available tasks for gamification features
   */
  getAvailableTasks(): any[] {
    if (!this.taskActions?.getTasks) return [];
    
    const allTasks = this.taskActions.getTasks();
    return allTasks.filter((task: any) => !task.completed);
  }

  /**
   * Get completed tasks for today
   */
  getTodaysCompletedTasks(): any[] {
    if (!this.taskActions?.getTasks) return [];
    
    const allTasks = this.taskActions.getTasks();
    const today = new Date().toISOString().split('T')[0];
    
    return allTasks.filter((task: any) => {
      if (!task.completed || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
      return completedDate === today;
    });
  }

  private calculateTaskXP(data: TaskCompletionData): number {
    let baseXP = 20; // Base XP for any task completion

    // Priority multiplier
    switch (data.priority) {
      case 'high':
        baseXP *= 2;
        break;
      case 'medium':
        baseXP *= 1.5;
        break;
      case 'low':
        baseXP *= 1;
        break;
    }

    // Time spent bonus (1 XP per minute spent)
    baseXP += Math.floor(data.timeSpent);

    // Special task type bonuses
    if (data.isFrogTask) {
      baseXP += 50; // Frog task bonus
    }

    return Math.floor(baseXP);
  }

  private calculateTaskCoins(data: TaskCompletionData): number {
    let baseCoins = 10; // Base coins for any task completion

    // Priority multiplier
    switch (data.priority) {
      case 'high':
        baseCoins *= 2;
        break;
      case 'medium':
        baseCoins *= 1.5;
        break;
      case 'low':
        baseCoins *= 1;
        break;
    }

    // Time spent bonus (0.5 coins per minute spent)
    baseCoins += Math.floor(data.timeSpent * 0.5);

    // Special task type bonuses
    if (data.isFrogTask) {
      baseCoins += 25; // Frog task bonus
    }

    return Math.floor(baseCoins);
  }

  private handleFrogTaskCompletion(data: TaskCompletionData): void {
    // Additional frog-specific rewards and tracking
    console.log('Frog task completed:', data.title);
    
    // Update frog streak in localStorage
    try {
      const frogHistory = JSON.parse(localStorage.getItem('focusflow_frog_history') || '[]');
      const today = new Date().toISOString().split('T')[0];
      
      const updatedHistory = frogHistory.map((frog: any) => {
        if (frog.taskId === data.taskId && frog.date === today) {
          return {
            ...frog,
            isCompleted: true,
            completedAt: data.completedAt
          };
        }
        return frog;
      });
      
      localStorage.setItem('focusflow_frog_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to update frog history:', error);
    }
  }

  private handleQuestTaskCompletion(data: TaskCompletionData): void {
    // Update quest progress
    if (!this.gameActions?.quests) return;

    const activeQuests = this.gameActions.quests.filter((quest: any) => 
      quest.status === 'active' && quest.type === 'task_completion'
    );

    activeQuests.forEach((quest: any) => {
      const updatedQuest = {
        ...quest,
        progress: Math.min(quest.progress + 1, quest.target)
      };

      this.gameActions.updateQuest?.(updatedQuest);

      if (updatedQuest.progress >= updatedQuest.target) {
        this.gameActions.completeQuest?.(updatedQuest.id);
      }
    });
  }

  private updateCompanionMood(type: 'positive' | 'negative', data: any): void {
    // Update companion mood based on activity
    if (!this.gameActions?.companion) return;

    // This would update companion happiness/mood
    console.log(`Companion mood updated: ${type}`);
  }

  private updateQuestProgress(data: TaskCompletionData): void {
    // Update various quest types based on task completion
    if (!this.gameActions?.quests) return;

    const activeQuests = this.gameActions.quests.filter((quest: any) => quest.status === 'active');

    activeQuests.forEach((quest: any) => {
      let progressIncrement = 0;

      switch (quest.type) {
        case 'task_completion':
          progressIncrement = 1;
          break;
        case 'high_priority_tasks':
          if (data.priority === 'high') progressIncrement = 1;
          break;
        case 'category_tasks':
          if (quest.targetCategory === data.category) progressIncrement = 1;
          break;
        case 'time_spent':
          progressIncrement = data.timeSpent;
          break;
      }

      if (progressIncrement > 0) {
        const updatedQuest = {
          ...quest,
          progress: Math.min(quest.progress + progressIncrement, quest.target)
        };

        this.gameActions.updateQuest?.(updatedQuest);

        if (updatedQuest.progress >= updatedQuest.target) {
          this.gameActions.completeQuest?.(updatedQuest.id);
        }
      }
    });
  }

  private updateFocusQuests(data: FocusSessionData): void {
    // Update focus-related quests
    if (!this.gameActions?.quests) return;

    const focusQuests = this.gameActions.quests.filter((quest: any) => 
      quest.status === 'active' && quest.type === 'focus_session'
    );

    focusQuests.forEach((quest: any) => {
      const updatedQuest = {
        ...quest,
        progress: Math.min(quest.progress + 1, quest.target)
      };

      this.gameActions.updateQuest?.(updatedQuest);

      if (updatedQuest.progress >= updatedQuest.target) {
        this.gameActions.completeQuest?.(updatedQuest.id);
      }
    });
  }
}

export default GamificationIntegrationService;

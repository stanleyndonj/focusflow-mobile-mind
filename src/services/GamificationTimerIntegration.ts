/**
 * Gamification Timer Integration Service
 * Coordinates timer events with all gamification features
 */

// Timer and Game state will be passed as parameters to avoid circular imports

export interface TimerEventData {
  sessionId: string;
  startTime: number;
  duration: number;
  taskId?: string;
  taskTitle?: string;
  completed: boolean;
  exitedEarly: boolean;
}

export interface GamificationTimerCallbacks {
  onSessionStart?: (data: TimerEventData) => void;
  onSessionComplete?: (data: TimerEventData) => void;
  onSessionAbandoned?: (data: TimerEventData) => void;
  onTimerTick?: (timeLeft: number, totalDuration: number) => void;
  onSessionPaused?: (data: TimerEventData) => void;
  onSessionResumed?: (data: TimerEventData) => void;
}

class GamificationTimerIntegration {
  private static instance: GamificationTimerIntegration;
  private callbacks: GamificationTimerCallbacks = {};
  private currentSession: TimerEventData | null = null;
  private gameActions: any = null;
  private taskActions: any = null;
  private isInitialized = false;
  private isProcessing = false; // Add processing lock

  private constructor() {}

  static getInstance(): GamificationTimerIntegration {
    if (!GamificationTimerIntegration.instance) {
      GamificationTimerIntegration.instance = new GamificationTimerIntegration();
    }
    return GamificationTimerIntegration.instance;
  }

  /**
   * Initialize with game context actions
   */
  initialize(gameActions: any, taskActions: any): void {
    this.gameActions = gameActions;
    this.taskActions = taskActions;
    this.isInitialized = true; // Set initialization flag
    
    console.log('🥷 GamificationTimerIntegration: Initializing with actions...');
    console.log('🥷 GameActions available:', !!gameActions);
    console.log('🥷 TaskActions available:', !!taskActions);
    console.log('🥷 Shadow Mode enabled:', gameActions?.shadowMode?.isEnabled);
    
    // Start scheduled task monitoring for Shadow Mode
    this.startScheduledTaskMonitoring();
    
    console.log('✅ GamificationTimerIntegration initialized with Shadow Mode task monitoring');
  }
  
  // Monitor scheduled tasks for Shadow Mode duels
  private startScheduledTaskMonitoring(): void {
    // Check every minute for missed scheduled tasks
    setInterval(() => {
      this.checkScheduledTaskDuels();
    }, 60000); // Check every minute
  }
  
  private checkScheduledTaskDuels(): void {
    if (!this.gameActions || !this.isInitialized) {
      console.log('🥷 Shadow Mode: Not initialized, skipping scheduled task check');
      return;
    }
    
    // Prevent duplicate processing
    if (this.isProcessing) {
      console.log('🥷 Shadow Mode: Already processing, skipping duplicate call');
      return;
    }
    
    this.isProcessing = true;
    
    if (!this.gameActions?.shadowMode?.isEnabled) {
      console.log('🥷 Shadow Mode disabled, skipping task check');
      this.isProcessing = false;
      return;
    }
    
    if (!this.taskActions) {
      console.log('⚠️ Shadow Mode: Task actions not available');
      this.isProcessing = false;
      return;
    }
    
    const now = new Date();
    let tasks = [];
    
    // Try multiple ways to get tasks
    try {
      // Method 1: Use taskActions.getTasks()
      tasks = this.taskActions.getTasks?.() || [];
      console.log(`🥷 Method 1 - getTasks(): ${tasks.length} tasks`);
      
      if (tasks.length === 0) {
        // Method 2: Try localStorage with different keys
        const possibleKeys = ['tasks', 'focusflow_tasks', 'focusflow-tasks'];
        for (const key of possibleKeys) {
          const storedTasks = localStorage.getItem(key);
          if (storedTasks) {
            try {
              const parsedTasks = JSON.parse(storedTasks);
              if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                tasks = parsedTasks;
                console.log(`🥷 Method 2 - localStorage[${key}]: ${tasks.length} tasks`);
                break;
              }
            } catch (parseError) {
              console.warn(`⚠️ Failed to parse tasks from ${key}:`, parseError);
            }
          }
        }
      }
      
      if (tasks.length === 0) {
        // Method 3: Try to get tasks from window object (if available)
        if (typeof window !== 'undefined' && (window as any).taskState) {
          tasks = (window as any).taskState.tasks || [];
          console.log(`🥷 Method 3 - window.taskState: ${tasks.length} tasks`);
        }
      }
      
      // Remove duplicates based on id and title
      const uniqueTasks = tasks.filter((task: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t.id === task.id || (t.title === task.title && t.createdAt === task.createdAt))
      );
      
      if (uniqueTasks.length !== tasks.length) {
        console.log(`🥷 Removed ${tasks.length - uniqueTasks.length} duplicate tasks`);
        tasks = uniqueTasks;
        
        // Update localStorage to remove duplicates
        try {
          localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (error) {
          console.warn('⚠️ Failed to update localStorage with deduplicated tasks:', error);
        }
      }
      
      // Migration: Add scheduledFor to existing tasks that have dueDate and startTime but no scheduledFor
      let migrationCount = 0;
      tasks = tasks.map((task: any) => {
        if (!task.scheduledFor && task.dueDate && task.startTime) {
          try {
            const [hours, minutes] = task.startTime.split(':').map(Number);
            const scheduledDateTime = new Date(task.dueDate);
            scheduledDateTime.setHours(hours, minutes, 0, 0);
            task.scheduledFor = scheduledDateTime.toISOString();
            migrationCount++;
            console.log(`🥷 Migrated task "${task.title}" - added scheduledFor: ${scheduledDateTime.toLocaleString()}`);
          } catch (error) {
            console.warn(`⚠️ Failed to migrate task "${task.title}":`, error);
          }
        }
        return task;
      });
      
      if (migrationCount > 0) {
        console.log(`🥷 Migrated ${migrationCount} existing tasks with scheduledFor property`);
        // Update localStorage with migrated tasks
        try {
          localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (error) {
          console.warn('⚠️ Failed to save migrated tasks to localStorage:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error retrieving tasks:', error);
      this.isProcessing = false;
      return;
    }
    
    console.log(`🥷 Shadow Mode: Checking ${tasks.length} tasks for scheduled duels...`);
    
    if (tasks.length === 0) {
      console.log('🥷 No tasks found to monitor');
      console.log('🥷 Available localStorage keys:', Object.keys(localStorage));
      console.log('🥷 TaskActions available:', !!this.taskActions);
      console.log('🥷 getTasks method available:', !!this.taskActions?.getTasks);
      this.isProcessing = false;
      return;
    }
    
    // Debug: Log all tasks with their scheduled times
    console.log('🥷 Tasks found:');
    tasks.forEach((task: any, index: number) => {
      console.log(`  ${index + 1}. "${task.title}" - Scheduled: ${task.scheduledFor || 'None'} - Completed: ${task.completed} - Processed: ${task.shadowDuelProcessed}`);
    });
    
    // Check for scheduled tasks - both completed (user wins) and missed (shadow wins)
    let processedCount = 0;
    tasks.forEach((task: any) => {
      // Process scheduled tasks for shadow duels
      if (task.scheduledFor && !task.shadowDuelProcessed) {
        const scheduledTime = new Date(task.scheduledFor);
        const timeDiff = now.getTime() - scheduledTime.getTime();
        const minutesOverdue = Math.floor(timeDiff / (60 * 1000));
        
        console.log(`🥷 Task "${task.title}" scheduled for ${scheduledTime.toLocaleString()}, time diff: ${minutesOverdue} minutes`);
        
        // Check if task was completed (with or without completedAt timestamp)
        if (task.completed) {
          let completionTimeDiff = 0;
          
          if (task.completedAt) {
            const completedTime = new Date(task.completedAt);
            completionTimeDiff = completedTime.getTime() - scheduledTime.getTime();
            console.log(`✅ Task "${task.title}" completed at ${completedTime.toLocaleString()}`);
          } else {
            // If no completedAt timestamp, assume completed recently
            completionTimeDiff = now.getTime() - scheduledTime.getTime();
            console.log(`✅ Task "${task.title}" completed (no timestamp, using current time)`);
          }
          
          const minutesFromScheduled = Math.floor(completionTimeDiff / (60 * 1000));
          console.log(`✅ Task completion time difference: ${minutesFromScheduled} minutes from scheduled time`);
          
          // User wins if completed within 15 minutes of scheduled time (before or after)
          if (minutesFromScheduled <= 15) {
            console.log(`🏆 Shadow Mode: Task "${task.title}" completed on time! USER WINS!`);
            
            // Update localStorage FIRST to ensure persistence
            this.updateTaskInStorage(task.id, { shadowDuelProcessed: true });
            
            // Mark task as processed
            task.shadowDuelProcessed = true;
            
            // Update task via TaskActions if available
            if (this.taskActions.updateTask) {
              try {
                this.taskActions.updateTask({
                  ...task,
                  shadowDuelProcessed: true
                });
              } catch (error) {
                console.warn(`⚠️ Failed to update task ${task.id} via TaskActions:`, error);
              }
            }
            
            // Record user win (shadow loss) and create duel session
            this.gameActions.recordShadowLoss?.(); // User wins when completing task on time
            
            // Create a duel session for history
            this.createDuelSession({
              taskId: task.id,
              taskTitle: task.title,
              scheduledTime: scheduledTime.toISOString(),
              completedTime: task.completedAt || new Date().toISOString(),
              result: 'user_win',
              duration: task.duration || 30
            });
            
            console.log(`🏆 Shadow Duel Result: VICTORY! You completed "${task.title}" on time!`);
            console.log(`🥷 User win awarded! Task marked as processed.`);
            processedCount++;
          }
        }
        // Check for missed tasks (incomplete and overdue by more than 15 minutes)
        else if (!task.completed && minutesOverdue >= 15) {
          console.log(`😈 Shadow Mode: Scheduled task "${task.title}" missed by ${minutesOverdue} minutes! Shadow WINS!`);
          
          // Mark task as processed to avoid duplicate shadow wins
          task.shadowDuelProcessed = true;
          
          // Update localStorage FIRST to ensure persistence
          this.updateTaskInStorage(task.id, { shadowDuelProcessed: true });
          
          // Update task via TaskActions if available
          if (this.taskActions.updateTask) {
            try {
              this.taskActions.updateTask({
                ...task,
                shadowDuelProcessed: true
            });
            } catch (error) {
              console.warn(`⚠️ Failed to update task ${task.id} via TaskActions:`, error);
            }
          }
          
          // Record shadow win for missed scheduled task and create duel session
          this.gameActions.recordShadowWin?.(); // Shadow wins when user misses task
          
          // Create a duel session for history
          this.createDuelSession({
            taskId: task.id,
            taskTitle: task.title,
            scheduledTime: scheduledTime.toISOString(),
            completedTime: null,
            result: 'shadow_win',
            duration: task.duration || 30
          });
          
          console.log(`😈 Shadow Duel Result: DEFEAT! You missed your scheduled task "${task.title}" at ${scheduledTime.toLocaleTimeString()}`);
          console.log(`🥷 Shadow win awarded! Task marked as processed to prevent duplicate wins.`);
          processedCount++;
        }
        else if (task.shadowDuelProcessed) {
          console.log(`🥷 Task "${task.title}" already processed for shadow duel, skipping`);
        }
      }
      
      // Also check for recently completed tasks without scheduled times (manual completion)
      else if (task.completed && !task.shadowDuelProcessed && !task.scheduledFor) {
        console.log(`🏆 Task "${task.title}" completed manually (no scheduled time) - USER WINS!`);
        
        // Mark task as processed
        task.shadowDuelProcessed = true;
        
        // Update task via TaskActions if available
        if (this.taskActions.updateTask) {
          this.taskActions.updateTask({
            ...task,
            shadowDuelProcessed: true
          });
        }
        
        // Update localStorage
        this.updateTaskInStorage(task.id, { shadowDuelProcessed: true });
        
        // Record user win for manual completion and create duel session
        this.gameActions.recordShadowLoss?.(); // User wins when completing any task
        
        // Create a duel session for history
        this.createDuelSession({
          taskId: task.id,
          taskTitle: task.title,
          scheduledTime: null,
          completedTime: task.completedAt || new Date().toISOString(),
          result: 'user_win',
          duration: task.duration || 30
        });
        
        console.log(`🏆 Manual Task Completion: VICTORY! You completed "${task.title}"!`);
        console.log(`🥷 User win awarded for manual completion! Task marked as processed.`);
        processedCount++;
      }
    });
    
    console.log(`🥷 Shadow Mode: Processed ${processedCount} tasks in this check`);
    
    // Release processing lock
    setTimeout(() => {
      this.isProcessing = false;
    }, 1000); // 1 second cooldown
  }

  /**
   * Create a duel session for history tracking
   */
  private createDuelSession(duelData: {
    taskId: string;
    taskTitle: string;
    scheduledTime: string | null;
    completedTime: string | null;
    result: 'user_win' | 'shadow_win';
    duration: number;
  }): void {
    try {
      const session = {
        id: `duel_${Date.now()}`,
        startTime: duelData.scheduledTime || new Date().toISOString(),
        actualEndTime: duelData.completedTime,
        duration: duelData.duration,
        taskId: duelData.taskId,
        taskTitle: duelData.taskTitle,
        completed: duelData.result === 'user_win',
        exitedEarly: false,
        createdAt: new Date().toISOString()
      };

      // Add to GameContext shadow sessions
      if (this.gameActions?.startShadowSession) {
        // Store the session in GameContext
        const existingSessions = this.gameActions.shadowSessions || [];
        const updatedSessions = [...existingSessions, session];
        
        // Save to localStorage for persistence
        localStorage.setItem('shadowSessions', JSON.stringify(updatedSessions));
        
        console.log(`🥷 Created duel session for "${duelData.taskTitle}" - Result: ${duelData.result}`);
      }
    } catch (error) {
      console.error('Error creating duel session:', error);
    }
  }

  /**
   * Set callbacks for timer events
   */
  setCallbacks(callbacks: GamificationTimerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Handle timer session start
   */
  onTimerStart(timerState: any, taskId?: string, taskTitle?: string): void {
    const sessionData: TimerEventData = {
      sessionId: `session-${Date.now()}`,
      startTime: Date.now(),
      duration: timerState.focusDuration * 60, // Convert to seconds
      taskId,
      taskTitle,
      completed: false,
      exitedEarly: false
    };

    this.currentSession = sessionData;

    // Trigger gamification features
    this.handleSessionStart(sessionData);
    
    // Notify callbacks
    this.callbacks.onSessionStart?.(sessionData);
  }

  /**
   * Handle timer session completion
   */
  onTimerComplete(timerState: any): void {
    if (!this.currentSession) return;

    const sessionData: TimerEventData = {
      ...this.currentSession,
      completed: true,
      exitedEarly: false
    };

    // Trigger gamification features
    this.handleSessionComplete(sessionData);
    
    // Notify callbacks
    this.callbacks.onSessionComplete?.(sessionData);
    
    this.currentSession = null;
  }

  /**
   * Handle timer session abandonment
   */
  onTimerAbandoned(timerState: any, reason?: string): void {
    if (!this.currentSession) return;

    const sessionData: TimerEventData = {
      ...this.currentSession,
      completed: false,
      exitedEarly: true
    };

    // Trigger gamification features
    this.handleSessionAbandoned(sessionData);
    
    // Notify callbacks
    this.callbacks.onSessionAbandoned?.(sessionData);
    
    this.currentSession = null;
  }

  /**
   * Handle timer tick events
   */
  onTimerTick(timerState: any): void {
    if (!this.currentSession) return;

    const timeLeft = timerState.timeLeft;
    const totalDuration = this.currentSession.duration;

    // Notify callbacks
    this.callbacks.onTimerTick?.(timeLeft, totalDuration);
  }

  /**
   * Handle timer pause
   */
  onTimerPause(timerState: any): void {
    if (!this.currentSession) return;

    // Notify callbacks
    this.callbacks.onSessionPaused?.(this.currentSession);
  }

  /**
   * Handle timer resume
   */
  onTimerResume(timerState: any): void {
    if (!this.currentSession) return;

    // Notify callbacks
    this.callbacks.onSessionResumed?.(this.currentSession);
  }

  /**
   * Get current session data
   */
  getCurrentSession(): TimerEventData | null {
    return this.currentSession;
  }

  private handleSessionStart(sessionData: TimerEventData): void {
    if (!this.gameActions) return;

    // Shadow Mode: Start shadow session if enabled
    if (this.gameActions.shadowMode?.enabled) {
      console.log('🥷 Shadow Mode: Starting shadow session for', sessionData.duration / 60, 'minutes');
      this.gameActions.startShadowSession(
        sessionData.duration / 60, // Convert back to minutes
        sessionData.taskId,
        sessionData.taskTitle
      );
      console.log('🥷 Shadow is now watching your focus session...');
    }

    // Mini Focus Quests: Check for quest progress
    this.updateQuestProgress('focus_session_start', {
      duration: sessionData.duration / 60,
      taskId: sessionData.taskId
    });

    // Mind Lock Mode: Handle active lock session
    // (Already handled in MindLockMode component)

    // Eat That Frog Mode: Track frog task session
    if (this.gameActions.frogMode?.activeFrogTaskId === sessionData.taskId) {
      // Mark frog task session as started
      console.log('Frog task session started:', sessionData.taskId);
    }
  }

  private handleSessionComplete(sessionData: TimerEventData): void {
    if (!this.gameActions) return;

    // Shadow Mode: Record shadow win (user completed the session)
    if (this.gameActions.shadowMode?.enabled && this.gameActions.shadowMode?.isActive) {
      console.log('🎆 Shadow Mode: Focus session completed! You WIN against your shadow!');
      this.gameActions.endShadowSession(true, false);
      
      // Show win notification
      console.log('🎆 Shadow Duel Result: VICTORY! You completed your focus session.');
    }

    // Day Streak: Update daily progress
    this.gameActions.updateDayStreak?.();

    // Mini Focus Quests: Update quest progress
    this.updateQuestProgress('focus_session_complete', {
      duration: sessionData.duration / 60,
      taskId: sessionData.taskId
    });

    // Productivity Companion: Update companion mood
    if (this.gameActions.companion) {
      // Positive mood boost for completed session
      console.log('Companion mood boost for completed session');
    }

    // Eat That Frog Mode: Complete frog task if applicable
    if (this.gameActions.frogMode?.activeFrogTaskId === sessionData.taskId) {
      // Handle frog task completion
      console.log('Frog task completed:', sessionData.taskId);
    }

    // General rewards for session completion
    const baseXP = Math.floor(sessionData.duration / 60) * 5; // 5 XP per minute
    const baseCoins = Math.floor(sessionData.duration / 60) * 2; // 2 coins per minute
    
    this.gameActions.addXP?.(baseXP);
    this.gameActions.addCoins?.(baseCoins);
  }

  private handleSessionAbandoned(sessionData: TimerEventData): void {
    if (!this.gameActions) return;

    // Shadow Mode: Record shadow loss (user abandoned the session)
    if (this.gameActions.shadowMode?.enabled && this.gameActions.shadowMode?.isActive) {
      console.log('😈 Shadow Mode: Focus session abandoned! Your shadow WINS!');
      this.gameActions.endShadowSession(false, true);
      
      // Show loss notification
      console.log('😈 Shadow Duel Result: DEFEAT! Your shadow completed the task while you gave up.');
    }

    // Mini Focus Quests: Handle quest failure
    this.updateQuestProgress('focus_session_abandoned', {
      duration: sessionData.duration / 60,
      taskId: sessionData.taskId
    });

    // Productivity Companion: Negative mood impact
    if (this.gameActions.companion) {
      // Negative mood impact for abandoned session
      console.log('Companion mood decrease for abandoned session');
    }

    // Day Streak: Potential streak break (handled in DayStreakTracker)
  }

  private updateQuestProgress(eventType: string, data: any): void {
    if (!this.gameActions?.quests) return;

    // Find active quests that match this event type
    const activeQuests = this.gameActions.quests.filter((quest: any) => 
      quest.status === 'active' && quest.type === 'focus_session'
    );

    activeQuests.forEach((quest: any) => {
      let progressIncrement = 0;

      switch (eventType) {
        case 'focus_session_start':
          // Some quests might track session starts
          break;
        case 'focus_session_complete':
          progressIncrement = 1; // One completed session
          break;
        case 'focus_session_abandoned':
          // Some quests might penalize abandonment
          break;
      }

      if (progressIncrement > 0) {
        const updatedQuest = {
          ...quest,
          progress: Math.min(quest.progress + progressIncrement, quest.target)
        };

        this.gameActions.updateQuest?.(updatedQuest);

        // Check if quest is completed
        if (updatedQuest.progress >= updatedQuest.target) {
          this.gameActions.completeQuest?.(updatedQuest.id);
        }
      }
    });
  }

  private updateTaskInStorage(taskId: string, updates: any) {
    try {
      const storedTasks = localStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        const updatedTasks = parsedTasks.map((t: any) => 
          t.id === taskId ? { ...t, ...updates } : t
        );
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        console.log(`🥷 Task ${taskId} updated in localStorage with:`, updates);
        
        // Also update the task in the TaskContext if available
        if (this.taskActions?.updateTask) {
          try {
            // Get the updated task data
            const updatedTask = updatedTasks.find((t: any) => t.id === taskId);
            if (updatedTask) {
              this.taskActions.updateTask(updatedTask);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to update task ${taskId} via TaskActions:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to update task in localStorage:', error);
    }
  }
}

export default GamificationTimerIntegration;

import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

interface RecurringTasksPluginInterface {
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
  scheduleRecurringTask(options: {
    taskId: string;
    title: string;
    body: string;
    recurrence: 'daily' | 'weekly' | 'monthly' | 'once';
    time: {
      hour: number;
      minute: number;
      dayOfWeek?: number; // 1 = Sunday, 7 = Saturday
      dayOfMonth?: number; // 1-31
    };
  }): Promise<{ success: boolean; taskId: string; nextTriggerTime: number }>;
  
  cancelRecurringTask(options: {
    taskId: string;
  }): Promise<{ success: boolean; taskId: string }>;
  
  completeTask(options: {
    taskId: string;
  }): Promise<{ 
    success: boolean; 
    taskId: string; 
    completed: boolean; 
    recurring: boolean; 
    nextTriggerTime?: number; 
    recurrence?: string;
  }>;
  
  getScheduledTasks(): Promise<{
    tasks: Array<{
      taskId: string;
      title: string;
      body: string;
      recurrence: string;
      nextTriggerTime: number;
    }>;
  }>;
}

const RecurringTasksPlugin = registerPlugin<RecurringTasksPluginInterface>('RecurringTasks');

interface CompletedTaskInfo {
  success: boolean;
  taskId: string;
  completed: boolean;
  recurring: boolean;
  nextTriggerTime?: number;
  recurrence?: string;
  lastCompletedDate?: number;
}

class RecurringTasksService {
  private listeners: Map<string, Array<Function>> = new Map();
  
  constructor() {
    this.registerListeners();
  }
  
  private async registerListeners() {
    try {
      // Listen for task notification shown events
      await RecurringTasksPlugin.addListener('taskNotificationShown', (data: any) => {
        this.emitEvent('taskNotificationShown', {
          taskId: data.taskId,
          timestamp: data.timestamp
        });
      });
    } catch (error) {
      console.error('Error registering task notification listener:', error);
    }
  }
  
  /**
   * Schedule a recurring task notification
   * @param taskId Unique identifier for the task
   * @param title Notification title
   * @param body Notification body text
   * @param recurrence Recurrence pattern (daily, weekly, monthly, once)
   * @param time Time configuration object
   * @returns Promise with scheduling result
   */
  async scheduleRecurringTask(
    taskId: string,
    title: string,
    body: string,
    recurrence: 'daily' | 'weekly' | 'monthly' | 'once',
    time: {
      hour: number;
      minute: number;
      dayOfWeek?: number;
      dayOfMonth?: number;
    }
  ) {
    try {
      const result = await RecurringTasksPlugin.scheduleRecurringTask({
        taskId,
        title,
        body,
        recurrence,
        time
      });
      
      // Save to local storage for UI reference
      this.saveTaskToStorage(taskId, {
        title,
        body,
        recurrence,
        time,
        nextTriggerTime: result.nextTriggerTime
      });
      
      return result;
    } catch (error) {
      console.error('Error scheduling recurring task:', error);
      return { success: false, taskId, nextTriggerTime: 0 };
    }
  }
  
  /**
   * Cancel a scheduled recurring task
   * @param taskId ID of the task to cancel
   * @returns Promise with cancellation result
   */
  async cancelRecurringTask(taskId: string) {
    try {
      const result = await RecurringTasksPlugin.cancelRecurringTask({
        taskId
      });
      
      // Remove from local storage
      this.removeTaskFromStorage(taskId);
      
      return result;
    } catch (error) {
      console.error('Error cancelling recurring task:', error);
      return { success: false, taskId };
    }
  }
  
  /**
   * Mark a task as completed and handle re-scheduling for recurring tasks
   * @param taskId Task ID to complete
   * @returns Promise with completion result including next occurrence info if recurring
   */
  async completeTask(taskId: string): Promise<CompletedTaskInfo> {
    try {
      // For web platform, provide a stub implementation
      if (this.isWeb()) {
        const tasks = this.getTasksFromStorage();
        const task = tasks[taskId];
        
        if (!task) {
          return { 
            success: false, 
            taskId, 
            completed: false, 
            recurring: false 
          };
        }
        
        const recurrence = task.recurrence;
        const recurring = recurrence !== 'once';
        const now = Date.now();
        
        // Record completion
        task.lastCompletedDate = now;
        
        if (!recurring) {
          // For non-recurring tasks, just mark as completed and remove
          this.removeTaskFromStorage(taskId);
          return { 
            success: true, 
            taskId, 
            completed: true, 
            recurring: false 
          };
        } else {
          // For recurring tasks, calculate next occurrence
          const time = task.time;
          const nextDate = new Date();
          nextDate.setHours(time.hour, time.minute, 0, 0);
          
          switch (recurrence) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
          }
          
          const nextTriggerTime = nextDate.getTime();
          task.nextTriggerTime = nextTriggerTime;
          
          // Save updated task
          this.saveTaskToStorage(taskId, task);
          
          return {
            success: true,
            taskId,
            completed: true,
            recurring: true,
            nextTriggerTime,
            recurrence
          };
        }
      }
      
      // For native platforms, use the plugin
      const result = await RecurringTasksPlugin.completeTask({
        taskId
      });
      
      // If this was a non-recurring task, remove it from storage
      if (!result.recurring) {
        this.removeTaskFromStorage(taskId);
      } else if (result.nextTriggerTime) {
        // For recurring tasks, update the next trigger time in storage
        const tasks = this.getTasksFromStorage();
        const task = tasks[taskId];
        
        if (task) {
          task.nextTriggerTime = result.nextTriggerTime;
          task.lastCompletedDate = Date.now();
          this.saveTaskToStorage(taskId, task);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error completing task:', error);
      return { 
        success: false, 
        taskId, 
        completed: false, 
        recurring: false 
      };
    }
  }
  
  /**
   * Get all scheduled tasks from the native layer
   * @returns Promise with array of scheduled tasks
   */
  async getScheduledTasks() {
    try {
      return await RecurringTasksPlugin.getScheduledTasks();
    } catch (error) {
      console.error('Error getting scheduled tasks:', error);
      return { tasks: [] };
    }
  }
  
  /**
   * Get all recurring tasks from local storage
   * This provides a faster access to task details without having to call native code
   * @returns Array of recurring tasks with details
   */
  getTasksFromStorage() {
    try {
      const tasksJson = localStorage.getItem('recurringTasks') || '{}';
      return JSON.parse(tasksJson);
    } catch (error) {
      console.error('Error getting tasks from storage:', error);
      return {};
    }
  }
  
  /**
   * Save task to local storage
   * @param taskId Task ID to save
   * @param taskData Task data object
   */
  private saveTaskToStorage(taskId: string, taskData: any) {
    try {
      const tasksJson = localStorage.getItem('recurringTasks') || '{}';
      const tasks = JSON.parse(tasksJson);
      
      tasks[taskId] = {
        ...taskData,
        updatedAt: Date.now(),
        createdAt: tasks[taskId]?.createdAt || Date.now()
      };
      
      localStorage.setItem('recurringTasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving task to storage:', error);
    }
  }
  
  /**
   * Remove task from local storage
   * @param taskId Task ID to remove
   */
  private removeTaskFromStorage(taskId: string) {
    try {
      const tasksJson = localStorage.getItem('recurringTasks') || '{}';
      const tasks = JSON.parse(tasksJson);
      
      if (tasks[taskId]) {
        delete tasks[taskId];
        localStorage.setItem('recurringTasks', JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Error removing task from storage:', error);
    }
  }
  
  /**
   * Synchronize local storage with actual scheduled tasks
   * This ensures UI shows only tasks that are actually scheduled
   */
  async syncTasksWithNative() {
    try {
      const { tasks } = await this.getScheduledTasks();
      const storageTasksMap = this.getTasksFromStorage();
      
      // Update the nextTriggerTime for tasks in storage
      const updatedStorageTasks: any = {};
      
      // First add all native tasks
      tasks.forEach(task => {
        const existingTask = storageTasksMap[task.taskId] || {};
        updatedStorageTasks[task.taskId] = {
          ...existingTask,
          title: task.title,
          body: task.body,
          recurrence: task.recurrence,
          nextTriggerTime: task.nextTriggerTime,
          updatedAt: Date.now()
        };
      });
      
      // Save back to storage
      localStorage.setItem('recurringTasks', JSON.stringify(updatedStorageTasks));
      
      return { success: true, taskCount: tasks.length };
    } catch (error) {
      console.error('Error syncing tasks with native:', error);
      return { success: false, taskCount: 0 };
    }
  }
  
  // Event subscription system
  addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  private emitEvent(event: string, data: any) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in recurring tasks event listener for ${event}:`, error);
      }
    });
  }
  
  // Helper method to detect if running on web platform
  private isWeb(): boolean {
    return typeof document !== 'undefined' && 
           typeof navigator !== 'undefined' && 
           typeof navigator.userAgent !== 'undefined' &&
           !navigator.userAgent.includes('Capacitor');
  }
}

export default new RecurringTasksService();

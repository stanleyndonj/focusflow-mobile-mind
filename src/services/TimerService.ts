import { registerPlugin, Capacitor } from '@capacitor/core';
import NotificationService from './NotificationService.ts';

interface TimerPluginInterface {
  startTimer(options: { durationSeconds: number; taskName?: string; taskId?: string }): Promise<{ success: boolean; durationSeconds: number }>;
  pauseTimer(): Promise<{ success: boolean }>;
  resumeTimer(): Promise<{ success: boolean }>;
  stopTimer(): Promise<{ success: boolean }>;
  getTimerStatus(): Promise<{ isRunning: boolean }>;
  addListener(eventName: string, listenerFunc: (data: any) => void): PluginListenerHandle;
}

interface PluginListenerHandle {
  remove: () => Promise<void>;
}

// Web fallback implementation
class WebTimerPlugin implements TimerPluginInterface {
  private timerId: number | null = null;
  private listeners: {[event: string]: Array<(data: any) => void>} = {};
  private startTime: number = 0;
  private duration: number = 0;
  private timeRemaining: number = 0;
  private taskName: string = 'Focus Session';
  private taskId?: string;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000; // Update every second

  async startTimer(options: { durationSeconds: number; taskName?: string; taskId?: string }): Promise<{ success: boolean; durationSeconds: number }> {
    if (this.isRunning) return { success: false, durationSeconds: 0 };
    
    this.duration = options.durationSeconds * 1000;
    this.timeRemaining = this.duration;
    this.taskName = options.taskName || 'Focus Session';
    this.taskId = options.taskId;
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    
    // Emit started event
    this.emitEvent('timerStarted', {
      duration: this.duration,
      startTime: this.startTime,
      taskId: this.taskId,
      taskName: this.taskName
    });
    
    // Start the timer
    this.timerId = window.setInterval(() => this.updateTimer(), this.updateInterval);
    
    return { success: true, durationSeconds: options.durationSeconds };
  }
  
  async pauseTimer(): Promise<{ success: boolean }> {
    if (!this.isRunning || this.isPaused) return { success: false };
    
    clearInterval(this.timerId!);
    this.isPaused = true;
    this.isRunning = false;
    
    // Calculate time spent in this session
    const timeSpent = Date.now() - this.lastUpdateTime;
    this.timeRemaining = Math.max(0, this.timeRemaining - timeSpent);
    
    this.emitEvent('timerPaused', {
      timeRemaining: this.timeRemaining,
      taskId: this.taskId
    });
    
    return { success: true };
  }
  
  async resumeTimer(): Promise<{ success: boolean }> {
    if (!this.isPaused || this.isRunning) return { success: false };
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastUpdateTime = Date.now();
    
    // Restart the timer
    this.timerId = window.setInterval(() => this.updateTimer(), this.updateInterval);
    
    this.emitEvent('timerResumed', {
      timeRemaining: this.timeRemaining,
      taskId: this.taskId
    });
    
    return { success: true };
  }
  
  async stopTimer(): Promise<{ success: boolean }> {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    const wasRunning = this.isRunning;
    this.isRunning = false;
    this.isPaused = false;
    
    if (wasRunning) {
      this.emitEvent('timerStopped', {
        taskId: this.taskId,
        timeSpent: this.duration - this.timeRemaining
      });
    }
    
    return { success: true };
  }
  
  async getTimerStatus(): Promise<{ isRunning: boolean }> {
    return { isRunning: this.isRunning };
  }
  
  addListener(eventName: string, listenerFunc: (data: any) => void): PluginListenerHandle {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listenerFunc);
    
    return {
      remove: async () => {
        this.listeners[eventName] = this.listeners[eventName].filter(fn => fn !== listenerFunc);
      }
    };
  }
  
  private emitEvent(eventName: string, data: any) {
    const listeners = this.listeners[eventName] || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (e) {
        console.error(`Error in ${eventName} listener:`, e);
      }
    }
  }
  
  private updateTimer() {
    const now = Date.now();
    const elapsed = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    
    this.timeRemaining = Math.max(0, this.timeRemaining - elapsed);
    
    // Emit update
    this.emitEvent('timerUpdate', {
      timeRemaining: this.timeRemaining,
      totalTime: this.duration,
      taskId: this.taskId
    });
    
    // Check if timer finished
    if (this.timeRemaining <= 0) {
      clearInterval(this.timerId!);
      this.isRunning = false;
      this.emitEvent('timerFinished', {
        taskId: this.taskId,
        taskName: this.taskName
      });
    }
  }
}

// Use the native plugin if available, otherwise fall back to web implementation
const TimerPlugin = Capacitor.isNativePlatform() 
  ? registerPlugin<TimerPluginInterface>('TimerPlugin')
  : new WebTimerPlugin();

// Format time function helper
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format: "2 hours 30 minutes" or "30 minutes" or "2 hours"
  let formattedTime = '';
  if (hours > 0) {
    formattedTime += `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  if (minutes > 0) {
    formattedTime += formattedTime ? ' ' : '';
    formattedTime += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  if (hours === 0 && minutes === 0) {
    formattedTime = `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }

  return formattedTime;
};

// Format the time for display in HH:MM:SS format
const formatTimeDisplay = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

class TimerService {
  private listeners: Map<string, Array<Function>> = new Map();
  private timerState: {
    isRunning: boolean;
    isPaused: boolean;
    startTime: number;
    duration: number;
    timeRemaining: number;
    taskName: string;
    taskId?: string;
    pausedDuration?: number; // Track accumulated time when paused
  } = {
    isRunning: false,
    isPaused: false,
    startTime: 0,
    duration: 0,
    timeRemaining: 0,
    taskName: 'Focus Session'
  };

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for timer updates from the native layer
    TimerPlugin.addListener('timerUpdate', (data: any) => {
      this.timerState.timeRemaining = data.timeRemaining;
      this.emitEvent('timerUpdate', {
        timeRemaining: data.timeRemaining,
        formattedTime: formatTimeDisplay(data.timeRemaining),
        percentComplete: 100 - ((data.timeRemaining * 100) / data.totalTime),
        taskId: this.timerState.taskId
      });
    });

    TimerPlugin.addListener('timerStarted', (data: any) => {
      this.timerState.isRunning = true;
      this.timerState.isPaused = false;
      this.timerState.startTime = data.startTime;
      this.timerState.duration = data.duration;
      this.timerState.timeRemaining = data.duration;
      this.timerState.pausedDuration = 0; // Reset paused duration when starting new session
      
      this.emitEvent('timerStarted', {
        duration: data.duration,
        formattedDuration: formatTime(data.duration),
        startTime: data.startTime,
        taskId: this.timerState.taskId,
        taskName: this.timerState.taskName
      });
    });

    TimerPlugin.addListener('timerPaused', (data: any) => {
      this.timerState.isPaused = true;
      this.timerState.timeRemaining = data.timeRemaining;
      
      // Calculate time spent so far in this session (duration - remaining)
      const timeSpentInSession = this.timerState.duration - data.timeRemaining;
      // Add to the accumulated paused duration
      this.timerState.pausedDuration = (this.timerState.pausedDuration || 0) + timeSpentInSession;
      
      this.emitEvent('timerPaused', {
        timeRemaining: data.timeRemaining,
        formattedTimeRemaining: formatTimeDisplay(data.timeRemaining),
        taskId: this.timerState.taskId,
        timeSpentSoFar: this.timerState.pausedDuration
      });
    });

    TimerPlugin.addListener('timerStopped', () => {
      const taskId = this.timerState.taskId;
      const pausedDuration = this.timerState.pausedDuration || 0;
      const timeSpentInSession = this.timerState.duration - this.timerState.timeRemaining;
      const totalTimeSpent = pausedDuration + timeSpentInSession;
      
      this.timerState.isRunning = false;
      this.timerState.isPaused = false;
      this.timerState.timeRemaining = 0;
      
      // Emit event with the total time spent on this task session
      this.emitEvent('timerStopped', {
        taskId,
        timeSpent: totalTimeSpent
      });
      
      // Reset task-specific state
      this.timerState.taskId = undefined;
      this.timerState.pausedDuration = 0;
      this.timerState.taskName = 'Focus Session';
    });

    TimerPlugin.addListener('timerFinished', (data: any) => {
      this.timerState.isRunning = false;
      this.timerState.isPaused = false;
      this.timerState.timeRemaining = 0;
      
      const taskId = this.timerState.taskId;
      const focusSession = {
        duration: data.duration,
        formattedDuration: formatTime(data.duration),
        date: new Date().toISOString(),
        taskName: this.timerState.taskName,
        taskId: taskId
      };
      
      this.saveCompletedSession(focusSession);
      
      // Show notification when timer completes
      const notificationTime = new Date();
      NotificationService.scheduleTimerNotification(
        'Focus Session Completed',
        `You completed a ${formatTime(data.duration)} focus session${taskId ? ` for "${this.timerState.taskName}"` : ''}!`,
        notificationTime
      );
      
      this.emitEvent('timerFinished', focusSession);
      
      // Reset task-specific state
      this.timerState.taskId = undefined;
      this.timerState.pausedDuration = 0;
      this.timerState.taskName = 'Focus Session';
    });
  }

  async startTimer(durationSeconds: number, taskName: string = 'Focus Session', taskId?: string) {
    try {
      this.timerState.taskName = taskName;
      this.timerState.taskId = taskId;
      this.timerState.pausedDuration = 0; // Reset accumulated paused duration
      
      // Schedule a notification for when the timer completes
      const endTime = new Date(Date.now() + (durationSeconds * 1000));
      await NotificationService.scheduleTimerNotification(
        'Focus Time Complete!',
        `Your ${taskName} session is complete.`,
        endTime
      );
      
      const result = await TimerPlugin.startTimer({
        durationSeconds,
        taskName,
        taskId
      });
      
      return result.success;
    } catch (error) {
      console.error('Error starting timer:', error);
      return false;
    }
  }

  async pauseTimer() {
    try {
      const result = await TimerPlugin.pauseTimer();
      return result.success;
    } catch (error) {
      console.error('Error pausing timer:', error);
      return false;
    }
  }

  async resumeTimer() {
    try {
      const result = await TimerPlugin.resumeTimer();
      return result.success;
    } catch (error) {
      console.error('Error resuming timer:', error);
      return false;
    }
  }

  async stopTimer() {
    try {
      const result = await TimerPlugin.stopTimer();
      return result.success;
    } catch (error) {
      console.error('Error stopping timer:', error);
      return false;
    }
  }

  async getTimerStatus() {
    try {
      const status = await TimerPlugin.getTimerStatus();
      return {
        isRunning: status.isRunning,
        isPaused: this.timerState.isPaused,
        timeRemaining: this.timerState.timeRemaining,
        formattedTimeRemaining: formatTimeDisplay(this.timerState.timeRemaining),
        taskName: this.timerState.taskName,
        taskId: this.timerState.taskId,
        pausedDuration: this.timerState.pausedDuration || 0
      };
    } catch (error) {
      console.error('Error getting timer status:', error);
      return {
        isRunning: false,
        isPaused: false,
        timeRemaining: 0,
        formattedTimeRemaining: '00:00',
        taskName: 'Focus Session',
        taskId: undefined,
        pausedDuration: 0
      };
    }
  }

  // Helper method to save completed focus session to local storage for history
  private saveCompletedSession(session: any) {
    try {
      // Get existing sessions
      const sessionsJson = localStorage.getItem('completedFocusSessions') || '[]';
      const sessions = JSON.parse(sessionsJson);
      
      // Add new session
      sessions.push({
        id: `session_${Date.now()}`,
        duration: session.duration,
        endTime: session.endTime || new Date().toISOString(),
        taskName: session.taskName || 'Focus Session',
        taskId: session.taskId
      });
      
      // Save back to storage (keep the most recent 100 sessions)
      localStorage.setItem('completedFocusSessions', JSON.stringify(sessions.slice(-100)));
    } catch (error) {
      console.error('Error saving completed session:', error);
    }
  }

  // Get completed focus sessions for history/stats
  getCompletedSessions() {
    try {
      const sessionsJson = localStorage.getItem('completedFocusSessions') || '[]';
      return JSON.parse(sessionsJson);
    } catch (error) {
      console.error('Error getting completed sessions:', error);
      return [];
    }
  }

  // Get total focus time
  getTotalFocusTime() {
    const sessions = this.getCompletedSessions();
    const totalMs = sessions.reduce((total: number, session: any) => {
      return total + (session.duration || 0);
    }, 0);
    
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours,
      minutes,
      totalMs,
      formatted: `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
    };
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
        console.error(`Error in timer event listener for ${event}:`, error);
      }
    });
  }
}

export default new TimerService();
export { formatTime, formatTimeDisplay };

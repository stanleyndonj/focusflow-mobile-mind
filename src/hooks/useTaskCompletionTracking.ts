/**
 * Hook for tracking task completions and triggering gamification updates
 */

import { useEffect, useRef } from 'react';
import { Task } from '@/contexts/TaskContext';
import GamificationIntegrationService from '@/services/GamificationIntegrationService';

export const useTaskCompletionTracking = (tasks: Task[]) => {
  const previousTasksRef = useRef<Task[]>([]);
  const integrationService = GamificationIntegrationService.getInstance();

  useEffect(() => {
    const previousTasks = previousTasksRef.current;
    const currentTasks = tasks;

    // Find newly completed tasks
    const newlyCompletedTasks = currentTasks.filter(currentTask => {
      if (!currentTask.completed) return false;
      
      const previousTask = previousTasks.find(prev => prev.id === currentTask.id);
      return !previousTask || !previousTask.completed;
    });

    // Process each newly completed task
    newlyCompletedTasks.forEach(task => {
      const completionData = {
        taskId: task.id,
        title: task.title,
        category: task.category || 'general',
        priority: task.priority,
        timeSpent: Math.floor((task.totalTimeSpent || 0) / (1000 * 60)), // Convert to minutes
        isFrogTask: task.taskType === 'frog',
        isQuestTask: task.taskType === 'quest',
        completedAt: task.completedAt || new Date().toISOString()
      };

      // Trigger gamification integration
      integrationService.onTaskCompleted(completionData);
      
      console.log(`🎉 Task completed: "${task.title}" - Gamification rewards applied!`);
    });

    // Update the reference for next comparison
    previousTasksRef.current = [...currentTasks];
  }, [tasks, integrationService]);

  return {
    // Expose methods for manual tracking if needed
    trackTaskCompletion: (taskId: string) => {
      integrationService.syncTaskCompletion(taskId);
    },
    
    getAvailableTasks: () => {
      return integrationService.getAvailableTasks();
    },
    
    getTodaysCompletedTasks: () => {
      return integrationService.getTodaysCompletedTasks();
    }
  };
};

export default useTaskCompletionTracking;

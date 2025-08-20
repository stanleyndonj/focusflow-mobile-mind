
import React from 'react';
import { Task } from '@/contexts/TaskContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Star, MessageSquare, Link as LinkIcon, CheckCircle, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onStartTimer?: (task: Task) => void;
  onStartTask?: (task: Task) => void;
  onFinishTask?: (task: Task) => void;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStartTimer, onStartTask, onFinishTask, onClick }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <motion.div
      className="bg-background border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      whileHover={{ y: -2 }}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-foreground text-sm leading-tight">
            {task.title}
          </h4>
          {task.isPriority && (
            <Star size={16} className="text-yellow-500 fill-current flex-shrink-0 ml-2" />
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags and Category */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {task.category}
          </Badge>
          <Badge className={cn("text-xs px-2 py-0.5", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
        </div>

        {/* Progress */}
        {task.subtasks.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-focus-400 h-1.5 rounded-full transition-all" 
                style={{ 
                  width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Time and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.totalTimeSpent > 0 && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{formatDuration(Math.floor(task.totalTimeSpent / 60000))}</span>
              </div>
            )}
            
            {/* Notes indicator */}
            {task.description && (
              <MessageSquare size={12} />
            )}
          </div>

          {/* Action buttons */}
          {!task.completed && (
            <div className="flex items-center gap-1">
              {/* Start Task button - for shadow mode tracking */}
              {onStartTask && !task.isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTask(task);
                  }}
                  title="Start task and notify shadow mode"
                >
                  <Timer size={12} className="mr-1" />
                  Start
                </Button>
              )}
              
              {/* Finish Task button - for early completion */}
              {onFinishTask && task.isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFinishTask(task);
                  }}
                  title="Finish task early and register win"
                >
                  <CheckCircle size={12} className="mr-1" />
                  Finish
                </Button>
              )}
              
              {/* Quick start timer button */}
              {onStartTimer && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTimer(task);
                  }}
                  title="Start focus timer"
                >
                  <Play size={12} />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <div className="text-xs text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;

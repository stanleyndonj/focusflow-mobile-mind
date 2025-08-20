
import React from 'react';
import { Task } from '@/contexts/TaskContext';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Star, ChevronRight, Calendar, Clock, Flame, Timer, CheckCircle } from 'lucide-react';
import { format, isSameDay, isToday } from 'date-fns';
import TaskTimeDisplay from '@/components/task/TaskTimeDisplay';
import TaskLiveTimer from '@/components/task/TaskLiveTimer';
import { useTimer } from '@/contexts/TimerContext';

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onTogglePriority: () => void;
  onStartTask?: (task: Task) => void;
  onFinishTask?: (task: Task) => void;
  onClick: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggleComplete, 
  onTogglePriority,
  onStartTask,
  onFinishTask,
  onClick 
}) => {
  const { state: timerState } = useTimer();
  
  // Check if this task is currently being timed
  const isBeingTimed = 
    timerState.isRunning && 
    timerState.mode === 'focus' && 
    timerState.currentTaskId === task.id;
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete();
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePriority();
  };

  // Calculate progress if there are subtasks
  const progress = task.subtasks.length 
    ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100) 
    : task.completed 
      ? 100 
      : 0;
      
  const priorityColors = {
    high: 'border-red-400 bg-red-100 dark:bg-red-900/20',
    medium: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
  };

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700",
        "transition-all duration-200 hover:shadow-md active:scale-99",
        task.isPriority && !task.completed && "border-l-4 border-l-focus-400",
        task.completed && "opacity-70"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div onClick={handleCheckboxClick} className="flex-shrink-0">
            <Checkbox 
              checked={task.completed}
              className={cn(
                "rounded-full h-5 w-5 border-2",
                task.priority === 'high' ? "border-red-400" : 
                task.priority === 'medium' ? "border-yellow-400" : 
                "border-blue-400"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-base font-medium line-clamp-1",
              task.completed && "line-through opacity-70"
            )}>
              {task.title}
            </h3>
            
            {task.subtasks.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      progress === 100 ? "bg-green-500" : "bg-focus-400"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </span>
              </div>
            )}
            
            {task.dueDate && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Calendar size={12} className="inline-block" />
                {format(new Date(task.dueDate), "MMM d")}
              </p>
            )}
            
            {/* Display time spent on task */}
            {task.totalTimeSpent && task.totalTimeSpent > 0 && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock size={12} className="inline-block text-violet-500" />
                <TaskTimeDisplay task={task} showLabel={false} />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Start/Finish buttons for shadow mode */}
          {!task.completed && (
            <div className="flex items-center gap-1">
              {/* Start Task button */}
              {onStartTask && !task.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTask(task);
                  }}
                  className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors flex items-center gap-1"
                  title="Start task and notify shadow mode"
                >
                  <Timer size={10} />
                  Start
                </button>
              )}
              
              {/* Finish Task button */}
              {onFinishTask && task.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFinishTask(task);
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors flex items-center gap-1"
                  title="Finish task early and register win"
                >
                  <CheckCircle size={10} />
                  Finish
                </button>
              )}
            </div>
          )}
          
          <button 
            onClick={handleStarClick}
            className="focus:outline-none transform transition-transform hover:scale-110"
          >
            <Star 
              size={18} 
              className={cn(
                "transition-colors",
                task.isPriority 
                  ? "fill-focus-400 text-focus-400" 
                  : "text-gray-300 dark:text-gray-600"
              )} 
            />
          </button>
          {/* Show streak indicator for daily repeating tasks */}
          {task.recurrence === 'daily' && (
            <div 
              className="flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900/30 mr-1"
              title={`Streak: ${task.streak || 0} ${task.streak === 1 ? 'day' : 'days'}`}
            >
              <Flame size={14} className="text-orange-500" />
              {task.streak > 1 && (
                <span className="absolute -bottom-1 -right-1 bg-focus-400 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {task.streak}
                </span>
              )}
            </div>
          )}
          
          {/* Show live timer if this task is currently being timed, otherwise show default arrow */}
          {isBeingTimed ? (
            <TaskLiveTimer taskId={task.id} />
          ) : (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700">
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;

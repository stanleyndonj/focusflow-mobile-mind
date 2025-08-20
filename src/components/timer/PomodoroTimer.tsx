
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Coffee, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Task } from '@/contexts/TaskContext';
import TaskTimerService from '@/services/TaskTimerService';
import { formatTime } from '@/services/TimerService';

interface PomodoroTimerProps {
  task?: Task;
  onSessionComplete?: (taskId: string, duration: number) => void;
  onBreakComplete?: () => void;
  onTaskAbandoned?: (taskId: string, timeSpent: number) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  task,
  onSessionComplete,
  onBreakComplete,
  onTaskAbandoned
}) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [focusDuration] = useState(25); // minutes
  const [breakDuration] = useState(5); // minutes
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const timerService = TaskTimerService.getInstance();

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (isBreak) {
      // Break completed, switch back to focus
      setIsBreak(false);
      setTimeLeft(focusDuration * 60);
      onBreakComplete?.();
    } else {
      // Focus session completed
      if (task) {
        const session = timerService.completeSession(task.id);
        onSessionComplete?.(task.id, focusDuration * 60 * 1000);
      }
      
      // Switch to break
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      setIsActive(true); // Auto-start break
    }
  };

  const toggleTimer = () => {
    if (!isActive && !isBreak && task) {
      // Starting focus session
      timerService.startTaskTimer(task.id, focusDuration);
      setSessionStartTime(Date.now());
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(focusDuration * 60);
    
    if (task) {
      timerService.pauseActiveSession();
    }
  };

  const skipToBreak = () => {
    if (!isBreak) {
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      setIsActive(false);
    }
  };

  const abandonTask = () => {
    if (task && sessionStartTime) {
      const timeSpent = Date.now() - sessionStartTime;
      console.log(`🚫 Task abandoned: ${task.title}, Time spent: ${Math.round(timeSpent / 1000)}s`);
      
      // Stop the timer service
      timerService.pauseActiveSession();
      
      // Reset timer state
      setIsActive(false);
      setIsBreak(false);
      setTimeLeft(focusDuration * 60);
      setSessionStartTime(null);
      
      // Notify parent component
      onTaskAbandoned?.(task.id, timeSpent);
    }
  };

  const progress = isBreak 
    ? ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100
    : ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100;

  return (
    <motion.div 
      className="flex flex-col items-center space-y-6 p-6 bg-card rounded-xl shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {task && (
        <div className="text-center">
          <h3 className="font-medium text-lg text-foreground">{task.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isBreak ? 'Break Time' : 'Focus Session'}
          </p>
        </div>
      )}

      <div className="relative">
        <div className={`w-48 h-48 rounded-full border-8 flex items-center justify-center ${
          isBreak 
            ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
            : 'border-focus-300 bg-focus-50 dark:border-focus-600 dark:bg-focus-900/20'
        }`}>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground">
              {formatTime(timeLeft * 1000)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {isBreak ? 'Break' : 'Focus'}
            </div>
          </div>
        </div>
      </div>

      <Progress 
        value={progress} 
        className="w-48 h-2"
      />

      <div className="flex gap-3">
        <Button
          onClick={toggleTimer}
          variant={isActive ? "outline" : "default"}
          size="lg"
          className="w-14 h-14 rounded-full"
        >
          {isActive ? <Pause size={20} /> : <Play size={20} />}
        </Button>

        <Button
          onClick={resetTimer}
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full"
        >
          <RotateCcw size={20} />
        </Button>

        {!isBreak && (
          <Button
            onClick={skipToBreak}
            variant="outline"
            size="lg"
            className="w-14 h-14 rounded-full"
          >
            <Coffee size={20} />
          </Button>
        )}
        
        {/* Abandon button - only show during active task focus session */}
        {task && isActive && !isBreak && sessionStartTime && (
          <Button
            onClick={abandonTask}
            variant="destructive"
            size="lg"
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
            title="Abandon Task"
          >
            <X size={20} />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default PomodoroTimer;

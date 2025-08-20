import React, { useState, useCallback, useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Star, 
  Calendar, 
  Search, 
  Mic, 
  ArrowLeft, 
  ArrowRight, 
  Filter, 
  Clock,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  List,
  CheckCircle
} from 'lucide-react';
import { useTasks, Task } from '@/contexts/TaskContext';
import { useGame } from '@/contexts/GameContext';
import TaskItem from '@/components/tasks/TaskItem';
import AddTaskDialog from '@/components/tasks/AddTaskDialog';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { useNotification } from '../contexts/NotificationContext';

const TasksPage: React.FC = () => {
  // State for dialogs and UI
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  
  // Game context for shadow mode
  const gameContext = useGame();

  // Filter and view states
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [showMonthlyTasks, setShowMonthlyTasks] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to compare dates by day (ignoring time)
  const isSameDay = (date1: string, date2: string): boolean => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  };

  // Helper function to check if a date is in the future
  const isFutureDate = (dateStr: string): boolean => {
    const today = new Date();
    const date = new Date(dateStr);
    return date > new Date(today.setHours(0, 0, 0, 0));
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Get task context and state
  const { 
    state: { tasks, loading, currentPage, tasksPerPage },
    addTask, 
    updateTask,
    toggleComplete, 
    togglePriority,
    setPage,
    setSearchTerm,
    getFilteredAndSortedTasks // This is the function from context
  } = useTasks();

  // Use the getFilteredAndSortedTasks from context directly
  const allTasks = React.useMemo(() => getFilteredAndSortedTasks(), [getFilteredAndSortedTasks]);

  // Helper to check if a task is due on a specific date
  const isTaskDueOnDate = (task: Task, date: string): boolean => {
    if (!task.dueDate) return false;
    return isSameDay(task.dueDate, date);
  };

  // Helper to check if a task is overdue
  const isTaskOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today && !isSameDay(task.dueDate, today.toISOString().split('T')[0]);
  };

  // Separate tasks into today's tasks, upcoming tasks, and other tasks
  const todaysTasks = allTasks.filter(task => 
    !task.completed && 
    task.dueDate && 
    isTaskDueOnDate(task, today)
  );

  const upcomingTasks = allTasks.filter(task => 
    !task.completed && 
    task.dueDate && 
    isFutureDate(task.dueDate) && 
    !isTaskDueOnDate(task, today)
  );

  const otherTasks = allTasks.filter(task => 
    !task.completed && 
    (!task.dueDate || isTaskOverdue(task))
  );

  const completedTasks = allTasks.filter(task => task.completed);

  // Get tasks for the active tab
  const getTasksForActiveTab = useCallback(() => {
    switch (activeTab) {
      case 'today':
        return todaysTasks;
      case 'upcoming':
        return upcomingTasks;
      case 'all':
        return allTasks.filter(task => !task.completed);
      case 'completed':
        return completedTasks;
      default:
        return [];
    }
  }, [activeTab, todaysTasks, upcomingTasks, allTasks, completedTasks]);

  // Get current tasks for the active tab with memoization
  const currentTasks = React.useMemo(() => getTasksForActiveTab(), [getTasksForActiveTab]);

  // Calculate pagination
  const totalPages = Math.ceil(currentTasks.length / tasksPerPage) || 1;
  const currentPageNum = Math.min(currentPage, Math.max(1, totalPages));

  // Get paginated tasks with bounds checking
  const paginatedTasks = React.useMemo(() => {
    const start = (currentPageNum - 1) * tasksPerPage;
    const end = currentPageNum * tasksPerPage;
    return currentTasks.slice(start, end);
  }, [currentTasks, currentPageNum, tasksPerPage]);

  // Update page if it was out of bounds
  useEffect(() => {
    if (currentPage !== currentPageNum) {
      setPage(currentPageNum);
    }
  }, [currentPage, currentPageNum, setPage]);

  // Handle page change with bounds checking
  const handlePageChange = useCallback((newPage: number) => {
    const page = Math.max(1, Math.min(newPage, totalPages));
    setPage(page);
  }, [setPage, totalPages]);

  // Reset to first page when search query changes
  useEffect(() => {
    if (searchQuery) {
      setPage(1);
    }
  }, [searchQuery, setPage]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    setIsVoiceInputActive(!isVoiceInputActive);
    // In a real app, you would integrate with a speech recognition API here
  };

  // Handle task completion toggle
  const handleToggleComplete = useCallback((taskId: string) => {
    toggleComplete(taskId);
  }, [toggleComplete]);

  // Handle task priority toggle
  const handleTogglePriority = useCallback((taskId: string) => {
    togglePriority(taskId);
  }, [togglePriority]);

  const handleStartTask = (task: Task) => {
    console.log('▶️ Attempting to start task:', task.title);
    
    // Check if this is a scheduled task and if shadow has already won
    if (task.scheduledFor) {
      const scheduledTime = new Date(task.scheduledFor);
      const currentTime = new Date();
      const timeDiff = currentTime.getTime() - scheduledTime.getTime();
      const minutesFromScheduled = Math.floor(timeDiff / (60 * 1000));
      
      // If task is more than 15 minutes late, shadow has already won - prevent start
      if (minutesFromScheduled > 15) {
        console.log('❌ Task is too late! Shadow has already won. Cannot start.');
        toast({
          title: "Too Late!",
          description: "Your shadow has already won this duel. You cannot start this task now.",
          variant: "destructive"
        });
        return; // Prevent task start
      }
    }
    
    // Mark task as active
    updateTask(task.id, { isActive: true });
    
    // Start shadow session if enabled
    if (gameContext.shadowMode.isEnabled) {
      gameContext.startShadowSession(
        task.duration || 30,
        task.id,
        task.title
      );
    }
    
    console.log('✅ Task started successfully');
  };
  
  const handleFinishTask = (task: Task) => {
    console.log('🏁 Attempting to finish task:', task.title);
    
    const completedAt = new Date().toISOString();
    
    // Check if this is a scheduled task and if shadow has already won
    if (task.scheduledFor) {
      const scheduledTime = new Date(task.scheduledFor);
      const completedTime = new Date(completedAt);
      const timeDiff = completedTime.getTime() - scheduledTime.getTime();
      const minutesFromScheduled = Math.floor(timeDiff / (60 * 1000));
      
      // If task is more than 15 minutes late, shadow has already won - prevent completion
      if (minutesFromScheduled > 15) {
        console.log('❌ Task is too late! Shadow has already won. Cannot complete.');
        toast({
          title: "Too Late!",
          description: "Your shadow has already won this duel. You cannot complete this task now.",
          variant: "destructive"
        });
        return; // Prevent task completion
      }
    }
    
    // Mark task as completed
    updateTask(task.id, { 
      completed: true,
      completedAt,
      isActive: false
    });
    
    // Check if this was a scheduled task and register win if on time
    if (task.scheduledFor) {
      const scheduledTime = new Date(task.scheduledFor);
      const completedTime = new Date(completedAt);
      const timeDiff = completedTime.getTime() - scheduledTime.getTime();
      const minutesFromScheduled = Math.floor(timeDiff / (60 * 1000));
      
      // User wins if completed within 15 minutes of scheduled time
      if (minutesFromScheduled <= 15) {
        console.log('🏆 Task completed on time - USER WINS!');
        gameContext.recordShadowLoss(); // User win = shadow loss
        
        // Mark as processed to prevent duplicate processing
        updateTask(task.id, { shadowDuelProcessed: true });
      }
    }
    
    // End shadow session if active
    if (gameContext.shadowMode.isEnabled) {
      gameContext.endShadowSession(true, false); // completed=true, exitedEarly=false
    }
    
    console.log('✅ Task finished successfully');
  };

  // Voice recognition callback
  const handleSpeechResult = (text: string) => {
    if (text) {
      // Simple command handling
      if (text.toLowerCase().includes('add task')) {
        const taskTitle = text.replace(/add task/i, '').trim();
        if (taskTitle) {
          setIsAddTaskDialogOpen(true);
          // We'll use this in the AddTaskDialog component
          localStorage.setItem('voiceTaskTitle', taskTitle);
          toast({
            title: "Voice command detected",
            description: `Adding new task: "${taskTitle}"`,
          });
        }
      } else if (text.toLowerCase().includes('search for')) {
        const searchQuery = text.replace(/search for/i, '').trim();
        setSearchTerm(searchQuery);
        setSearchQuery(searchQuery);
        toast({
          title: "Voice search",
          description: `Searching for: "${searchQuery}"`,
        });
      } else {
        // Just use as search term
        setSearchTerm(text);
        setSearchQuery(text);
      }
    }

    setIsVoiceInputActive(false);
  };

  // Update search term when searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, setSearchTerm]);

  // Place renderTaskList here so it can access all variables
  const renderTaskList = (tasks: Task[], options: { 
    header?: string; 
    emptyMessage?: string;
    showOtherTasks?: boolean;
  } = {}) => {
    const { header, emptyMessage, showOtherTasks = false } = options;

    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    const hasTasks = tasks.length > 0;
    const hasOtherTasks = showOtherTasks && otherTasks.length > 0;

    if (!hasTasks && !hasOtherTasks) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage || 'No tasks found.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {header && (
          <h3 className="text-sm font-medium text-muted-foreground">{header}</h3>
        )}

        <div className="space-y-2">
          {hasTasks ? (
            <AnimatePresence>
              {paginatedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskItem
                    task={task}
                    onToggleComplete={() => handleToggleComplete(task.id)}
                    onTogglePriority={() => handleTogglePriority(task.id)}
                    onStartTask={handleStartTask}
                    onFinishTask={handleFinishTask}
                    onClick={() => setSelectedTask(task)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : null}

          {showOtherTasks && hasOtherTasks && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Other Tasks</h3>
              <div className="space-y-2">
                {otherTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskItem
                      task={task}
                      onToggleComplete={() => handleToggleComplete(task.id)}
                      onTogglePriority={() => handleTogglePriority(task.id)}
                      onStartTask={handleStartTask}
                      onFinishTask={handleFinishTask}
                      onClick={() => setSelectedTask(task)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>  

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageNum - 1)}
                disabled={currentPageNum <= 1}
              >
                <ArrowLeft size={16} className="mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPageNum} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageNum + 1)}
                disabled={currentPageNum >= totalPages}
              >
                Next <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      );
    };

  const { scheduleNotification } = useNotification();

  const scheduleTaskNotification = async (task: Task) => {
    try {
      // Fix: Convert string to Date if needed
      const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate || new Date(Date.now() + 60 * 1000);

      await scheduleNotification({
        title: task.title,
        body: 'Task reminder',
        date: dueDate,
        isUrgent: localStorage.getItem('urgentNotifications') === 'true'
      });
      toast({
        title: 'Notification Set',
        description: `Reminder for "${task.title}" has been scheduled.`
      });
    } catch (error) {
      toast({
        title: 'Notification Error',
        description: 'Failed to schedule notification.',
        variant: 'destructive'
      });
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-md z-40 pb-4 px-4">
          <div className="space-y-4 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">
            FocusFlow
          </h1>
          <p className="text-muted-foreground">Manage your tasks and stay productive</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowOnlyPriority(!showOnlyPriority)}
            className={cn(
              showOnlyPriority && 'bg-focus-100 text-focus-600 border-focus-300',
              'transition-colors'
            )}
            title={showOnlyPriority ? 'Show all tasks' : 'Show priority tasks only'}
          >
            <Star size={18} className={showOnlyPriority ? 'fill-current' : ''} />
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowMonthlyTasks(!showMonthlyTasks)}
            className={cn(
              showMonthlyTasks && 'bg-focus-100 text-focus-600 border-focus-300',
              'transition-colors'
            )}
            title={showMonthlyTasks ? 'Show all tasks' : 'Show monthly tasks only'}
          >
            <Calendar size={18} />
          </Button>

          <Button
            onClick={() => setIsAddTaskDialogOpen(true)}
            className="rounded-full w-14 h-14 shadow-lg"
            aria-label="Add new task"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Plus className="w-6 h-6" />
              </TooltipTrigger>
              <TooltipContent>Add New Task</TooltipContent>
            </Tooltip>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVoiceInput}
          className={cn(
            'absolute right-1 top-1/2 transform -translate-y-1/2',
            isVoiceInputActive && 'text-focus-500'
          )}
          title={isVoiceInputActive ? 'Listening...' : 'Voice search'}
        >
          <Mic size={18} className={isVoiceInputActive ? 'animate-pulse' : ''} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          setPage(1); // Reset to first page when changing tabs
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today" className="flex items-center gap-1">
            <CalendarIcon size={14} />
            <span className="hidden sm:inline">Today</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-1">
            <Clock size={14} />
            <span className="hidden sm:inline">Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <List size={14} />
            <span className="hidden sm:inline">All</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1">
            <CheckCircle size={14} />
            <span className="hidden sm:inline">Completed</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="today">
            {renderTaskList(todaysTasks, { showOtherTasks: true })}
          </TabsContent>

          <TabsContent value="upcoming">
            {renderTaskList(upcomingTasks, { showOtherTasks: true })}
          </TabsContent>

          <TabsContent value="all">
            {renderTaskList(allTasks.filter(task => !task.completed), { showOtherTasks: true })}
          </TabsContent>

          <TabsContent value="completed">
            {renderTaskList(completedTasks)}
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Task Dialog */}
      <AddTaskDialog 
        isOpen={isAddTaskDialogOpen} 
        onClose={() => setIsAddTaskDialogOpen(false)} 
      />

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Voice Recognition UI */}
      {isVoiceInputActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-focus-100 dark:bg-focus-900 flex items-center justify-center">
                <Mic size={32} className="text-focus-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium">Listening...</h3>
              <p className="text-muted-foreground text-center text-sm">
                Speak now to add a task
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsVoiceInputActive(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default TasksPage;
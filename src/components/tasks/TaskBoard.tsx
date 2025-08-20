
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, useTasks } from '@/contexts/TaskContext';
import TaskCard from './TaskCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import GamificationTimerIntegration from '@/services/GamificationTimerIntegration';

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const TaskBoard: React.FC = () => {
  const { state: { tasks }, updateTask } = useTasks();
  const [columns, setColumns] = useState<Column[]>([]);
  const gameContext = useGame();
  
  // Initialize gamification timer integration
  const gamificationTimer = React.useMemo(() => {
    const timer = GamificationTimerIntegration.getInstance();
    timer.initialize(gameContext, { updateTask });
    return timer;
  }, [updateTask, gameContext]);

  useEffect(() => {
    // Initialize columns with tasks
    const backlogTasks = tasks.filter(task => !task.dueDate && !task.completed);
    const thisWeekTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate <= weekFromNow && dueDate > today;
    });
    const todayTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    });
    const completedTasks = tasks.filter(task => task.completed);

    setColumns([
      { id: 'backlog', title: 'Backlog', tasks: backlogTasks },
      { id: 'thisWeek', title: 'This Week', tasks: thisWeekTasks },
      { id: 'today', title: 'Today', tasks: todayTasks },
      { id: 'completed', title: 'Completed', tasks: completedTasks }
    ]);
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update task based on destination column
    let updates: Partial<Task> = {};
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (destination.droppableId) {
      case 'backlog':
        updates = { dueDate: undefined, completed: false };
        break;
      case 'thisWeek':
        updates = { 
          dueDate: weekFromNow.toISOString().split('T')[0], 
          completed: false 
        };
        break;
      case 'today':
        updates = { 
          dueDate: today.toISOString().split('T')[0], 
          completed: false 
        };
        break;
      case 'completed':
        updates = { completed: true, completedAt: new Date().toISOString() };
        break;
    }

    updateTask(task.id, updates);
  };
  
  const handleStartTask = (task: Task) => {
    console.log('🚀 Starting task:', task.title);
    
    // Mark task as active and notify shadow mode
    updateTask(task.id, { 
      isActive: true,
      startedAt: new Date().toISOString()
    });
    
    // Notify gamification system
    if (gameContext.shadowMode.isEnabled) {
      console.log('🥷 Shadow Mode: Task started, beginning monitoring...');
      gameContext.startShadowSession(task.duration || 30, task.id, task.title);
    }
    
    console.log('✅ Task started successfully');
  };
  
  const handleFinishTask = (task: Task) => {
    console.log('🏁 Finishing task early:', task.title);
    
    const completedAt = new Date().toISOString();
    
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

  return (
    <div className="h-full overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {columns.map((column) => (
            <motion.div
              key={column.id}
              className="flex-shrink-0 w-80"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-card rounded-lg shadow-sm border h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 space-y-3 overflow-y-auto ${
                        snapshot.isDraggingOver ? 'bg-accent/50' : ''
                      }`}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${
                                snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                              }`}
                            >
                              <TaskCard 
                                task={task} 
                                onStartTask={handleStartTask}
                                onFinishTask={handleFinishTask}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {column.tasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No tasks</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </motion.div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;

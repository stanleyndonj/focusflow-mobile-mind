import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Plus, X, CheckCircle, Circle, Calendar, Clock, Target, Trash, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VisionBoardEntry } from '@/contexts/VisionBoardContext';
import { Task } from '@/contexts/TaskContext';
import { format, isValid, parseISO } from 'date-fns';

interface TaskHabitIntegrationProps {
  entry: VisionBoardEntry;
  tasks: Task[];
  onUpdateEntry: (entry: VisionBoardEntry) => void;
  onCreateTask?: (taskData: Partial<Task>) => void;
  theme?: string;
}

const TaskHabitIntegration: React.FC<TaskHabitIntegrationProps> = ({
  entry,
  tasks,
  onUpdateEntry,
  onCreateTask,
  theme = 'default'
}) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedTaskToLink, setSelectedTaskToLink] = useState<string>('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Get linked tasks
  const linkedTasks = tasks.filter(task => entry.linkedTaskIds?.includes(task.id));
  const availableTasksToLink = tasks.filter(task => !entry.linkedTaskIds?.includes(task.id));

  const linkTask = (taskId: string) => {
    const updatedEntry = {
      ...entry,
      linkedTaskIds: [...(entry.linkedTaskIds || []), taskId]
    };
    onUpdateEntry(updatedEntry);
  };

  const unlinkTask = (taskId: string) => {
    const updatedEntry = {
      ...entry,
      linkedTaskIds: entry.linkedTaskIds?.filter(id => id !== taskId) || []
    };
    onUpdateEntry(updatedEntry);
  };

  const createTaskFromVision = () => {
    if (onCreateTask) {
      const newTaskData: Partial<Task> = {
        title: `Work on: ${entry.title}`,
        description: `Task created from vision: ${entry.description}`,
        category: entry.category || 'Vision Goals',
        priority: 'high',
        dueDate: entry.targetDate || undefined,
        estimatedDuration: 60, // Default 1 hour
        tags: ['vision-board', entry.category?.toLowerCase()].filter(Boolean)
      };
      onCreateTask(newTaskData);
    }
  };

  const calculateVisionProgress = (): number => {
    if (linkedTasks.length === 0) return entry.progressPercentage || 0;
    
    const completedTasks = linkedTasks.filter(task => task.completed).length;
    const taskProgress = (completedTasks / linkedTasks.length) * 100;
    
    // Combine manual progress with task progress
    const manualProgress = entry.progressPercentage || 0;
    return Math.max(manualProgress, taskProgress);
  };

  const getTaskStatusColor = (task: Task) => {
    if (task.completed) return 'bg-green-100 text-green-800 border-green-200';
    if (task.dueDate && new Date(task.dueDate) < new Date()) return 'bg-red-100 text-red-800 border-red-200';
    if (task.priority === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => {
                // Toggle task completion - this would need to be handled by parent component
                console.log('Toggle task completion:', task.id);
              }}
            >
              {task.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </Button>
            <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h4>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={getTaskStatusColor(task)}>
              {task.priority}
            </Badge>
            {task.category && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                {task.category}
              </Badge>
            )}
            {task.dueDate && (
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                <Calendar className="h-3 w-3 mr-1" />
                {format(parseISO(task.dueDate), 'MMM d')}
              </Badge>
            )}
            {task.estimatedDuration && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedDuration}min
              </Badge>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => unlinkTask(task.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Vision Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-2xl font-bold text-blue-600">{Math.round(calculateVisionProgress())}%</span>
            </div>
            <Progress value={calculateVisionProgress()} className="h-3" />
            
            {linkedTasks.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {linkedTasks.filter(t => t.completed).length}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {linkedTasks.filter(t => !t.completed).length}
                  </div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">{linkedTasks.length}</div>
                  <div className="text-xs text-gray-500">Total Tasks</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linked Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-600" />
            Linked Tasks ({linkedTasks.length})
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLinkDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Link Existing
            </Button>
            <Button
              size="sm"
              onClick={createTaskFromVision}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {linkedTasks.length > 0 ? (
            <div className="space-y-3">
              {linkedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
            >
              <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">No linked tasks yet</h4>
              <p className="text-gray-500 mb-4">Connect tasks to track your vision progress</p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLinkDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Link Existing Task
                </Button>
                <Button
                  onClick={createTaskFromVision}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Task
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Link Task Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Existing Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTaskToLink} onValueChange={setSelectedTaskToLink}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task to link" />
              </SelectTrigger>
              <SelectContent>
                {availableTasksToLink.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{task.title}</span>
                      {task.completed && <CheckCircle className="h-4 w-4 text-green-500 ml-2" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {availableTasksToLink.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No available tasks to link.</p>
                <p className="text-sm">Create a new task or all existing tasks are already linked.</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTaskToLink) {
                    linkTask(selectedTaskToLink);
                    setSelectedTaskToLink('');
                    setShowLinkDialog(false);
                  }
                }}
                disabled={!selectedTaskToLink}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Link Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskHabitIntegration;

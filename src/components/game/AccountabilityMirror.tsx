import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Target, CheckCircle, XCircle, BarChart3, Eye, Calendar, Flame } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import ReflectionInterface from './ReflectionInterface';

interface AccountabilityMirrorProps {
  onClose?: () => void;
}

const AccountabilityMirror: React.FC<AccountabilityMirrorProps> = ({ onClose }) => {
  const { addReflection, getTodaysReflection, gameStats } = useGame();
  const { state } = useTasks();
  const { tasks } = state;
  
  const [reflectionText, setReflectionText] = useState('');
  const [selectedMood, setSelectedMood] = useState<'frustrated' | 'satisfied' | 'motivated' | 'neutral'>('neutral');
  const [blockers, setBlockers] = useState<string[]>([]);
  const [newBlocker, setNewBlocker] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showReflectionInterface, setShowReflectionInterface] = useState(false);

  const todaysReflection = getTodaysReflection();
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate today's stats
  const todaysTasks = tasks.filter(task => 
    task.createdAt.startsWith(today) || 
    (task.completedAt && task.completedAt.startsWith(today))
  );
  const tasksPlanned = todaysTasks.length;
  const tasksCompleted = todaysTasks.filter(task => task.completed).length;
  const completionRate = tasksPlanned > 0 ? (tasksCompleted / tasksPlanned) * 100 : 0;

  const moodEmojis = {
    frustrated: '😤',
    satisfied: '😌',
    motivated: '🔥',
    neutral: '😐'
  };

  const moodColors = {
    frustrated: 'bg-destructive/20 text-destructive',
    satisfied: 'bg-success/20 text-success',
    motivated: 'bg-warning/20 text-warning',
    neutral: 'bg-muted text-muted-foreground'
  };

  const handleAddBlocker = () => {
    if (newBlocker.trim() && !blockers.includes(newBlocker.trim())) {
      setBlockers([...blockers, newBlocker.trim()]);
      setNewBlocker('');
    }
  };

  const handleRemoveBlocker = (blocker: string) => {
    setBlockers(blockers.filter(b => b !== blocker));
  };

  const handleSubmitReflection = useCallback(() => {
    if (todaysReflection) return; // Already reflected today
    
    addReflection({
      date: today,
      tasksPlanned,
      tasksCompleted,
      reflectionText: reflectionText.trim() || undefined,
      mood: selectedMood,
      blockers
    });

    // Reset form
    setReflectionText('');
    setSelectedMood('neutral');
    setBlockers([]);
    
    if (onClose) onClose();
  }, [addReflection, today, tasksPlanned, tasksCompleted, reflectionText, selectedMood, blockers, todaysReflection, onClose]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
  };

  if (todaysReflection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Today's Reflection Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{todaysReflection.tasksCompleted}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{todaysReflection.tasksPlanned}</div>
                <div className="text-sm text-muted-foreground">Planned</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{moodEmojis[todaysReflection.mood]}</span>
              <Badge className={moodColors[todaysReflection.mood]}>
                {todaysReflection.mood}
              </Badge>
            </div>
            
            {todaysReflection.reflectionText && (
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-sm">{todaysReflection.reflectionText}</p>
              </div>
            )}
            
            {todaysReflection.blockers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Today's Blockers:</p>
                <div className="flex flex-wrap gap-2">
                  {todaysReflection.blockers.map((blocker, index) => (
                    <Badge key={index} variant="outline">
                      {blocker}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Accountability Mirror
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Reflect on your day with gentle honesty
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Progress</span>
              <span className="text-sm text-muted-foreground">
                {tasksCompleted} of {tasksPlanned} tasks
              </span>
            </div>
            
            <Progress value={completionRate} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-md bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <div className="text-center">
                  <div className="text-lg font-bold text-success">{tasksCompleted}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <div className="text-lg font-bold text-muted-foreground">{tasksPlanned - tasksCompleted}</div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mood Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">How are you feeling about today?</label>
            <Select value={selectedMood} onValueChange={(value: any) => setSelectedMood(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(moodEmojis).map(([mood, emoji]) => (
                  <SelectItem key={mood} value={mood}>
                    <span className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span className="capitalize">{mood}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reflection Text */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">What blocked you today? (Optional)</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                className={isRecording ? 'text-destructive' : ''}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            
            <Textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Share your thoughts about today... What went well? What could be improved?"
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            
            <div className="text-xs text-muted-foreground text-right">
              {reflectionText.length}/500
            </div>
          </div>

          {/* Blockers */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Tag your blockers</label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newBlocker}
                onChange={(e) => setNewBlocker(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddBlocker()}
                placeholder="e.g., distractions, unclear goals..."
                className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button size="sm" onClick={handleAddBlocker} disabled={!newBlocker.trim()}>
                Add
              </Button>
            </div>
            
            {blockers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blockers.map((blocker, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => handleRemoveBlocker(blocker)}
                  >
                    {blocker} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Reflect Button */}
          <Button 
            onClick={() => setShowReflectionInterface(true)}
            className="w-full"
            size="lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Reflect
          </Button>
        </CardContent>
      </Card>
      
      {/* Reflection Interface Modal */}
      <ReflectionInterface 
        isOpen={showReflectionInterface}
        onClose={() => setShowReflectionInterface(false)}
      />
    </motion.div>
  );
};

export default AccountabilityMirror;
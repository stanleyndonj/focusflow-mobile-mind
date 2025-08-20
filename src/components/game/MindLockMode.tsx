import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Trophy, 
  Coins,
  Clock,
  Target,
  Zap,
  Shield,
  Flame,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  StopCircle,
  Eye,
  Smartphone
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import { useTimer } from '@/contexts/TimerContext';
import { MindLockSession, MindLockCommitment } from '@/types/GameTypes';
import BackgroundLockService from '@/services/BackgroundLockService';

interface MindLockModeProps {
  onClose?: () => void;
}

const MindLockMode: React.FC<MindLockModeProps> = ({ onClose }) => {
  const { gameStats, addCoins, addXP } = useGame();
  const { state: taskState } = useTasks();
  const { state: timerState, startTimer, pauseTimer, resetTimer } = useTimer();
  const { tasks } = taskState;
  const backgroundLockService = BackgroundLockService.getInstance();
  
  const [activeSession, setActiveSession] = useState<MindLockSession | null>(null);
  const [commitment, setCommitment] = useState('');
  const [duration, setDuration] = useState([25]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [showAbandonWarning, setShowAbandonWarning] = useState(false);
  
  // Use persistent storage for session history
  const [sessionHistory, setSessionHistory] = useState<MindLockSession[]>(() => {
    const saved = localStorage.getItem('mindLockSessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Sample commitment suggestions
  const commitmentSuggestions = {
    easy: [
      "I will focus for the next 15 minutes without checking my phone",
      "I will complete this task without getting distracted",
      "I will work steadily until the timer ends"
    ],
    medium: [
      "I will finish this task in 25 minutes and won't stop until it's done",
      "I will maintain deep focus and resist all distractions",
      "I will complete this work session with full concentration"
    ],
    hard: [
      "I will achieve a breakthrough on this challenging task in 45 minutes",
      "I will push through any resistance and complete this difficult work",
      "I will maintain laser focus for the entire session, no matter what"
    ]
  };

  const getDifficultySettings = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return { penalty: 10, reward: 20, xp: 30, color: 'text-green-500 bg-green-500/10' };
      case 'medium':
        return { penalty: 25, reward: 50, xp: 75, color: 'text-blue-500 bg-blue-500/10' };
      case 'hard':
        return { penalty: 50, reward: 100, xp: 150, color: 'text-purple-500 bg-purple-500/10' };
    }
  };

  const availableTasks = tasks.filter(task => !task.completed);

  const startMindLockSession = async () => {
    if (!commitment.trim()) return;

    const settings = getDifficultySettings(difficulty);
    const newSession: MindLockSession = {
      id: `mindlock-${Date.now()}`,
      taskId: selectedTask || undefined,
      commitment: commitment.trim(),
      duration: duration[0],
      startTime: new Date().toISOString(),
      isCompleted: false,
      wasAbandoned: false,
      coinPenalty: settings.penalty,
      coinReward: settings.reward,
      xpReward: settings.xp,
      createdAt: new Date().toISOString()
    };

    // Start background lock service
    const lockStarted = await backgroundLockService.startLockSession({
      id: newSession.id,
      startTime: Date.now(),
      duration: duration[0],
      commitment: commitment.trim(),
      difficulty: difficulty
    });

    if (lockStarted) {
      setActiveSession(newSession);
      startTimer(duration[0] * 60); // Convert to seconds
      
      // Set up background service callbacks
      backgroundLockService.setCallbacks({
        onLockViolation: () => {
          console.warn('Mind Lock violation detected!');
        },
        onSessionComplete: () => {
          completeSession();
        },
        onSessionAbandoned: () => {
          abandonSession('Background service abandonment');
        }
      });
    }
  };

  const abandonSession = (reason?: string) => {
    if (!activeSession) return;

    const abandonedSession: MindLockSession = {
      ...activeSession,
      wasAbandoned: true,
      abandonedAt: new Date().toISOString(),
      abandonReason: reason || 'User abandoned session'
    };

    const newHistory = [...sessionHistory, abandonedSession];
    setSessionHistory(newHistory);
    localStorage.setItem('mindLockSessions', JSON.stringify(newHistory));
    setActiveSession(null);
    setShowAbandonWarning(false);
    resetTimer();
    
    // End background lock service
    backgroundLockService.endLockSession(false);
    
    // Deduct coins as penalty
    if (gameStats.coins >= activeSession.coinPenalty) {
      addCoins(-activeSession.coinPenalty);
    }
  };

  const completeSession = () => {
    if (!activeSession) return;

    const completedSession: MindLockSession = {
      ...activeSession,
      isCompleted: true,
      endTime: new Date().toISOString()
    };

    const newHistory = [...sessionHistory, completedSession];
    setSessionHistory(newHistory);
    localStorage.setItem('mindLockSessions', JSON.stringify(newHistory));
    
    console.log(`🎉 Mind Lock session completed! +${activeSession.coinReward} coins, +${activeSession.xpReward} XP`);
    setActiveSession(null);
    
    // End background lock service
    backgroundLockService.endLockSession(true);
    
    // Add rewards
    addCoins(activeSession.coinReward);
    addXP(activeSession.xpReward);
  };

  // Check if timer completed
  useEffect(() => {
    if (activeSession && timerState.timeLeft === 0 && timerState.isRunning === false) {
      completeSession();
    }
  }, [timerState.timeLeft, timerState.isRunning, activeSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionProgress = () => {
    if (!activeSession) return 0;
    const totalSeconds = activeSession.duration * 60;
    const elapsed = totalSeconds - (timerState.timeLeft || 0);
    return (elapsed / totalSeconds) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="w-6 h-6" />
            Mind Lock Mode
          </h2>
          <p className="text-muted-foreground">Commit to your focus session with consequences</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Active Session */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <Card className="border-2 border-red-500/50 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Shield className="w-5 h-5" />
                Session Locked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatTime(timerState.timeLeft || 0)}
                </div>
                <Progress value={getSessionProgress()} className="h-3 mb-4" />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Your Commitment:</h4>
                <p className="text-sm italic">"{activeSession.commitment}"</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-yellow-500">{activeSession.coinReward}</div>
                  <div className="text-xs text-muted-foreground">Reward</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-500">{activeSession.xpReward}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-500">-{activeSession.coinPenalty}</div>
                  <div className="text-xs text-muted-foreground">Penalty</div>
                </div>
              </div>

              <div className="flex gap-2">
                {timerState.isRunning ? (
                  <Button onClick={pauseTimer} variant="outline" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={() => startTimer(timerState.timeLeft || 0)} variant="outline" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
                
                <Button 
                  onClick={() => setShowAbandonWarning(true)}
                  variant="destructive"
                  className="flex-1"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Abandon
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Setup Form */}
      {!activeSession && (
        <div className="space-y-6">
          {/* Difficulty Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Difficulty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as const).map((diff) => {
                  const settings = getDifficultySettings(diff);
                  return (
                    <Card 
                      key={diff}
                      className={`cursor-pointer transition-all ${
                        difficulty === diff ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setDifficulty(diff)}
                    >
                      <CardContent className="p-4 text-center">
                        <Badge className={`mb-2 ${settings.color}`}>
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </Badge>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-center gap-1 text-yellow-500">
                            <Coins className="w-3 h-3" />
                            <span>+{settings.reward}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            <span>-{settings.penalty}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-blue-500">
                            <Zap className="w-3 h-3" />
                            <span>{settings.xp} XP</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader>
              <CardTitle>Session Duration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{duration[0]} minutes</div>
                <Progress 
                  value={timerState.timeLeft ? 
                    ((duration[0] * 60 - timerState.timeLeft) / (duration[0] * 60)) * 100 : 0
                  } 
                  className="h-2" 
                />
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  max={120}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Task Selection */}
          {availableTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Link to Task (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <select 
                  value={selectedTask} 
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">No specific task</option>
                  {availableTasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          {/* Commitment */}
          <Card>
            <CardHeader>
              <CardTitle>Your Commitment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="I will..."
                value={commitment}
                onChange={(e) => setCommitment(e.target.value)}
                className="min-h-[80px]"
              />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggestions:</p>
                {commitmentSuggestions[difficulty].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setCommitment(suggestion)}
                    className="block w-full text-left p-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <Button 
                onClick={startMindLockSession}
                disabled={!commitment.trim()}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                size="lg"
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock In & Start Session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessionHistory.slice(-3).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  {session.isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm truncate">{session.commitment}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3" />
                  {session.duration}m
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Abandon Warning Modal */}
      <AnimatePresence>
        {showAbandonWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                <h3 className="text-xl font-bold">⚠️ Abandon Mission?</h3>
                <p className="text-muted-foreground">
                  You've abandoned your mission, Commander. This will cost you{' '}
                  <span className="font-bold text-red-500">{activeSession?.coinPenalty} coins</span>.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowAbandonWarning(false)}
                    variant="outline" 
                    className="flex-1"
                  >
                    Continue Session
                  </Button>
                  <Button 
                    onClick={() => abandonSession('User confirmed abandonment')}
                    variant="destructive" 
                    className="flex-1"
                  >
                    Accept Penalty
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MindLockMode;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Clock, 
  Target, 
  Zap, 
  Coins, 
  TrendingUp,
  Shield,
  Sword,
  Trophy,
  AlertTriangle,
  Play,
  BarChart3,
  Calendar,
  Flame,
  Star,
  ChevronRight
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';

interface ShadowSession {
  id: string;
  date: string;
  targetTime: number; // in minutes
  actualTime: number; // in minutes
  completed: boolean;
  exitedEarly: boolean;
  taskId?: string;
  taskTitle?: string;
  xpGained: number;
  coinsEarned: number;
  distractionAttempts: number;
  focusData: FocusPoint[];
  createdAt: string;
}

interface FocusPoint {
  timestamp: number;
  focusLevel: number; // 0-100
  isDistracted: boolean;
}

interface DuelSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onRematch?: () => void;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  scheduledFor?: string;
}

export const DuelSummary: React.FC<DuelSummaryProps> = ({ isOpen, onClose, onRematch }) => {
  const { shadowMode, shadowSessions, startShadowSession } = useGame();
  const { startTimer } = useTimer();
  const { state: { tasks } } = useTasks();
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  
  const [recentSession, setRecentSession] = useState<ShadowSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<ShadowSession[]>([]);
  const [focusChartData, setFocusChartData] = useState<FocusPoint[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDuelData();
    }
  }, [isOpen, shadowSessions]);

  const loadDuelData = () => {
    try {
      // Use real shadow sessions from GameContext
      const realSessions = shadowSessions || [];
      console.log('🥷 DuelSummary: Loading shadow sessions...');
      console.log('🥷 shadowSessions from GameContext:', realSessions);
      console.log('🥷 shadowMode state:', shadowMode);
      
      // Also check for shadow sessions in localStorage as fallback
      let fallbackSessions = [];
      try {
        const storedSessions = localStorage.getItem('shadowSessions');
        if (storedSessions) {
          fallbackSessions = JSON.parse(storedSessions);
          console.log('🥷 Found shadow sessions in localStorage:', fallbackSessions);
        }
      } catch (e) {
        console.warn('Failed to load shadow sessions from localStorage:', e);
      }
      
      // Use GameContext sessions first, fallback to localStorage
      const sessionsToUse = realSessions.length > 0 ? realSessions : fallbackSessions;
      console.log('🥷 Using sessions:', sessionsToUse);
      
      // Convert sessions to DuelSummary format
      const formattedSessions: ShadowSession[] = sessionsToUse.map((session: any) => {
        const actualDuration = session.actualEndTime ? 
          Math.floor((new Date(session.actualEndTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)) : 
          session.duration;
        
        return {
          id: session.id,
          date: new Date(session.startTime).toLocaleDateString(),
          targetTime: session.duration,
          actualTime: actualDuration,
          completed: session.completed,
          exitedEarly: session.exitedEarly,
          taskId: session.taskId,
          taskTitle: session.taskTitle || 'Focus Session',
          xpGained: session.completed ? 25 : 0,
          coinsEarned: session.completed ? 10 : 0,
          distractionAttempts: 0,
          focusData: generateMockFocusData(actualDuration),
          createdAt: session.startTime
        };
      });
      
      console.log('🥷 Formatted sessions for DuelSummary:', formattedSessions);
      setSessionHistory(formattedSessions);
      
      // Get most recent session
      if (formattedSessions.length > 0) {
        const recent = formattedSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        console.log('🥷 Most recent session:', recent);
        setRecentSession(recent);
        setFocusChartData(recent.focusData);
      } else {
        console.log('🥷 No sessions found - showing empty state');
        setRecentSession(null);
        setFocusChartData([]);
      }
    } catch (error) {
      console.error('🥷 Failed to load duel data:', error);
      setRecentSession(null);
      setFocusChartData([]);
    }
  };

  const generateMockFocusData = (duration: number): FocusPoint[] => {
    const points: FocusPoint[] = [];
    const intervalMinutes = Math.max(1, Math.floor(duration / 20)); // 20 data points max
    
    for (let i = 0; i <= duration; i += intervalMinutes) {
      const focusLevel = Math.max(20, Math.min(100, 70 + (Math.random() - 0.5) * 40));
      points.push({
        timestamp: i * 60 * 1000, // Convert to milliseconds
        focusLevel,
        isDistracted: focusLevel < 40
      });
    }
    
    return points;
  };

  const handleRematch = () => {
    console.log('🥊 Starting rematch duel...');
    setShowTaskSelection(true);
  };
  
  const handleTaskSelect = (task: Task) => {
    console.log(`🥊 Starting duel with selected task: ${task.title}`);
    const durationMinutes = Math.ceil(task.estimatedDuration / 60); // Convert seconds to minutes
    startShadowSession(durationMinutes, task.id, task.title);
    startTimer(task.estimatedDuration * 1000); // Convert to milliseconds
    setShowTaskSelection(false);
    onRematch?.();
  };
  
  // Get incomplete tasks for selection
  const incompleteTasks = tasks.filter(task => !task.completed);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };
  
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getFocusColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-yellow-500';
    if (level >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getBattleNarrative = (session: ShadowSession) => {
    if (session.completed) {
      const narratives = [
        "Victory! You conquered your Shadow Self!",
        "Triumph! Your focus proved stronger than darkness!",
        "Success! The Shadow bows to your determination!",
        "Champion! You've mastered the art of focus!"
      ];
      return narratives[Math.floor(Math.random() * narratives.length)];
    } else {
      const narratives = [
        "The Shadow Self claims victory this time...",
        "Darkness prevailed, but wisdom was gained.",
        "Your Shadow Self grows stronger from this battle.",
        "The duel is lost, but the war continues..."
      ];
      return narratives[Math.floor(Math.random() * narratives.length)];
    }
  };

  if (!recentSession) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl max-w-md w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-4">🌙</div>
              <h2 className="text-2xl font-bold mb-2">No Duels Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start your first Shadow Duel to see battle results here.
              </p>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">Shadow Duel Summary</h2>
                <p className="text-muted-foreground">Battle results and statistics</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Dynamic Battle Arena with Avatars */}
                <Card className="bg-gradient-to-br from-purple-900/20 via-slate-900/20 to-red-900/20 border-purple-500/30 overflow-hidden">
                  <CardContent className="p-6 relative">
                    {/* Battle Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-red-500/5" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                    
                    <div className="relative z-10">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
                          Battle Arena
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {recentSession.taskTitle || 'Focus Session'} • {formatDate(recentSession.date)}
                        </div>
                      </div>
                      
                      {/* Avatar Battle */}
                      <div className="flex items-center justify-between mb-6 px-4">
                        {/* User Avatar */}
                        <motion.div 
                          className="flex flex-col items-center"
                          animate={recentSession.completed ? { scale: [1, 1.1, 1] } : { opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                            recentSession.completed 
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25' 
                              : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg shadow-slate-500/25'
                          }`}>
                            {recentSession.completed ? '🏆' : '😔'}
                          </div>
                          <div className="text-sm font-medium text-center">
                            <div>You</div>
                            <div className={`text-xs ${
                              recentSession.completed ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {recentSession.completed ? 'VICTORY' : 'DEFEAT'}
                            </div>
                          </div>
                        </motion.div>
                        
                        {/* Battle Effects */}
                        <div className="flex-1 flex items-center justify-center relative">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              rotate: [0, 180, 360]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-4xl"
                          >
                            ⚔️
                          </motion.div>
                          
                          {/* Lightning Effects */}
                          <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            className="absolute inset-0 flex items-center justify-center text-6xl"
                          >
                            ⚡
                          </motion.div>
                        </div>
                        
                        {/* Shadow Avatar */}
                        <motion.div 
                          className="flex flex-col items-center"
                          animate={!recentSession.completed ? { scale: [1, 1.1, 1] } : { opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                            !recentSession.completed 
                              ? 'bg-gradient-to-br from-red-500 to-purple-600 shadow-lg shadow-red-500/25' 
                              : 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-500/25'
                          }`}>
                            {!recentSession.completed ? '👹' : '😵'}
                          </div>
                          <div className="text-sm font-medium text-center">
                            <div>Shadow Self</div>
                            <div className={`text-xs ${
                              !recentSession.completed ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {!recentSession.completed ? 'VICTORY' : 'DEFEAT'}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Battle Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                          <div className="text-xl font-bold text-green-400">
                            {formatTime(recentSession.actualTime)}
                          </div>
                          <div className="text-xs text-muted-foreground">Your Time</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-red-500/10 rounded-lg border border-purple-500/20">
                          <div className="text-xl font-bold text-purple-400">
                            {formatTime(recentSession.targetTime)}
                          </div>
                          <div className="text-xs text-muted-foreground">Shadow's Challenge</div>
                        </div>
                      </div>
                      
                      {/* Battle Outcome */}
                      <div className="text-center p-4 rounded-lg bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50">
                        <div className="text-lg font-semibold mb-1">
                          {getBattleNarrative(recentSession)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {recentSession.completed 
                            ? "Your focus was unbreakable. The Shadow Self acknowledges your strength."
                            : "Every defeat teaches valuable lessons. Your next victory awaits."
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        +{recentSession.xpGained}
                      </div>
                      <div className="text-sm text-muted-foreground">XP Gained</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        +{recentSession.coinsEarned}
                      </div>
                      <div className="text-sm text-muted-foreground">Coins Earned</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Shadow Mode Statistics */}
                <Card className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-600/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Shadow Duel Scoreboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
                        <div className="text-3xl font-bold text-red-400 mb-1">
                          {shadowMode?.totalShadowWins || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Shadow Wins</div>
                        <div className="text-xs text-red-400 mt-1">Times you were defeated</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
                        <div className="text-3xl font-bold text-green-400 mb-1">
                          {shadowMode?.totalShadowLosses || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Your Wins</div>
                        <div className="text-xs text-green-400 mt-1">Times you conquered shadow</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
                      <div className="text-2xl font-bold">
                        {((shadowMode?.totalShadowLosses || 0) / Math.max(1, (shadowMode?.totalShadowWins || 0) + (shadowMode?.totalShadowLosses || 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Duel History */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Recent Duels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sessionHistory.slice(0, 10).map((session, index) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-lg">
                              {session.completed ? '🟢' : '🔴'}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{formatDate(session.date)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(session.actualTime)} / {formatTime(session.targetTime)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-yellow-500" />
                              <span>{session.xpGained}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-500" />
                              <span>{session.coinsEarned}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleRematch} className="flex-1" size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Rematch Duel
                  </Button>
                  <Button onClick={onClose} variant="outline" size="lg">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Task Selection Modal */}
      {showTaskSelection && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowTaskSelection(false)}
        >
          <motion.div
            className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Select Task for Duel</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose an incomplete task to duel your shadow
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTaskSelection(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {incompleteTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No incomplete tasks available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a new task to start a duel
                    </p>
                  </div>
                ) : (
                  incompleteTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTaskSelect(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityBadgeColor(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{Math.ceil(task.estimatedDuration / 60)}m</span>
                            </div>
                            {task.scheduledFor && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(task.scheduledFor).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowTaskSelection(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DuelSummary;

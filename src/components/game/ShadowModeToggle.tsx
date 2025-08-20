import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Eye, 
  EyeOff, 
  Sword, 
  Trophy, 
  Target,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTimer } from '@/contexts/TimerContext';

interface ShadowModeToggleProps {
  className?: string;
}

const ShadowModeToggle: React.FC<ShadowModeToggleProps> = ({ className = '' }) => {
  const { 
    shadowMode, 
    toggleShadowMode, 
    startShadowSession, 
    endShadowSession,
    recordShadowWin,
    recordShadowLoss 
  } = useGame();
  
  const { state: timerState } = useTimer();
  const [showObserver, setShowObserver] = useState(false);

  // Monitor timer state for Shadow Mode integration
  useEffect(() => {
    if (shadowMode.isEnabled && timerState.isRunning && !shadowMode.isActive) {
      // Start shadow session when timer starts
      const duration = Math.ceil(timerState.timeLeft / 60); // Convert seconds to minutes
      startShadowSession(
        duration, 
        timerState.currentTaskId || undefined, 
        timerState.currentTask || undefined
      );
    } else if (shadowMode.isActive && !timerState.isRunning) {
      // End shadow session when timer stops
      const completed = timerState.mode === 'break' || timerState.sessionsCompleted > 0;
      const exitedEarly = timerState.mode === 'idle' && timerState.timeLeft > 0;
      
      endShadowSession(completed, exitedEarly);
      
      // Record win/loss
      if (completed && !exitedEarly) {
        recordShadowWin();
      } else if (exitedEarly) {
        recordShadowLoss();
      }
    }
  }, [
    shadowMode.isEnabled, 
    shadowMode.isActive, 
    timerState.isRunning, 
    timerState.mode, 
    timerState.timeLeft,
    timerState.sessionsCompleted,
    timerState.currentTaskId,
    timerState.currentTask,
    startShadowSession,
    endShadowSession,
    recordShadowWin,
    recordShadowLoss
  ]);

  // Show shadow observer when session is active
  useEffect(() => {
    setShowObserver(shadowMode.isActive && shadowMode.shadowObserverVisible);
  }, [shadowMode.isActive, shadowMode.shadowObserverVisible]);

  const handleToggle = (enabled: boolean) => {
    toggleShadowMode(enabled);
  };

  const getResultIcon = (result: 'win' | 'loss' | null) => {
    switch (result) {
      case 'win':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'loss':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Shadow Mode Toggle Card */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-full">
                <Sword className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">Shadow Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor focus sessions for wins/losses
                </p>
              </div>
            </div>
            <Switch
              checked={shadowMode.isEnabled}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">
                {shadowMode.totalShadowWins}
              </div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">
                {shadowMode.totalShadowLosses}
              </div>
              <div className="text-xs text-muted-foreground">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-500">
                {shadowMode.totalShadowWins + shadowMode.totalShadowLosses > 0 
                  ? Math.round((shadowMode.totalShadowWins / (shadowMode.totalShadowWins + shadowMode.totalShadowLosses)) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
          </div>

          {/* Current Session Status */}
          {shadowMode.isEnabled && (
            <div className="space-y-2">
              {shadowMode.isActive ? (
                <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Shadow is watching...
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    Active
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Start a focus session to begin
                  </span>
                </div>
              )}

              {/* Last Session Result */}
              {shadowMode.lastSessionResult && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  {getResultIcon(shadowMode.lastSessionResult)}
                  <span className="text-sm">
                    Last session: {shadowMode.lastSessionResult === 'win' ? 'Victory!' : 'Defeat'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {!shadowMode.isEnabled && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">How Shadow Mode works:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Complete focus sessions = Shadow Win</li>
                    <li>• Exit early = Shadow Loss</li>
                    <li>• Visual shadow observer during sessions</li>
                    <li>• Track your win/loss record</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Shadow Observer Animation */}
        <AnimatePresence>
          {showObserver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-2 right-2"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-2 bg-purple-500/20 rounded-full backdrop-blur-sm"
              >
                <Eye className="w-5 h-5 text-purple-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default ShadowModeToggle;

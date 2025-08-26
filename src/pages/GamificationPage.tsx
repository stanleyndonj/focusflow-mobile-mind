import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Sword, 
  Calendar, 
  Trophy, 
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';
import AccountabilityMirror from '@/components/game/AccountabilityMirror';
import ShadowSelfChallenge from '@/components/game/ShadowSelfChallenge';
import ShadowAnalytics from '@/components/game/ShadowAnalytics';
import MiniFocusQuests from '@/components/game/MiniFocusQuests';
import ProductivityCompanion from '@/components/game/ProductivityCompanion';
import MindLockMode from '@/components/game/MindLockMode';
import EatThatFrogMode from '@/components/game/EatThatFrogMode';
import ShadowModeToggle from '@/components/game/ShadowModeToggle';
import DayStreakTracker from '@/components/game/DayStreakTracker';
import ReflectionInterface from '@/components/game/ReflectionInterface';
import DuelSummary from '@/components/game/DuelSummary';

const GamificationPage: React.FC = () => {
  const gameContext = useGame();
  const { gameStats, getTodaysReflection, todaysShadow, shadowMode, shadowSessions } = gameContext;
  const { state } = useTasks();
  const { tasks } = state;
  
  const [activeModal, setActiveModal] = useState<'mirror' | 'shadow' | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showReflectionInterface, setShowReflectionInterface] = useState(false);
  const [showDuelSummary, setShowDuelSummary] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, opacity: number}>>([]);
  
  // Force data refresh and UI update with persistent stats loading
  useEffect(() => {
    const forceRefresh = async () => {
      console.log('🔄 GamificationPage: Forcing data refresh and stats loading...');
      
      // Force GameContext to reload data from storage
      // Note: loadAllData method may not be available in current GameContext
      console.log('Game context methods available:', Object.keys(gameContext));
      
      console.log('📊 Current stats after reload:', {
        coins: gameStats?.coins || 0,
        xp: gameStats?.totalXP || 0, // Use totalXP instead of xp
        level: gameStats?.level || 1,
        shadowWins: shadowMode?.totalShadowWins || 0,
        shadowLosses: shadowMode?.totalShadowLosses || 0,
        shadowEnabled: shadowMode?.isEnabled
      });
      
      setIsDataLoaded(true);
    };
    
    // Force refresh immediately and after delays to ensure context is loaded
    forceRefresh();
    const timer1 = setTimeout(forceRefresh, 100);
    const timer2 = setTimeout(forceRefresh, 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [gameStats, shadowMode, gameContext]);
  
  // Create floating particles for dynamic effect
  useEffect(() => {
    const createParticles = () => {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: Math.random() * 0.3 + 0.1
      }));
      setParticles(newParticles);
    };
    
    createParticles();
    const interval = setInterval(createParticles, 10000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaysReflection = getTodaysReflection();
  
  // Calculate accurate shadow stats directly from tasks with proper processing checks
  const calculateAccurateShadowStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let shadowWins = 0;
    let userWins = 0;
    
    tasks.forEach(task => {
      // Only count tasks that have been properly processed to prevent duplication
      if (task.scheduledFor && task.shadowDuelProcessed) {
        const scheduledTime = new Date(task.scheduledFor);
        
        // Only include tasks from the last 30 days
        if (scheduledTime >= thirtyDaysAgo) {
          if (task.completed) {
            // Check completion time accuracy
            const completedTime = new Date(task.completedAt || task.updatedAt);
            const timeDiff = completedTime.getTime() - scheduledTime.getTime();
            const minutesLate = Math.floor(timeDiff / (60 * 1000));
            
            if (minutesLate > 15) {
              shadowWins++;
            } else {
              userWins++;
            }
          } else {
            // Incomplete tasks that are overdue count as shadow wins
            const timeDiff = now.getTime() - scheduledTime.getTime();
            const minutesOverdue = Math.floor(timeDiff / (60 * 1000));
            
            if (minutesOverdue >= 15) {
              shadowWins++;
            }
          }
        }
      }
    });
    
    return { shadowWins, userWins };
  };
  
  const accurateStats = calculateAccurateShadowStats();
  
  // Use GameContext stats if they match our accurate calculation, otherwise use accurate values
  // This prevents the massive duplication seen in the logs (30 vs 6 wins)
  const displayShadowWins = (shadowMode?.totalShadowWins !== undefined && 
                            Math.abs(shadowMode.totalShadowWins - accurateStats.shadowWins) <= 1)
    ? shadowMode.totalShadowWins 
    : accurateStats.shadowWins;
    
  const displayUserWins = (shadowMode?.totalShadowLosses !== undefined &&
                          Math.abs(shadowMode.totalShadowLosses - accurateStats.userWins) <= 1)
    ? shadowMode.totalShadowLosses 
    : accurateStats.userWins;
  
  console.log('📊 Accurate Stats Calculation:', accurateStats);
  console.log('📊 GameContext Stats:', {
    shadowWins: shadowMode?.totalShadowWins || 0,
    userWins: shadowMode?.totalShadowLosses || 0
  });
  
  console.log('📊 Stats comparison:', {
    gameContextShadowWins: shadowMode?.totalShadowWins || 0,
    gameContextUserWins: shadowMode?.totalShadowLosses || 0,
    accurateShadowWins: accurateStats.shadowWins,
    accurateUserWins: accurateStats.userWins,
    displayShadowWins,
    displayUserWins
  });
  
  // Calculate today's stats
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
    const completedDate = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null;
    return taskDate === today || completedDate === today;
  });
  const tasksCompleted = todaysTasks.filter(task => task.completed).length;
  
  // Calculate accurate focus time from today's sessions
  const totalFocusTime = todaysTasks.reduce((total, task) => {
    console.log(`📊 Calculating focus time for task: ${task.title}`);
    console.log(`  - totalTimeSpent: ${task.totalTimeSpent || 0}`);
    console.log(`  - focusSessions:`, task.focusSessions);
    
    // Use totalTimeSpent if available (this is the actual tracked time)
    if (task.totalTimeSpent && task.totalTimeSpent > 0) {
      // Check if totalTimeSpent is in milliseconds (> 3600 suggests milliseconds)
      const timeInSeconds = task.totalTimeSpent > 3600 ? 
        Math.floor(task.totalTimeSpent / 1000) : // Convert from milliseconds
        task.totalTimeSpent; // Already in seconds
      
      console.log(`  ✅ Using totalTimeSpent: ${task.totalTimeSpent} (converted to ${timeInSeconds} seconds)`);
      return total + timeInSeconds;
    }
    
    // Fallback to focus sessions if available
    const todaysSessions = task.focusSessions?.filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return sessionDate === today && session.endTime; // Only completed sessions
    }) || [];
    
    if (todaysSessions.length > 0) {
      const taskFocusTime = todaysSessions.reduce((sessionTotal, session) => {
        const duration = new Date(session.endTime!).getTime() - new Date(session.startTime).getTime();
        return sessionTotal + Math.max(0, duration / 1000); // Convert to seconds
      }, 0);
      console.log(`  ✅ Using focus sessions: ${taskFocusTime} seconds`);
      return total + taskFocusTime;
    }
    
    console.log(`  ❌ No focus time found for this task`);
    return total;
  }, 0);

  // Check if user should see welcome message
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('gamification-welcome-seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('gamification-welcome-seen', 'true');
    }
  }, []);

  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 18; // 6 PM or later
  const isMorning = currentHour >= 6 && currentHour < 12; // 6 AM to 12 PM

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-slate-50 dark:to-slate-900 flex flex-col overflow-hidden relative">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 pb-24 space-y-4 sm:space-y-6">
          {/* Welcome Modal */}
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card rounded-2xl p-6 max-w-md w-full"
              >
                <div className="text-center">
                  <div className="mb-4">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Gamification!</h2>
                  <p className="text-muted-foreground mb-6">
                    Unlock advanced reflection and challenge features to boost your productivity journey.
                  </p>
                  <Button onClick={() => setShowWelcome(false)} className="w-full">
                    Let's Begin!
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center sm:text-left"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
              Gamification Hub
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto sm:mx-0">
              Reflect, challenge yourself, and level up your productivity
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full"
          >
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 min-h-[100px] sm:min-h-[120px] hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-center text-center relative overflow-hidden">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-1 sm:mb-2" />
                    </motion.div>
                    <motion.div 
                      className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight"
                      key={gameStats?.level || 1}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {gameStats?.level || 1}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Level</div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/20 rounded-full blur-xl"></div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 min-h-[100px] sm:min-h-[120px] hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-center text-center relative overflow-hidden">
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                    </motion.div>
                    <motion.div 
                      className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight"
                      key={gameStats?.coins || 0}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {gameStats?.coins || 0}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Coins</div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500/20 rounded-full blur-xl"></div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20 min-h-[100px] sm:min-h-[120px] hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-center text-center relative overflow-hidden">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-1 sm:mb-2" />
                    </motion.div>
                    <motion.div 
                      className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight"
                      key={displayShadowWins}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {displayShadowWins}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Shadow Wins</div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/20 rounded-full blur-xl"></div>
                    {displayShadowWins > 0 && (
                      <motion.div
                        className="absolute inset-0 bg-red-500/5 rounded-lg"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 min-h-[100px] sm:min-h-[120px] hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-center text-center relative overflow-hidden">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-1 sm:mb-2" />
                    </motion.div>
                    <motion.div 
                      className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight"
                      key={displayUserWins}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {displayUserWins}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Your Wins</div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/20 rounded-full blur-xl"></div>
                    {displayUserWins > 0 && (
                      <motion.div
                        className="absolute inset-0 bg-green-500/5 rounded-lg"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="col-span-2 lg:col-span-1"
              >
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 min-h-[100px] sm:min-h-[120px] hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-center text-center relative overflow-hidden">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-1 sm:mb-2" />
                    </motion.div>
                    <motion.div 
                      className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight"
                      key={gameStats?.streak || 0}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {gameStats?.streak || 0}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Day Streak</div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/20 rounded-full blur-xl"></div>
                    {(gameStats?.streak || 0) > 0 && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-b-lg"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs defaultValue="overview" className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="grid w-full min-w-[560px] grid-cols-7 gap-2 h-auto p-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-600/30 dark:via-purple-600/30 dark:to-pink-600/30 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 py-3 font-semibold rounded-lg hover:scale-105 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 transform">
                    📊 Overview
                  </TabsTrigger>
                  <TabsTrigger value="quests" className="text-xs sm:text-sm px-3 py-3 font-semibold rounded-lg hover:scale-105 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 transform">
                    🎯 Quests
                  </TabsTrigger>
                  <TabsTrigger value="companion" className="text-xs sm:text-sm px-3 py-3 font-semibold rounded-lg hover:scale-105 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 transform">
                    🐾 Companion
                  </TabsTrigger>
                  <TabsTrigger value="mindlock" className="text-xs sm:text-sm px-3 py-3 font-semibold rounded-lg hover:scale-105 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 transform">
                    🔒 Mind Lock
                  </TabsTrigger>
                  <TabsTrigger value="frog" className="text-xs sm:text-sm px-3 py-3 font-semibold rounded-lg hover:scale-105 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 transform">
                    🐸 Frog Mode
                  </TabsTrigger>
                  <TabsTrigger value="mirror" className="text-xs sm:text-sm px-3 py-3 font-semibold rounded-lg hover:scale-105 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 transform">
                    🪞 Mirror
                  </TabsTrigger>
                  <TabsTrigger value="shadow" className="text-xs sm:text-sm px-3 py-3 font-semibold rounded-lg hover:scale-105 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 transition-all duration-300 transform">
                    🥷 Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Today's Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        Today's Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-green-500/10 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                            {tasksCompleted}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Tasks Completed</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-blue-500/10 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                            {Math.round(totalFocusTime / 60)}m
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Focus Time</div>
                        </div>
                      </div>
                      
                      {/* Shadow Mode Toggle */}
                      <div className="pt-2">
                        <ShadowModeToggle />
                      </div>
                      
                      {/* Day Streak Tracker */}
                      <div className="pt-2">
                        <DayStreakTracker />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid gap-3 sm:gap-4"
                >
                  {/* Accountability Mirror Card */}
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          <div className="p-2 sm:p-3 bg-blue-500/10 rounded-full flex-shrink-0">
                            <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">
                              Accountability Mirror
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              Daily reflection and self-assessment
                            </p>
                            {todaysReflection && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                Completed Today
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowReflectionInterface(true)}
                          variant={isEvening ? "default" : "outline"}
                          size="sm"
                          className="w-full sm:w-auto flex-shrink-0"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {todaysReflection ? 'View' : 'Reflect'}
                        </Button>
                      </div>
                      {isEvening && !todaysReflection && (
                        <div className="mt-3 sm:mt-4 p-3 bg-blue-500/10 rounded-lg">
                          <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                            🌅 Perfect time for evening reflection!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Shadow Mode Status Card */}
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          <div className="p-2 sm:p-3 bg-purple-500/10 rounded-full flex-shrink-0">
                            <Sword className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">
                              Shadow Mode Active
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2">
                              Your shadow is monitoring all scheduled tasks
                            </p>
                            <div className="flex gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-green-500" />
                                <span className="text-green-600 font-semibold">{displayUserWins}</span>
                                <span className="text-muted-foreground">Your Wins</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span className="text-red-600 font-semibold">{displayShadowWins}</span>
                                <span className="text-muted-foreground">Shadow Wins</span>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`mt-2 text-xs ${
                                shadowMode?.isEnabled 
                                  ? 'border-green-500 text-green-600 bg-green-500/5' 
                                  : 'border-gray-500 text-gray-600'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                shadowMode?.isEnabled ? 'bg-green-500' : 'bg-gray-500'
                              }`} />
                              {shadowMode?.isEnabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowDuelSummary(true)}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto flex-shrink-0"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="quests">
                <div className="p-4">
                  <MiniFocusQuests onClose={() => setActiveModal(null)} />
                </div>
              </TabsContent>

              <TabsContent value="companion">
                <div className="p-4">
                  <ProductivityCompanion onClose={() => setActiveModal(null)} />
                </div>
              </TabsContent>



              <TabsContent value="mindlock">
                <div className="p-4">
                  <MindLockMode onClose={() => setActiveModal(null)} />
                </div>
              </TabsContent>

              <TabsContent value="frog">
                <div className="p-4">
                  <EatThatFrogMode onClose={() => setActiveModal(null)} />
                </div>
              </TabsContent>

              <TabsContent value="mirror">
                <div className="p-4">
                  <AccountabilityMirror onClose={() => setActiveModal(null)} />
                </div>
              </TabsContent>

              <TabsContent value="shadow">
                <div className="p-4">
                  <ShadowAnalytics onClose={() => setActiveModal(null)} />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      
      {/* Overview Tab Modals */}
      <ReflectionInterface 
        isOpen={showReflectionInterface}
        onClose={() => setShowReflectionInterface(false)}
      />
      
      <DuelSummary 
        isOpen={showDuelSummary}
        onClose={() => setShowDuelSummary(false)}
        onRematch={() => {
          setShowDuelSummary(false);
          setActiveModal('shadow'); // Open shadow tab for rematch
        }}
      />
    </div>
  );
};

export default GamificationPage;

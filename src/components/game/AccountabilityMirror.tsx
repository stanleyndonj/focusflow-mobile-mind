import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, MicOff, Target, CheckCircle, XCircle, BarChart3, Eye, Calendar, Flame, 
  TrendingUp, TrendingDown, AlertTriangle, Clock, Zap, Award, RefreshCw,
  MessageSquare, ThumbsUp, ThumbsDown, Activity, PieChart, Save, Lightbulb
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useTasks } from '@/contexts/TaskContext';

interface AccountabilityMirrorProps {
  onClose?: () => void;
}

interface AccountabilityData {
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  focusTimeMinutes: number;
  mood: string;
  reflection: string;
  blockers: string[];
  commitments: string[];
  excuses: string[];
  improvements: string[];
}

interface WeeklyPattern {
  averageCompletion: number;
  bestDay: string;
  worstDay: string;
  consistencyScore: number;
  procrastinationDays: number;
}

const AccountabilityMirror: React.FC<AccountabilityMirrorProps> = ({ onClose }) => {
  const { addReflection, getTodaysReflection, gameStats } = useGame();
  const { state } = useTasks();
  const { tasks } = state;
  
  const [activeTab, setActiveTab] = useState('reality-check');
  const [reflectionText, setReflectionText] = useState('');
  const [selectedMood, setSelectedMood] = useState<'frustrated' | 'satisfied' | 'motivated' | 'neutral'>('neutral');
  const [blockers, setBlockers] = useState<string[]>([]);
  const [newBlocker, setNewBlocker] = useState('');
  const [excuses, setExcuses] = useState<string[]>([]);
  const [newExcuse, setNewExcuse] = useState('');
  const [commitments, setCommitments] = useState<string[]>([]);
  const [newCommitment, setNewCommitment] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [newImprovement, setNewImprovement] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showReflectionInterface, setShowReflectionInterface] = useState(false);
  const [accountabilityHistory, setAccountabilityHistory] = useState<AccountabilityData[]>([]);

  const today = new Date().toISOString().split('T')[0];
  
  // Get today's reflection from game context
  const todaysReflection = gameStats.reflections?.find(r => r.date === today);
  
  // Load accountability history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('accountabilityHistory');
    if (savedHistory) {
      setAccountabilityHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Calculate comprehensive daily stats
  const todaysTasks = tasks.filter(task => 
    task.createdAt.startsWith(today) || 
    (task.completedAt && task.completedAt.startsWith(today))
  );
  const tasksPlanned = todaysTasks.length;
  const tasksCompleted = todaysTasks.filter(task => task.completed).length;
  const tasksMissed = tasksPlanned - tasksCompleted;
  const completionRate = tasksPlanned > 0 ? (tasksCompleted / tasksPlanned) * 100 : 0;
  
  // Calculate focus time
  const totalFocusTime = todaysTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
  const focusMinutes = Math.round(totalFocusTime / (1000 * 60));
  const focusHours = Math.round(focusMinutes / 60 * 10) / 10;

  // Calculate weekly patterns
  const getWeeklyPattern = (): WeeklyPattern => {
    const lastWeek = accountabilityHistory.slice(-7);
    if (lastWeek.length === 0) {
      return {
        averageCompletion: 0,
        bestDay: 'N/A',
        worstDay: 'N/A',
        consistencyScore: 0,
        procrastinationDays: 0
      };
    }

    const completionRates = lastWeek.map(day => 
      day.tasksPlanned > 0 ? (day.tasksCompleted / day.tasksPlanned) * 100 : 0
    );
    const averageCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
    
    const bestDayIndex = completionRates.indexOf(Math.max(...completionRates));
    const worstDayIndex = completionRates.indexOf(Math.min(...completionRates));
    
    const bestDay = lastWeek[bestDayIndex]?.date || 'N/A';
    const worstDay = lastWeek[worstDayIndex]?.date || 'N/A';
    
    const consistencyScore = 100 - (Math.max(...completionRates) - Math.min(...completionRates));
    const procrastinationDays = lastWeek.filter(day => 
      day.tasksPlanned > 0 && (day.tasksCompleted / day.tasksPlanned) < 0.5
    ).length;

    return {
      averageCompletion,
      bestDay,
      worstDay,
      consistencyScore,
      procrastinationDays
    };
  };

  const weeklyPattern = getWeeklyPattern();

  // Enhanced radical honesty feedback system with varied statements
  const getRadicalHonestyFeedback = () => {
    const feedback: string[] = [];
    const positiveMessages = [];
    const negativeMessages = [];
    
    // Task completion feedback - varied based on performance
    if (completionRate === 100 && tasksPlanned > 0) {
      positiveMessages.push("🎯 Perfect execution! You completed every single task you planned.");
      positiveMessages.push("🏆 Flawless performance - this is what consistency looks like.");
      positiveMessages.push("✨ You're operating at peak productivity today!");
    } else if (completionRate >= 90) {
      positiveMessages.push("🔥 Outstanding performance! You're in the top tier of productivity.");
      positiveMessages.push("💪 Nearly perfect execution - just a small gap to close.");
      positiveMessages.push("🌟 Excellent work! You're building strong momentum.");
    } else if (completionRate >= 80) {
      positiveMessages.push("👍 Good progress! You're maintaining solid productivity habits.");
      positiveMessages.push("📈 Strong performance - you're on the right track.");
      positiveMessages.push("⚡ You're doing well, with just minor room for optimization.");
    } else if (completionRate >= 60) {
      feedback.push("⚠️ Moderate performance. You're making progress but inconsistently.");
      feedback.push("📊 You completed more than half your tasks - that's something, but aim higher.");
      feedback.push("🔄 You're in the middle ground. Time to push for excellence.");
    } else if (completionRate >= 40) {
      negativeMessages.push("🚨 Below-average completion rate. Your productivity is suffering.");
      negativeMessages.push("📉 Less than half completed? This pattern needs to change immediately.");
      negativeMessages.push("⏰ You're letting tasks pile up. This is procrastination in action.");
    } else if (completionRate >= 20) {
      negativeMessages.push("❌ Poor performance alert! You're completing very few planned tasks.");
      negativeMessages.push("💔 This completion rate is unsustainable for any meaningful progress.");
      negativeMessages.push("🔴 Serious productivity crisis - immediate action required.");
    } else {
      negativeMessages.push("🆘 Critical failure! Almost nothing got done today.");
      negativeMessages.push("💀 This is not productivity, this is complete task avoidance.");
      negativeMessages.push("🚫 Emergency intervention needed - you're in full procrastination mode.");
    }

    // Focus time feedback - multiple varied statements
    if (focusMinutes >= 300) { // 5+ hours
      positiveMessages.push("🧠 Exceptional focus time! You're in deep work mastery mode.");
      positiveMessages.push("🚀 5+ hours of focused work? You're operating like a productivity machine.");
      positiveMessages.push("💎 Elite-level concentration! This is how success is built.");
    } else if (focusMinutes >= 240) { // 4+ hours
      positiveMessages.push("🎯 Impressive focus session! 4+ hours shows real commitment.");
      positiveMessages.push("⚡ Strong deep work performance - you're in the zone today.");
      positiveMessages.push("🏅 Excellent focus duration! You're building powerful work habits.");
    } else if (focusMinutes >= 180) { // 3+ hours
      positiveMessages.push("👍 Good focus time! 3+ hours shows solid productivity habits.");
      positiveMessages.push("📈 Respectable concentration period - you're making progress.");
      positiveMessages.push("💪 Decent focus session! Keep building on this momentum.");
    } else if (focusMinutes >= 120) { // 2+ hours
      feedback.push("⏰ 2+ hours of focus is acceptable, but you can do better.");
      feedback.push("📊 Moderate focus time. Are you getting distracted too easily?");
      feedback.push("🔄 Room for improvement in concentration duration.");
    } else if (focusMinutes >= 60) { // 1+ hour
      negativeMessages.push("⚠️ Just over an hour of focus? That's bare minimum effort.");
      negativeMessages.push("📱 Low focus time suggests too many distractions in your environment.");
      negativeMessages.push("🔴 One hour barely scratches the surface of deep work potential.");
    } else if (focusMinutes >= 30) {
      negativeMessages.push("🚨 30-60 minutes of focus? This is nowhere near your potential.");
      negativeMessages.push("💔 Such short focus periods indicate serious concentration problems.");
      negativeMessages.push("⏰ You're giving tasks the bare minimum attention they deserve.");
    } else {
      negativeMessages.push("❌ Less than 30 minutes of focus? Are you even trying?");
      negativeMessages.push("💀 This focus time is laughably inadequate for any real work.");
      negativeMessages.push("🆘 You're not working, you're just pretending to be busy.");
    }

    // Weekly pattern feedback
    if (weeklyPattern.procrastinationDays === 0) {
      positiveMessages.push("🔥 Zero procrastination days this week! You're unstoppable.");
      positiveMessages.push("🏆 Perfect weekly consistency - this is championship-level performance.");
    } else if (weeklyPattern.procrastinationDays === 1) {
      positiveMessages.push("💫 Only 1 off day this week? Excellent consistency!");
      positiveMessages.push("🎯 Nearly perfect week with just one minor slip-up.");
    } else if (weeklyPattern.procrastinationDays === 2) {
      feedback.push("📊 2 procrastination days is manageable, but watch for patterns.");
      feedback.push("⚠️ Couple of off days this week - keep it from becoming a trend.");
    } else if (weeklyPattern.procrastinationDays <= 3) {
      negativeMessages.push("📉 3 procrastination days? You're losing too many battles.");
      negativeMessages.push("🔴 Nearly half your week was unproductive - this is concerning.");
    } else if (weeklyPattern.procrastinationDays <= 5) {
      negativeMessages.push("🚨 More procrastination days than productive ones! This is critical.");
      negativeMessages.push("💔 Your week was dominated by avoidance and delay tactics.");
    } else {
      negativeMessages.push("💀 Almost the entire week wasted! This is a complete productivity failure.");
      negativeMessages.push("🆘 Emergency mode: You've procrastinated nearly every single day.");
    }

    // Streak feedback - contextual and varied
    if (gameStats.streak >= 30) {
      positiveMessages.push("🔥 30+ day streak! You're building legendary consistency habits.");
      positiveMessages.push("👑 This streak is impressive - you're in elite productivity territory.");
    } else if (gameStats.streak >= 14) {
      positiveMessages.push("💪 2+ week streak! Your consistency is paying off big time.");
      positiveMessages.push("🚀 Strong momentum building - keep this streak alive!");
    } else if (gameStats.streak >= 7) {
      positiveMessages.push("📈 Week-long streak! You're developing solid routine habits.");
      positiveMessages.push("⚡ Good consistency building - stay committed!");
    } else if (gameStats.streak >= 3) {
      feedback.push("🔄 Short streak building. Focus on extending this pattern.");
      feedback.push("📊 Early momentum - don't let this streak die now.");
    } else if (gameStats.streak <= 1) {
      negativeMessages.push("💔 Your streak is broken or barely started. Consistency is everything.");
      negativeMessages.push("🚨 No meaningful streak means no meaningful habits are forming.");
    }

    // Combine messages based on overall performance
    if (positiveMessages.length >= negativeMessages.length) {
      // Good day - mix positive with some constructive
      feedback.push(...positiveMessages.slice(0, Math.min(4, positiveMessages.length)));
      if (negativeMessages.length > 0) {
        feedback.push(negativeMessages[0]); // Add one reality check
      }
    } else {
      // Poor day - mix negative with some encouragement
      feedback.push(...negativeMessages.slice(0, Math.min(4, negativeMessages.length)));
      if (positiveMessages.length > 0) {
        feedback.push(positiveMessages[0]); // Add one bright spot
      }
    }

    // Always add a forward-looking statement
    if (completionRate >= 80) {
      feedback.push("🎯 You're proving you can maintain high standards - keep it up!");
    } else if (completionRate >= 50) {
      feedback.push("📈 You have the capability for more - push yourself tomorrow.");
    } else {
      feedback.push("🔄 Tomorrow is a fresh start - commit to doing better.");
    }

    return feedback.length > 0 ? feedback : ["📊 Your performance is average. There's room for improvement."];
  };

  // Self-reflection questions
  const getRandomReflectionQuestion = () => {
    const questions = [
      "What's your excuse for not completing all tasks today?",
      "How will you fix this tomorrow?",
      "What patterns of procrastination do you notice?",
      "Are your goals realistic or are you setting yourself up to fail?",
      "What would you tell a friend who performed like you did today?",
      "What's the real reason you're avoiding certain tasks?",
      "How does today's performance align with your long-term goals?",
      "What would happen if you continued this pattern for a month?",
      "What's one thing you could have done differently today?",
      "Are you being honest with yourself about your priorities?"
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  };

  const moodEmojis = {
    frustrated: '😤',
    satisfied: '😌',
    motivated: '🔥',
    neutral: '😐'
  };

  const moodColors = {
    frustrated: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    satisfied: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    motivated: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  };

  // Save accountability data
  const saveAccountabilityData = () => {
    const todayData: AccountabilityData = {
      date: today,
      tasksPlanned,
      tasksCompleted,
      focusTimeMinutes: focusMinutes,
      mood: selectedMood,
      reflection: reflectionText,
      blockers,
      commitments,
      excuses,
      improvements
    };

    const updatedHistory = [...accountabilityHistory.filter(d => d.date !== today), todayData];
    setAccountabilityHistory(updatedHistory);
    localStorage.setItem('accountabilityHistory', JSON.stringify(updatedHistory));
  };

  // Add item handlers
  const addBlocker = () => {
    if (newBlocker.trim()) {
      setBlockers([...blockers, newBlocker.trim()]);
      setNewBlocker('');
    }
  };

  const addExcuse = () => {
    if (newExcuse.trim()) {
      setExcuses([...excuses, newExcuse.trim()]);
      setNewExcuse('');
    }
  };

  const addCommitment = () => {
    if (newCommitment.trim()) {
      setCommitments([...commitments, newCommitment.trim()]);
      setNewCommitment('');
    }
  };

  const addImprovement = () => {
    if (newImprovement.trim()) {
      setImprovements([...improvements, newImprovement.trim()]);
      setNewImprovement('');
    }
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
    
    // Save reflection data directly to accountability history
    saveAccountabilityData();

    // Reset form
    setReflectionText('');
    setSelectedMood('neutral');
    setBlockers([]);
    
    if (onClose) onClose();
  }, [saveAccountabilityData, today, tasksPlanned, tasksCompleted, reflectionText, selectedMood, blockers, todaysReflection, onClose]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header with Reality Check */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-800 dark:text-red-400">
            <Eye className="h-6 w-6" />
            Accountability Mirror
          </CardTitle>
          <p className="text-sm text-red-600 dark:text-red-400">
            Time to face the truth about your productivity
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tasksCompleted}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{tasksMissed}</div>
              <div className="text-xs text-muted-foreground">Missed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{focusHours}h</div>
              <div className="text-xs text-muted-foreground">Focus Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(completionRate)}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          {/* Radical Honesty Feedback */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
            <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Reality Check</h4>
            {getRadicalHonestyFeedback().map((feedback, index) => (
              <p key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                {feedback}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reality-check" className="text-xs">Reality</TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs">Patterns</TabsTrigger>
          <TabsTrigger value="reflection" className="text-xs">Reflect</TabsTrigger>
          <TabsTrigger value="action-plan" className="text-xs">Action</TabsTrigger>
        </TabsList>

        {/* Reality vs Expectations Tab */}
        <TabsContent value="reality-check" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Reality vs. Expectations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">What You Achieved</h4>
                  <div className="space-y-2">
                    {todaysTasks.filter(task => task.completed).map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{task.title}</span>
                      </div>
                    ))}
                    {tasksCompleted === 0 && (
                      <p className="text-sm text-gray-500 italic">No tasks completed today</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-600">What You Missed</h4>
                  <div className="space-y-2">
                    {todaysTasks.filter(task => !task.completed).map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{task.title}</span>
                      </div>
                    ))}
                    {tasksMissed === 0 && (
                      <p className="text-sm text-green-600 italic">All tasks completed! 🎉</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Performance Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-semibold">Completion Rate</div>
                    <div className={`text-lg ${completionRate >= 80 ? 'text-green-600' : completionRate >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                      {Math.round(completionRate)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-semibold">Focus Quality</div>
                    <div className={`text-lg ${focusMinutes >= 120 ? 'text-green-600' : focusMinutes >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                      {focusMinutes >= 120 ? 'Excellent' : focusMinutes >= 60 ? 'Good' : 'Poor'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-semibold">Streak Status</div>
                    <div className={`text-lg ${gameStats.streak >= 7 ? 'text-green-600' : gameStats.streak >= 3 ? 'text-orange-600' : 'text-red-600'}`}>
                      {gameStats.streak} days
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns & Trends Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Patterns & Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm">Average Completion</span>
                      <span className="font-semibold">{Math.round(weeklyPattern.averageCompletion)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm">Consistency Score</span>
                      <span className="font-semibold">{Math.round(weeklyPattern.consistencyScore)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm">Procrastination Days</span>
                      <span className="font-semibold text-red-600">{weeklyPattern.procrastinationDays}/7</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Best vs Worst</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="text-sm text-green-800 dark:text-green-400">Best Day</div>
                      <div className="font-semibold">{weeklyPattern.bestDay}</div>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="text-sm text-red-800 dark:text-red-400">Worst Day</div>
                      <div className="font-semibold">{weeklyPattern.worstDay}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {weeklyPattern.procrastinationDays > 2 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-800 dark:text-red-400">Procrastination Alert</h4>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    You've had {weeklyPattern.procrastinationDays} low-productivity days this week. 
                    Time to identify what's holding you back and make changes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Self-Reflection Tab */}
        <TabsContent value="reflection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Deep Self-Reflection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-3">
                  {getRandomReflectionQuestion ? getRandomReflectionQuestion() : "What's your excuse for not completing all tasks today?"}
                </h4>
                <Textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Take a moment to really think about this question. Be honest with yourself..."
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground text-right mt-2">
                  {reflectionText.length}/1000
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">What blocked you today?</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBlocker}
                      onChange={(e) => setNewBlocker(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addBlocker()}
                      placeholder="e.g., distractions, unclear goals..."
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button size="sm" onClick={addBlocker} disabled={!newBlocker.trim()}>
                      Add
                    </Button>
                  </div>
                  {blockers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blockers.map((blocker, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer hover:bg-destructive/20">
                          {blocker} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">What excuses did you make?</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExcuse}
                      onChange={(e) => setNewExcuse(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addExcuse()}
                      placeholder="e.g., too tired, not enough time..."
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button size="sm" onClick={addExcuse} disabled={!newExcuse.trim()}>
                      Add
                    </Button>
                  </div>
                  {excuses.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {excuses.map((excuse, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 dark:bg-red-900/20">
                          {excuse}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">How are you feeling about today?</h4>
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

              <Button 
                onClick={saveAccountabilityData}
                className="w-full"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Reflection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="action-plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Next Steps & Commitments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">Tomorrow's Commitments</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCommitment}
                      onChange={(e) => setNewCommitment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCommitment()}
                      placeholder="I will..."
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button size="sm" onClick={addCommitment} disabled={!newCommitment.trim()}>
                      Add
                    </Button>
                  </div>
                  {commitments.length > 0 && (
                    <div className="space-y-2">
                      {commitments.map((commitment, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{commitment}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-600">Process Improvements</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newImprovement}
                      onChange={(e) => setNewImprovement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addImprovement()}
                      placeholder="Next time I'll..."
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button size="sm" onClick={addImprovement} disabled={!newImprovement.trim()}>
                      Add
                    </Button>
                  </div>
                  {improvements.length > 0 && (
                    <div className="space-y-2">
                      {improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(completionRate < 60 || weeklyPattern.procrastinationDays > 2) && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-800 dark:text-orange-400">Recovery Plan Needed</h4>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                    Your performance suggests you need to adjust your approach. Consider:
                  </p>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Reducing your daily task load to build momentum</li>
                    <li>• Identifying and eliminating your biggest time wasters</li>
                    <li>• Setting up better systems and routines</li>
                    <li>• Getting accountability from someone you trust</li>
                  </ul>
                </div>
              )}

              <Button 
                onClick={saveAccountabilityData}
                className="w-full"
                size="lg"
                variant="default"
              >
                <Target className="w-4 h-4 mr-2" />
                Commit to Action Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AccountabilityMirror;
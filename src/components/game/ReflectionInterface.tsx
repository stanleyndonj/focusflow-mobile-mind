import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Calendar, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Save,
  Eye,
  Flame,
  Star,
  Heart,
  Smile,
  Meh,
  Frown,
  Angry,
  Zap,
  Trophy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

interface ReflectionData {
  id: string;
  date: string;
  mood: string;
  moodEmoji: string;
  wellToday: string;
  couldImprove: string;
  distractions: string;
  values: string;
  improveTomorrow: string;
  voiceNoteUrl?: string;
  createdAt: string;
}

interface ReflectionInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReflectionInterface: React.FC<ReflectionInterfaceProps> = ({ isOpen, onClose }) => {
  const { addXP, addCoins } = useGame();
  const today = new Date().toISOString().split('T')[0];
  
  // State for current reflection
  const [currentReflection, setCurrentReflection] = useState<Partial<ReflectionData>>({
    date: today,
    mood: 'neutral',
    moodEmoji: '😐',
    wellToday: '',
    couldImprove: '',
    distractions: '',
    values: '',
    improveTomorrow: ''
  });
  
  // State for reflection history
  const [reflectionHistory, setReflectionHistory] = useState<ReflectionData[]>([]);
  const [streak, setStreak] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState<string | null>(null);

  // Mood options
  const moodOptions = [
    { value: 'amazing', emoji: '🤩', label: 'Amazing', color: 'text-green-500' },
    { value: 'great', emoji: '😊', label: 'Great', color: 'text-green-400' },
    { value: 'good', emoji: '🙂', label: 'Good', color: 'text-blue-400' },
    { value: 'neutral', emoji: '😐', label: 'Neutral', color: 'text-gray-400' },
    { value: 'tired', emoji: '😴', label: 'Tired', color: 'text-yellow-400' },
    { value: 'stressed', emoji: '😰', label: 'Stressed', color: 'text-orange-400' },
    { value: 'frustrated', emoji: '😤', label: 'Frustrated', color: 'text-red-400' }
  ];

  // Load reflection data on mount
  useEffect(() => {
    if (isOpen) {
      loadReflectionData();
    }
  }, [isOpen]);

  const loadReflectionData = () => {
    try {
      // Load reflection history
      const savedHistory = localStorage.getItem('focusflow_reflection_history');
      if (savedHistory) {
        const history: ReflectionData[] = JSON.parse(savedHistory);
        setReflectionHistory(history);
        
        // Calculate streak
        const currentStreak = calculateReflectionStreak(history);
        setStreak(currentStreak);
        
        // Load today's reflection if it exists
        const todaysReflection = history.find(r => r.date === today);
        if (todaysReflection) {
          setCurrentReflection(todaysReflection);
          if (todaysReflection.voiceNoteUrl) {
            setAudioUrl(todaysReflection.voiceNoteUrl);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load reflection data:', error);
    }
  };

  const calculateReflectionStreak = (history: ReflectionData[]): number => {
    if (history.length === 0) return 0;
    
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    let currentDate = new Date();
    
    for (const reflection of sortedHistory) {
      const reflectionDate = new Date(reflection.date);
      const daysDiff = Math.floor((currentDate.getTime() - reflectionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = reflectionDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const handleMoodSelect = (mood: typeof moodOptions[0]) => {
    setCurrentReflection(prev => ({
      ...prev,
      mood: mood.value,
      moodEmoji: mood.emoji
    }));
  };

  const handleInputChange = (field: keyof ReflectionData, value: string) => {
    setCurrentReflection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Save to localStorage with unique key
        const reader = new FileReader();
        reader.onload = () => {
          localStorage.setItem(`focusflow_voice_${today}`, reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Stop recording after 5 minutes max
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5 * 60 * 1000);

      // Store recorder reference for manual stop
      (window as any).currentRecorder = mediaRecorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    const recorder = (window as any).currentRecorder;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const saveReflection = () => {
    if (!currentReflection.wellToday?.trim()) {
      alert('Please fill in at least one reflection field before saving.');
      return;
    }

    const reflectionData: ReflectionData = {
      id: currentReflection.id || `reflection-${Date.now()}`,
      date: today,
      mood: currentReflection.mood || 'neutral',
      moodEmoji: currentReflection.moodEmoji || '😐',
      wellToday: currentReflection.wellToday || '',
      couldImprove: currentReflection.couldImprove || '',
      distractions: currentReflection.distractions || '',
      values: currentReflection.values || '',
      improveTomorrow: currentReflection.improveTomorrow || '',
      voiceNoteUrl: audioUrl || undefined,
      createdAt: new Date().toISOString()
    };

    // Update history
    const updatedHistory = reflectionHistory.filter(r => r.date !== today);
    updatedHistory.push(reflectionData);
    
    setReflectionHistory(updatedHistory);
    localStorage.setItem('focusflow_reflection_history', JSON.stringify(updatedHistory));

    // Update streak
    const newStreak = calculateReflectionStreak(updatedHistory);
    setStreak(newStreak);

    // Award XP and coins for reflection
    addXP(25); // Base XP for reflection
    addCoins(10); // Base coins for reflection
    
    // Bonus for streak
    if (newStreak > 1) {
      const streakBonus = Math.min(newStreak * 5, 50); // Max 50 bonus XP
      addXP(streakBonus);
      addCoins(Math.floor(streakBonus / 2));
    }

    alert(`Reflection saved! +${25 + (newStreak > 1 ? Math.min(newStreak * 5, 50) : 0)} XP, +${10 + (newStreak > 1 ? Math.floor(Math.min(newStreak * 5, 50) / 2) : 0)} coins`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-bold">Daily Reflection</h2>
                <p className="text-sm text-muted-foreground">
                  {formatDate(today)} • {streak > 0 && `${streak} day streak 🔥`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-4 space-y-6">
              {/* Streak Display */}
              {streak > 0 && (
                <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="font-semibold">Reflection Streak</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">
                        {streak} {streak === 1 ? 'day' : 'days'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mood Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">How are you feeling today?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {moodOptions.map((mood) => (
                      <Button
                        key={mood.value}
                        variant={currentReflection.mood === mood.value ? "default" : "outline"}
                        className="h-16 flex-col gap-1 text-xs"
                        onClick={() => handleMoodSelect(mood)}
                      >
                        <span className="text-2xl">{mood.emoji}</span>
                        <span className={mood.color}>{mood.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reflection Questions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Guided Reflection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What did I do well today? ✨
                    </label>
                    <Textarea
                      value={currentReflection.wellToday || ''}
                      onChange={(e) => handleInputChange('wellToday', e.target.value)}
                      placeholder="Celebrate your wins, big or small..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What could I have done better? 🎯
                    </label>
                    <Textarea
                      value={currentReflection.couldImprove || ''}
                      onChange={(e) => handleInputChange('couldImprove', e.target.value)}
                      placeholder="Areas for growth and improvement..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What distracted me or pulled me off course? 🌊
                    </label>
                    <Textarea
                      value={currentReflection.distractions || ''}
                      onChange={(e) => handleInputChange('distractions', e.target.value)}
                      placeholder="Identify patterns and triggers..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Did I live according to my values today? 💎
                    </label>
                    <Textarea
                      value={currentReflection.values || ''}
                      onChange={(e) => handleInputChange('values', e.target.value)}
                      placeholder="Reflect on alignment with your core values..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What will I improve tomorrow? 🚀
                    </label>
                    <Textarea
                      value={currentReflection.improveTomorrow || ''}
                      onChange={(e) => handleInputChange('improveTomorrow', e.target.value)}
                      placeholder="Set intentions for tomorrow..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Voice Note */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Reflection (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <Button onClick={startRecording} variant="outline" className="flex-1">
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} variant="destructive" className="flex-1">
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                    
                    {audioUrl && (
                      <Button onClick={togglePlayback} variant="outline">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  
                  {isRecording && (
                    <div className="mt-3 flex items-center gap-2 text-red-500">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm">Recording...</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex gap-3">
                <Button onClick={saveReflection} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Reflection
                </Button>
                <Button 
                  onClick={() => setShowHistory(!showHistory)} 
                  variant="outline"
                  className="px-4"
                >
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {/* Reflection History */}
              {showHistory && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Reflection History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reflectionHistory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No previous reflections yet. Start your journey today!
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {reflectionHistory
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((reflection) => (
                            <div
                              key={reflection.id}
                              className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => setExpandedHistoryItem(
                                expandedHistoryItem === reflection.id ? null : reflection.id
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{reflection.moodEmoji}</span>
                                  <div>
                                    <p className="font-medium">{formatDate(reflection.date)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {reflection.wellToday.substring(0, 50)}
                                      {reflection.wellToday.length > 50 ? '...' : ''}
                                    </p>
                                  </div>
                                </div>
                                {reflection.voiceNoteUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const audio = new Audio(reflection.voiceNoteUrl);
                                      audio.play();
                                    }}
                                  >
                                    <Play className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              
                              {expandedHistoryItem === reflection.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="mt-3 pt-3 border-t space-y-2 text-sm"
                                >
                                  <div><strong>Well:</strong> {reflection.wellToday}</div>
                                  <div><strong>Improve:</strong> {reflection.couldImprove}</div>
                                  <div><strong>Distractions:</strong> {reflection.distractions}</div>
                                  <div><strong>Values:</strong> {reflection.values}</div>
                                  <div><strong>Tomorrow:</strong> {reflection.improveTomorrow}</div>
                                </motion.div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReflectionInterface;

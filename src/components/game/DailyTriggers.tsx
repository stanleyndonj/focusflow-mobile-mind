import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Eye, Sword, Clock, Sparkles } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useNavigate } from 'react-router-dom';

interface DailyTriggersProps {
  onTriggerAction?: (action: 'mirror' | 'shadow') => void;
}

const DailyTriggers: React.FC<DailyTriggersProps> = ({ onTriggerAction }) => {
  const { getTodaysReflection, todaysShadow } = useGame();
  const navigate = useNavigate();
  
  const [showMirrorPrompt, setShowMirrorPrompt] = useState(false);
  const [showShadowPrompt, setShowShadowPrompt] = useState(false);
  const [dismissedToday, setDismissedToday] = useState({
    mirror: false,
    shadow: false
  });

  const todaysReflection = getTodaysReflection();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const checkDailyTriggers = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Check if already dismissed today
      const dismissedData = localStorage.getItem(`daily-triggers-dismissed-${today}`);
      const todaysDismissed = dismissedData ? JSON.parse(dismissedData) : { mirror: false, shadow: false };
      setDismissedToday(todaysDismissed);

      // Evening Accountability Mirror (6 PM - 11 PM)
      if (currentHour >= 18 && currentHour < 23 && !todaysReflection && !todaysDismissed.mirror) {
        setShowMirrorPrompt(true);
      }

      // Morning Shadow Self Challenge (7 AM - 11 AM)
      if (currentHour >= 7 && currentHour < 11 && !todaysShadow && !todaysDismissed.shadow) {
        setShowShadowPrompt(true);
      }
    };

    // Check immediately
    checkDailyTriggers();

    // Check every 30 minutes
    const interval = setInterval(checkDailyTriggers, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [todaysReflection, todaysShadow, today]);

  const dismissPrompt = (type: 'mirror' | 'shadow') => {
    const newDismissed = { ...dismissedToday, [type]: true };
    setDismissedToday(newDismissed);
    localStorage.setItem(`daily-triggers-dismissed-${today}`, JSON.stringify(newDismissed));
    
    if (type === 'mirror') {
      setShowMirrorPrompt(false);
    } else {
      setShowShadowPrompt(false);
    }
  };

  const handleAction = (action: 'mirror' | 'shadow') => {
    if (onTriggerAction) {
      onTriggerAction(action);
    } else {
      navigate('/gamification');
    }
    dismissPrompt(action);
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-40 pointer-events-none">
      <AnimatePresence>
        {/* Evening Accountability Mirror Prompt */}
        {showMirrorPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="pointer-events-auto mb-3"
          >
            <Card className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/30 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <Eye className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-blue-100">Evening Reflection</h3>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Perfect Time
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-200/80">
                        How did your day go? Take a moment to reflect in your Accountability Mirror.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      size="sm"
                      onClick={() => handleAction('mirror')}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Reflect
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissPrompt('mirror')}
                      className="text-blue-300 hover:text-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Morning Shadow Self Challenge Prompt */}
        {showShadowPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
            className="pointer-events-auto"
          >
            <Card className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-500/30 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <Sword className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-purple-100">Shadow Challenge</h3>
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          New Day
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-200/80">
                        Ready to duel your shadow self? Set today's challenge and prove your worth!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      size="sm"
                      onClick={() => handleAction('shadow')}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      Challenge
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissPrompt('shadow')}
                      className="text-purple-300 hover:text-purple-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyTriggers;

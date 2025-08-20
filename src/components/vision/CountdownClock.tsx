import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, Calendar, AlertCircle } from 'lucide-react';

interface CountdownClockProps {
  targetDate: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  theme?: 'default' | 'vibrant' | 'minimal';
  showMilliseconds?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  isOverdue: boolean;
}

const CountdownClock: React.FC<CountdownClockProps> = ({
  targetDate,
  title,
  size = 'medium',
  theme = 'default',
  showMilliseconds = false
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    isOverdue: false
  });

  const calculateTimeLeft = () => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        milliseconds: Math.floor((difference % 1000) / 10), // Show as two digits
        isOverdue: false
      };
    } else {
      const overdue = Math.abs(difference);
      return {
        days: Math.floor(overdue / (1000 * 60 * 60 * 24)),
        hours: Math.floor((overdue / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((overdue / 1000 / 60) % 60),
        seconds: Math.floor((overdue / 1000) % 60),
        milliseconds: Math.floor((overdue % 1000) / 10),
        isOverdue: true
      };
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, showMilliseconds ? 10 : 1000);

    return () => clearInterval(timer);
  }, [targetDate, showMilliseconds]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, [targetDate]);

  const getThemeClasses = () => {
    const baseClasses = 'rounded-xl backdrop-blur-sm transition-all duration-300';
    
    switch (theme) {
      case 'vibrant':
        return `${baseClasses} ${timeLeft.isOverdue 
          ? 'bg-gradient-to-br from-red-500/90 to-pink-600/90 border border-red-300/50 shadow-red-500/20' 
          : 'bg-gradient-to-br from-purple-500/90 to-blue-600/90 border border-purple-300/50 shadow-purple-500/20'} shadow-lg`;
      case 'minimal':
        return `${baseClasses} ${timeLeft.isOverdue 
          ? 'bg-red-50/90 border border-red-200/50' 
          : 'bg-gray-50/90 border border-gray-200/50'}`;
      default:
        return `${baseClasses} ${timeLeft.isOverdue 
          ? 'bg-gradient-to-br from-orange-100/95 to-red-100/95 border border-orange-200/50 shadow-orange-500/10' 
          : 'bg-gradient-to-br from-blue-50/95 to-indigo-100/95 border border-blue-200/50 shadow-blue-500/10'} shadow-lg`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-2 text-xs';
      case 'large':
        return 'p-6 text-lg';
      default:
        return 'p-4 text-sm';
    }
  };

  const getTimeUnitClasses = () => {
    const baseClasses = 'font-mono font-bold tabular-nums';
    
    switch (theme) {
      case 'vibrant':
        return `${baseClasses} text-white`;
      case 'minimal':
        return `${baseClasses} ${timeLeft.isOverdue ? 'text-red-700' : 'text-gray-700'}`;
      default:
        return `${baseClasses} ${timeLeft.isOverdue ? 'text-orange-800' : 'text-blue-800'}`;
    }
  };

  const formatNumber = (num: number, pad: number = 2) => {
    return num.toString().padStart(pad, '0');
  };

  const TimeUnit = ({ value, label, animate = true }: { value: number; label: string; animate?: boolean }) => (
    <motion.div 
      className="text-center"
      animate={animate ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className={`${getTimeUnitClasses()} ${size === 'large' ? 'text-2xl' : size === 'small' ? 'text-lg' : 'text-xl'} leading-none`}
        key={value} // Key change triggers animation
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {formatNumber(value)}
      </motion.div>
      <div className={`text-xs ${theme === 'vibrant' ? 'text-white/80' : timeLeft.isOverdue ? 'text-red-600' : 'text-gray-600'} mt-1`}>
        {label}
      </div>
    </motion.div>
  );

  const Separator = () => (
    <div className={`${getTimeUnitClasses()} ${size === 'large' ? 'text-2xl' : 'text-xl'} animate-pulse`}>
      :
    </div>
  );

  return (
    <motion.div 
      className={`${getThemeClasses()} ${getSizeClasses()} relative overflow-hidden`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-2 right-2">
          {timeLeft.isOverdue ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <Target className="h-6 w-6" />
          )}
        </div>
      </div>

      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <Clock className={`h-4 w-4 ${theme === 'vibrant' ? 'text-white/80' : timeLeft.isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
          <span className={`font-semibold ${theme === 'vibrant' ? 'text-white' : timeLeft.isOverdue ? 'text-red-800' : 'text-blue-800'}`}>
            {title}
          </span>
        </div>
      )}

      {/* Status Indicator */}
      <div className="text-center mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${
          timeLeft.isOverdue 
            ? 'bg-red-500/20 text-red-700 border border-red-300/50' 
            : 'bg-green-500/20 text-green-700 border border-green-300/50'
        }`}>
          {timeLeft.isOverdue ? '⚠️ OVERDUE' : '🎯 TIME LEFT'}
        </span>
      </div>

      {/* Countdown Display */}
      <div className="flex items-center justify-center gap-3">
        {timeLeft.days > 0 && (
          <>
            <TimeUnit value={timeLeft.days} label="DAYS" />
            <Separator />
          </>
        )}
        
        <TimeUnit value={timeLeft.hours} label="HRS" />
        <Separator />
        <TimeUnit value={timeLeft.minutes} label="MIN" />
        <Separator />
        <TimeUnit value={timeLeft.seconds} label="SEC" animate />
        
        {showMilliseconds && (
          <>
            <Separator />
            <TimeUnit value={timeLeft.milliseconds} label="MS" animate />
          </>
        )}
      </div>

      {/* Progress Ring for Urgency */}
      {!timeLeft.isOverdue && timeLeft.days < 7 && (
        <div className="mt-3 flex justify-center">
          <div className="relative">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`${theme === 'vibrant' ? 'text-white/20' : 'text-gray-300'}`}
              />
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`${timeLeft.days < 2 ? 'text-red-500' : timeLeft.days < 4 ? 'text-yellow-500' : 'text-green-500'}`}
                strokeDasharray={`${Math.max(0, (7 - timeLeft.days) / 7 * 87.9)} 87.9`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CountdownClock;

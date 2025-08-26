import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, PartyPopper } from 'lucide-react';
import { Vision } from '@/contexts/VisionBoardContext';

interface VisionCelebrationProps {
  vision: Vision;
  isVisible: boolean;
  onComplete: () => void;
}

const VisionCelebration: React.FC<VisionCelebrationProps> = ({
  vision,
  isVisible,
  onComplete
}) => {
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowFireworks(true);
      // Auto-complete celebration after animation
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          {/* Fireworks Background */}
          {showFireworks && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                  initial={{
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{
                    x: window.innerWidth / 2 + (Math.cos((i * 30 * Math.PI) / 180) * 200),
                    y: window.innerHeight / 2 + (Math.sin((i * 30 * Math.PI) / 180) * 200),
                    scale: [0, 1.5, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Confetti */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className={`absolute w-1 h-3 ${
                    ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][i % 5]
                  }`}
                  initial={{
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
                    y: -50,
                    rotation: 0,
                    scale: 1
                  }}
                  animate={{
                    y: window.innerHeight + 50,
                    rotation: 360 * 3,
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 400
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}

          {/* Main Celebration Card */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.2 }}
            className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-sm max-w-md mx-4 text-center"
          >
            {/* Trophy Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.5 }}
              className="mb-6 flex justify-center"
            >
              <div className="relative">
                <Trophy className="h-16 w-16 text-yellow-300" />
                {/* Sparkles around trophy */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${20 + Math.sin((i * 45 * Math.PI) / 180) * 30}px`,
                      left: `${20 + Math.cos((i * 45 * Math.PI) / 180) * 30}px`
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.7 + i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    <Star className="h-3 w-3 text-yellow-200" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2">🎉 Vision Achieved!</h1>
              <h2 className="text-xl font-semibold text-blue-100 mb-4">{vision.title}</h2>
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <Sparkles className="h-5 w-5" />
                <span className="text-lg">Manifestation Complete</span>
                <PartyPopper className="h-5 w-5" />
              </div>
            </motion.div>

            {/* Pulsing Border Effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-white/40"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Click to Continue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <button
              onClick={onComplete}
              className="text-white/80 hover:text-white transition-colors text-sm px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
            >
              Tap to continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VisionCelebration;

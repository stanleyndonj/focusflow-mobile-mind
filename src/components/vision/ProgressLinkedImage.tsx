import React from 'react';
import { motion } from 'framer-motion';

interface ProgressLinkedImageProps {
  imageUrl: string;
  progress: number; // 0-100
  title?: string;
  className?: string;
  showOverlay?: boolean;
  overlayText?: string;
}

const ProgressLinkedImage: React.FC<ProgressLinkedImageProps> = ({
  imageUrl,
  progress,
  title,
  className = '',
  showOverlay = true,
  overlayText
}) => {
  // Calculate filter values based on progress
  const getFilterStyle = () => {
    const progressPercent = Math.max(0, Math.min(100, progress));
    
    if (progressPercent === 0) {
      // Completely grayscale with low brightness
      return {
        filter: 'grayscale(100%) brightness(0.6) contrast(0.8)',
        opacity: 0.7
      };
    } else if (progressPercent < 25) {
      // Mostly grayscale with slight color
      const grayscale = 100 - (progressPercent * 2); // 100 to 50
      const brightness = 0.6 + (progressPercent * 0.01); // 0.6 to 0.85
      return {
        filter: `grayscale(${grayscale}%) brightness(${brightness}) contrast(0.9)`,
        opacity: 0.7 + (progressPercent * 0.006) // 0.7 to 0.85
      };
    } else if (progressPercent < 50) {
      // Half grayscale, increasing color
      const grayscale = 50 - ((progressPercent - 25) * 2); // 50 to 0
      const brightness = 0.85 + ((progressPercent - 25) * 0.004); // 0.85 to 0.95
      return {
        filter: `grayscale(${grayscale}%) brightness(${brightness}) contrast(1)`,
        opacity: 0.85 + ((progressPercent - 25) * 0.004) // 0.85 to 0.95
      };
    } else if (progressPercent < 75) {
      // Full color, increasing brightness and saturation
      const brightness = 0.95 + ((progressPercent - 50) * 0.002); // 0.95 to 1.0
      const saturate = 100 + ((progressPercent - 50) * 1.2); // 100 to 130
      return {
        filter: `grayscale(0%) brightness(${brightness}) saturate(${saturate}%) contrast(1.1)`,
        opacity: 0.95 + ((progressPercent - 50) * 0.002) // 0.95 to 1.0
      };
    } else {
      // Enhanced colors with glow effect
      const brightness = 1.0 + ((progressPercent - 75) * 0.004); // 1.0 to 1.1
      const saturate = 130 + ((progressPercent - 75) * 0.8); // 130 to 150
      const contrast = 1.1 + ((progressPercent - 75) * 0.004); // 1.1 to 1.2
      return {
        filter: `grayscale(0%) brightness(${brightness}) saturate(${saturate}%) contrast(${contrast})`,
        opacity: 1.0
      };
    }
  };

  const getProgressColor = () => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-yellow-500';
    if (progress < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getProgressText = () => {
    if (progress < 25) return 'Just Started';
    if (progress < 50) return 'Making Progress';
    if (progress < 75) return 'Almost There!';
    return 'Achievement Unlocked!';
  };

  return (
    <motion.div 
      className={`relative overflow-hidden rounded-lg ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Main Image */}
      <motion.img
        src={imageUrl}
        alt={title || 'Vision Board Image'}
        className="w-full h-full object-cover transition-all duration-700 ease-in-out"
        style={getFilterStyle()}
        animate={{
          ...getFilterStyle(),
        }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />
      
      {/* Progress Glow Effect for High Progress */}
      {progress > 75 && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear'
          }}
        />
      )}

      {/* Progress Overlay */}
      {showOverlay && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <motion.div
                  className={`h-full ${getProgressColor()} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
              <motion.span
                className="text-white font-bold text-xs bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                {Math.round(progress)}%
              </motion.span>
            </div>

            {/* Progress Text */}
            <motion.div
              className="text-white text-xs font-semibold"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {overlayText || getProgressText()}
            </motion.div>

            {/* Title */}
            {title && (
              <motion.div
                className="text-white text-sm font-bold mt-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {title}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Achievement Badge for 100% */}
      {progress >= 100 && (
        <motion.div
          className="absolute top-2 right-2 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-full p-2 shadow-lg"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 1,
            type: "spring", 
            stiffness: 500, 
            damping: 15 
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ 
              duration: 0.5, 
              repeat: 3, 
              delay: 1.5 
            }}
          >
            ⭐
          </motion.div>
        </motion.div>
      )}

      {/* Milestone Sparkles for High Progress */}
      {progress > 50 && progress < 100 && (
        <motion.div className="absolute top-2 left-2">
          {[...Array(Math.floor(progress / 25))].map((_, i) => (
            <motion.div
              key={i}
              className="inline-block text-yellow-400 text-xs"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            >
              ✨
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProgressLinkedImage;

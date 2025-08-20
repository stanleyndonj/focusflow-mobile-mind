import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles, Minimize2, Heart, Star, Sun, Moon, Zap } from 'lucide-react';

export interface VisionBoardTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  gradients: {
    card: string;
    overlay: string;
    button: string;
  };
  icon: React.ReactNode;
}

export const VISION_BOARD_THEMES: VisionBoardTheme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and focused',
    colors: {
      primary: '#374151',
      secondary: '#6B7280',
      accent: '#3B82F6',
      background: '#F9FAFB',
      text: '#111827',
      border: '#E5E7EB'
    },
    gradients: {
      card: 'bg-gradient-to-br from-white to-gray-50',
      overlay: 'bg-gradient-to-t from-black/20 to-transparent',
      button: 'bg-gradient-to-r from-gray-600 to-gray-700'
    },
    icon: <Minimize2 className="h-4 w-4" />
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Energetic and bold',
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      accent: '#06B6D4',
      background: '#F3E8FF',
      text: '#581C87',
      border: '#D8B4FE'
    },
    gradients: {
      card: 'bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100',
      overlay: 'bg-gradient-to-t from-purple-600/30 to-pink-400/10',
      button: 'bg-gradient-to-r from-pink-500 to-purple-600'
    },
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Earthy and calming',
    colors: {
      primary: '#059669',
      secondary: '#65A30D',
      accent: '#F59E0B',
      background: '#F0FDF4',
      text: '#064E3B',
      border: '#BBF7D0'
    },
    gradients: {
      card: 'bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50',
      overlay: 'bg-gradient-to-t from-green-600/30 to-transparent',
      button: 'bg-gradient-to-r from-green-500 to-emerald-600'
    },
    icon: <Heart className="h-4 w-4" />
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    description: 'Mystical and inspiring',
    colors: {
      primary: '#7C3AED',
      secondary: '#3B82F6',
      accent: '#F59E0B',
      background: '#1E1B4B',
      text: '#C7D2FE',
      border: '#4338CA'
    },
    gradients: {
      card: 'bg-gradient-to-br from-violet-900/50 via-blue-900/50 to-indigo-900/50',
      overlay: 'bg-gradient-to-t from-violet-900/50 to-transparent',
      button: 'bg-gradient-to-r from-violet-600 to-blue-600'
    },
    icon: <Star className="h-4 w-4" />
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm and motivating',
    colors: {
      primary: '#EA580C',
      secondary: '#DC2626',
      accent: '#F59E0B',
      background: '#FEF3C7',
      text: '#92400E',
      border: '#FED7AA'
    },
    gradients: {
      card: 'bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100',
      overlay: 'bg-gradient-to-t from-orange-600/30 to-yellow-400/10',
      button: 'bg-gradient-to-r from-orange-500 to-red-500'
    },
    icon: <Sun className="h-4 w-4" />
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Elegant and sophisticated',
    colors: {
      primary: '#1F2937',
      secondary: '#374151',
      accent: '#6366F1',
      background: '#111827',
      text: '#F3F4F6',
      border: '#374151'
    },
    gradients: {
      card: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
      overlay: 'bg-gradient-to-t from-black/60 to-transparent',
      button: 'bg-gradient-to-r from-gray-700 to-indigo-600'
    },
    icon: <Moon className="h-4 w-4" />
  },
  {
    id: 'electric',
    name: 'Electric',
    description: 'High-energy and modern',
    colors: {
      primary: '#06B6D4',
      secondary: '#0891B2',
      accent: '#10B981',
      background: '#CFFAFE',
      text: '#0E7490',
      border: '#67E8F9'
    },
    gradients: {
      card: 'bg-gradient-to-br from-cyan-100 via-teal-50 to-emerald-100',
      overlay: 'bg-gradient-to-t from-cyan-600/30 to-teal-400/10',
      button: 'bg-gradient-to-r from-cyan-500 to-teal-500'
    },
    icon: <Zap className="h-4 w-4" />
  }
];

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  compact?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme,
  onThemeChange,
  compact = false
}) => {
  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-5 w-5 text-gray-600" />
        <span className="font-semibold text-gray-800">Choose Your Style</span>
      </div>
      
      <div className={`grid ${compact ? 'grid-cols-4 gap-2' : 'grid-cols-3 sm:grid-cols-4 gap-3'}`}>
        {VISION_BOARD_THEMES.map((theme) => (
          <motion.button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-300
              ${selectedTheme === theme.id 
                ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: theme.colors.background
            }}
          >
            {/* Theme Preview */}
            <div className="space-y-2">
              {/* Color Palette */}
              <div className="flex gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
              
              {/* Theme Icon */}
              <div 
                className="flex justify-center"
                style={{ color: theme.colors.primary }}
              >
                {theme.icon}
              </div>
              
              {/* Theme Name */}
              <div className={`text-xs font-medium ${compact ? 'text-center' : ''}`}>
                <div style={{ color: theme.colors.text }}>
                  {theme.name}
                </div>
                {!compact && (
                  <div className="text-xs opacity-60 mt-1" style={{ color: theme.colors.secondary }}>
                    {theme.description}
                  </div>
                )}
              </div>
            </div>
            
            {/* Selection Indicator */}
            {selectedTheme === theme.id && (
              <motion.div
                className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;

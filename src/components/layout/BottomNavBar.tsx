
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListTodo, Clock, BarChart, Settings, Zap, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  
  // State for scroll tracking and visibility
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Primary navigation items (main 4 items)
  const primaryNavItems = [
    { path: '/tasks', Icon: ListTodo, label: 'Tasks' },
    { path: '/productivity', Icon: Zap, label: 'Productivity' },
    { path: '/timer', Icon: Clock, label: 'Timer' },
    { path: '/insights', Icon: BarChart, label: 'Insights' },
  ];

  // Secondary navigation items (in dropdown menu)
  const secondaryNavItems = [
    { path: '/vision-board', label: 'My Why' },
    { path: '/review', label: 'Review' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/settings', label: 'Settings' },
  ];

  // Scroll event listener for auto-hide functionality
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at the top of the page
      if (currentScrollY === 0) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 200) {
        // Scrolling down and past threshold - hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const isSecondaryActive = secondaryNavItems.some(item => item.path === location.pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.nav 
        className={`flex items-center justify-between bg-background/95 backdrop-blur-lg border-t border-border px-4 py-3 pointer-events-auto transition-transform duration-300 w-full ${
          isVisible ? 'translate-y-0' : 'translate-y-24'
        }`}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Primary Navigation Items */}
        {primaryNavItems.map(({ path, Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={path}
              className={`flex flex-col items-center justify-center p-4 min-h-[48px] rounded-xl transition-all duration-300 min-w-0 flex-1 ${
                isActive 
                  ? 'text-primary bg-primary/10 scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              onClick={() => navigate(path)}
              aria-label={label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon 
                size={20} 
                className={`transition-all duration-300 ${
                  isActive ? 'scale-110' : ''
                }`} 
              />
              <span className="text-xs mt-1 font-medium">
                {label}
              </span>
            </motion.button>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              className={`flex flex-col items-center justify-center p-4 min-h-[48px] rounded-xl transition-all duration-300 min-w-0 ${
                isSecondaryActive
                  ? 'text-primary bg-primary/10 scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreHorizontal size={20} />
              <span className="text-xs mt-1 font-medium">More</span>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="top" 
            align="end" 
            className="mb-2 bg-background/95 backdrop-blur-lg border border-border shadow-lg"
          >
            {secondaryNavItems.map(({ path, label }) => (
              <DropdownMenuItem
                key={path}
                onClick={() => navigate(path)}
                className={`cursor-pointer ${
                  location.pathname === path ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.nav>
    </div>
  );
};

export default BottomNavBar;

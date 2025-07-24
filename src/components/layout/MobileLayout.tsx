
import React, { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import BottomNavBar from './BottomNavBar';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 w-full h-full bg-background text-foreground" data-theme={theme} style={{ margin: 0, padding: 0, top: 0, left: 0 }}>
      {/* Main content with proper scrolling */}
      <main 
        className="h-full overflow-y-auto overflow-x-hidden" 
        style={{
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          height: '100vh',
          margin: 0,
          paddingTop: '16px'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="min-h-full w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </div>
  );
};

export default MobileLayout;

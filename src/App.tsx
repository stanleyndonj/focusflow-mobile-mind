
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import NotificationService from './services/NotificationService'; 
import { Capacitor } from '@capacitor/core';
import AppLoader from './components/ui/app-loader';
import PersistentNotificationBar from './components/notifications/PersistentNotificationBar';

import { TaskProvider } from "./contexts/TaskContext";
import { TimerProvider } from "./contexts/TimerContext";
import { ProcrastinationProvider } from "./contexts/ProcrastinationContext";
import { VisionBoardProvider } from "./contexts/VisionBoardContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from './contexts/ThemeContext';
import { GameProvider } from './contexts/GameContext';

import Index from "./pages/Index";
import TasksPage from "./pages/TasksPage";
import ProductivityPage from "./pages/ProductivityPage";
import TimerPage from "./pages/TimerPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import ReviewPage from "./pages/ReviewPage";
import CalendarPage from "./pages/CalendarPage";
import VisionBoardPage from "./pages/VisionBoardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Initialize notifications with better error handling
    const initializeNotifications = async () => {
      try {
        // Only initialize native notifications if on a supported platform
        if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')) {
          console.log('Initializing native notifications...');
          await NotificationService.initializeChannels();
          
          // Don't automatically request permissions on app start
          // Let the user trigger permission request when needed
          const currentStatus = await NotificationService.requestPermissions();
          console.log('Initial notification setup complete. Permission granted:', currentStatus);
        } else {
          console.log('Running on web platform - native notifications not available');
          // For web, we can still use browser notifications
          if ('Notification' in window) {
            console.log('Browser notifications available');
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Don't prevent app from loading if notifications fail
      }
    };

    initializeNotifications();

    // Watch for system theme changes if no preference is saved
    if (!('darkMode' in localStorage)) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Theme is now handled by ThemeProvider
      };

      darkModeMediaQuery.addEventListener('change', handleChange);
      return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TaskProvider>
          <GameProvider>
            <TimerProvider>
              <ProcrastinationProvider>
                <VisionBoardProvider>
                  <ThemeProvider>
                    <NotificationProvider>
                    <TooltipProvider>
                      <BrowserRouter>
                        <div className="fixed inset-0 w-full h-full overflow-hidden bg-background text-foreground">
                          {showLoader && <AppLoader onFinished={() => setShowLoader(false)} />}
                          <Toaster />
                          <Sonner />
                          
                          <Routes>
                            <Route path="/" element={
                              <ErrorBoundary>
                                <Index />
                              </ErrorBoundary>
                            } />
                            <Route path="/tasks" element={
                              <ErrorBoundary>
                                <TasksPage />
                              </ErrorBoundary>
                            } />
                            <Route path="/productivity" element={
                              <ErrorBoundary>
                                <ProductivityPage />
                              </ErrorBoundary>
                            } />
                            <Route path="/timer" element={
                              <ErrorBoundary>
                                <TimerPage />
                              </ErrorBoundary>
                            } />
                            <Route path="/insights" element={
                              <ErrorBoundary>
                                <InsightsPage />
                              </ErrorBoundary>
                            } />
                            <Route path="/settings" element={
                              <ErrorBoundary>
                                <SettingsPage />
                              </ErrorBoundary>
                            } />
                            <Route path="/review" element={
                              <ErrorBoundary>
                                <ReviewPage />
                              </ErrorBoundary>
                            } />
                            <Route path="/calendar" element={
                              <ErrorBoundary>
                                <CalendarPage />
                              </ErrorBoundary>
                            } />
                            <Route path="/vision-board" element={
                              <ErrorBoundary>
                                <VisionBoardPage />
                              </ErrorBoundary>
                            } />
                            <Route path="*" element={
                              <ErrorBoundary>
                                <NotFound />
                              </ErrorBoundary>
                            } />
                          </Routes>
                        </div>
                      </BrowserRouter>
                    </TooltipProvider>
                      </NotificationProvider>
                    </ThemeProvider>
                  </VisionBoardProvider>
                </ProcrastinationProvider>
              </TimerProvider>
            </GameProvider>
          </TaskProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

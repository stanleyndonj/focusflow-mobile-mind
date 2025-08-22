import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Download, Share2, Moon, Sun, Target, Sparkles, Palette } from 'lucide-react';
import CustomSoundSelector from '@/components/settings/CustomSoundSelector';
import callStyleNotificationService from '@/services/CallStyleNotificationService';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { toast } from '@/components/ui/use-toast';
import NotificationService from '@/services/NotificationService';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  // Would integrate with device notification system in a real mobile app
  const [allowNotifications, setAllowNotifications] = React.useState(true);
  
  // Vision Board settings
  const [showMotivationalReminders, setShowMotivationalReminders] = React.useState(() => {
    return localStorage.getItem('showMotivationalReminders') !== 'false'; // Default to true
  });
  const [showMotivationOnStartup, setShowMotivationOnStartup] = React.useState(() => {
    return localStorage.getItem('showMotivationOnStartup') !== 'false'; // Default to true
  });
  
  const [urgentNotifications, setUrgentNotifications] = React.useState(() => {
    return localStorage.getItem('urgentNotifications') === 'true'; // Default to false
  });

  // Call-style notifications state
  const [callStyleNotifications, setCallStyleNotifications] = React.useState(() => {
    const settings = callStyleNotificationService.getSettings();
    return settings.enabled;
  });
  
  const { resetTimer } = useTimer();
  const { state: taskState } = useTasks();
  const { state: procrastinationState } = useProcrastination();
  const { requestPermissions } = useNotification();
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    // Request notification permissions on page load
    const handleRequestPermissions = async () => {
      try {
        await requestPermissions();
        setAllowNotifications(true);
        toast({
          title: 'Permissions Requested',
          description: 'Notification permissions have been requested. Check your device settings if needed.',
        });
      } catch (error) {
        toast({
          title: 'Permission Error',
          description: 'Failed to request notification permissions.',
          variant: 'destructive',
        });
      }
    };
    
    handleRequestPermissions();
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    toast({
      title: newTheme === 'dark' ? "Dark mode enabled" : "Light mode enabled",
      description: "Your theme preference has been saved",
    });
  };
  
  const toggleMotivationalReminders = () => {
    const newValue = !showMotivationalReminders;
    setShowMotivationalReminders(newValue);
    localStorage.setItem('showMotivationalReminders', newValue.toString());
    
    toast({
      title: newValue ? "Motivational reminders enabled" : "Motivational reminders disabled",
      description: "Your preference has been saved",
    });
  };
  
  const toggleMotivationOnStartup = () => {
    const newValue = !showMotivationOnStartup;
    setShowMotivationOnStartup(newValue);
    localStorage.setItem('showMotivationOnStartup', newValue.toString());
    
    toast({
      title: newValue ? "Startup quotes enabled" : "Startup quotes disabled",
      description: "Your preference has been saved",
    });
  };
  
  const handleUrgentNotificationsChange = (checked: boolean) => {
    setUrgentNotifications(checked);
    localStorage.setItem('urgentNotifications', checked.toString());
    
    toast({
      title: checked ? "Urgent notifications enabled" : "Urgent notifications disabled",
      description: checked 
        ? "You'll receive persistent call-style notifications for urgent tasks" 
        : "Urgent notifications have been turned off",
    });
  };

  const testUrgentNotification = async () => {
    if (!urgentNotifications) {
      toast({
        title: "Urgent notifications disabled",
        description: "Please enable urgent notifications first to test them",
        variant: "destructive"
      });
      return;
    }

    try {
      await NotificationService.testUrgentNotification();
      toast({
        title: "Test notification scheduled",
        description: "You should receive an urgent notification in 2 seconds",
      });
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Could not schedule test notification. Check permissions.",
        variant: "destructive"
      });
    }
  };
  
  const handleClearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };
  
  const handleExportData = () => {
    const exportData = {
      tasks: taskState.tasks,
      procrastination: procrastinationState.entries,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `focusflow-export-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    
    toast({
      title: "Data exported successfully",
      description: "Your tasks and insights have been saved to a file",
    });
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <MobileLayout>
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-400 to-focus-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Customize your experience</p>
      </motion.div>
      
      <motion.div 
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl bg-white/70 dark:bg-card border border-gray-200 dark:border-transparent backdrop-blur-md shadow-md hover:shadow-lg transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</CardTitle>
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  )}
                </button>
              </div>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                Toggle between light and dark mode for your comfort
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl bg-white/70 dark:bg-card border border-gray-200 dark:border-transparent backdrop-blur-md shadow-md hover:shadow-lg transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="notifications" className="flex-1 cursor-pointer">
                    Allow notifications
                  </Label>
                  <Switch 
                    id="notifications" 
                    checked={allowNotifications} 
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        try {
                          await requestPermissions();
                          setAllowNotifications(true);
                          toast({
                            title: "Permissions Requested",
                            description: "Notification permissions have been requested. Check your device settings if needed.",
                          });
                        } catch (error) {
                          toast({
                            title: "Permission Error",
                            description: "Failed to request notification permissions.",
                            variant: "destructive"
                          });
                        }
                      } else {
                        setAllowNotifications(false);
                      }
                    }} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="endTimer" className="flex-1 cursor-pointer">
                    Timer completion notification
                  </Label>
                  <Switch 
                    id="endTimer" 
                    disabled={!allowNotifications} 
                    defaultChecked 
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="dailyReminder" className="flex-1 cursor-pointer">
                    Daily task reminder
                  </Label>
                  <Switch 
                    id="dailyReminder" 
                    disabled={!allowNotifications} 
                    defaultChecked 
                  />
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label htmlFor="urgentNotifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Use urgent call-style notifications
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Persistent notifications with continuous sound and vibration until dismissed
                      </p>
                    </div>
                    <Switch
                      id="urgentNotifications"
                      checked={urgentNotifications}
                      onCheckedChange={handleUrgentNotificationsChange}
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>
                  
                  {urgentNotifications && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testUrgentNotification}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        🚨 Test Urgent Notification
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                  <h3 className="text-sm font-medium mb-4">Notification Sounds</h3>
                  
                  <div className="space-y-5">
                    <CustomSoundSelector 
                      onSoundSelected={(soundPath) => {
                        console.log('Timer notification sound selected:', soundPath);
                        toast({
                          title: "Sound Updated",
                          description: "Timer notification sound has been updated."
                        });
                      }}
                      currentSound={callStyleNotificationService.getCurrentRingtone()}
                    />
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Select audio files from your device to personalize notifications
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl bg-white/70 dark:bg-card border border-gray-200 dark:border-transparent backdrop-blur-md shadow-md hover:shadow-lg transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                onClick={handleExportData}
              >
                <Download size={18} className="mr-2 text-focus-500" />
                Export Your Data
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-500 hover:text-red-600 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={18} className="mr-2" />
                    Clear All Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle>Clear all data?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete all your tasks, timer settings, and insights. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button variant="destructive" onClick={handleClearAllData}>
                      Yes, delete everything
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl bg-white/70 dark:bg-card border border-gray-200 dark:border-transparent backdrop-blur-md shadow-md hover:shadow-lg transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-medium">About</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-4">
              <div className="text-center py-4">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-focus-300 to-focus-500 bg-clip-text text-transparent">FocusFlow</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Version 1.0.0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 px-4">
                  A productivity app designed to help you overcome procrastination 
                  and stay focused on your important tasks.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl bg-white/70 dark:bg-card border border-gray-200 dark:border-transparent backdrop-blur-md shadow-md hover:shadow-lg transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Vision Board Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="motivationalReminders" className="cursor-pointer flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      Daily Motivational Reminders
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                      Show a daily quote from your vision board on the dashboard
                    </p>
                  </div>
                  <Switch 
                    id="motivationalReminders" 
                    checked={showMotivationalReminders} 
                    onCheckedChange={toggleMotivationalReminders}
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="motivationStartup" className="cursor-pointer flex items-center gap-2">
                      <Target size={16} className="text-focus-400" />
                      Startup Motivation
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                      Show a motivational quote when the app launches
                    </p>
                  </div>
                  <Switch 
                    id="motivationStartup" 
                    checked={showMotivationOnStartup} 
                    onCheckedChange={toggleMotivationOnStartup}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MobileLayout>
  );
};

export default SettingsPage;

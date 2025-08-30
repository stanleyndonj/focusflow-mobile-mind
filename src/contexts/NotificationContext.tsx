import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import NotificationService from '../services/NotificationService';

type Notification = {
  id: number;
  title: string;
  body: string;
  date: Date;
  isUrgent?: boolean;
  scheduleAt?: string;
};

type NotificationPermissionStatus = 'unknown' | 'granted' | 'denied' | 'prompt';

interface NotificationContextType {
  notifications: Notification[];
  urgentNotification: Notification | null;
  scheduleNotification: (notification: Omit<Notification, 'id'>) => Promise<number | null>;
  dismissUrgentNotification: () => void;
  cancelNotification: (id: number) => Promise<boolean>;
  requestPermissions: () => Promise<void>;
  hasPermission: boolean;
  permissionStatus: NotificationPermissionStatus;
  isNativePlatform: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper function to normalize permission status
const normalizePermissionStatus = (status: string): NotificationPermissionStatus => {
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'prompt':
    case 'prompt-with-rationale':
      return 'prompt';
    default:
      return 'unknown';
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [urgentNotification, setUrgentNotification] = useState<Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('unknown');
  const [isNativePlatform] = useState(Capacitor.isNativePlatform());
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing NotificationProvider...');
        
        // Initialize notification service
        await NotificationService.initializeChannels();
        
        // Check current permission status
        if (isNativePlatform && Capacitor.isPluginAvailable('LocalNotifications')) {
          try {
            const status = await LocalNotifications.checkPermissions();
            console.log('Initial permission check:', status);
            const normalizedStatus = normalizePermissionStatus(status.display);
            setPermissionStatus(normalizedStatus);
            setHasPermission(normalizedStatus === 'granted');
          } catch (error) {
            console.error('Error checking initial permissions:', error);
            setPermissionStatus('unknown');
          }
        } else {
          console.log('Not a native platform or LocalNotifications not available');
          // For web platform, check browser notification permission
          if ('Notification' in window) {
            const permission = Notification.permission;
            const normalizedStatus = normalizePermissionStatus(permission);
            setPermissionStatus(normalizedStatus);
            setHasPermission(normalizedStatus === 'granted');
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };
    
    initialize();
  }, [isNativePlatform, toast]);

  const requestPermissions = async () => {
    try {
      console.log('Requesting notification permissions...');
      
      if (isNativePlatform && Capacitor.isPluginAvailable('LocalNotifications')) {
        const result = await NotificationService.checkAndRequestPermission();
        setHasPermission(result);
        
        // Update permission status
        const status = await LocalNotifications.checkPermissions();
        const normalizedStatus = normalizePermissionStatus(status.display);
        setPermissionStatus(normalizedStatus);
        
        if (!result) {
          toast({
            title: 'Notifications Disabled',
            description: 'Please enable notifications in your device settings to receive task reminders.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive task reminders.',
          });
        }
      } else {
        // Handle web notifications
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          const normalizedStatus = normalizePermissionStatus(permission);
          setPermissionStatus(normalizedStatus);
          setHasPermission(normalizedStatus === 'granted');
          
          if (normalizedStatus === 'granted') {
            toast({
              title: 'Browser Notifications Enabled',
              description: 'You will receive notifications in your browser.',
            });
          } else {
            toast({
              title: 'Browser Notifications Disabled',
              description: 'Please enable notifications in your browser settings.',
              variant: 'destructive',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      toast({
        title: 'Permission Error',
        description: 'Failed to request notification permissions. Please try again.',
        variant: 'destructive',
      });
      setHasPermission(false);
      setPermissionStatus('denied');
    }
  };

  const scheduleNotification = async (notification: Omit<Notification, 'id'>) => {
    try {
      const useUrgentStyle = notification.isUrgent && localStorage.getItem('urgentNotifications') === 'true';
      const newNotification = { id: Date.now(), ...notification, isUrgent: useUrgentStyle ? true : notification.isUrgent };
      
      setNotifications((prev) => [...prev, newNotification]);
      
      if (useUrgentStyle) {
        setUrgentNotification(newNotification);
      }

      if (notification.scheduleAt) {
        if (isNativePlatform) {
          await NotificationService.scheduleTaskNotification(
            newNotification.id.toString(),
            newNotification.title,
            newNotification.body || 'Reminder',
            new Date(notification.scheduleAt),
            useUrgentStyle
          );
        } else {
          // For web, show immediate notification or schedule with setTimeout
          if (hasPermission && 'Notification' in window) {
            const scheduleTime = new Date(notification.scheduleAt).getTime();
            const delay = scheduleTime - Date.now();
            
            if (delay > 0) {
              setTimeout(() => {
                new Notification(newNotification.title, {
                  body: newNotification.body || 'Reminder',
                  icon: '/favicon.ico'
                });
              }, delay);
            }
          }
        }
      }
      
      return newNotification.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Notification Error",
        description: "Failed to schedule notification. Please check your notification settings.",
        variant: "destructive"
      });
      return null;
    }
  };

  const dismissUrgentNotification = () => {
    setUrgentNotification(null);
  };

  const cancelNotification = async (id: number) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (urgentNotification?.id === id) {
        setUrgentNotification(null);
      }
      
      if (isNativePlatform) {
        await NotificationService.cancelNotification(id.toString());
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        urgentNotification,
        scheduleNotification,
        dismissUrgentNotification,
        cancelNotification,
        requestPermissions,
        hasPermission,
        permissionStatus,
        isNativePlatform,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;

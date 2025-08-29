import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Trash2, Upload, TestTube, CheckCircle, XCircle } from 'lucide-react';
import CustomAudioPicker from './CustomAudioPicker';
import CustomAudioService from '@/services/CustomAudioService';
import NotificationService from '@/services/NotificationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

interface NotificationSoundSettingsProps {
  onClose?: () => void;
}

interface SoundInfo {
  name: string;
  originalName: string;
  size: number;
  createdAt: string;
  segment: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

const NotificationSoundSettings: React.FC<NotificationSoundSettingsProps> = ({ onClose }) => {
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [timerSoundInfo, setTimerSoundInfo] = useState<SoundInfo | null>(null);
  const [taskSoundInfo, setTaskSoundInfo] = useState<SoundInfo | null>(null);
  const [isTestingTimer, setIsTestingTimer] = useState(false);
  const [isTestingTask, setIsTestingTask] = useState(false);

  useEffect(() => {
    loadSoundInfo();
  }, []);

  const loadSoundInfo = () => {
    const timerInfo = CustomAudioService.getCustomAudioMetadata('timer');
    const taskInfo = CustomAudioService.getCustomAudioMetadata('task');
    
    setTimerSoundInfo(timerInfo);
    setTaskSoundInfo(taskInfo);
  };

  const handleTimerAudioSaved = (audioBlob: Blob, originalName: string, segment: any) => {
    NotificationService.updateCustomSound('timer', audioBlob, originalName, segment)
      .then(success => {
        if (success) {
          setShowTimerPicker(false);
          loadSoundInfo();
        }
      });
  };

  const handleTaskAudioSaved = (audioBlob: Blob, originalName: string, segment: any) => {
    NotificationService.updateCustomSound('task', audioBlob, originalName, segment)
      .then(success => {
        if (success) {
          setShowTaskPicker(false);
          loadSoundInfo();
        }
      });
  };

  const removeCustomSound = async (type: 'timer' | 'task') => {
    const success = await NotificationService.removeCustomSound(type);
    if (success) {
      loadSoundInfo();
    }
  };

  const testNotification = async (type: 'timer' | 'task') => {
    if (type === 'timer') {
      setIsTestingTimer(true);
    } else {
      setIsTestingTask(true);
    }

    try {
      await NotificationService.testCustomNotification(type);
      
      toast({
        title: 'Test Notification Sent',
        description: `Check your notifications in 2 seconds`,
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Could not send test notification',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        if (type === 'timer') {
          setIsTestingTimer(false);
        } else {
          setIsTestingTask(false);
        }
      }, 3000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  if (showTimerPicker) {
    return (
      <CustomAudioPicker
        type="timer"
        onAudioSaved={handleTimerAudioSaved}
        onCancel={() => setShowTimerPicker(false)}
      />
    );
  }

  if (showTaskPicker) {
    return (
      <CustomAudioPicker
        type="task"
        onAudioSaved={handleTaskAudioSaved}
        onCancel={() => setShowTaskPicker(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-purple-600" />
            Custom Notification Sounds
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your notification sounds with 10-second audio clips from your own files
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        )}
      </div>

      <Separator />

      {/* Timer Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            Timer Notifications
          </CardTitle>
          <CardDescription>
            Sound played when timers complete (Pomodoro, Focus sessions, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timerSoundInfo ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      {timerSoundInfo.originalName}
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <p>Duration: {formatDuration(timerSoundInfo.segment.duration)}</p>
                      <p>Segment: {formatDuration(timerSoundInfo.segment.startTime)} - {formatDuration(timerSoundInfo.segment.endTime)}</p>
                      <p>Size: {formatFileSize(timerSoundInfo.size)}</p>
                      <p>Added: {new Date(timerSoundInfo.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testNotification('timer')}
                    disabled={isTestingTimer}
                    className="flex items-center gap-1"
                  >
                    <TestTube className="h-4 w-4" />
                    {isTestingTimer ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeCustomSound('timer')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Using Default Sound
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Timer notifications will use the built-in timer sound
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowTimerPicker(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Add Custom Sound
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            Task Notifications
          </CardTitle>
          <CardDescription>
            Sound played for task reminders and habit notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {taskSoundInfo ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      {taskSoundInfo.originalName}
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <p>Duration: {formatDuration(taskSoundInfo.segment.duration)}</p>
                      <p>Segment: {formatDuration(taskSoundInfo.segment.startTime)} - {formatDuration(taskSoundInfo.segment.endTime)}</p>
                      <p>Size: {formatFileSize(taskSoundInfo.size)}</p>
                      <p>Added: {new Date(taskSoundInfo.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testNotification('task')}
                    disabled={isTestingTask}
                    className="flex items-center gap-1"
                  >
                    <TestTube className="h-4 w-4" />
                    {isTestingTask ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeCustomSound('task')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Using Default Sound
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Task notifications will use the built-in notification sound
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowTaskPicker(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Add Custom Sound
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Volume2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                About Custom Notification Sounds
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Upload audio files up to 50MB in size</li>
                <li>• Select a precise 10-second segment for notifications</li>
                <li>• All notifications include vibration on mobile devices</li>
                <li>• Audio files are processed and stored securely on your device</li>
                <li>• Custom sounds work offline and don't require internet</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSoundSettings;

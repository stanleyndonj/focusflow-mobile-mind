import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Upload, 
  Check,
  Music,
  Phone,
  Bell,
  Zap
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from '@/components/ui/use-toast';
import callStyleNotificationService from '@/services/CallStyleNotificationService';

interface CustomSoundSelectorProps {
  onSoundSelected?: (soundPath: string | null) => void;
  currentSound?: string | null;
}

interface SoundOption {
  id: string;
  name: string;
  path: string;
  type: 'default' | 'system' | 'custom';
  description?: string;
  category?: 'ringtone' | 'notification' | 'alarm';
}

const CustomSoundSelector: React.FC<CustomSoundSelectorProps> = ({
  onSoundSelected,
  currentSound
}) => {
  const [selectedSound, setSelectedSound] = useState<string | null>(currentSound || null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [customSounds, setCustomSounds] = useState<SoundOption[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default notification sounds
  const defaultSounds: SoundOption[] = [
    {
      id: 'default',
      name: 'Default Notification',
      path: '/assets/sounds/default-notification.mp3',
      type: 'default',
      description: 'Standard notification sound',
      category: 'notification'
    },
    {
      id: 'urgent-ringtone',
      name: 'Urgent Call',
      path: '/assets/sounds/urgent-ringtone.mp3',
      type: 'default',
      description: 'Call-style urgent notification',
      category: 'ringtone'
    },
    {
      id: 'gentle-chime',
      name: 'Gentle Chime',
      path: '/assets/sounds/gentle-chime.mp3',
      type: 'default',
      description: 'Soft, pleasant notification',
      category: 'notification'
    },
    {
      id: 'focus-bell',
      name: 'Focus Bell',
      path: '/assets/sounds/focus-bell.mp3',
      type: 'default',
      description: 'Meditation-style focus sound',
      category: 'notification'
    },
    {
      id: 'achievement-fanfare',
      name: 'Achievement Fanfare',
      path: '/assets/sounds/achievement-fanfare.mp3',
      type: 'default',
      description: 'Celebratory completion sound',
      category: 'notification'
    },
    {
      id: 'digital-beep',
      name: 'Digital Beep',
      path: '/assets/sounds/digital-beep.mp3',
      type: 'default',
      description: 'Modern digital notification',
      category: 'notification'
    }
  ];

  // System ringtones (Android/iOS specific)
  const systemSounds: SoundOption[] = [
    {
      id: 'system-ringtone-1',
      name: 'Phone Ringtone 1',
      path: 'content://settings/system/ringtone',
      type: 'system',
      description: 'Default phone ringtone',
      category: 'ringtone'
    },
    {
      id: 'system-notification-1',
      name: 'System Notification',
      path: 'content://settings/system/notification_sound',
      type: 'system',
      description: 'Default system notification',
      category: 'notification'
    },
    {
      id: 'system-alarm-1',
      name: 'System Alarm',
      path: 'content://settings/system/alarm_alert',
      type: 'system',
      description: 'Default system alarm',
      category: 'alarm'
    }
  ];

  // Load custom sounds from filesystem
  useEffect(() => {
    loadCustomSounds();
  }, []);

  const loadCustomSounds = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Check if custom sounds directory exists
      const customDir = 'custom-sounds';
      
      try {
        const files = await Filesystem.readdir({
          path: customDir,
          directory: Directory.Documents
        });

        const customSoundFiles: SoundOption[] = files.files.map((file, index) => ({
          id: `custom-${index}`,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          path: `file://${file.uri}`,
          type: 'custom',
          description: 'Custom uploaded sound',
          category: 'notification'
        }));

        setCustomSounds(customSoundFiles);
      } catch (error) {
        // Directory doesn't exist, create it
        await Filesystem.mkdir({
          path: customDir,
          directory: Directory.Documents,
          recursive: true
        });
      }
    } catch (error) {
      console.warn('Error loading custom sounds:', error);
    }
  };

  // Play sound preview
  const playSound = async (soundPath: string, soundId: string) => {
    try {
      // Stop current playing sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (playingSound === soundId) {
        setPlayingSound(null);
        return;
      }

      if (Capacitor.isNativePlatform() && soundPath.startsWith('content://')) {
        // Handle system sounds on native platforms
        toast({
          title: "Preview",
          description: "System sounds will use your device's default sound."
        });
        setPlayingSound(null);
        return;
      }

      // Create audio element for preview
      const audio = new Audio(soundPath);
      audioRef.current = audio;
      
      audio.onloadstart = () => setPlayingSound(soundId);
      audio.onended = () => setPlayingSound(null);
      audio.onerror = () => {
        setPlayingSound(null);
        toast({
          title: "Error",
          description: "Could not play this sound. It may not be supported.",
          variant: "destructive"
        });
      };

      await audio.play();
    } catch (error) {
      setPlayingSound(null);
      toast({
        title: "Error",
        description: "Could not play sound preview.",
        variant: "destructive"
      });
    }
  };

  // Upload custom sound
  const handleUploadSound = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File",
        description: "Please select a valid audio file (MP3, WAV, OGG, M4A).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio file must be smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      if (Capacitor.isNativePlatform()) {
        // Save to filesystem on native platforms
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          const base64 = base64Data.split(',')[1]; // Remove data:audio/... prefix

          try {
            const fileName = `custom-${Date.now()}-${file.name}`;
            const filePath = `custom-sounds/${fileName}`;

            await Filesystem.writeFile({
              path: filePath,
              data: base64,
              directory: Directory.Documents
            });

            // Add to custom sounds list
            const newSound: SoundOption = {
              id: `custom-${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ""),
              path: filePath,
              type: 'custom',
              description: 'Custom uploaded sound',
              category: 'notification'
            };

            setCustomSounds(prev => [...prev, newSound]);
            
            toast({
              title: "Sound Uploaded",
              description: `${file.name} has been added to your custom sounds.`
            });
          } catch (error) {
            console.error('Error saving custom sound:', error);
            toast({
              title: "Upload Error",
              description: "Failed to save the custom sound file.",
              variant: "destructive"
            });
          }
        };

        reader.readAsDataURL(file);
      } else {
        // Web platform - store in localStorage or IndexedDB
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) {
            const newSound: SoundOption = {
              id: `custom-web-${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ""),
              path: result as string,
              type: 'custom',
              description: 'Custom uploaded sound',
              category: 'notification'
            };

            // Store in localStorage
            const existingCustom = JSON.parse(localStorage.getItem('focusflow_custom_sounds') || '[]');
            const updatedCustom = [...existingCustom, newSound];
            localStorage.setItem('focusflow_custom_sounds', JSON.stringify(updatedCustom));

            setCustomSounds(prev => [...prev, newSound]);
            
            toast({
              title: "Sound Uploaded",
              description: `${file.name} has been added to your custom sounds.`
            });
          }
        };

        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error uploading sound:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload the sound file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Select sound
  const handleSoundSelect = (sound: SoundOption) => {
    setSelectedSound(sound.id);
    callStyleNotificationService.setCustomRingtone(sound.path);
    onSoundSelected?.(sound.path);
    
    toast({
      title: "Sound Selected",
      description: `"${sound.name}" is now your notification sound.`
    });
  };

  // Get sound icon based on category
  const getSoundIcon = (category: string | undefined) => {
    switch (category) {
      case 'ringtone': return <Phone className="h-4 w-4" />;
      case 'alarm': return <Bell className="h-4 w-4" />;
      default: return <Volume2 className="h-4 w-4" />;
    }
  };

  const allSounds = [...defaultSounds, ...(Capacitor.isNativePlatform() ? systemSounds : []), ...customSounds];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Custom Notification Sounds
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose or upload a custom sound for your task notifications
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Custom Sound */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-4 w-4" />
            <span className="font-medium">Upload Custom Sound</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleUploadSound}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Zap className="animate-spin h-4 w-4 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Audio File
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Supports MP3, WAV, OGG, M4A files up to 5MB
          </p>
        </div>

        <Separator />

        {/* Sound Options */}
        <div className="space-y-4">
          {/* Default Sounds */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Built-in Sounds
            </h4>
            <div className="grid gap-2">
              {defaultSounds.map((sound) => (
                <div
                  key={sound.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSound === sound.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleSoundSelect(sound)}
                >
                  <div className="flex-shrink-0">
                    {getSoundIcon(sound.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{sound.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {sound.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {sound.category}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound(sound.path, sound.id);
                      }}
                    >
                      {playingSound === sound.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>

                    {selectedSound === sound.id && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Sounds (Native only) */}
          {Capacitor.isNativePlatform() && systemSounds.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                System Sounds
              </h4>
              <div className="grid gap-2">
                {systemSounds.map((sound) => (
                  <div
                    key={sound.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSound === sound.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleSoundSelect(sound)}
                  >
                    <div className="flex-shrink-0">
                      {getSoundIcon(sound.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{sound.name}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {sound.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        system
                      </Badge>

                      {selectedSound === sound.id && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Sounds */}
          {customSounds.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Your Custom Sounds ({customSounds.length})
              </h4>
              <div className="grid gap-2">
                {customSounds.map((sound) => (
                  <div
                    key={sound.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSound === sound.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleSoundSelect(sound)}
                  >
                    <div className="flex-shrink-0">
                      <Music className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{sound.name}</div>
                      <div className="text-sm text-gray-500 truncate">
                        Custom sound
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        custom
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound(sound.path, sound.id);
                        }}
                      >
                        {playingSound === sound.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>

                      {selectedSound === sound.id && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomSoundSelector;

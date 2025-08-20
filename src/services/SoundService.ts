
import { Howl } from 'howler';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/components/ui/use-toast';
import NotificationService from './NotificationService';
import { Filesystem, Directory } from '@capacitor/filesystem';

class SoundService {
  private sounds: Record<string, Howl> = {};
  private customSounds: Record<string, Howl> = {};
  private customSoundNames: Record<string, string> = {};

  constructor() {
    this.sounds = {
      timerComplete: new Howl({
        src: ['/sounds/timer-complete.mp3'],
        volume: 0.7,
        preload: true
      }),
      timerTick: new Howl({
        src: ['/sounds/timer-tick.mp3'],
        volume: 0.3,
        preload: true
      }),
      taskNotification: new Howl({
        src: ['/sounds/timer-complete.mp3'], // Reuse the timer sound for task notification by default
        volume: 0.7,
        preload: true
      })
    };
    
    // Load custom sounds from localStorage if available
    this.loadCustomSounds();
  }

  private loadCustomSounds() {
    try {
      const customTimerSound = localStorage.getItem('customTimerSound');
      const customTaskSound = localStorage.getItem('customTaskSound');
      const customTimerSoundName = localStorage.getItem('customTimerSoundName');
      const customTaskSoundName = localStorage.getItem('customTaskSoundName');
      
      if (customTimerSound) {
        this.customSounds.timerComplete = new Howl({
          src: [customTimerSound],
          volume: 0.7,
          preload: true,
          format: ['mp3', 'wav', 'ogg'] // Support multiple formats
        });
        
        this.customSoundNames.timerComplete = customTimerSoundName || 'Custom Timer Sound';
        console.log('Loaded custom timer sound:', this.customSoundNames.timerComplete);
      }
      
      if (customTaskSound) {
        this.customSounds.taskNotification = new Howl({
          src: [customTaskSound],
          volume: 0.7,
          preload: true,
          format: ['mp3', 'wav', 'ogg'] // Support multiple formats
        });
        
        this.customSoundNames.taskNotification = customTaskSoundName || 'Custom Task Sound';
        console.log('Loaded custom task sound:', this.customSoundNames.taskNotification);
      }
    } catch (error) {
      console.error('Error loading custom sounds:', error);
    }
  }

  play(soundName: 'timerComplete' | 'timerTick' | 'taskNotification') {
    // Check for custom sound first
    if (this.customSounds[soundName]) {
      console.log(`Playing custom sound: ${this.customSoundNames[soundName]}`);
      this.customSounds[soundName].play();
      return true;
    }
    
    // Fall back to default sound
    const sound = this.sounds[soundName] || this.sounds.timerComplete;
    if (sound) {
      console.log(`Playing default sound: ${soundName}`);
      sound.play();
      return true;
    }
    
    return false;
  }

  stop(soundName: 'timerComplete' | 'timerTick' | 'taskNotification') {
    // Check for custom sound first
    if (this.customSounds[soundName]) {
      this.customSounds[soundName].stop();
      return;
    }
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.stop();
    }
  }
  
  getCustomSoundName(type: 'timer' | 'task'): string | null {
    const soundKey = type === 'timer' ? 'timerComplete' : 'taskNotification';
    return this.customSoundNames[soundKey] || null;
  }
  
  // Enhanced method to set custom sounds for both in-app and notifications
  async setCustomSound(type: 'timer' | 'task', fileUrl: string, fileName: string) {
    try {
      console.log(`Setting custom ${type} sound:`, fileName, fileUrl);
      
      // Force release any existing sound to prevent memory leaks
      const soundKey = type === 'timer' ? 'timerComplete' : 'taskNotification';
      if (this.customSounds[soundKey]) {
        this.customSounds[soundKey].unload();
      }
      
      // Create a Howl for in-app playback with more formats and error handling
      const newSound = new Howl({
        src: [fileUrl],
        volume: 0.7,
        preload: true,
        format: ['mp3', 'wav', 'ogg'], // Support multiple formats
        html5: true, // Use HTML5 Audio for better compatibility
        onloaderror: () => {
          console.error(`Failed to load ${type} sound:`, fileName);
          toast({
            title: "Error loading sound",
            description: "The audio file format is not supported",
            variant: "destructive"
          });
        }
      });
      
      // Set up a one-time load event handler
      return new Promise<boolean>((resolve) => {
        // Test play the sound to see if it works
        newSound.once('load', async () => {
          try {
            // Store the sound in localStorage
            localStorage.setItem(type === 'timer' ? 'customTimerSound' : 'customTaskSound', fileUrl);
            localStorage.setItem(type === 'timer' ? 'customTimerSoundName' : 'customTaskSoundName', fileName);
            
            // Update the sound in our service
            this.customSounds[soundKey] = newSound;
            this.customSoundNames[soundKey] = fileName;
            
            // For native notifications, prepare sound file for notifications
            if (Capacitor.isNativePlatform()) {
              const targetFileName = type === 'timer' ? 'custom-timer-sound.mp3' : 'custom-task-sound.mp3';
              await this.copyCustomSoundToNative(fileUrl, targetFileName);
              
              // Update notification channel
              await NotificationService.updateCustomSound(type, fileName);
            }
            
            // Play the sound once to let the user hear it
            newSound.play();
            
            console.log(`Successfully set custom ${type} sound:`, fileName);
            resolve(true);
          } catch (error) {
            console.error(`Error finalizing custom ${type} sound:`, error);
            resolve(false);
          }
        });
        
        // Handle load errors
        newSound.once('loaderror', () => {
          console.error(`Error loading ${type} sound:`, fileName);
          toast({
            title: "Error loading sound",
            description: "The selected file is not a valid audio file",
            variant: "destructive"
          });
          resolve(false);
        });
        
        // Set a timeout in case the sound never loads
        setTimeout(() => {
          if (!newSound.state()) {
            console.error(`Timeout loading ${type} sound:`, fileName);
            toast({
              title: "Error loading sound",
              description: "The audio file took too long to load",
              variant: "destructive"
            });
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('Error setting custom sound:', error);
      toast({
        title: "Error setting custom sound",
        description: "Failed to set custom sound. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }
  
  // Helper method to copy custom sounds to native app storage for notifications
  private async copyCustomSoundToNative(fileUrl: string, targetFileName: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      return fileUrl; // Return original URL if not on native platform
    }
    
    try {
      // For blob URLs, we need to fetch and get the blob data
      let soundBlob: Blob;
      if (fileUrl.startsWith('blob:')) {
        const response = await fetch(fileUrl);
        soundBlob = await response.blob();
      } else {
        // For other URLs, just fetch them
        const response = await fetch(fileUrl);
        soundBlob = await response.blob();
      }
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            // The result will be a base64 string
            const base64Data = reader.result as string;
            const base64Sound = base64Data.split(',')[1]; // Remove the data URL prefix
            
            // Write to app directory
            await Filesystem.writeFile({
              path: targetFileName,
              data: base64Sound,
              directory: Directory.Data
            });
            
            console.log(`Custom sound saved as ${targetFileName}`);
            resolve(targetFileName);
          } catch (error) {
            console.error('Error saving sound file:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(soundBlob);
      });
    } catch (error) {
      console.error('Error processing sound file:', error);
      throw error;
    }
  }
  
  // Enhanced method to get file from device storage with better validation
  async getFileFromDevice(): Promise<{url: string, name: string, size: number, type: string} | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac'; // More specific audio formats
      input.multiple = false;
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an audio file smaller than 10MB",
            variant: "destructive"
          });
          resolve(null);
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('audio/')) {
          toast({
            title: "Invalid file type",
            description: "Please select a valid audio file",
            variant: "destructive"
          });
          resolve(null);
          return;
        }
        
        // Create URL and test if the audio can be loaded
        const url = URL.createObjectURL(file);
        
        // Test audio loading
        const testAudio = new Audio(url);
        testAudio.oncanplaythrough = () => {
          testAudio.remove();
          resolve({
            url,
            name: file.name,
            size: file.size,
            type: file.type
          });
        };
        
        testAudio.onerror = () => {
          URL.revokeObjectURL(url);
          testAudio.remove();
          toast({
            title: "Invalid audio file",
            description: "The selected file cannot be played as audio",
            variant: "destructive"
          });
          resolve(null);
        };
        
        // Set a timeout for loading test
        setTimeout(() => {
          if (testAudio.readyState < 4) { // Not loaded yet
            URL.revokeObjectURL(url);
            testAudio.remove();
            toast({
              title: "Audio loading timeout",
              description: "The audio file took too long to load",
              variant: "destructive"
            });
            resolve(null);
          }
        }, 5000);
        
        testAudio.load();
      };
      
      input.onerror = () => {
        toast({
          title: "File selection error",
          description: "There was an error selecting the file",
          variant: "destructive"
        });
        resolve(null);
      };
      
      input.click();
    });
  }
  
  // Method to clear custom sounds
  clearCustomSound(type: 'timer' | 'task') {
    const soundKey = type === 'timer' ? 'timerComplete' : 'taskNotification';
    
    // Remove from localStorage
    localStorage.removeItem(type === 'timer' ? 'customTimerSound' : 'customTaskSound');
    localStorage.removeItem(type === 'timer' ? 'customTimerSoundName' : 'customTaskSoundName');
    
    // Unload the sound
    if (this.customSounds[soundKey]) {
      this.customSounds[soundKey].unload();
      delete this.customSounds[soundKey];
    }
    
    // Clear the name
    delete this.customSoundNames[soundKey];
    
    // Update notification service (for native platforms)
    if (Capacitor.isNativePlatform()) {
      NotificationService.updateCustomSound(type, '');
    }
    
    toast({
      title: `Default ${type} sound restored`,
      description: `The ${type} sound has been reset to default`,
    });
    
    return true;
  }
}

export default new SoundService();

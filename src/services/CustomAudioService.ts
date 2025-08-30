/**
 * CustomAudioService - Handles custom audio file processing and storage
 * Supports large files with 10-second segment extraction
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface AudioSegment {
  startTime: number;
  endTime: number;
  duration: number;
}

interface CustomAudio {
  name: string;
  originalName: string;
  segment: AudioSegment;
  size: number;
  createdAt: string;
}

class CustomAudioService {
  private readonly AUDIO_DIR = 'custom_sounds';

  /**
   * Save processed audio segment to device storage
   */
  async saveCustomAudio(
    type: 'timer' | 'task',
    audioBlob: Blob,
    originalName: string,
    segment: AudioSegment
  ): Promise<boolean> {
    try {
      // Convert blob to base64
      const base64Data = await this.blobToBase64(audioBlob);
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = `${type}_custom_${timestamp}.wav`;
      const filePath = `${this.AUDIO_DIR}/${fileName}`;

      if (Capacitor.isNativePlatform()) {
        // Save to device storage for app use
        await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: Directory.Data
        });

        // For mobile notifications, we need to copy to the app's public assets
        // This requires writing to a location accessible by the notification system
        try {
          // Save to External Documents for notification system access
          await Filesystem.writeFile({
            path: `sounds/${fileName}`,
            data: base64Data,
            directory: Directory.Documents
          });
          console.log(`Custom audio saved for notifications: sounds/${fileName}`);
        } catch (error) {
          console.warn('Could not save to notification-accessible directory:', error);
          
          // Fallback: save to cache for app-level playback
          try {
            await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache
            });
            console.log(`Custom audio saved to cache: ${fileName}`);
          } catch (cacheError) {
            console.warn('Could not save to cache directory:', cacheError);
          }
        }
      } else {
        // For web, store in localStorage as base64
        localStorage.setItem(`customAudio_${type}`, base64Data);
        localStorage.setItem(`customAudio_${type}_name`, fileName);
      }

      // Save metadata
      const audioMetadata: CustomAudio = {
        name: fileName,
        originalName,
        segment,
        size: audioBlob.size,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(`customAudio_${type}_metadata`, JSON.stringify(audioMetadata));
      localStorage.setItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}Sound`, fileName);
      localStorage.setItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}SoundName`, originalName);
      
      // For notifications, store the filename for direct access
      localStorage.setItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}SoundFile`, fileName);

      console.log(`Custom ${type} audio saved: ${fileName}`);
      return true;
    } catch (error) {
      console.error(`Error saving custom ${type} audio:`, error);
      return false;
    }
  }

  /**
   * Get custom audio metadata
   */
  getCustomAudioMetadata(type: 'timer' | 'task'): CustomAudio | null {
    try {
      const metadata = localStorage.getItem(`customAudio_${type}_metadata`);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error(`Error getting ${type} audio metadata:`, error);
      return null;
    }
  }

  /**
   * Remove custom audio
   */
  async removeCustomAudio(type: 'timer' | 'task'): Promise<boolean> {
    try {
      const metadata = this.getCustomAudioMetadata(type);
      
      if (metadata && Capacitor.isNativePlatform()) {
        // Remove from device storage
        const filePath = `${this.AUDIO_DIR}/${metadata.name}`;
        try {
          await Filesystem.deleteFile({
            path: filePath,
            directory: Directory.Data
          });
        } catch (deleteError) {
          console.log('File may not exist:', deleteError);
        }
      }

      // Remove from localStorage
      localStorage.removeItem(`customAudio_${type}`);
      localStorage.removeItem(`customAudio_${type}_name`);
      localStorage.removeItem(`customAudio_${type}_metadata`);
      localStorage.removeItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}Sound`);
      localStorage.removeItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}SoundName`);

      console.log(`Custom ${type} audio removed`);
      return true;
    } catch (error) {
      console.error(`Error removing custom ${type} audio:`, error);
      return false;
    }
  }

  /**
   * Get audio URL for playback
   */
  async getAudioUrl(type: 'timer' | 'task'): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const metadata = this.getCustomAudioMetadata(type);
        if (!metadata) return null;

        const filePath = `${this.AUDIO_DIR}/${metadata.name}`;
        const fileUri = await Filesystem.getUri({
          directory: Directory.Data,
          path: filePath
        });
        // Convert native file URI to a WebView-accessible URL (required on Android)
        const webviewUrl = Capacitor.convertFileSrc(fileUri.uri);
        return webviewUrl;
      } else {
        // For web, get from localStorage
        const base64Data = localStorage.getItem(`customAudio_${type}`);
        if (!base64Data) return null;

        // Convert base64 to blob URL
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/wav' });
        
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error(`Error getting ${type} audio URL:`, error);
      return null;
    }
  }

  /**
   * Check if custom audio exists
   */
  hasCustomAudio(type: 'timer' | 'task'): boolean {
    return localStorage.getItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}Sound`) !== null;
  }

  /**
   * Get file size limit (50MB)
   */
  getMaxFileSize(): number {
    return 50 * 1024 * 1024; // 50MB
  }

  /**
   * Validate audio file
   */
  validateAudioFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('audio/')) {
      return { valid: false, error: 'Invalid file type. Please select an audio file.' };
    }

    // Check file size
    if (file.size > this.getMaxFileSize()) {
      return { valid: false, error: 'File too large. Maximum size is 50MB.' };
    }

    return { valid: true };
  }

  /**
   * Create audio context for processing
   */
  async createAudioContext(): Promise<AudioContext> {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Process audio segment with fade in/out
   */
  async processAudioSegment(
    audioBuffer: AudioBuffer,
    startTime: number,
    endTime: number
  ): Promise<AudioBuffer> {
    const audioContext = await this.createAudioContext();
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const segmentLength = endSample - startSample;

    // Create new buffer for the segment
    const segmentBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      sampleRate
    );

    // Apply fade in/out for smooth audio
    const fadeInSamples = Math.floor(0.1 * sampleRate); // 100ms fade in
    const fadeOutSamples = Math.floor(0.1 * sampleRate); // 100ms fade out

    // Copy and process audio data
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const segmentData = segmentBuffer.getChannelData(channel);
      
      for (let i = 0; i < segmentLength; i++) {
        let sample = sourceData[startSample + i];
        
        // Apply fade in
        if (i < fadeInSamples) {
          sample *= i / fadeInSamples;
        }
        
        // Apply fade out
        if (i >= segmentLength - fadeOutSamples) {
          const fadePosition = (segmentLength - i) / fadeOutSamples;
          sample *= fadePosition;
        }
        
        segmentData[i] = sample;
      }
    }

    return segmentBuffer;
  }

  /**
   * Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:audio/wav;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Initialize audio directory
   */
  async initializeAudioDirectory(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.mkdir({
          path: this.AUDIO_DIR,
          directory: Directory.Data,
          recursive: true
        });
      } catch (error) {
        // Directory might already exist
        console.log('Audio directory already exists or created');
      }
    }
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<{ totalSize: number; files: CustomAudio[] }> {
    const files: CustomAudio[] = [];
    let totalSize = 0;

    // Check timer audio
    const timerMetadata = this.getCustomAudioMetadata('timer');
    if (timerMetadata) {
      files.push(timerMetadata);
      totalSize += timerMetadata.size;
    }

    // Check task audio
    const taskMetadata = this.getCustomAudioMetadata('task');
    if (taskMetadata) {
      files.push(taskMetadata);
      totalSize += taskMetadata.size;
    }

    return { totalSize, files };
  }
}

export default new CustomAudioService();

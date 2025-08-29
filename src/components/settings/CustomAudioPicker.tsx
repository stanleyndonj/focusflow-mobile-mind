/**
 * CustomAudioPicker Component
 * Advanced audio file picker with segment selection for custom notification tones
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Volume2, Scissors, Save, X, FileAudio, Clock, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AudioSegment {
  startTime: number;
  endTime: number;
  duration: number;
}

interface CustomAudioPickerProps {
  type: 'timer' | 'task';
  currentSound?: string;
  onAudioSaved: (audioBlob: Blob, originalName: string, segment: AudioSegment) => void;
  onCancel: () => void;
}

const CustomAudioPicker: React.FC<CustomAudioPickerProps> = ({
  type,
  currentSound,
  onAudioSaved,
  onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Segment selection state
  const [segment, setSegment] = useState<AudioSegment>({
    startTime: 0,
    endTime: 10,
    duration: 10
  });
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an audio file (MP3, WAV, M4A, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (allowing up to 50MB for large audio files)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an audio file smaller than 50MB',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setSelectedFile(file);

    try {
      // Create URL for the audio file
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      // Wait for audio metadata to load
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        const audioDuration = audio.duration;
        setDuration(audioDuration);
        
        // Set initial segment (first 10 seconds or full duration if shorter)
        const segmentEnd = Math.min(10, audioDuration);
        setSegment({
          startTime: 0,
          endTime: segmentEnd,
          duration: segmentEnd
        });
        
        setIsLoading(false);
        
        toast({
          title: 'Audio Loaded',
          description: `Duration: ${formatTime(audioDuration)}. Select your 10-second segment.`
        });
      });

      audio.addEventListener('error', () => {
        setIsLoading(false);
        toast({
          title: 'Error Loading Audio',
          description: 'Could not load the selected audio file. Please try a different file.',
          variant: 'destructive'
        });
      });

    } catch (error) {
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to process the audio file',
        variant: 'destructive'
      });
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Start playing from segment start time
      audioRef.current.currentTime = segment.startTime;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const previewSegment = () => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    audio.currentTime = segment.startTime;
    audio.play();
    setIsPlaying(true);
    
    // Stop at segment end time
    const checkTime = () => {
      if (audio.currentTime >= segment.endTime) {
        audio.pause();
        setIsPlaying(false);
        return;
      }
      if (isPlaying) {
        requestAnimationFrame(checkTime);
      }
    };
    requestAnimationFrame(checkTime);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const current = audioRef.current.currentTime;
    setCurrentTime(current);
    
    // Stop playback when reaching end of segment
    if (current >= segment.endTime) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.currentTime = segment.startTime;
    }
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const clickTime = percentage * duration;

    // Update segment based on which handle is closer
    const distanceToStart = Math.abs(clickTime - segment.startTime);
    const distanceToEnd = Math.abs(clickTime - segment.endTime);

    if (distanceToStart < distanceToEnd) {
      // Update start time
      const newStart = Math.max(0, Math.min(clickTime, segment.endTime - 1));
      setSegment(prev => ({
        ...prev,
        startTime: newStart,
        duration: prev.endTime - newStart
      }));
    } else {
      // Update end time
      const newEnd = Math.min(duration, Math.max(clickTime, segment.startTime + 1));
      // Ensure maximum 10 seconds
      const maxEnd = Math.min(newEnd, segment.startTime + 10);
      setSegment(prev => ({
        ...prev,
        endTime: maxEnd,
        duration: maxEnd - prev.startTime
      }));
    }
  };

  const handleMouseDown = (handle: 'start' | 'end') => (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDragging(handle);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const moveX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const newTime = percentage * duration;

    if (isDragging === 'start') {
      const newStart = Math.max(0, Math.min(newTime, segment.endTime - 1));
      setSegment(prev => ({
        ...prev,
        startTime: newStart,
        duration: prev.endTime - newStart
      }));
    } else if (isDragging === 'end') {
      const newEnd = Math.min(duration, Math.max(newTime, segment.startTime + 1));
      // Ensure maximum 10 seconds
      const maxEnd = Math.min(newEnd, segment.startTime + 10);
      setSegment(prev => ({
        ...prev,
        endTime: maxEnd,
        duration: maxEnd - prev.startTime
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const processAndSaveAudio = async () => {
    if (!selectedFile || !audioUrl) return;

    setIsProcessing(true);

    try {
      // Create audio context for processing
      const audioContext = new AudioContext();
      const audioBuffer = await fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data));

      // Calculate sample positions
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(segment.startTime * sampleRate);
      const endSample = Math.floor(segment.endTime * sampleRate);
      const segmentLength = endSample - startSample;

      // Create new buffer for the segment
      const segmentBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        segmentLength,
        sampleRate
      );

      // Copy audio data for the selected segment
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel);
        const segmentData = segmentBuffer.getChannelData(channel);
        
        for (let i = 0; i < segmentLength; i++) {
          segmentData[i] = sourceData[startSample + i];
        }
      }

      // Convert to WAV blob
      const wavBlob = await audioBufferToWav(segmentBuffer);
      
      onAudioSaved(wavBlob, selectedFile.name, segment);

      toast({
        title: 'Audio Saved',
        description: `10-second segment saved for ${type} notifications`
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process the audio segment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <FileAudio className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Custom {type === 'timer' ? 'Timer' : 'Task'} Sound
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select an audio file and choose a 10-second segment
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          {!selectedFile && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choose Audio File
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports MP3, WAV, M4A and other audio formats up to 50MB
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading audio...</span>
            </div>
          )}

          {/* Audio Player and Timeline */}
          {selectedFile && audioUrl && !isLoading && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {formatTime(duration)}
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Segment Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Select 10-Second Segment
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    <span className="text-blue-600 dark:text-blue-400">
                      ({formatTime(segment.duration)})
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div
                  ref={timelineRef}
                  className="relative h-16 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer select-none"
                  onClick={handleTimelineClick}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Waveform placeholder */}
                  <div className="absolute inset-2 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded opacity-50" />
                  
                  {/* Current playback position */}
                  {duration > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  )}

                  {/* Selected segment overlay */}
                  {duration > 0 && (
                    <div
                      className="absolute top-2 bottom-2 bg-blue-500/30 border border-blue-500 rounded z-10"
                      style={{
                        left: `${(segment.startTime / duration) * 100}%`,
                        width: `${((segment.endTime - segment.startTime) / duration) * 100}%`
                      }}
                    />
                  )}

                  {/* Start handle */}
                  {duration > 0 && (
                    <div
                      className="absolute top-1 bottom-1 w-2 bg-blue-600 rounded cursor-ew-resize z-30 hover:bg-blue-700"
                      style={{ left: `calc(${(segment.startTime / duration) * 100}% - 4px)` }}
                      onMouseDown={handleMouseDown('start')}
                    />
                  )}

                  {/* End handle */}
                  {duration > 0 && (
                    <div
                      className="absolute top-1 bottom-1 w-2 bg-blue-600 rounded cursor-ew-resize z-30 hover:bg-blue-700"
                      style={{ left: `calc(${(segment.endTime / duration) * 100}% - 4px)` }}
                      onMouseDown={handleMouseDown('end')}
                    />
                  )}
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-3 py-4">
                <button
                  onClick={togglePlayback}
                  className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                  disabled={!selectedFile}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={previewSegment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  disabled={!selectedFile}
                >
                  <Volume2 className="h-4 w-4" />
                  Preview Segment
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={processAndSaveAudio}
                  disabled={isProcessing || segment.duration > 10}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Custom Sound
                    </>
                  )}
                </button>
                <button
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Segment length warning */}
              {segment.duration > 10 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ Segment is longer than 10 seconds. Please adjust the selection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Hidden elements */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          {/* File input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

        </div>
      </div>
    </div>
  );
};

// Helper function to convert AudioBuffer to WAV blob
async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2; // 16-bit
  const byteRate = sampleRate * numberOfChannels * bytesPerSample;
  const blockAlign = numberOfChannels * bytesPerSample;
  const dataSize = length * numberOfChannels * bytesPerSample;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert audio data to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default CustomAudioPicker;

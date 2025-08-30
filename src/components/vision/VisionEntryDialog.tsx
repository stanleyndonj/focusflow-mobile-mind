import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useVisionBoard, VisionBoardEntry, Milestone, JournalEntry } from '@/contexts/VisionBoardContext';
import type { MediaItem } from '@/contexts/VisionBoardContext';
import { useTasks } from '@/contexts/TaskContext';
import { 
  Image, Upload, X, Calendar as CalendarIcon, CalendarPlus, BookOpen, 
  Target, Link2, Flag, Plus, Mic, Video, Camera, Play, Pause, 
  Trash, ChevronRight, Clock, FileText, CheckCircle2, Circle, ListTodo 
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Utility function to get MIME type from data URL
const getMimeTypeFromDataUrl = (dataUrl: string): string => {
  const matches = dataUrl.match(/^data:([^;]+);/);
  return matches ? matches[1] : 'application/octet-stream';
};

interface VisionEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry: VisionBoardEntry | null;
}

interface MilestoneFormProps {
  milestone: Partial<Milestone>;
  onSave: (milestone: Partial<Milestone>) => void;
  onCancel: () => void;
}

interface JournalEntryFormProps {
  journalEntry: Partial<JournalEntry>;
  onSave: (entry: Partial<JournalEntry>) => void;
  onCancel: () => void;
}

// Update the MediaItem interface in contexts/VisionBoardContext.tsx if needed
interface MediaItemProps {
  item: MediaItem & { mimeType?: string }; // Add mimeType to support stored MIME type
  onDelete: (id: string) => void;
}

interface TaskItemProps {
  taskId: string;
  onUnlink: (id: string) => void;
}

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Milestone Form Component
const MilestoneForm: React.FC<MilestoneFormProps> = ({ milestone, onSave, onCancel }) => {
  const [title, setTitle] = useState(milestone.title || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    milestone.dueDate ? new Date(milestone.dueDate) : undefined
  );
  const [notes, setNotes] = useState(milestone.notes || '');
  
  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for this milestone",
        variant: "destructive"
      });
      return;
    }
    
    if (!dueDate) {
      toast({
        title: "Date required",
        description: "Please select a target date for this milestone",
        variant: "destructive"
      });
      return;
    }
    
    onSave({
      title: title.trim(),
      dueDate: dueDate.toISOString(),
      notes: notes.trim() || undefined,
      completed: milestone.completed || false,
      completedAt: milestone.completedAt,
    });
  };
  
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="milestoneTitle">Milestone Title</Label>
        <Input 
          id="milestoneTitle" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Complete MVP"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Target Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="milestoneNotes">Notes (Optional)</Label>
        <Textarea
          id="milestoneNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details about this milestone"
          className="min-h-[80px]"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Milestone</Button>
      </div>
    </div>
  );
};

// Journal Entry Form Component
const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ journalEntry, onSave, onCancel }) => {
  const [content, setContent] = useState(journalEntry.content || '');
  const [prompt, setPrompt] = useState(journalEntry.prompt || 'free');
  
  const prompts = {
    free: '',
    importance: 'Why is this goal important to me?',
    success: 'What does success look like for this goal?',
    challenges: 'What challenges might I face and how will I overcome them?',
    motivation: 'What will keep me motivated when things get difficult?',
    steps: 'What are the key steps I need to take to achieve this?'
  };
  
  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write some content for your journal entry",
        variant: "destructive"
      });
      return;
    }
    
    onSave({
      content: content.trim(),
      prompt: prompt === 'free' ? undefined : prompts[prompt as keyof typeof prompts],
    });
  };
  
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label>Reflection Prompt</Label>
        <RadioGroup value={prompt} onValueChange={setPrompt} className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="free" id="free" />
            <Label htmlFor="free" className="cursor-pointer">Free writing</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="importance" id="importance" />
            <Label htmlFor="importance" className="cursor-pointer">Why is this important?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="success" id="success" />
            <Label htmlFor="success" className="cursor-pointer">What does success look like?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="challenges" id="challenges" />
            <Label htmlFor="challenges" className="cursor-pointer">Challenges and solutions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="motivation" id="motivation" />
            <Label htmlFor="motivation" className="cursor-pointer">What will keep me motivated?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="steps" id="steps" />
            <Label htmlFor="steps" className="cursor-pointer">Key steps to achievement</Label>
          </div>
        </RadioGroup>
      </div>
      
      {prompt !== 'free' && (
        <div className="bg-muted p-3 rounded-md italic text-sm text-muted-foreground">
          {prompts[prompt as keyof typeof prompts]}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="journalContent">Your Reflection</Label>
        <Textarea
          id="journalContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={prompt === 'free' ? "Write your thoughts here..." : "Reflect on the prompt above..."}
          className="min-h-[150px]"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Entry</Button>
      </div>
    </div>
  );
};

// Media Item Component
const MediaItem: React.FC<MediaItemProps> = ({ item, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Helper function to check if a URL is a base64 data URL
  const isDataUrl = (url: string) => url.startsWith('data:');
  
  // Extract MIME type from data URL if possible
  const getMimeTypeFromDataUrl = (dataUrl: string): string | null => {
    if (!isDataUrl(dataUrl)) return null;
    
    try {
      // Format: data:[<mediatype>][;base64],<data>
      const mimeMatch = dataUrl.match(/^data:([^;,]+)/i);
      return mimeMatch ? mimeMatch[1] : null;
    } catch (e) {
      console.error('Error extracting MIME type from data URL:', e);
      return null;
    }
  };
  
  // Determine the correct MIME type to use
  const getMimeType = (): string => {
    // Use the stored MIME type if available
    if (item.mimeType) return item.mimeType;
    
    // Try to extract from data URL
    const extractedType = getMimeTypeFromDataUrl(item.path);
    if (extractedType) return extractedType;
    
    // Fall back to default types based on media type
    if (item.type === 'audio') return 'audio/webm;codecs=opus';
    if (item.type === 'video') return 'video/webm';
    return 'application/octet-stream'; // Generic fallback
  };
  
  // Initialize audio only after user interaction to prevent AudioContext errors
  const handlePlayPause = () => {
    if (item.type === 'audio') {
      // Handle audio playback
      if (!audioElement) {
        console.log('Creating new audio element with URL:', item.url.substring(0, 50) + '...');
        
        // Create audio element
        const audio = new Audio();
        
        // Add error handler before setting source
        audio.onerror = (e) => {
          console.error('Audio error:', e);
          toast({
            title: "Playback error",
            description: "Could not play this audio format. The recording may be corrupted.",
            variant: "destructive"
          });
          setIsPlaying(false);
        };
        
        audio.oncanplay = () => {
          console.log('Audio can play now');
          audio.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.error("Error playing audio:", err);
              toast({
                title: "Playback error",
                description: "Could not play the audio file. User interaction may be required.",
                variant: "destructive"
              });
              setIsPlaying(false);
            });
        };
        
        audio.addEventListener('ended', () => setIsPlaying(false));
        setAudioElement(audio);
        audioRef.current = audio;
        
        // Set source after attaching event handlers
        audio.src = item.url;
        audio.load(); // Important: explicitly load the audio
      } else {
        // Toggle existing audio
        if (isPlaying) {
          audioElement.pause();
          setIsPlaying(false);
        } else {
          audioElement.currentTime = 0; // Reset to beginning for better experience
          audioElement.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.error("Error playing audio:", err);
              toast({
                title: "Playback error",
                description: "Could not play the audio file.",
                variant: "destructive"
              });
            });
        }
      }
    } else if (item.type === 'video' && videoRef.current) {
      // Handle video playback
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error("Error playing video:", err);
            toast({
              title: "Playback error",
              description: "Could not play the video file.",
              variant: "destructive"
            });
          });
      }
    }
  };
  
  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);
  
  return (
    <div className="relative rounded-md overflow-hidden border border-border group">
      {item.type === 'image' && (
        <div className="aspect-square w-full">
          <img 
            src={item.path} 
            alt="Vision board media" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {item.type === 'video' && (
        <div className="aspect-video w-full relative">
          <video 
            ref={videoRef}
            src={item.path} 
            className="w-full h-full object-cover"
            controls={false}
            playsInline
            onClick={handlePlayPause}
            onError={(e) => {
              console.error('Video error:', e);
              toast({
                title: "Video error",
                description: "Could not load this video format.",
                variant: "destructive"
              });
            }}
          />
          <img src={item.path} alt="Vision media" className="w-full h-32 object-cover rounded" />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20" onClick={handlePlayPause}>
              <div className="rounded-full bg-background/80 p-2 cursor-pointer">
                <Play className="h-6 w-6 text-foreground" />
              </div>
            </div>
          )}
        </div>
      )}
      
      {item.type === 'audio' && (
        <div className="p-4 bg-muted flex items-center justify-between w-full">
          <audio ref={audioRef} src={item.path} className="hidden" />
          <div className="flex-1">
            <p className="text-sm font-medium">Voice Note</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}
      
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
        onClick={() => onDelete(item.id)}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Task Item Component
const TaskItem: React.FC<TaskItemProps> = ({ taskId, onUnlink }) => {
  const { state } = useTasks();
  const task = state.tasks.find(t => t.id === taskId);
  
  if (!task) return null;
  
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-background border border-border">
      <div className="flex items-center gap-2">
        {task.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={cn(
          "text-sm",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full"
        onClick={() => onUnlink(taskId)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Main VisionEntryDialog Component
const VisionEntryDialog: React.FC<VisionEntryDialogProps> = ({ isOpen, onClose, editEntry }) => {
  const { 
    addEntry, 
    updateEntry, 
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestoneCompletion,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addMediaItem,
    deleteMediaItem,
    linkTask,
    unlinkTask
  } = useVisionBoard();
  const { state: taskState } = useTasks();
  
  // Basic info state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('none');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [importance, setImportance] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Milestone state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  
  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  
  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<any>(null);
  
  // Task state
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  // Reset form function
  const resetForm = () => {
    // Reset basic info
    setTitle('');
    setDescription('');
    setCategory('none');
    setImageUrl(undefined);
    setImportance('');
    setSuccessCriteria('');
    setTargetDate(undefined);
    
    // Reset specialized data
    setMilestones([]);
    setJournalEntries([]);
    setMediaItems([]);
    setLinkedTaskIds([]);
    
    // Reset UI state
    setActiveTab('info');
    setShowMilestoneForm(false);
    setEditingMilestone(null);
    setShowJournalForm(false);
    setEditingJournal(null);
    setErrorMessage('');
    setSelectedTaskId('');
  };
  
  // Reset form when dialog opens/closes or edit entry changes
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      return;
    }
    
    // Only initialize once when dialog opens, not on subsequent editEntry changes
    if (!hasInitialized) {
      if (editEntry) {
        // Basic info
        setTitle(editEntry.title || '');
        setDescription(editEntry.description || '');
        setCategory(editEntry.category || 'none');
        setImageUrl(editEntry.imageUrl);
        setImportance(editEntry.importance || '');
        setSuccessCriteria(editEntry.successCriteria || '');
        setTargetDate(editEntry.targetDate ? new Date(editEntry.targetDate) : undefined);
        
        // Milestones
        setMilestones(editEntry.milestones || []);
        
        // Journal entries
        setJournalEntries(editEntry.journalEntries || []);
        
        // Media items
        setMediaItems(editEntry.mediaItems || []);
        
        // Linked tasks
        setLinkedTaskIds(editEntry.linkedTaskIds || []);
      } else {
        // Reset form when adding new entry
        resetForm();
      }
      
      // Always reset error message
      setErrorMessage('');
      setHasInitialized(true);
    }
  }, [isOpen, editEntry, hasInitialized]);
  
  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle image upload for main image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }
    
    try {
      const base64 = await fileToBase64(file);
      setImageUrl(base64);
      setErrorMessage('');
    } catch (error) {
      console.error('Error converting image to base64:', error);
      setErrorMessage('Failed to process image. Please try again.');
    }
  };
  
  // Handle media upload (image/video)
  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    const isImage = mediaType === 'image';
    const isVideo = mediaType === 'video';
    
    if (isImage && !file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    if (isVideo && !file.type.startsWith('video/')) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const base64 = await fileToBase64(file);
      
      const newMediaItem: MediaItem = {
        id: Date.now().toString(),
        type: mediaType,
        path: base64,
        mimeType: getMimeTypeFromDataUrl(base64),
        createdAt: new Date().toISOString(),
      };
      
      const updatedMediaItems = [...mediaItems, newMediaItem];
      setMediaItems(updatedMediaItems);
      console.log(`📷 Added ${mediaType} to vision. Total media items:`, updatedMediaItems.length);
    } catch (error) {
      console.error(`Error processing ${mediaType}:`, error);
      toast({
        title: "Upload failed",
        description: `Failed to process ${mediaType}. Please try again.`,
        variant: "destructive"
      });
    }
  };
  
  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Specify the mimeType explicitly to ensure compatibility
      const options = { mimeType: 'audio/webm;codecs=opus' };
      
      // Try the preferred MIME type, but fall back to browser defaults if not supported
      const recorder = MediaRecorder.isTypeSupported(options.mimeType)
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);
        
      setAudioRecorder(recorder);
      
      // Log the actual MIME type being used
      console.log('Using MIME Type:', recorder.mimeType);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(chunks => [...chunks, event.data]);
        }
      };
      
      recorder.onstop = async () => {
        try {
          // Use the same MIME type that was used for recording
          const blob = new Blob(recordedChunks, { type: recorder.mimeType });
          const reader = new FileReader();
          
          reader.onload = () => {
            const base64 = reader.result as string;
            const newMediaItem: MediaItem = {
              id: Date.now().toString(),
              type: 'audio',
              path: base64,
              mimeType: recorder.mimeType,
              createdAt: new Date().toISOString(),
            };
            
            setMediaItems([...mediaItems, newMediaItem]);
            setRecordedChunks([]);
            
            // Log success for debugging
            console.log('Audio recording saved successfully with type:', recorder.mimeType);
          };
          
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Error saving audio recording:', error);
          toast({
            title: "Recording failed",
            description: "Failed to save the voice note. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      recorder.start(1000); // Collect data in 1-second chunks
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice notes.",
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = () => {
    if (!audioRecorder) return;
    
    audioRecorder.stop();
    setIsRecording(false);
    
    // Stop all audio tracks
    audioRecorder.stream.getTracks().forEach(track => track.stop());
    
    // Clear timer
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  };
  
  // Task linking functions
  const handleLinkTask = () => {
    if (!selectedTaskId || linkedTaskIds.includes(selectedTaskId)) return;
    
    setLinkedTaskIds([...linkedTaskIds, selectedTaskId]);
    setSelectedTaskId('');
  };
  
  const handleUnlinkTask = (taskId: string) => {
    setLinkedTaskIds(linkedTaskIds.filter(id => id !== taskId));
  };
  
  // Milestone functions
  const handleAddMilestone = (milestone: Partial<Milestone>) => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: milestone.title!,
      dueDate: milestone.dueDate!,
      notes: milestone.notes,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    setMilestones([...milestones, newMilestone]);
    setShowMilestoneForm(false);
    setEditingMilestone(null);
  };
  
  const handleUpdateMilestone = (milestone: Partial<Milestone>) => {
    if (!editingMilestone) return;
    
    const updatedMilestones = milestones.map(m => 
      m.id === editingMilestone.id ? {...m, ...milestone} : m
    );
    
    setMilestones(updatedMilestones);
    setShowMilestoneForm(false);
    setEditingMilestone(null);
  };
  
  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };
  
  const handleToggleMilestoneCompletion = (id: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        const completed = !m.completed;
        return {
          ...m,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return m;
    }));
  };
  
  // Journal entry functions
  const handleAddJournalEntry = (entry: Partial<JournalEntry>) => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content: entry.content!,
      prompt: entry.prompt,
      createdAt: new Date().toISOString(),
    };
    
    setJournalEntries([...journalEntries, newEntry]);
    setShowJournalForm(false);
    setEditingJournal(null);
  };
  
  const handleUpdateJournalEntry = (entry: Partial<JournalEntry>) => {
    if (!editingJournal) return;
    
    const updatedEntries = journalEntries.map(e => 
      e.id === editingJournal.id ? {...e, ...entry} : e
    );
    
    setJournalEntries(updatedEntries);
    setShowJournalForm(false);
    setEditingJournal(null);
  };
  
  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries(journalEntries.filter(e => e.id !== id));
  };
  
  // Delete media item
  const handleDeleteMedia = (id: string) => {
    setMediaItems(mediaItems.filter(item => item.id !== id));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!title.trim()) {
      setErrorMessage('Title is required');
      return;
    }
    
    if (!description.trim()) {
      setErrorMessage('Description is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const entryData: Partial<VisionBoardEntry> = {
        id: editEntry?.id,
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        category: category !== 'none' ? category : undefined,
        importance: importance.trim() || undefined,
        successCriteria: successCriteria.trim() || undefined,
        targetDate: targetDate?.toISOString(),
        milestones,
        journalEntries,
        mediaItems,
        linkedTaskIds,
      };
      
      console.log('Saving vision with mediaItems:', mediaItems);
      
      if (editEntry) {
        await updateEntry(entryData as VisionBoardEntry);
        toast({
          title: "Vision updated",
          description: "Your vision has been successfully updated.",
        });
      } else {
        await addEntry(entryData as VisionBoardEntry);
        toast({
          title: "Vision added",
          description: "Your vision has been successfully added to your board.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving vision entry:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your vision. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Remove image
  const removeImage = () => {
    setImageUrl(undefined);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] md:max-h-[80vh] w-full flex flex-col p-4 md:p-6 overflow-hidden"
        aria-describedby="vision-entry-description"
      >
        <div id="vision-entry-description" className="sr-only">
          {editEntry ? 'Edit your vision board entry details' : 'Create a new vision board entry'}
        </div>
        <DialogHeader className="px-0">
          <DialogTitle className="text-xl font-bold text-primary">
            {editEntry ? 'Edit Vision' : 'Add New Vision'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4 overflow-y-auto scrollbar-thin pb-4" style={{ scrollBehavior: 'smooth' }}>
          <div className="space-y-4 py-4">
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {errorMessage}
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4 w-full sticky top-0 z-10 bg-background">
                <TabsTrigger value="info" className="flex items-center justify-center gap-1 h-12 sm:h-10">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="milestones" className="flex items-center justify-center gap-1 h-12 sm:h-10">
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Milestones</span>
                </TabsTrigger>
                <TabsTrigger value="journal" className="flex items-center justify-center gap-1 h-12 sm:h-10">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Journal</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center justify-center gap-1 h-12 sm:h-10">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Media</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center justify-center gap-1 h-12 sm:h-10">
                  <ListTodo className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Tasks</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What's your vision?"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description / Quote</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your vision or add an inspirational quote"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="health">Health & Wellness</SelectItem>
                        <SelectItem value="finance">Financial</SelectItem>
                        <SelectItem value="spiritual">Spiritual</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="relationships">Relationships</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="importance">Why This Matters (Optional)</Label>
                    <Textarea
                      id="importance"
                      value={importance || ''}
                      onChange={(e) => setImportance(e.target.value)}
                      placeholder="Why is this vision important to you?"
                      className="min-h-[80px]"
                      autoComplete="off"
                      spellCheck={true}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="successCriteria">Success Criteria (Optional)</Label>
                    <Textarea
                      id="successCriteria"
                      value={successCriteria || ''}
                      onChange={(e) => setSuccessCriteria(e.target.value)}
                      placeholder="What does success look like for this vision?"
                      className="min-h-[80px]"
                      autoComplete="off"
                      spellCheck={true}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {targetDate ? format(targetDate, 'PPP') : <span>Set target date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={targetDate}
                          onSelect={setTargetDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Main Image</Label>
                    {imageUrl ? (
                      <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border">
                        <img 
                          src={imageUrl} 
                          alt="Vision board image"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-md p-12 text-center">
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <label 
                          htmlFor="image"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium">Upload Image</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            Click to browse or drag and drop
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Milestones Tab */}
              <TabsContent value="milestones" className="space-y-4">
                {showMilestoneForm ? (
                  <MilestoneForm
                    milestone={editingMilestone || {}}
                    onSave={editingMilestone ? handleUpdateMilestone : handleAddMilestone}
                    onCancel={() => {
                      setShowMilestoneForm(false);
                      setEditingMilestone(null);
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Timeline Milestones</h3>
                      <Button
                        onClick={() => setShowMilestoneForm(true)}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Milestone</span>
                      </Button>
                    </div>
                    
                    {milestones.length === 0 ? (
                      <div className="text-center p-6 bg-muted/40 rounded-md">
                        <CalendarPlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No milestones yet. Add checkpoints to track your progress.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {milestones
                          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                          .map((milestone) => (
                          <div 
                            key={milestone.id}
                            className="border border-border rounded-md p-3 relative"
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                onClick={() => handleToggleMilestoneCompletion(milestone.id)}
                                className="mt-1 cursor-pointer"
                              >
                                {milestone.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className={cn(
                                    "font-medium",
                                    milestone.completed && "line-through text-muted-foreground"
                                  )}>
                                    {milestone.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                                  </Badge>
                                </div>
                                
                                {milestone.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {milestone.notes}
                                  </p>
                                )}
                                
                                {milestone.completed && milestone.completedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed on {format(new Date(milestone.completedAt), 'MMM d, yyyy')}
                                  </p>
                                )}
                                
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setEditingMilestone(milestone);
                                      setShowMilestoneForm(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteMilestone(milestone.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Journal Tab */}
              <TabsContent value="journal" className="space-y-4">
                {showJournalForm ? (
                  <JournalEntryForm
                    journalEntry={editingJournal || {}}
                    onSave={editingJournal ? handleUpdateJournalEntry : handleAddJournalEntry}
                    onCancel={() => {
                      setShowJournalForm(false);
                      setEditingJournal(null);
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Reflections & Journal</h3>
                      <Button
                        onClick={() => setShowJournalForm(true)}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Entry</span>
                      </Button>
                    </div>
                    
                    {journalEntries.length === 0 ? (
                      <div className="text-center p-6 bg-muted/40 rounded-md">
                        <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No journal entries yet. Reflect on your vision's progress.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {journalEntries
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((entry) => (
                          <div 
                            key={entry.id}
                            className="border border-border rounded-md p-4"
                          >
                            <div className="flex justify-between items-start">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                              </p>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    setEditingJournal(entry);
                                    setShowJournalForm(true);
                                  }}
                                >
                                  <div className="sr-only">Edit</div>
                                  <div className="h-3.5 w-3.5 rounded-full border-2 border-current" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteJournalEntry(entry.id)}
                                >
                                  <div className="sr-only">Delete</div>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            
                            {entry.prompt && (
                              <div className="mt-2 bg-muted p-2 rounded-md text-sm italic text-muted-foreground">
                                {entry.prompt}
                              </div>
                            )}
                            
                            <div className="mt-3 text-sm whitespace-pre-wrap">
                              {entry.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Media Tab */}
              <TabsContent value="media" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Media Gallery</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <input
                          id="upload-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleMediaUpload(e, 'image')}
                        />
                        <label htmlFor="upload-image">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1 cursor-pointer"
                            asChild
                          >
                            <span>
                              <Camera className="h-4 w-4" />
                              <span>Image</span>
                            </span>
                          </Button>
                        </label>
                      </div>
                      
                      <div className="relative">
                        <input
                          id="upload-video"
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleMediaUpload(e, 'video')}
                        />
                        <label htmlFor="upload-video">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1 cursor-pointer"
                            asChild
                          >
                            <span>
                              <Video className="h-4 w-4" />
                              <span>Video</span>
                            </span>
                          </Button>
                        </label>
                      </div>
                      
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? (
                          <>
                            <Pause className="h-4 w-4" />
                            <span>{formatRecordingTime(recordingTime)}</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            <span>Voice</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {mediaItems.length === 0 ? (
                    <div className="text-center p-6 bg-muted/40 rounded-md">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No media items yet. Add images, videos, or voice notes.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {mediaItems.map((item) => (
                        <MediaItem
                          key={item.id}
                          item={item}
                          onDelete={handleDeleteMedia}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Linked Tasks</h3>
                    <div className="flex gap-2">
                      <Select
                        value={selectedTaskId}
                        onValueChange={setSelectedTaskId}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select a task" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskState.tasks
                            .filter(task => !linkedTaskIds.includes(task.id))
                            .map(task => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={!selectedTaskId}
                        onClick={handleLinkTask}
                      >
                        Link
                      </Button>
                    </div>
                  </div>
                  
                  {linkedTaskIds.length === 0 ? (
                    <div className="text-center p-6 bg-muted/40 rounded-md">
                      <ListTodo className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tasks linked yet. Connect your vision to actionable tasks.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedTaskIds.map(taskId => (
                        <TaskItem
                          key={taskId}
                          taskId={taskId}
                          onUnlink={handleUnlinkTask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        
        <div className="sticky bottom-0 left-0 right-0 pt-4 border-t border-border mt-2 bg-background z-10">
          <DialogFooter className="flex justify-end gap-2 md:gap-4 py-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Saving...' : editEntry ? 'Update Vision' : 'Save Vision'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisionEntryDialog;

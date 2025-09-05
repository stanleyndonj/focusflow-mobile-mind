import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { visionStorageService, Vision, VisionMilestone, MediaItem } from '@/services/VisionStorageService';
import { LocalNotifications } from '@capacitor/local-notifications';

// Re-export types from storage service
export type { Vision, VisionMilestone, MediaItem } from '@/services/VisionStorageService';

// Legacy types for backward compatibility
export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  createdAt?: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  prompt?: string;
}

// Legacy VisionBoardEntry (will be mapped to Vision internally)
export interface VisionBoardEntry {
  id: string;
  imageUrl?: string;
  title: string;
  description: string;
  category?: string;
  linkedTaskIds?: string[];
  createdAt: string;
  milestones?: Milestone[];
  journalEntries?: JournalEntry[];
  mediaItems?: MediaItem[];
  importance?: string;
  successCriteria?: string;
  targetDate?: string;
  progressPercentage?: number;
  completed?: boolean;
  completedAt?: string;
  notes?: string;
}

// Enhanced Vision Board State
interface VisionBoardState {
  visions: Vision[];
  milestones: VisionMilestone[];
  loading: boolean;
  error: string | null;
  migrating: boolean;
  
  // Legacy compatibility
  entries: VisionBoardEntry[];
}

// Enhanced Actions
type VisionBoardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MIGRATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'LOAD_VISIONS'; payload: Vision[] }
  | { type: 'LOAD_MILESTONES'; payload: VisionMilestone[] }
  | { type: 'ADD_VISION'; payload: Vision }
  | { type: 'UPDATE_VISION'; payload: Vision }
  | { type: 'DELETE_VISION'; payload: string }
  | { type: 'ADD_MILESTONE'; payload: VisionMilestone }
  | { type: 'UPDATE_MILESTONE'; payload: VisionMilestone }
  | { type: 'DELETE_MILESTONE'; payload: string }
  // Legacy compatibility
  | { type: 'ADD_ENTRY'; payload: VisionBoardEntry }
  | { type: 'UPDATE_ENTRY'; payload: VisionBoardEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'LOAD_ENTRIES'; payload: VisionBoardEntry[] };

// Initial State
const initialState: VisionBoardState = {
  visions: [],
  milestones: [],
  entries: [], // Legacy compatibility
  loading: true,
  error: null,
  migrating: false,
};

// Helper function to convert Vision to legacy VisionBoardEntry
function visionToLegacyEntry(vision: Vision): VisionBoardEntry {
  return {
    id: vision.id,
    title: vision.title,
    description: vision.description,
    createdAt: vision.createdAt,
    imageUrl: vision.media?.[0]?.path,
    category: vision.category,
    linkedTaskIds: vision.linkedTaskIds,
    importance: vision.importance,
    successCriteria: vision.successCriteria,
    targetDate: vision.targetDate,
    progressPercentage: vision.progressPercentage,
    completed: vision.status === 'completed',
    completedAt: vision.accomplishedAt,
    notes: vision.notes,
    milestones: [], // Legacy milestones handled separately
    journalEntries: [], // Legacy journal entries
    mediaItems: vision.media
  };
}

// Handle legacy actions
function handleLegacyAction(state: VisionBoardState, action: any): VisionBoardState {
  switch (action.type) {
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [action.payload, ...state.entries],
      };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.payload),
      };
    case 'LOAD_ENTRIES':
      return {
        ...state,
        entries: action.payload,
        loading: false,
      };
    default:
      return state;
  }
}

// Enhanced Reducer
const visionBoardReducer = (state: VisionBoardState, action: VisionBoardAction): VisionBoardState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_MIGRATING':
      return { ...state, migrating: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'LOAD_VISIONS':
      return {
        ...state,
        visions: action.payload,
        entries: action.payload.map(visionToLegacyEntry), // Legacy compatibility
        loading: false
      };
    case 'LOAD_MILESTONES':
      return { ...state, milestones: action.payload };
    
    case 'ADD_VISION':
      return {
        ...state,
        visions: [action.payload, ...state.visions],
        entries: [visionToLegacyEntry(action.payload), ...state.entries]
      };
    case 'UPDATE_VISION':
      return {
        ...state,
        visions: state.visions.map(v => v.id === action.payload.id ? action.payload : v),
        entries: state.entries.map(e => e.id === action.payload.id ? visionToLegacyEntry(action.payload) : e)
      };
    case 'DELETE_VISION':
      return {
        ...state,
        visions: state.visions.filter(v => v.id !== action.payload),
        entries: state.entries.filter(e => e.id !== action.payload)
      };
    
    case 'ADD_MILESTONE':
      return {
        ...state,
        milestones: [...state.milestones, action.payload]
      };
    case 'UPDATE_MILESTONE':
      return {
        ...state,
        milestones: state.milestones.map(m => m.id === action.payload.id ? action.payload : m)
      };
    case 'DELETE_MILESTONE':
      return {
        ...state,
        milestones: state.milestones.filter(m => m.id !== action.payload)
      };
    
    // Legacy compatibility
    case 'ADD_ENTRY':
    case 'UPDATE_ENTRY':
    case 'DELETE_ENTRY':
    case 'LOAD_ENTRIES':
      return handleLegacyAction(state, action);
    
    default:
      return state;
  }
};

// Enhanced Context Type
interface VisionBoardContextType {
  state: VisionBoardState;
  
  // Vision management
  addVision: (vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVision: (vision: Vision) => Promise<void>;
  deleteVision: (id: string) => Promise<void>;
  completeVision: (id: string, celebrationCallback?: () => void) => Promise<void>;
  checkTargetDateCompletions: () => Promise<void>;
  getVisionById: (id: string) => Vision | undefined;
  getRandomVision: () => Vision | null;
  isVisionOverdue: (vision: Vision) => boolean;
  getCompletedVisions: () => Vision[];
  getActiveVisions: () => Vision[];
  
  // Milestone management
  addMilestone: (milestone: Omit<VisionMilestone, 'id' | 'createdAt'>) => Promise<void>;
  updateMilestone: (milestone: VisionMilestone) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  toggleMilestoneCompletion: (id: string) => Promise<void>;
  getMilestonesForVision: (visionId: string) => VisionMilestone[];
  
  // Vision linking
  linkVisionAsMilestone: (parentVisionId: string, linkedVisionId: string, title?: string) => Promise<void>;
  unlinkVisionMilestone: (milestoneId: string) => Promise<void>;
  getParentVisions: (linkedVisionId: string) => Promise<string[]>;
  checkForCycles: (parentVisionId: string, linkedVisionId: string) => Promise<boolean>;
  
  // Progress and analytics
  calculateVisionProgress: (visionId: string) => Promise<number>;
  updateProgress: (visionId: string, percentage: number) => Promise<void>;
  
  // Legacy compatibility
  addEntry: (entry: Omit<VisionBoardEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (entry: VisionBoardEntry) => void;
  deleteEntry: (id: string) => void;
  getRandomEntry: () => VisionBoardEntry | null;
  addMilestone_legacy: (visionId: string, milestone: Omit<Milestone, 'id' | 'completed' | 'completedAt'>) => void;
  updateMilestone_legacy: (visionId: string, milestone: Milestone) => void;
  deleteMilestone_legacy: (visionId: string, milestoneId: string) => void;
  toggleMilestoneCompletion_legacy: (visionId: string, milestoneId: string) => void;
  addJournalEntry: (visionId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateJournalEntry: (visionId: string, entry: JournalEntry) => void;
  deleteJournalEntry: (visionId: string, entryId: string) => void;
  addMediaItem: (visionId: string, item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  deleteMediaItem: (visionId: string, itemId: string) => void;
  linkTask: (visionId: string, taskId: string) => void;
  unlinkTask: (visionId: string, taskId: string) => void;
  calculateTaskProgress: (visionId: string) => number;
}

// Create Context
const VisionBoardContext = createContext<VisionBoardContextType | undefined>(undefined);

// Enhanced Provider Component
export const VisionBoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(visionBoardReducer, initialState);

  // Initialize storage and load data
  useEffect(() => {
    const initializeAndLoad = async () => {
      try {
        dispatch({ type: 'SET_MIGRATING', payload: true });
        
        // Initialize storage service and run migration if needed
        await visionStorageService.initialize();
        
        // Load visions and milestones
        const [visions, milestones] = await Promise.all([
          visionStorageService.loadVisions(),
          visionStorageService.loadMilestones()
        ]);
        
        dispatch({ type: 'LOAD_VISIONS', payload: visions });
        dispatch({ type: 'LOAD_MILESTONES', payload: milestones });
        dispatch({ type: 'SET_MIGRATING', payload: false });
        
      } catch (error) {
        console.error('Error initializing vision board:', error);
        dispatch({ type: 'SET_ERROR', payload: `Failed to initialize vision board: ${error}` });
        dispatch({ type: 'SET_MIGRATING', payload: false });
      }
    };

    initializeAndLoad();
  }, []);

  // Vision management functions
  const addVision = useCallback(async (visionData: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newVision: Vision = {
        ...visionData,
        id: `vision-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        media: visionData.media || []
      };
      
      await visionStorageService.saveVision(newVision);
      dispatch({ type: 'ADD_VISION', payload: newVision });
      
      toast({
        title: "Vision Created",
        description: `"${newVision.title}" has been added to your vision board.`
      });
      
    } catch (error) {
      console.error('Error adding vision:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add vision' });
    }
  }, []);

  const updateVision = useCallback(async (vision: Vision) => {
    try {
      await visionStorageService.saveVision(vision);
      dispatch({ type: 'UPDATE_VISION', payload: vision });
    } catch (error) {
      console.error('Error updating vision:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update vision' });
    }
  }, []);

  const deleteVision = useCallback(async (id: string) => {
    try {
      await visionStorageService.deleteVision(id);
      dispatch({ type: 'DELETE_VISION', payload: id });
      
      toast({
        title: "Vision Deleted",
        description: "The vision has been removed from your board."
      });
      
    } catch (error) {
      console.error('Error deleting vision:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete vision' });
    }
  }, []);

  // Progress calculation (moved above to avoid TDZ issues in dependencies)
  const getVisionById = useCallback((id: string): Vision | undefined => {
    return state.visions.find(v => v.id === id);
  }, [state.visions]);

  const calculateVisionProgress = useCallback(async (visionId: string): Promise<number> => {
    return await visionStorageService.calculateVisionProgress(visionId);
  }, []);

  const updateProgress = useCallback(async (visionId: string, percentage: number) => {
    try {
      const vision = getVisionById(visionId);
      if (vision) {
        const updatedVision: Vision = {
          ...vision,
          progressPercentage: percentage,
          updatedAt: new Date().toISOString()
        };
        await updateVision(updatedVision);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update progress' });
    }
  }, [getVisionById, updateVision]);

  const completeVision = useCallback(async (id: string, celebrationCallback?: () => void) => {
    try {
      const vision = state.visions.find(v => v.id === id);
      if (!vision || vision.status === 'completed') return;
      
      console.log(' Completing vision:', vision.title);
      
      const completedVision: Vision = {
        ...vision,
        status: 'completed',
        accomplishedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressPercentage: 100
      };
      
      await visionStorageService.saveVision(completedVision);
      dispatch({ type: 'UPDATE_VISION', payload: completedVision });
      
      //  Trigger celebration animation
      if (celebrationCallback) {
        setTimeout(() => celebrationCallback(), 100);
      }
      
      // Cascade completion to parent visions
      const affectedParents = await visionStorageService.cascadeVisionCompletion(id);
      
      if (affectedParents.length > 0) {
        // Reload milestones to reflect changes
        const milestones = await visionStorageService.loadMilestones();
        dispatch({ type: 'LOAD_MILESTONES', payload: milestones });
        
        // Recalculate and persist progress for each affected parent
        for (const parentId of affectedParents) {
          try {
            const percentage = await calculateVisionProgress(parentId);
            await updateProgress(parentId, percentage);
          } catch (updateError) {
            console.warn('Failed updating parent progress', { parentId, updateError });
          }
        }

        // Send notifications
        for (const parentId of affectedParents) {
          const parentVision = state.visions.find(v => v.id === parentId);
          if (parentVision) {
            toast({
              title: "Milestone Unlocked!",
              description: `Milestone unlocked in "${parentVision.title}": "${vision.title}"`
            });
            
            // Send local notification
            try {
              await LocalNotifications.schedule({
                notifications: [{
                  id: Date.now(),
                  title: `Milestone unlocked in ${parentVision.title}`,
                  body: `You completed: ${vision.title}`,
                  schedule: { at: new Date(Date.now() + 1000) }
                }]
              });
            } catch (notificationError) {
              console.warn('Could not send local notification:', notificationError);
            }
          }
        }
      }
      
      toast({
        title: "Vision Completed! 🎉",
        description: `Congratulations on achieving "${vision.title}"!`
      });
      
    } catch (error) {
      console.error('Error completing vision:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to complete vision' });
    }
  }, [state.visions, calculateVisionProgress, updateProgress]);

  // 📅 Check for target date completions
  const checkTargetDateCompletions = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueVisions = state.visions.filter(vision => {
      return vision.status === 'active' && 
             vision.targetDate && 
             vision.targetDate <= today;
    });
    
    return overdueVisions;
  }, [state.visions]);
  
  // 🚨 Check if vision is overdue
  const isVisionOverdue = useCallback((vision: Vision) => {
    if (vision.status !== 'active' || !vision.targetDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return vision.targetDate < today;
  }, []);
  
  // 📋 Get completed visions (archive)
  const getCompletedVisions = useCallback(() => {
    return state.visions.filter(v => v.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.accomplishedAt || b.updatedAt).getTime() - 
                     new Date(a.completedAt || a.accomplishedAt || a.updatedAt).getTime());
  }, [state.visions]);
  
  // ✨ Get active visions
  const getActiveVisions = useCallback(() => {
    return state.visions.filter(v => v.status === 'active')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.visions]);

  

  const getRandomVision = useCallback((): Vision | null => {
    if (state.visions.length === 0) return null;
    const activeVisions = state.visions.filter(v => v.status === 'active');
    if (activeVisions.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * activeVisions.length);
    return activeVisions[randomIndex];
  }, [state.visions]);

  // Milestone management functions
  const addMilestone = useCallback(async (milestoneData: Omit<VisionMilestone, 'id' | 'createdAt'>) => {
    try {
      const newMilestone: VisionMilestone = {
        ...milestoneData,
        id: `milestone-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      // Check for cycles if it's a vision link
      if (newMilestone.type === 'vision_link' && newMilestone.linkedVisionId) {
        const hasCycle = await visionStorageService.checkForCycles(newMilestone.parentVisionId, newMilestone.linkedVisionId);
        if (hasCycle) {
          toast({
            title: "Cannot Link Vision",
            description: "This would create a circular dependency. A vision cannot depend on itself directly or indirectly.",
            variant: "destructive"
          });
          return;
        }
      }
      
      await visionStorageService.saveMilestone(newMilestone);
      dispatch({ type: 'ADD_MILESTONE', payload: newMilestone });
      
      toast({
        title: "Milestone Added",
        description: "New milestone has been added to your vision."
      });
      
      // Recompute progress for the parent vision after adding a milestone
      try {
        const percentage = await calculateVisionProgress(newMilestone.parentVisionId);
        await updateProgress(newMilestone.parentVisionId, percentage);
      } catch (recalcError) {
        console.warn('Failed to recalc progress after addMilestone', recalcError);
      }
      
    } catch (error) {
      console.error('Error adding milestone:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add milestone' });
    }
  }, []);

  const updateMilestone = useCallback(async (milestone: VisionMilestone) => {
    try {
      await visionStorageService.saveMilestone(milestone);
      dispatch({ type: 'UPDATE_MILESTONE', payload: milestone });
    } catch (error) {
      console.error('Error updating milestone:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update milestone' });
    }
  }, []);

  const deleteMilestone = useCallback(async (id: string) => {
    try {
      const milestone = state.milestones.find(m => m.id === id);
      await visionStorageService.deleteMilestone(id);
      dispatch({ type: 'DELETE_MILESTONE', payload: id });
      
      toast({
        title: "Milestone Removed",
        description: "The milestone has been removed from your vision."
      });
      
      // Recompute progress for the parent vision after deleting a milestone
      if (milestone) {
        try {
          const percentage = await calculateVisionProgress(milestone.parentVisionId);
          await updateProgress(milestone.parentVisionId, percentage);
        } catch (recalcError) {
          console.warn('Failed to recalc progress after deleteMilestone', recalcError);
        }
      }
      
    } catch (error) {
      console.error('Error deleting milestone:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete milestone' });
    }
  }, [state.milestones]);

  const toggleMilestoneCompletion = useCallback(async (id: string) => {
    try {
      const milestone = state.milestones.find(m => m.id === id);
      if (!milestone) return;
      
      const updatedMilestone: VisionMilestone = {
        ...milestone,
        achievedAt: milestone.achievedAt ? undefined : new Date().toISOString()
      };
      
      await updateMilestone(updatedMilestone);

      // After toggling, recalculate parent vision progress
      try {
        const percentage = await calculateVisionProgress(updatedMilestone.parentVisionId);
        await updateProgress(updatedMilestone.parentVisionId, percentage);
      } catch (progressError) {
        console.warn('Failed to recalc parent progress after milestone toggle', { id, progressError });
      }
      
    } catch (error) {
      console.error('Error toggling milestone completion:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update milestone' });
    }
  }, [state.milestones, updateMilestone, calculateVisionProgress, updateProgress]);

  const getMilestonesForVision = useCallback((visionId: string): VisionMilestone[] => {
    return state.milestones.filter(m => m.parentVisionId === visionId).sort((a, b) => a.orderIndex - b.orderIndex);
  }, [state.milestones]);

  // Vision linking functions
  const linkVisionAsMilestone = useCallback(async (parentVisionId: string, linkedVisionId: string, title?: string) => {
    try {
      const linkedVision = getVisionById(linkedVisionId);
      if (!linkedVision) {
        throw new Error('Linked vision not found');
      }
      
      // Get current milestones to determine order index
      const existingMilestones = getMilestonesForVision(parentVisionId);
      const orderIndex = existingMilestones.length;
      
      await addMilestone({
        parentVisionId,
        type: 'vision_link',
        title: title || linkedVision.title,
        linkedVisionId,
        orderIndex,
        achievedAt: linkedVision.status === 'completed' ? linkedVision.accomplishedAt : undefined
      });
      
    } catch (error) {
      console.error('Error linking vision as milestone:', error);
      toast({
        title: "Error",
        description: "Failed to link vision as milestone.",
        variant: "destructive"
      });
    }
  }, [addMilestone, getVisionById, getMilestonesForVision]);

  const unlinkVisionMilestone = useCallback(async (milestoneId: string) => {
    await deleteMilestone(milestoneId);
  }, [deleteMilestone]);

  const getParentVisions = useCallback(async (linkedVisionId: string): Promise<string[]> => {
    return await visionStorageService.getParentVisions(linkedVisionId);
  }, []);

  const checkForCycles = useCallback(async (parentVisionId: string, linkedVisionId: string): Promise<boolean> => {
    return await visionStorageService.checkForCycles(parentVisionId, linkedVisionId);
  }, []);

  // After initial load, recompute progress once to include tasks and milestones
  useEffect(() => {
    const recomputeAllProgress = async () => {
      try {
        for (const v of state.visions) {
          const target = v.status === 'completed' ? 100 : await calculateVisionProgress(v.id);
          if ((v.progressPercentage || 0) !== target) {
            await updateProgress(v.id, target);
          }
        }
      } catch (e) {
        console.warn('Failed to recompute all vision progress', e);
      }
    };
    if (!state.loading && !state.migrating && state.visions.length >= 0) {
      void recomputeAllProgress();
    }
  }, [state.loading, state.migrating, state.visions.length, calculateVisionProgress, updateProgress]);

  // React to task updates to recompute weighted progress (tasks influence progress)
  useEffect(() => {
    const onTasksUpdated = async () => {
      try {
        for (const v of state.visions) {
          if (v.status === 'completed') continue;
          const percentage = await calculateVisionProgress(v.id);
          await updateProgress(v.id, percentage);
        }
      } catch (e) {
        console.warn('Failed to recompute progress on tasks update', e);
      }
    };
    window.addEventListener('tasks:updated', onTasksUpdated as any);
    return () => window.removeEventListener('tasks:updated', onTasksUpdated as any);
  }, [state.visions, calculateVisionProgress, updateProgress]);

  // Legacy compatibility functions
  const addEntry = useCallback((entry: Omit<VisionBoardEntry, 'id' | 'createdAt'>) => {
    // Ensure main image persists on create even if mediaItems is an empty array
    let media = entry.mediaItems && entry.mediaItems.length > 0 ? entry.mediaItems : [];
    if (media.length === 0 && entry.imageUrl) {
      media = [{
        id: `media-${Date.now()}`,
        type: 'image' as const,
        path: entry.imageUrl,
        createdAt: new Date().toISOString()
      }];
    }

    const visionData = {
      title: entry.title,
      description: entry.description,
      media,
      category: entry.category,
      linkedTaskIds: entry.linkedTaskIds,
      importance: entry.importance,
      successCriteria: entry.successCriteria,
      targetDate: entry.targetDate,
      progressPercentage: entry.progressPercentage,
      notes: entry.notes,
      status: 'active' // Add required status property
    };
    addVision(visionData);
  }, [addVision]);

  const updateEntry = useCallback((entry: VisionBoardEntry) => {
    const vision = state.visions.find(v => v.id === entry.id);
    if (vision) {
      // Handle media properly - convert imageUrl to media format if needed
      let media = entry.mediaItems || [];
      if (entry.imageUrl && (!entry.mediaItems || entry.mediaItems.length === 0)) {
        media = [{
          id: `media-${Date.now()}`,
          type: 'image' as const,
          path: entry.imageUrl,
          createdAt: new Date().toISOString()
        }];
      }
      
      const updatedVision: Vision = {
        ...vision,
        title: entry.title,
        description: entry.description,
        status: entry.completed ? 'completed' : 'active',
        accomplishedAt: entry.completedAt,
        media: media,
        category: entry.category,
        linkedTaskIds: entry.linkedTaskIds,
        importance: entry.importance,
        successCriteria: entry.successCriteria,
        targetDate: entry.targetDate,
        progressPercentage: entry.progressPercentage,
        notes: entry.notes,
        updatedAt: new Date().toISOString(),
        // Preserve journal entries and milestones
        journalEntries: entry.journalEntries || vision.journalEntries || [],
        milestones: entry.milestones || vision.milestones || []
      };
      
      console.log('Updating vision with media:', updatedVision.media);
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);

  const deleteEntry = useCallback((id: string) => {
    deleteVision(id);
  }, [deleteVision]);

  const getRandomEntry = useCallback((): VisionBoardEntry | null => {
    const randomVision = getRandomVision();
    return randomVision ? visionToLegacyEntry(randomVision) : null;
  }, [getRandomVision]);

  // Legacy milestone functions - properly implemented
  const addMilestone_legacy = useCallback((visionId: string, milestone: Omit<Milestone, 'id' | 'completed' | 'completedAt'>) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision) {
      const newMilestone: Milestone = {
        ...milestone,
        id: `milestone-${Date.now()}`,
        completed: false,
        createdAt: new Date().toISOString()
      };
      const updatedVision: Vision = {
        ...vision,
        milestones: [...(vision.milestones || []), newMilestone],
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const updateMilestone_legacy = useCallback((visionId: string, milestone: Milestone) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision && vision.milestones) {
      const updatedVision: Vision = {
        ...vision,
        milestones: vision.milestones.map(m => m.id === milestone.id ? milestone : m),
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const deleteMilestone_legacy = useCallback((visionId: string, milestoneId: string) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision && vision.milestones) {
      const updatedVision: Vision = {
        ...vision,
        milestones: vision.milestones.filter(m => m.id !== milestoneId),
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const toggleMilestoneCompletion_legacy = useCallback((visionId: string, milestoneId: string) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision && vision.milestones) {
      const updatedVision: Vision = {
        ...vision,
        milestones: vision.milestones.map(m => 
          m.id === milestoneId 
            ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
            : m
        ),
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const addJournalEntry = useCallback((visionId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision) {
      const newEntry: JournalEntry = {
        ...entry,
        id: `journal-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      const updatedVision: Vision = {
        ...vision,
        journalEntries: [...(vision.journalEntries || []), newEntry],
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const updateJournalEntry = useCallback((visionId: string, entry: JournalEntry) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision && vision.journalEntries) {
      const updatedVision: Vision = {
        ...vision,
        journalEntries: vision.journalEntries.map(e => e.id === entry.id ? entry : e),
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const deleteJournalEntry = useCallback((visionId: string, entryId: string) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision && vision.journalEntries) {
      const updatedVision: Vision = {
        ...vision,
        journalEntries: vision.journalEntries.filter(e => e.id !== entryId),
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const addMediaItem = useCallback((visionId: string, item: Omit<MediaItem, 'id' | 'createdAt'>) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision) {
      const newItem: MediaItem = {
        ...item,
        id: `media-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      const updatedVision: Vision = {
        ...vision,
        media: [...(vision.media || []), newItem],
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const deleteMediaItem = useCallback((visionId: string, itemId: string) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision) {
      const updatedVision: Vision = {
        ...vision,
        media: vision.media.filter(item => item.id !== itemId),
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const linkTask = useCallback((visionId: string, taskId: string) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision) {
      const updatedVision: Vision = {
        ...vision,
        linkedTaskIds: [...(vision.linkedTaskIds || []), taskId],
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const unlinkTask = useCallback((visionId: string, taskId: string) => {
    const vision = state.visions.find(v => v.id === visionId);
    if (vision) {
      const updatedVision: Vision = {
        ...vision,
        linkedTaskIds: (vision.linkedTaskIds || []).filter(id => id !== taskId),
        updatedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
    }
  }, [state.visions, updateVision]);
  
  const calculateTaskProgress = useCallback((visionId: string) => {
    // Calculate progress based on completed linked tasks
    const vision = state.visions.find(v => v.id === visionId);
    if (!vision || !vision.linkedTaskIds || vision.linkedTaskIds.length === 0) return 0;
    // Would need task context to calculate actual progress
    return 0;
  }, [state.visions]);

  const contextValue: VisionBoardContextType = {
    state,
    
    // Vision management
    addVision,
    updateVision,
    deleteVision,
    completeVision,
    checkTargetDateCompletions,
    getVisionById,
    getRandomVision,
    isVisionOverdue,
    getCompletedVisions,
    getActiveVisions,
    
    // Milestone management  
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestoneCompletion,
    getMilestonesForVision,
    
    // Vision linking
    linkVisionAsMilestone,
    unlinkVisionMilestone,
    getParentVisions,
    checkForCycles,
    
    // Progress
    calculateVisionProgress,
    updateProgress,
    
    // Legacy compatibility
    addEntry,
    updateEntry,
    deleteEntry,
    getRandomEntry,
    addMilestone_legacy,
    updateMilestone_legacy,
    deleteMilestone_legacy,
    toggleMilestoneCompletion_legacy,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addMediaItem,
    deleteMediaItem,
    linkTask,
    unlinkTask,
    calculateTaskProgress
  };

  return (
    <VisionBoardContext.Provider value={contextValue}>
      {children}
    </VisionBoardContext.Provider>
  );
};

// Custom hook to use the vision board context
export const useVisionBoard = (): VisionBoardContextType => {
  const context = useContext(VisionBoardContext);
  if (context === undefined) {
    throw new Error('useVisionBoard must be used within a VisionBoardProvider');
  }
  return context;
};

export default VisionBoardContext;

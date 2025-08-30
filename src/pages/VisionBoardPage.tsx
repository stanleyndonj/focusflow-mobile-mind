import React, { useState, useMemo, useCallback } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useVisionBoard, Vision } from '@/contexts/VisionBoardContext';
import { AlertCircle, BookOpen, Calendar, Check, Clock, Edit, Eye, Grid3x3, Heart, Link2, List, Loader2, MoreVertical, Palette, Pencil, Plus, Sparkles, Star, Target, Trash, Trophy, Upload, X, Edit3, Trash2, Filter, CheckCircle, Archive, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import VisionEntryDialog from '@/components/vision/VisionEntryDialog';
import DeleteConfirmDialog from '@/components/vision/DeleteConfirmDialog';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import CountdownClock from '@/components/vision/CountdownClock';
import ProgressLinkedImage from '@/components/vision/ProgressLinkedImage';
import ThemeSelector, { VISION_BOARD_THEMES, VisionBoardTheme } from '@/components/vision/ThemeSelector';
import TimelineView from '@/components/vision/TimelineView';
import ManifestationJournal from '@/components/vision/ManifestationJournal';
import VirtualizedVisionGrid from '@/components/vision/VirtualizedVisionGrid';
import EnhancedVisionDetailsDialog from '@/components/vision/EnhancedVisionDetailsDialog';
import MilestoneTiles from '@/components/vision/MilestoneTiles';
import VisionPicker from '@/components/vision/VisionPicker';
import VisionBacklinks from '@/components/vision/VisionBacklinks';
import VisionCelebration from '@/components/vision/VisionCelebration';
import { useTasks } from '@/contexts/TaskContext';
import { format, parseISO, isValid } from 'date-fns';
import { useTimer } from '@/contexts/TimerContext';
import { formatTimeDisplay } from '@/services/TimerService';

const VisionBoardPage: React.FC = () => {
  const { 
    state, 
    addVision, 
    updateVision, 
    deleteVision, 
    getVisionById,
    completeVision,
    isVisionOverdue,
    getCompletedVisions,
    getActiveVisions
  } = useVisionBoard();
  const { state: taskState } = useTasks();
  const { state: timerState, startTimer, pauseTimer, resetTimer } = useTimer();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVision, setEditingVision] = useState<Vision | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [visionToDelete, setVisionToDelete] = useState<string | null>(null);
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'grid' | 'timeline'>('grid');
  const [selectedTheme, setSelectedTheme] = useState<string>('minimal');
  const [showJournal, setShowJournal] = useState(false);
  const [journalEntry, setJournalEntry] = useState<any>(null);
  const [celebratingVision, setCelebratingVision] = useState<Vision | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [completionDate, setCompletionDate] = useState('');
  const [reflectionNote, setReflectionNote] = useState('');
  const [activeTimerTileId, setActiveTimerTileId] = useState<string | null>(null);

  // Memoized visions for performance
  const activeVisions = useMemo(() => {
    return state.visions.filter(v => v.status === 'active');
  }, [state.visions]);

  const completedVisions = useMemo(() => {
    return state.visions.filter(v => v.status === 'completed');
  }, [state.visions]);

  const handleAddClick = useCallback(() => {
    setEditingVision(null);
    setIsAddDialogOpen(true);
  }, []);

  const handleEditVision = useCallback((vision: Vision) => {
    setEditingVision(vision);
    setIsAddDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setVisionToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (visionToDelete) {
      await deleteVision(visionToDelete);
      toast({
        title: "Vision Deleted",
        description: "Your vision has been removed from the board."
      });
      setVisionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [visionToDelete, deleteVision]);

  const handleVisionClick = useCallback((vision: Vision) => {
    setSelectedVision(vision);
    setIsDetailModalOpen(true);
  }, []);

  const handleSaveVision = useCallback(async (vision: Vision) => {
    await updateVision(vision);
    setSelectedVision(vision); // Update the selected vision with new data
    toast({
      title: "Vision Updated",
      description: "Your vision has been successfully updated."
    });
  }, [updateVision]);

  const handleEntryClick = useCallback((entry: any) => {
    setJournalEntry(entry);
    setShowJournal(true);
  }, []);

  const handleMarkAccomplished = useCallback(() => {
    if (selectedVision) {
      const updatedVision = {
        ...selectedVision,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      };
      updateVision(updatedVision);
      setSelectedVision(null);
      setIsDetailModalOpen(false);
      toast({
        title: "Vision Accomplished! 🎉",
        description: `Congratulations on achieving "${updatedVision.title}"!`
      });
    }
  }, [selectedVision, updateVision]);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedVision(null);
  }, []);

  // Get theme configuration (moved outside of map to avoid hooks violation)
  const themeConfig = useMemo(() => {
    return VISION_BOARD_THEMES.find(t => t.id === selectedTheme) || VISION_BOARD_THEMES[0];
  }, [selectedTheme]);

  // Handle theme change (moved outside of map to avoid hooks violation)
  const handleThemeChange = useCallback((themeId: string) => {
    setSelectedTheme(themeId);
  }, []);

  // Loading and migration states
  if (state.loading || state.migrating) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-focus-500" />
              <p className="text-gray-600 dark:text-gray-400">Loading your vision board...</p>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (state.error) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Error Loading Visions</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{state.error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <ErrorBoundary>
      <MobileLayout>
        <div className="space-y-8 px-1">
          {/* Enhanced Header Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-focus-50 to-primary/5 rounded-3xl -z-10" />
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-focus-400 to-focus-500 rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-600 to-focus-400 dark:from-focus-400 dark:to-focus-300 bg-clip-text text-transparent">
                      Vision Board
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-base max-w-md">
                    Visualize your dreams and turn them into reality
                  </p>
                  <div className="flex items-center gap-2 text-sm text-focus-600">
                    <Sparkles className="h-4 w-4" />
                    <span>{state.entries.length} vision{state.entries.length !== 1 ? 's' : ''} created</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddClick}
                  className="rounded-full bg-gradient-to-r from-focus-400 to-focus-500 hover:from-focus-500 hover:to-focus-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <Plus size={20} className="mr-2" /> 
                  Add Vision
                </Button>
              </div>
            </div>
          </div>
          
          {state.loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-focus-200 dark:border-gray-600 animate-spin"></div>
                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-focus-500 dark:border-t-focus-400 animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your visions...</p>
            </div>
          ) : state.entries.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-focus-100 to-focus-50 rounded-3xl p-8">
                  <Target size={64} className="text-focus-400 mx-auto" />
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full p-2">
                  <Sparkles size={20} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No visions yet</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">Create your first vision to start manifesting your dreams. Add images, goals, and inspiration to keep yourself motivated.</p>
              <Button 
                onClick={handleAddClick}
                className="rounded-full bg-gradient-to-r from-focus-400 to-focus-500 hover:from-focus-500 hover:to-focus-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <Plus size={20} className="mr-2" /> 
                Create First Vision
              </Button>
            </div>
          ) : (
            <>
              {/* Enhanced Control Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* View Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={currentView === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('grid')}
                      className="flex items-center gap-2"
                    >
                      <Grid3x3 className="h-4 w-4" />
                      Grid View
                    </Button>
                    <Button
                      variant={currentView === 'timeline' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('timeline')}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Timeline
                    </Button>
                  </div>

                  {/* Theme selector removed for cleaner UI */}
                </div>
              </div>

              {/* Main Content Area */}
              {currentView === 'timeline' ? (
                <div className="w-full">
                  <TimelineView entries={state.entries} onEntryClick={(entry) => {
                    const vision = state.visions.find(v => v.id === entry.id);
                    if (vision) handleEditVision(vision);
                  }} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Vision Grid */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(showArchive ? getCompletedVisions() : getActiveVisions()).filter(vision => {
                      const matchesSearch = !searchQuery || 
                        vision.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        vision.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        vision.category?.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      const matchesFilter = selectedFilter === 'all' || 
                        (selectedFilter === 'completed' && vision.status === 'completed') ||
                        (selectedFilter === 'in-progress' && vision.status === 'active');
                      
                      return matchesSearch && matchesFilter;
                    }).map((entry, index) => {
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="group relative"
                        >
                          <div 
                            className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border transform hover:scale-[1.02] ${
                              isVisionOverdue && isVisionOverdue(entry) 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800' 
                                : 'bg-white dark:bg-[#2C2C2C] border-gray-200 dark:border-gray-600'
                            }`}
                            onClick={() => {
                              const show = activeTimerTileId !== entry.id;
                              setActiveTimerTileId(show ? entry.id : null);
                              console.log('🕒 Vision tile click toggled timer overlay', { visionId: entry.id, showTimer: show });
                            }}
                          >
                            {/* Enhanced Image Section with Progress-Linked Updates */}
                            <div className="relative h-48 overflow-hidden">
                              {activeTimerTileId === entry.id ? (
                                <motion.div 
                                  key={`timer-${entry.id}`}
                                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/70 to-black/50"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                >
                                  <div className="text-center px-4">
                                    <div className="text-white text-3xl font-bold tracking-wide">
                                      {formatTimeDisplay(timerState.timeLeft * 1000)}
                                    </div>
                                    <div className="text-xs text-white/80 mt-1 capitalize">
                                      {timerState.mode}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (timerState.isRunning) {
                                            console.log('⏸ Pausing timer from vision tile', { visionId: entry.id });
                                            pauseTimer();
                                          } else {
                                            console.log('▶️ Starting timer from vision tile', { visionId: entry.id, task: entry.title });
                                            startTimer(undefined, entry.title, entry.id);
                                          }
                                        }}
                                      >
                                        {timerState.isRunning ? <Pause size={16} /> : <Play size={16} />}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('🔄 Resetting timer from vision tile', { visionId: entry.id });
                                          resetTimer();
                                        }}
                                      >
                                        <RotateCcw size={16} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveTimerTileId(null);
                                          console.log('🧩 Hiding timer overlay for vision', { visionId: entry.id });
                                        }}
                                      >
                                        <X size={16} />
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              ) : (
                                <>
                                  {(entry.media && entry.media.length > 0) ? (
                                    <ProgressLinkedImage
                                      imageUrl={entry.media[0]?.path}
                                      progress={entry.progressPercentage || 0}
                                      title={entry.title}
                                      className="w-full h-full"
                                      showOverlay={true}
                                    />
                                  ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Target className="h-12 w-12 text-white/80" />
                                  </div>
                                  )}
                                </>
                              )}

                              {/* Completion Badge */}
                              {entry.status === 'completed' && (
                                <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
                                  <Check size={16} />
                                </div>
                              )}
                              {isVisionOverdue && isVisionOverdue(entry) && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                  Overdue
                                </div>
                              )}
                            </div>
                                  
                                  {/* Enhanced Content Section */}
                                  <div className="p-6 space-y-4">
                                    <div>
                                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-focus-600 dark:group-hover:text-focus-400 transition-colors">
                                        {entry.title}
                                      </h3>
                                      <p className="text-sm line-clamp-3 leading-relaxed text-gray-600 dark:text-gray-400">
                                        {entry.description}
                                      </p>
                                    </div>
                                    
                                    {/* Countdown Clock for Target Dates */}
                                    {entry.targetDate && (
                                      <div className="my-3">
                                        <CountdownClock
                                          targetDate={entry.targetDate}
                                          title="Time Left"
                                          size="small"
                                          theme={selectedTheme === 'minimal' ? 'minimal' : selectedTheme === 'vibrant' ? 'vibrant' : 'default'}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Category Badge */}
                                    {entry.category && (
                                      <div className="inline-flex items-center">
                                        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-focus-100 dark:bg-focus-900/20 text-focus-700 dark:text-focus-400 border border-focus-300 dark:border-focus-700/30">
                                          {entry.category}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600 dark:text-gray-300">Progress</span>
                                        <span className="text-gray-900 dark:text-white font-medium">{entry.progressPercentage || 0}%</span>
                                      </div>
                                      <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                                        <div 
                                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-focus-500 to-focus-600 dark:from-focus-400 dark:to-focus-500"
                                          style={{ width: `${entry.progressPercentage || 0}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Vision Linking Section - PROMINENTLY VISIBLE */}
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-8 text-xs bg-purple-100 dark:bg-purple-900/10 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/20"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const vision = state.visions.find(v => v.id === entry.id);
                                          if (vision) {
                                            setSelectedVision(vision);
                                            setIsDetailModalOpen(true);
                                          }
                                        }}
                                      >
                                        <Target className="h-3 w-3 mr-1" />
                                        Link Milestones
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-8 text-xs bg-blue-100 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/20"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const vision = state.visions.find(v => v.id === entry.id);
                                          if (vision) {
                                            setSelectedVision(vision);
                                            setIsDetailModalOpen(true);
                                          }
                                        }}
                                      >
                                        <List className="h-3 w-3 mr-1" />
                                        View Links
                                      </Button>
                                    </div>

                                    {/* Linked Tasks Preview */}
                                    {entry.linkedTaskIds && entry.linkedTaskIds.length > 0 && (
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <List className="h-3 w-3" />
                                        <span>{entry.linkedTaskIds.length} linked task{entry.linkedTaskIds.length > 1 ? 's' : ''}</span>
                                      </div>
                                    )}
                                    
                                    {/* Enhanced Footer */}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <Calendar size={14} />
                                        <span>
                                          {entry.createdAt ? 
                                            (() => {
                                              try {
                                                const date = parseISO(entry.createdAt);
                                                return isValid(date) ? format(date, 'MMM d, yyyy') : 'No date';
                                              } catch (error) {
                                                console.error('Invalid date format:', entry.createdAt);
                                                return 'No date';
                                              }
                                            })() 
                                            : 'No date'}
                                        </span>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 rounded-full hover:bg-focus-100 text-gray-500 hover:text-focus-600 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Get the LATEST vision data from context, not the entry
                                            const freshVision = state.visions.find(v => v.id === entry.id);
                                            if (freshVision) {
                                              console.log('📖 Opening journal for vision with journal entries:', freshVision.journalEntries?.length || 0);
                                              setJournalEntry(freshVision);
                                            } else {
                                              console.warn('⚠️ Vision not found in context:', entry.id);
                                              setJournalEntry(entry);
                                            }
                                            setShowJournal(true);
                                          }}
                                        >
                                          <BookOpen size={14} />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 rounded-full hover:bg-focus-100 text-gray-500 hover:text-focus-600 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const vision = state.visions.find(v => v.id === entry.id);
                                            if (vision) handleEditVision(vision);
                                          }}
                                        >
                                          <Pencil size={14} />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(entry.id);
                                          }}
                                        >
                                          <Trash size={14} />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Archive Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {showArchive ? 'Archived Visions' : 'Active Visions'}
          </h2>
          <Button
            variant={showArchive ? "default" : "outline"}
            onClick={() => setShowArchive(!showArchive)}
            className={`px-4 py-2 text-sm ${
              showArchive 
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white' 
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchive ? 'Hide Archive' : 'Show Archive'}
            {!showArchive && getCompletedVisions().length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {getCompletedVisions().length}
              </span>
            )}
          </Button>
        </div>

        {/* Celebration Animation */}
        {celebratingVision && (
          <VisionCelebration
            vision={celebratingVision}
            isVisible={!!celebratingVision}
            onComplete={() => setCelebratingVision(null)}
          />
        )}

        {/* Manifestation Journal Modal - SEPARATE */}
        <Dialog open={showJournal} onOpenChange={setShowJournal}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manifestation Journal</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              {journalEntry && (() => {
                // Get the LATEST vision data to ensure journal entries are up-to-date
                const freshVision = state.visions.find(v => v.id === journalEntry.id);
                const entryToUse = freshVision || journalEntry;
                console.log('📖 Journal modal: Using vision with journal entries:', entryToUse.journalEntries?.length || 0);
                
                return (
                  <ManifestationJournal
                    entry={entryToUse}
                    onUpdateEntry={(updatedEntry) => {
                    // Find the corresponding vision and update it
                    const visionId = updatedEntry.id;
                    const vision = state.visions.find(v => v.id === visionId);
                    if (vision) {
                      // Update the vision with the new journal entries
                      const updatedVision = { 
                        ...vision, 
                        journalEntries: updatedEntry.journalEntries || []
                      };
                      updateVision(updatedVision);
                      // Update local state to reflect changes immediately
                      setJournalEntry(updatedEntry);
                      console.log('✅ Journal entry saved:', updatedEntry.journalEntries);
                    } else {
                      console.error('❌ Vision not found for journal update:', visionId);
                    }
                  }}
                  theme={selectedTheme}
                />
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail View Modal - Enhanced */}
        <Dialog open={!!selectedVision && !showJournal} onOpenChange={() => setSelectedVision(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#2C2C2C] border border-gray-200 dark:border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVision?.title}</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                {selectedVision?.description}
              </DialogDescription>
            </DialogHeader>
            {selectedVision && (
              <div className="p-6 space-y-6">
                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Progress</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {selectedVision.progressPercentage || 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${selectedVision.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  {selectedVision.status === 'active' && (
                    <Button
                      onClick={() => {
                        completeVision(selectedVision.id, () => {
                          setCelebratingVision(selectedVision);
                        });
                        setSelectedVision(null);
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setJournalEntry(selectedVision);
                      setShowJournal(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Open Manifestation Journal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingVision(selectedVision);
                      setIsAddDialogOpen(true);
                      setSelectedVision(null);
                    }}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Vision
                  </Button>
                </div>

                {/* Milestones Section - Show linked visions */}
                {selectedVision?.milestones && selectedVision.milestones.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Milestones</h3>
                    <div className="space-y-2">
                      {selectedVision.milestones.map((milestone: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {milestone.title || `Milestone ${index + 1}`}
                            </span>
                            {milestone.completed && (
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Milestones</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No milestones linked yet. Link other visions as milestones to track your progress.</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Enhanced Dialogs */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600">
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingVision ? 'Edit Vision Entry' : 'Add Vision Entry'}
            </DialogTitle>
            <VisionEntryDialog
              isOpen={isAddDialogOpen}
              onClose={() => setIsAddDialogOpen(false)}
              editEntry={editingVision}
            />
          </DialogContent>
        </Dialog>
        
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
        />
        
        {/* Enhanced Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <DialogTitle>View {selectedVision?.title || 'Vision Entry'}</DialogTitle>
            {selectedVision && (
              <div className="flex flex-col h-full">
                {/* Enhanced Image Header */}
                <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden rounded-t-2xl">
                  {selectedVision.media && selectedVision.media.length > 0 ? (
                    <img
                      src={selectedVision.media[0].path}
                      alt={selectedVision.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-focus-100 to-focus-50 dark:from-gray-800 dark:to-gray-700">
                      <Target size={64} className="text-focus-400 dark:text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                
                {/* Enhanced Content */}
                <div className="p-8 flex flex-col flex-grow space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                      {selectedVision.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>
                          {selectedVision.createdAt ? 
                            (() => {
                              try {
                                const date = parseISO(selectedVision.createdAt);
                                return isValid(date) ? format(date, 'MMMM d, yyyy') : 'No date';
                              } catch (error) {
                                console.error('Invalid date format:', selectedVision.createdAt);
                                return 'No date';
                              }
                            })() 
                            : 'No date'}
                        </span>
                      </div>
                      {selectedVision.category && (
                        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-focus-100 to-focus-50 text-focus-700 dark:from-focus-900 dark:to-focus-800 dark:text-focus-300">
                          {selectedVision.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                    {selectedVision.description}
                  </p>
                  
                  {/* Media Section */}
                  {selectedVision.media && selectedVision.media.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Media</h3>
                      {selectedVision.media.map((media: any) => (
                        <div key={media.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                          {media.type === 'audio' && (
                            <audio controls className="w-full">
                              <source src={media.path} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {media.type === 'video' && (
                            <video controls className="w-full rounded-lg">
                              <source src={media.path} type="video/mp4" />
                              Your browser does not support the video element.
                            </video>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {media.type} - Added on {media.createdAt ? format(parseISO(media.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Vision-as-Milestone Linking Section - ENHANCED VISIBILITY */}
                  <div className="space-y-6 border-t pt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/10 dark:to-blue-950/10 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Sparkles className="h-5 w-5" />
                        <h3 className="text-lg font-bold">
                          Vision Linking & Milestones
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connect this vision to other visions as milestones or see which visions depend on this one.
                      </p>
                    </div>

                    {/* Current Milestones */}
                    <MilestoneTiles 
                      visionId={selectedVision.id}
                      onMilestoneClick={(milestoneId) => {
                        const milestone = state.visions.find(v => v.id === milestoneId);
                        if (milestone) {
                          setSelectedVision(milestone);
                        }
                      }}
                    />

                    {/* Add New Milestone - PROMINENT BUTTON */}
                    <div className="flex justify-center">
                      <VisionPicker
                        parentVisionId={selectedVision.id}
                        onVisionSelected={(visionId, title) => {
                          // Actually create the milestone link
                          const parentVision = state.visions.find(v => v.id === selectedVision.id);
                          const childVision = state.visions.find(v => v.id === visionId);
                          
                          if (parentVision && childVision) {
                            // Add milestone to parent vision
                            const updatedMilestones = [...(parentVision.milestones || [])];
                            const newMilestone = {
                              id: visionId,
                              title: childVision.title,
                              completed: childVision.progressPercentage >= 100
                            };
                            
                            // Check if milestone already exists
                            const exists = updatedMilestones.some(m => m.id === visionId);
                            if (!exists) {
                              updatedMilestones.push(newMilestone);
                              
                              const updatedParentVision = {
                                ...parentVision,
                                milestones: updatedMilestones
                              };
                              
                              updateVision(updatedParentVision);
                              
                              // Update selectedVision to reflect changes immediately
                              setSelectedVision(updatedParentVision);
                              
                              toast({
                                title: "Milestone Added",
                                description: `${title || 'Vision'} has been linked as a milestone.`,
                              });
                              
                              console.log('✅ Milestone linked:', newMilestone);
                            } else {
                              toast({
                                title: "Already Linked",
                                description: `${title || 'Vision'} is already a milestone.`,
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                      >
                        <Button 
                          variant="default" 
                          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 shadow-lg"
                        >
                          <Plus className="h-5 w-5" />
                          Link a Vision as Milestone
                        </Button>
                      </VisionPicker>
                    </div>

                    {/* Vision Backlinks */}
                    <VisionBacklinks 
                      visionId={selectedVision.id}
                    />
                  </div>
                  
                  {/* Enhanced Accomplishment Section */}
                  {selectedVision.status !== 'completed' ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        Mark as Accomplished
                      </h3>
                      <div className="space-y-4">
                        <Input
                          type="date"
                          value={completionDate.split('T')[0] || ''}
                          onChange={(e) => setCompletionDate(e.target.value)}
                          className="rounded-lg border-green-200 focus:border-green-400 focus:ring-green-200"
                          placeholder="Select completion date"
                        />
                        <Input
                          type="text"
                          value={reflectionNote}
                          onChange={(e) => setReflectionNote(e.target.value)}
                          className="rounded-lg border-green-200 focus:border-green-400 focus:ring-green-200"
                          placeholder="Add a reflection or note about this achievement"
                        />
                        <Button
                          onClick={handleMarkAccomplished}
                          className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                          disabled={!completionDate}
                        >
                          <Check size={18} className="mr-2" /> 
                          Mark as Accomplished
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Accomplished
                      </h3>
                      <p className="text-green-700 dark:text-green-400">
                        Completed on: {selectedVision.completedAt ? format(parseISO(selectedVision.completedAt), 'MMMM d, yyyy') : 'N/A'}
                      </p>
                      {selectedVision.notes && (
                        <p className="text-green-700 dark:text-green-400 mt-2">
                          <span className="font-medium">Reflection:</span> {selectedVision.notes}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleEditVision(selectedVision);
                      }}
                      className="flex-1 rounded-lg border-focus-200 hover:border-focus-400 hover:bg-focus-50 transition-colors"
                    >
                      <Pencil size={16} className="mr-2" /> 
                      Edit Vision
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleDeleteClick(selectedVision.id);
                      }}
                      className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <Trash size={16} className="mr-2" /> 
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </MobileLayout>
    </ErrorBoundary>
  );
};

export default VisionBoardPage;

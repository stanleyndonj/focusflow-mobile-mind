import React, { useState, useMemo, useCallback } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useVisionBoard, Vision } from '@/contexts/VisionBoardContext';
import { Plus, Grid, Calendar, BookOpen, Palette, ListTodo, Target, Loader2, AlertCircle, Sparkles, Pencil, Trash, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import VisionEntryDialog from '@/components/vision/VisionEntryDialog';
import DeleteConfirmDialog from '@/components/vision/DeleteConfirmDialog';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CountdownClock from '@/components/vision/CountdownClock';
import ProgressLinkedImage from '@/components/vision/ProgressLinkedImage';
import ThemeSelector, { VISION_BOARD_THEMES, VisionBoardTheme } from '@/components/vision/ThemeSelector';
import TimelineView from '@/components/vision/TimelineView';
import ManifestationJournal from '@/components/vision/ManifestationJournal';
import VirtualizedVisionGrid from '@/components/vision/VirtualizedVisionGrid';
import EnhancedVisionDetailsDialog from '@/components/vision/EnhancedVisionDetailsDialog';
import VisionPicker from '@/components/vision/VisionPicker';
import MilestoneTiles from '@/components/vision/MilestoneTiles';
import VisionBacklinks from '@/components/vision/VisionBacklinks';
import { useTasks } from '@/contexts/TaskContext';
import { format, parseISO, isValid } from 'date-fns';

const VisionBoardPage: React.FC = () => {
  const { state, deleteVision, updateVision, addVision } = useVisionBoard();
  const { state: taskState } = useTasks();
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
  const [completionDate, setCompletionDate] = useState('');
  const [reflectionNote, setReflectionNote] = useState('');

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                {state.migrating ? 'Upgrading your visions...' : 'Loading your visions...'}
              </p>
              {state.migrating && (
                <p className="text-xs text-gray-500 mt-2">
                  This may take a moment during the first launch after an update
                </p>
              )}
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Error state
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
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-focus-600 to-focus-400 text-transparent bg-clip-text">
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
                <div className="h-12 w-12 rounded-full border-4 border-focus-200 animate-spin"></div>
                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-focus-500 animate-spin"></div>
              </div>
              <p className="text-muted-foreground font-medium">Loading your visions...</p>
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
              <h3 className="text-xl font-semibold text-foreground mb-3">Start Your Vision Journey</h3>
              <p className="text-muted-foreground text-center max-w-md mx-auto mb-8 leading-relaxed">
                Create your first vision to start manifesting your dreams. Add images, goals, and inspiration to keep yourself motivated.
              </p>
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
                      <Grid className="h-4 w-4" />
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

                  {/* Theme Selector - Compact */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Theme:</span>
                    </div>
                    <ThemeSelector
                      selectedTheme={selectedTheme}
                      onThemeChange={setSelectedTheme}
                      compact
                    />
                  </div>
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
                  {/* Enhanced Grid View */}
                  <AnimatePresence>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                      {state.entries.map((entry, index) => {

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
                              className={`${themeConfig.gradients.card} rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border cursor-pointer transform hover:scale-[1.02]`}
                              style={{ borderColor: themeConfig.colors.border }}
                              onClick={() => handleEntryClick(entry)}
                            >
                              {/* Enhanced Image Section with Progress-Linked Updates */}
                              {entry.imageUrl && (
                                <div className="relative h-48 overflow-hidden">
                                  <ProgressLinkedImage
                                    imageUrl={entry.imageUrl}
                                    progress={entry.progressPercentage || 0}
                                    title={entry.title}
                                    className="w-full h-full"
                                    showOverlay={true}
                                  />
                                  
                                  {/* Completion Badge */}
                                  {entry.completed && (
                                    <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
                                      <Check size={16} />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Enhanced Content Section */}
                              <div className="p-6 space-y-4">
                                <div>
                                  <h3 
                                    className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-focus-600 transition-colors"
                                    style={{ color: themeConfig.colors.text }}
                                  >
                                    {entry.title}
                                  </h3>
                                  <p 
                                    className="text-sm line-clamp-3 leading-relaxed"
                                    style={{ color: themeConfig.colors.secondary }}
                                  >
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
                                    <span 
                                      className="px-3 py-1.5 text-xs font-medium rounded-full border"
                                      style={{ 
                                        backgroundColor: themeConfig.colors.accent + '20',
                                        color: themeConfig.colors.accent,
                                        borderColor: themeConfig.colors.accent + '40'
                                      }}
                                    >
                                      {entry.category}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Progress Bar */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span style={{ color: themeConfig.colors.secondary }}>Progress</span>
                                    <span style={{ color: themeConfig.colors.primary }}>{entry.progressPercentage || 0}%</span>
                                  </div>
                                  <div 
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: themeConfig.colors.border }}
                                  >
                                    <div 
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${entry.progressPercentage || 0}%`,
                                        backgroundColor: themeConfig.colors.accent
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Linked Tasks Preview */}
                                {entry.linkedTaskIds && entry.linkedTaskIds.length > 0 && (
                                  <div className="flex items-center gap-2 text-xs" style={{ color: themeConfig.colors.secondary }}>
                                    <ListTodo className="h-3 w-3" />
                                    <span>{entry.linkedTaskIds.length} linked task{entry.linkedTaskIds.length > 1 ? 's' : ''}</span>
                                  </div>
                                )}
                                
                                {/* Enhanced Footer */}
                                <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: themeConfig.colors.border }}>
                                  <div className="flex items-center gap-2 text-xs" style={{ color: themeConfig.colors.secondary }}>
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
                                        setJournalEntry(entry);
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
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>

        {/* Manifestation Journal Modal */}
        <Dialog open={showJournal} onOpenChange={setShowJournal}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 bg-white rounded-2xl shadow-2xl border-0">
            <DialogTitle className="sr-only">Manifestation Journal</DialogTitle>
            <div className="p-6">
              {journalEntry && (
                <ManifestationJournal
                  entry={journalEntry}
                  onUpdateEntry={(updatedEntry) => {
                    const vision = state.visions.find(v => v.id === updatedEntry.id);
                    if (vision) {
                      updateVision({ ...vision, ...updatedEntry });
                    }
                    setJournalEntry(updatedEntry);
                  }}
                  theme={selectedTheme}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Enhanced Dialogs */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
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
          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
            <DialogTitle>View {selectedVision?.title || 'Vision Entry'}</DialogTitle>
            {selectedVision && (
              <div className="flex flex-col h-full">
                {/* Enhanced Image Header */}
                <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden rounded-t-2xl">
                  {selectedVision.imageUrl ? (
                    <img
                      src={selectedVision.imageUrl}
                      alt={selectedVision.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-focus-100 to-focus-50 dark:from-gray-700 dark:to-gray-600">
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
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
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
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-focus-100 to-focus-50 text-focus-700 dark:from-focus-900 dark:to-focus-800 dark:text-focus-300">
                          {selectedVision.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-foreground text-base leading-relaxed">
                    {selectedVision.description}
                  </p>
                  
                  {/* Media Section - keep existing code */}
                  {selectedVision.media && selectedVision.media.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Media</h3>
                      {selectedVision.media.map((media: any) => (
                        <div key={media.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          {media.type === 'audio' && (
                            <audio controls className="w-full">
                              <source src={media.url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {media.type === 'video' && (
                            <video controls className="w-full rounded-lg">
                              <source src={media.url} type="video/mp4" />
                              Your browser does not support the video element.
                            </video>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {media.type} - Added on {media.createdAt ? format(parseISO(media.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Vision-as-Milestone Linking Section */}
                  <div className="space-y-6 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Target className="h-5 w-5 text-focus-600" />
                        Milestones & Dependencies
                      </h3>
                    </div>

                    {/* Current Milestones */}
                    <MilestoneTiles 
                      parentVisionId={selectedVision.id}
                      onMilestoneClick={(milestoneId) => {
                        const milestone = state.visions.find(v => v.id === milestoneId);
                        if (milestone) {
                          setSelectedVision(milestone);
                        }
                      }}
                      onRemoveMilestone={(milestoneId) => {
                        // Handle milestone removal
                        toast({
                          title: "Milestone Removed",
                          description: "The milestone has been removed from this vision.",
                        });
                      }}
                    />

                    {/* Add New Milestone */}
                    <div className="flex justify-center">
                      <VisionPicker
                        parentVisionId={selectedVision.id}
                        onVisionSelected={(visionId, title) => {
                          toast({
                            title: "Milestone Added",
                            description: `${title || 'Vision'} has been linked as a milestone.`,
                          });
                        }}
                      >
                        <Button variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Milestone Vision
                        </Button>
                      </VisionPicker>
                    </div>

                    {/* Vision Backlinks */}
                    <VisionBacklinks 
                      visionId={selectedVision.id}
                      onBacklinkClick={(backlinkId) => {
                        const backlink = state.visions.find(v => v.id === backlinkId);
                        if (backlink) {
                          setSelectedVision(backlink);
                        }
                      }}
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

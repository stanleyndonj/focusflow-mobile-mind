import React, { useState, useMemo, useCallback } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useVisionBoard, Vision } from '@/contexts/VisionBoardContext';
import { Plus, Grid, Calendar, BookOpen, Palette, ListTodo, Target, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import VisionEntryDialog from '@/components/vision/VisionEntryDialog';
import DeleteConfirmDialog from '@/components/vision/DeleteConfirmDialog';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountdownClock from '@/components/vision/CountdownClock';
import ProgressLinkedImage from '@/components/vision/ProgressLinkedImage';
import ThemeSelector, { VISION_BOARD_THEMES } from '@/components/vision/ThemeSelector';
import TimelineView from '@/components/vision/TimelineView';
import ManifestationJournal from '@/components/vision/ManifestationJournal';
import VirtualizedVisionGrid from '@/components/vision/VirtualizedVisionGrid';
import EnhancedVisionDetailsDialog from '@/components/vision/EnhancedVisionDetailsDialog';
import { useTasks } from '@/contexts/TaskContext';

const VisionBoardPage: React.FC = () => {
  const { state, deleteVision, updateVision } = useVisionBoard();
  const { state: taskState } = useTasks();
  
  // State management
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

  // Memoized computations for performance
  const activeVisions = useMemo(() => {
    return state.visions.filter(v => v.status === 'active');
  }, [state.visions]);

  const completedVisions = useMemo(() => {
    return state.visions.filter(v => v.status === 'completed');
  }, [state.visions]);

  const themeConfig = useMemo(() => {
    return VISION_BOARD_THEMES.find(t => t.id === selectedTheme) || VISION_BOARD_THEMES[0];
  }, [selectedTheme]);

  // Event handlers
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
    setSelectedVision(vision);
    toast({
      title: "Vision Updated",
      description: "Your vision has been successfully updated."
    });
  }, [updateVision]);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedVision(null);
  }, []);

  const handleThemeChange = useCallback((themeId: string) => {
    setSelectedTheme(themeId);
  }, []);

  const handleJournalEntryClick = useCallback((entry: any) => {
    setJournalEntry(entry);
    setShowJournal(true);
  }, []);

  const handleCloseJournal = useCallback(() => {
    setShowJournal(false);
    setJournalEntry(null);
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
        <div className={`min-h-screen ${themeConfig.backgroundColor || 'bg-white dark:bg-gray-900'}`}>
          {/* Header */}
          <div className="sticky top-0 z-40 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Vision Board
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {state.visions.length} vision{state.visions.length !== 1 ? 's' : ''} • {activeVisions.length} active
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeSelector
                  themes={VISION_BOARD_THEMES}
                  selectedTheme={selectedTheme}
                  onThemeChange={setSelectedTheme}
                />
                
                <Button 
                  onClick={handleAddClick}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vision
                </Button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={currentView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('grid')}
                  className="flex-1"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={currentView === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('timeline')}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Timeline
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'grid' | 'timeline')} className="h-full">
              {/* Grid View */}
              <TabsContent value="grid" className="flex-1 mt-0">
                <div className="h-[calc(100vh-200px)]">
                  {state.visions.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          No Visions Yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                          Start building your dream life by creating your first vision.
                        </p>
                        <Button onClick={handleAddClick} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Vision
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <VirtualizedVisionGrid
                      visions={state.visions}
                      onEdit={handleEditVision}
                      onDelete={handleDeleteClick}
                      onOpen={handleVisionClick}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Timeline View */}
              <TabsContent value="timeline" className="flex-1 mt-0">
                <TimelineView 
                  entries={state.entries} 
                  onEntryClick={(entry) => {
                    const vision = state.visions.find(v => v.id === entry.id);
                    if (vision) handleVisionClick(vision);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Quick Stats Footer */}
          {state.visions.length > 0 && (
            <div className="sticky bottom-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{activeVisions.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{completedVisions.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((completedVisions.length / state.visions.length) * 100) || 0}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Progress</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals and Dialogs */}
        
        {/* Add/Edit Vision Dialog */}
        <VisionEntryDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          existingEntry={editingVision}
          linkedTasks={taskState.tasks}
        />

        {/* Enhanced Vision Details Dialog */}
        <EnhancedVisionDetailsDialog
          vision={selectedVision}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onSave={handleSaveVision}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          onClose={() => setIsDeleteDialogOpen(false)}
          title={state.visions.find(v => v.id === visionToDelete)?.title || ''}
        />

        {/* Journal Dialog */}
        <ManifestationJournal
          entry={journalEntry}
          onClose={() => setShowJournal(false)}
        />
      </MobileLayout>
    </ErrorBoundary>
  );
};

export default VisionBoardPage;

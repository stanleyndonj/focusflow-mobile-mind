import React, { useState, useCallback } from 'react';
import { useVisionBoard, Vision } from '@/contexts/VisionBoardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  CheckCircle, 
  Edit, 
  Save, 
  X, 
  Calendar, 
  TrendingUp, 
  Plus,
  Link2,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import VisionPicker from './VisionPicker';
import MilestoneTiles from './MilestoneTiles';
import VisionBacklinks from './VisionBacklinks';

interface EnhancedVisionDetailsDialogProps {
  vision: Vision | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vision: Vision) => void;
}

const EnhancedVisionDetailsDialog: React.FC<EnhancedVisionDetailsDialogProps> = ({
  vision,
  isOpen,
  onClose,
  onSave
}) => {
  const { completeVision, addMilestone, linkVisionAsMilestone } = useVisionBoard();
  const [editMode, setEditMode] = useState(false);
  const [editedVision, setEditedVision] = useState<Vision | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showVisionPicker, setShowVisionPicker] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  React.useEffect(() => {
    if (vision) {
      setEditedVision({ ...vision });
      setEditMode(false);
    }
  }, [vision]);

  const handleEdit = useCallback(() => {
    setEditMode(true);
  }, []);

  const handleSave = useCallback(() => {
    if (editedVision) {
      onSave(editedVision);
      setEditMode(false);
    }
  }, [editedVision, onSave]);

  const handleCancel = useCallback(() => {
    if (vision) {
      setEditedVision({ ...vision });
    }
    setEditMode(false);
  }, [vision]);

  const handleCompleteVision = useCallback(async () => {
    if (vision) {
      await completeVision(vision.id);
    }
  }, [vision, completeVision]);

  const handleVisionLinked = useCallback(async (linkedVisionId: string, title?: string) => {
    if (vision) {
      await linkVisionAsMilestone(vision.id, linkedVisionId, title);
      setShowVisionPicker(false);
    }
  }, [vision, linkVisionAsMilestone]);

  const handleAddMilestone = useCallback(async () => {
    if (vision && newMilestoneTitle.trim()) {
      await addMilestone({
        parentVisionId: vision.id,
        type: 'checklist',
        title: newMilestoneTitle.trim(),
        orderIndex: 0 // Will be calculated properly in the context
      });
      setNewMilestoneTitle('');
      setShowAddMilestone(false);
    }
  }, [vision, newMilestoneTitle, addMilestone]);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMMM dd, yyyy') : 'Invalid date';
    } catch {
      return 'Invalid date';
    }
  }, []);

  if (!vision) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-500" />
              <span>{editMode ? 'Edit Vision' : vision.title}</span>
              {vision.status === 'completed' && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {!editMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {vision.status !== 'completed' && (
                    <Button onClick={handleCompleteVision} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="backlinks">Used In</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="overview" className="h-full">
                <ScrollArea className="h-full -mr-4 pr-4">
                  <div className="space-y-6">
                    {/* Vision Image */}
                    {vision.media?.[0]?.path && (
                      <div className="w-full h-48 rounded-lg overflow-hidden">
                        <img
                          src={vision.media[0].path}
                          alt={vision.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Vision Content */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Basic Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Vision Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {editMode ? (
                            <>
                              <div>
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                  value={editedVision?.title || ''}
                                  onChange={(e) => setEditedVision(prev => prev ? { ...prev, title: e.target.value } : null)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                  value={editedVision?.description || ''}
                                  onChange={(e) => setEditedVision(prev => prev ? { ...prev, description: e.target.value } : null)}
                                  rows={4}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Category</label>
                                <Input
                                  value={editedVision?.category || ''}
                                  onChange={(e) => setEditedVision(prev => prev ? { ...prev, category: e.target.value } : null)}
                                  placeholder="e.g., Career, Health, Relationships"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Target Date</label>
                                <Input
                                  type="date"
                                  value={editedVision?.targetDate?.split('T')[0] || ''}
                                  onChange={(e) => setEditedVision(prev => prev ? { ...prev, targetDate: e.target.value } : null)}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                                <p className="text-sm mt-1">{vision.description}</p>
                              </div>
                              {vision.category && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                                  <div className="mt-1">
                                    <Badge variant="secondary">{vision.category}</Badge>
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Date</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{formatDate(vision.targetDate)}</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                                <div className="mt-1">
                                  <Badge variant={vision.status === 'completed' ? 'default' : 'secondary'}>
                                    {vision.status === 'completed' ? 'Completed' : 'Active'}
                                  </Badge>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Progress and Goals */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Progress & Goals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</label>
                              <span className="text-sm font-medium">
                                {vision.progressPercentage || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <motion.div
                                className="bg-blue-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${vision.progressPercentage || 0}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>

                          {editMode ? (
                            <>
                              <div>
                                <label className="text-sm font-medium">Why Important</label>
                                <Textarea
                                  value={editedVision?.importance || ''}
                                  onChange={(e) => setEditedVision(prev => prev ? { ...prev, importance: e.target.value } : null)}
                                  placeholder="Why is this vision important to you?"
                                  rows={3}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Success Criteria</label>
                                <Textarea
                                  value={editedVision?.successCriteria || ''}
                                  onChange={(e) => setEditedVision(prev => prev ? { ...prev, successCriteria: e.target.value } : null)}
                                  placeholder="How will you know when you've achieved this?"
                                  rows={3}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              {vision.importance && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Why Important</label>
                                  <p className="text-sm mt-1">{vision.importance}</p>
                                </div>
                              )}
                              {vision.successCriteria && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Criteria</label>
                                  <p className="text-sm mt-1">{vision.successCriteria}</p>
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {editMode ? (
                          <Textarea
                            value={editedVision?.notes || ''}
                            onChange={(e) => setEditedVision(prev => prev ? { ...prev, notes: e.target.value } : null)}
                            placeholder="Additional notes about this vision..."
                            rows={4}
                          />
                        ) : (
                          <p className="text-sm">{vision.notes || 'No notes added yet.'}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="milestones" className="h-full">
                <ScrollArea className="h-full -mr-4 pr-4">
                  <div className="space-y-4">
                    <MilestoneTiles
                      visionId={vision.id}
                      onAddMilestone={() => setShowAddMilestone(true)}
                      onLinkVision={() => setShowVisionPicker(true)}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="backlinks" className="h-full">
                <ScrollArea className="h-full -mr-4 pr-4">
                  <VisionBacklinks visionId={vision.id} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="journal" className="h-full">
                <ScrollArea className="h-full -mr-4 pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Vision Journal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Journal functionality will be available in a future update.
                      </p>
                    </CardContent>
                  </Card>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Modals */}
        <VisionPicker
          parentVisionId={vision.id}
          onVisionSelected={handleVisionLinked}
        >
          <div />
        </VisionPicker>

        {/* Add Milestone Dialog */}
        <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Milestone title..."
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddMilestone(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMilestone} disabled={!newMilestoneTitle.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedVisionDetailsDialog;

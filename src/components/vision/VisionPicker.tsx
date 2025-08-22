import React, { useState, useMemo } from 'react';
import { useVisionBoard, Vision } from '@/contexts/VisionBoardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Target, Calendar, Check, X, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';

interface VisionPickerProps {
  parentVisionId: string;
  onVisionSelected: (visionId: string, title?: string) => void;
  children: React.ReactNode;
}

const VisionPicker: React.FC<VisionPickerProps> = ({
  parentVisionId,
  onVisionSelected,
  children
}) => {
  const { state, checkForCycles } = useVisionBoard();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [checking, setChecking] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);

  // Filter visions for selection
  const availableVisions = useMemo(() => {
    return state.visions.filter(vision => {
      // Exclude parent vision and completed visions
      if (vision.id === parentVisionId || vision.status === 'completed') {
        return false;
      }
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          vision.title.toLowerCase().includes(query) ||
          vision.description.toLowerCase().includes(query) ||
          vision.category?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [state.visions, parentVisionId, searchQuery]);

  const handleVisionSelect = async (vision: Vision) => {
    setChecking(true);
    setCycleError(null);
    
    try {
      const hasCycle = await checkForCycles(parentVisionId, vision.id);
      if (hasCycle) {
        setCycleError(`Cannot link "${vision.title}" as it would create a circular dependency.`);
        setChecking(false);
        return;
      }
      
      setSelectedVision(vision);
      setCustomTitle(vision.title);
      setChecking(false);
    } catch (error) {
      console.error('Error checking for cycles:', error);
      setCycleError('Error checking for circular dependencies. Please try again.');
      setChecking(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedVision) {
      onVisionSelected(selectedVision.id, customTitle.trim() || selectedVision.title);
      setIsOpen(false);
      setSelectedVision(null);
      setCustomTitle('');
      setSearchQuery('');
      setCycleError(null);
    }
  };

  const handleCancel = () => {
    setSelectedVision(null);
    setCustomTitle('');
    setCycleError(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM dd, yyyy') : null;
    } catch {
      return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-500" />
            Link Vision as Milestone
          </DialogTitle>
        </DialogHeader>

        {!selectedVision ? (
          // Vision Selection Phase
          <div className="flex-1 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search visions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {cycleError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <X className="h-4 w-4" />
                    <span className="text-sm font-medium">{cycleError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vision List */}
            <ScrollArea className="flex-1 -mr-4 pr-4">
              <div className="space-y-3">
                {availableVisions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">No visions available</p>
                    <p className="text-sm">
                      {searchQuery ? 'No visions match your search.' : 'Create more visions to link as milestones.'}
                    </p>
                  </div>
                ) : (
                  availableVisions.map((vision) => (
                    <motion.div
                      key={vision.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                          checking ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'
                        }`}
                        onClick={() => !checking && handleVisionSelect(vision)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Vision Image/Icon */}
                            <div className="flex-shrink-0">
                              {vision.media?.[0]?.path ? (
                                <img
                                  src={vision.media[0].path}
                                  alt={vision.title}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  <Target className="h-6 w-6 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Vision Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                                {vision.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {vision.description}
                              </p>
                              
                              {/* Vision Metadata */}
                              <div className="flex items-center gap-4 mt-3">
                                {vision.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {vision.category}
                                  </Badge>
                                )}
                                
                                {vision.targetDate && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(vision.targetDate)}</span>
                                  </div>
                                )}
                                
                                {typeof vision.progressPercentage === 'number' && (
                                  <div className="text-xs text-gray-500">
                                    {vision.progressPercentage}% complete
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Confirmation Phase
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col gap-4"
          >
            {/* Selected Vision Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {selectedVision.media?.[0]?.path ? (
                    <img
                      src={selectedVision.media[0].path}
                      alt={selectedVision.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                    {selectedVision.title}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    {selectedVision.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Milestone Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Milestone Title (Optional)
              </label>
              <Input
                placeholder="Enter custom milestone title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Leave empty to use the vision's original title
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Back
              </Button>
              <Button onClick={handleConfirmSelection}>
                <Check className="h-4 w-4 mr-2" />
                Link as Milestone
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VisionPicker;

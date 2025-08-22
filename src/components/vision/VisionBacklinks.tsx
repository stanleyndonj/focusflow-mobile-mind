import React, { useEffect, useState } from 'react';
import { useVisionBoard, Vision } from '@/contexts/VisionBoardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Target, ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';

interface VisionBacklinksProps {
  visionId: string;
}

const VisionBacklinks: React.FC<VisionBacklinksProps> = ({ visionId }) => {
  const { getParentVisions, getVisionById, calculateVisionProgress } = useVisionBoard();
  const [parentVisionIds, setParentVisionIds] = useState<string[]>([]);
  const [parentVisions, setParentVisions] = useState<Vision[]>([]);
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBacklinks = async () => {
      try {
        setLoading(true);
        
        // Get parent vision IDs
        const parentIds = await getParentVisions(visionId);
        setParentVisionIds(parentIds);
        
        // Get parent visions data and progress
        const visions: Vision[] = [];
        const progress: Record<string, number> = {};
        
        for (const parentId of parentIds) {
          const vision = getVisionById(parentId);
          if (vision) {
            visions.push(vision);
            try {
              const visionProgress = await calculateVisionProgress(parentId);
              progress[parentId] = visionProgress;
            } catch (error) {
              console.warn(`Could not calculate progress for vision ${parentId}:`, error);
              progress[parentId] = 0;
            }
          }
        }
        
        setParentVisions(visions);
        setProgressData(progress);
        
      } catch (error) {
        console.error('Error loading backlinks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBacklinks();
  }, [visionId, getParentVisions, getVisionById, calculateVisionProgress]);

  const openParentVision = (parentVisionId: string) => {
    // Navigate to parent vision
    window.location.hash = `#/vision/${parentVisionId}`;
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            Used as Milestone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (parentVisions.length === 0) {
    return null; // Don't show the section if no backlinks
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-blue-500" />
          Used as Milestone in {parentVisions.length} Vision{parentVisions.length !== 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            <AnimatePresence>
              {parentVisions.map((parentVision, index) => (
                <motion.div
                  key={parentVision.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <Card 
                    className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
                    onClick={() => openParentVision(parentVision.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Parent Vision Thumbnail */}
                        <div className="flex-shrink-0">
                          {parentVision.media?.[0]?.path ? (
                            <img
                              src={parentVision.media[0].path}
                              alt={parentVision.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <Target className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Parent Vision Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                                {parentVision.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {parentVision.description}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                openParentVision(parentVision.id);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Metadata and Progress */}
                          <div className="flex items-center gap-3 mt-3">
                            {/* Progress */}
                            {typeof progressData[parentVision.id] === 'number' && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-blue-500" />
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {progressData[parentVision.id]}% complete
                                </span>
                              </div>
                            )}
                            
                            {/* Status */}
                            <Badge 
                              variant={parentVision.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {parentVision.status === 'completed' ? 'Completed' : 'Active'}
                            </Badge>
                            
                            {/* Target Date */}
                            {parentVision.targetDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(parentVision.targetDate)}</span>
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {typeof progressData[parentVision.id] === 'number' && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <motion.div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressData[parentVision.id]}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This vision serves as a milestone in {parentVisions.length} other vision{parentVisions.length !== 1 ? 's' : ''}. 
            Completing this vision will automatically mark those milestones as achieved.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisionBacklinks;

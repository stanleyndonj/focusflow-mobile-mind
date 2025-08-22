import React from 'react';
import { useVisionBoard, VisionMilestone, Vision } from '@/contexts/VisionBoardContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CheckCircle2, Circle, Target, MoreVertical, Unlink, ExternalLink, Calendar, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';

interface MilestoneTilesProps {
  visionId: string;
  onAddMilestone: () => void;
  onLinkVision: () => void;
}

const MilestoneTiles: React.FC<MilestoneTilesProps> = ({
  visionId,
  onAddMilestone,
  onLinkVision
}) => {
  const { 
    state, 
    getMilestonesForVision, 
    toggleMilestoneCompletion, 
    unlinkVisionMilestone,
    getVisionById 
  } = useVisionBoard();

  const milestones = getMilestonesForVision(visionId);
  const checklistMilestones = milestones.filter(m => m.type === 'checklist');
  const linkedVisionMilestones = milestones.filter(m => m.type === 'vision_link');

  const handleToggleComplete = async (milestoneId: string) => {
    await toggleMilestoneCompletion(milestoneId);
  };

  const handleUnlink = async (milestoneId: string) => {
    await unlinkVisionMilestone(milestoneId);
  };

  const openLinkedVision = (visionId: string) => {
    // This would navigate to the vision details
    window.location.hash = `#/vision/${visionId}`;
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

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.achievedAt).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Milestones
          </h3>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {progress}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Checklist Milestones */}
      {checklistMilestones.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
          </h4>
          
          <div className="space-y-2">
            <AnimatePresence>
              {checklistMilestones.map((milestone) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`cursor-pointer transition-all duration-200 ${
                    milestone.achievedAt ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => handleToggleComplete(milestone.id)}
                        >
                          {milestone.achievedAt ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                          )}
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            milestone.achievedAt ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {milestone.title}
                          </p>
                          {milestone.achievedAt && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Completed {formatDate(milestone.achievedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Linked Vision Milestones */}
      {linkedVisionMilestones.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Linked Visions
          </h4>
          
          <div className="grid gap-3">
            <AnimatePresence>
              {linkedVisionMilestones.map((milestone) => {
                const linkedVision = milestone.linkedVisionId ? getVisionById(milestone.linkedVisionId) : null;
                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`transition-all duration-200 ${
                      milestone.achievedAt ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Vision Thumbnail */}
                          <div className="flex-shrink-0">
                            {linkedVision?.media?.[0]?.path ? (
                              <img
                                src={linkedVision.media[0].path}
                                alt={linkedVision.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                milestone.achievedAt ? 'bg-green-500' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                              }`}>
                                <Target className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Vision Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className={`font-semibold text-sm ${
                                  milestone.achievedAt ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {milestone.title}
                                </h5>
                                
                                {linkedVision && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    {linkedVision.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Actions Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {linkedVision && (
                                    <DropdownMenuItem onClick={() => openLinkedVision(linkedVision.id)}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open Vision
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleUnlink(milestone.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Unlink className="h-4 w-4 mr-2" />
                                    Unlink
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Status and Metadata */}
                            <div className="flex items-center gap-2 mt-2">
                              {milestone.achievedAt ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : linkedVision?.status === 'completed' ? (
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  Vision Complete
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  In Progress
                                </Badge>
                              )}
                              
                              {linkedVision?.targetDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(linkedVision.targetDate)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add Milestone Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={onAddMilestone} 
          variant="outline" 
          size="sm"
          className="flex-1"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Add Task
        </Button>
        
        <Button 
          onClick={onLinkVision} 
          variant="outline" 
          size="sm"
          className="flex-1"
        >
          <Target className="h-4 w-4 mr-2" />
          Link Vision
        </Button>
      </div>

      {/* Empty State */}
      {milestones.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-1">No milestones yet</p>
          <p className="text-sm mb-4">Break down your vision into actionable milestones.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={onAddMilestone} variant="outline" size="sm">
              Add Task
            </Button>
            <Button onClick={onLinkVision} variant="outline" size="sm">
              Link Vision
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTiles;

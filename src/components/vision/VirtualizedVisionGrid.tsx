import React, { useMemo, useCallback, memo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Vision } from '@/contexts/VisionBoardContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, TrendingUp, Edit, Trash, MoreVertical, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';

interface VirtualizedVisionGridProps {
  visions: Vision[];
  onEdit: (vision: Vision) => void;
  onDelete: (id: string) => void;
  onOpen: (vision: Vision) => void;
  itemsPerRow?: number;
  itemHeight?: number;
}

interface VisionCardProps {
  vision: Vision;
  onEdit: (vision: Vision) => void;
  onDelete: (id: string) => void;
  onOpen: (vision: Vision) => void;
}

// Memoized Vision Card Component for performance
const VisionCard = memo<VisionCardProps>(({ vision, onEdit, onDelete, onOpen }) => {
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM dd') : null;
    } catch {
      return null;
    }
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(vision);
  }, [onEdit, vision]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(vision.id);
  }, [onDelete, vision.id]);

  const handleOpen = useCallback(() => {
    onOpen(vision);
  }, [onOpen, vision]);

  // Generate thumbnail with lazy loading
  const thumbnail = useMemo(() => {
    const media = vision.media?.[0];
    if (!media) return null;
    
    // For images, use thumbnail if available, otherwise use original with loading="lazy"
    if (media.type === 'image') {
      return media.thumbPath || media.path;
    }
    
    return media.thumbPath;
  }, [vision.media]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="p-2 h-full"
    >
      <Card 
        className={`h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
          vision.status === 'completed' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'hover:border-blue-300'
        }`}
        onClick={handleOpen}
      >
        <CardContent className="p-0 h-full flex flex-col">
          {/* Vision Image/Thumbnail */}
          <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={vision.title}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient background if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Target className="h-12 w-12 text-white/80" />
              </div>
            )}
            
            {/* Status Badge */}
            {vision.status === 'completed' && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-green-500 text-white">
                  ✓ Complete
                </Badge>
              </div>
            )}
            
            {/* Actions Menu */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {vision.status === 'active' && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger a custom event; parent page handles completion via context
                    const event = new CustomEvent('vision:mark-complete', { detail: { id: vision.id } });
                    window.dispatchEvent(event);
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Vision Content */}
          <div className="flex-1 p-3 flex flex-col">
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-gray-100 mb-1">
              {vision.title}
            </h3>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 flex-1 mb-2">
              {vision.description}
            </p>

            {/* Metadata */}
            <div className="space-y-2">
              {/* Progress Bar */}
              {typeof vision.progressPercentage === 'number' && vision.progressPercentage > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Progress
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {vision.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${vision.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tags and Date */}
              <div className="flex items-center justify-between">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

VisionCard.displayName = 'VisionCard';

// Grid cell renderer
const Cell = memo(({ columnIndex, rowIndex, style, data }: any) => {
  const { visions, onEdit, onDelete, onOpen, itemsPerRow } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const vision = visions[index];

  if (!vision) {
    return <div style={style} />;
  }

  return (
    <div style={style}>
      <VisionCard
        vision={vision}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpen={onOpen}
      />
    </div>
  );
});

Cell.displayName = 'Cell';

const VirtualizedVisionGrid: React.FC<VirtualizedVisionGridProps> = ({
  visions,
  onEdit,
  onDelete,
  onOpen,
  itemsPerRow = 2,
  itemHeight = 220
}) => {
  // Calculate grid dimensions
  const { rowCount, itemData } = useMemo(() => {
    const rows = Math.ceil(visions.length / itemsPerRow);
    return {
      rowCount: rows,
      itemData: {
        visions,
        onEdit,
        onDelete,
        onOpen,
        itemsPerRow
      }
    };
  }, [visions, itemsPerRow, onEdit, onDelete, onOpen]);

  // Responsive itemsPerRow based on screen width
  const getResponsiveItemsPerRow = useCallback((width: number) => {
    if (width < 640) return 1; // Mobile: 1 column
    if (width < 1024) return 2; // Tablet: 2 columns  
    return 3; // Desktop: 3 columns
  }, []);

  if (visions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-1">No visions yet</p>
          <p className="text-sm">Create your first vision to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }) => {
          const responsiveItemsPerRow = getResponsiveItemsPerRow(width);
          const responsiveRowCount = Math.ceil(visions.length / responsiveItemsPerRow);
          const itemWidth = width / responsiveItemsPerRow;

          return (
            <Grid
              columnCount={responsiveItemsPerRow}
              columnWidth={itemWidth}
              height={height}
              rowCount={responsiveRowCount}
              rowHeight={itemHeight}
              width={width}
              itemData={{
                visions,
                onEdit,
                onDelete,
                onOpen,
                itemsPerRow: responsiveItemsPerRow
              }}
            >
              {Cell}
            </Grid>
          );
        }}
      </AutoSizer>
    </div>
  );
};

export default VirtualizedVisionGrid;

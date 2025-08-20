import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Target, Trophy, AlertTriangle, ChevronRight, Filter } from 'lucide-react';
import { format, parseISO, isValid, differenceInDays, startOfQuarter, endOfQuarter, isSameQuarter } from 'date-fns';
import { VisionBoardEntry } from '@/contexts/VisionBoardContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CountdownClock from './CountdownClock';
import ProgressLinkedImage from './ProgressLinkedImage';

interface TimelineViewProps {
  entries: VisionBoardEntry[];
  onEntryClick: (entry: VisionBoardEntry) => void;
  theme?: string;
}

interface TimelinePeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  quarter?: string;
  color: string;
  bgColor: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  onEntryClick,
  theme = 'default'
}) => {
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'progress' | 'priority'>('date');

  // Generate timeline periods (quarters and custom periods)
  const timelinePeriods: TimelinePeriod[] = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const periods: TimelinePeriod[] = [];
    
    // Add quarterly periods
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterStart = startOfQuarter(new Date(currentYear, (quarter - 1) * 3, 1));
      const quarterEnd = endOfQuarter(quarterStart);
      
      periods.push({
        id: `q${quarter}-${currentYear}`,
        name: `Q${quarter} ${currentYear}`,
        startDate: quarterStart,
        endDate: quarterEnd,
        quarter: `Q${quarter}`,
        color: quarter === 1 ? 'text-blue-600' : quarter === 2 ? 'text-green-600' : quarter === 3 ? 'text-orange-600' : 'text-purple-600',
        bgColor: quarter === 1 ? 'bg-blue-50' : quarter === 2 ? 'bg-green-50' : quarter === 3 ? 'bg-orange-50' : 'bg-purple-50'
      });
    }

    // Add next year quarters
    for (let quarter = 1; quarter <= 4; quarter++) {
      const nextYear = currentYear + 1;
      const quarterStart = startOfQuarter(new Date(nextYear, (quarter - 1) * 3, 1));
      const quarterEnd = endOfQuarter(quarterStart);
      
      periods.push({
        id: `q${quarter}-${nextYear}`,
        name: `Q${quarter} ${nextYear}`,
        startDate: quarterStart,
        endDate: quarterEnd,
        quarter: `Q${quarter}`,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
      });
    }

    return periods;
  }, []);

  // Group entries by timeline periods
  const groupedEntries = useMemo(() => {
    const grouped: Record<string, VisionBoardEntry[]> = {};
    const overdue: VisionBoardEntry[] = [];
    const noDate: VisionBoardEntry[] = [];

    entries.forEach(entry => {
      if (!entry.targetDate) {
        noDate.push(entry);
        return;
      }

      const targetDate = parseISO(entry.targetDate);
      if (!isValid(targetDate)) {
        noDate.push(entry);
        return;
      }

      // Check if overdue
      if (differenceInDays(targetDate, new Date()) < 0) {
        overdue.push(entry);
        return;
      }

      // Find matching period
      const matchingPeriod = timelinePeriods.find(period => 
        targetDate >= period.startDate && targetDate <= period.endDate
      );

      if (matchingPeriod) {
        if (!grouped[matchingPeriod.id]) {
          grouped[matchingPeriod.id] = [];
        }
        grouped[matchingPeriod.id].push(entry);
      } else {
        // Future dates beyond our periods
        if (!grouped['future']) grouped['future'] = [];
        grouped['future'].push(entry);
      }
    });

    // Sort entries within each group
    Object.keys(grouped).forEach(periodId => {
      grouped[periodId].sort((a, b) => {
        switch (sortBy) {
          case 'progress':
            return (b.progressPercentage || 0) - (a.progressPercentage || 0);
          case 'priority':
            // Assume importance level affects priority
            const priorityA = a.importance?.length || 0;
            const priorityB = b.importance?.length || 0;
            return priorityB - priorityA;
          default: // date
            if (!a.targetDate || !b.targetDate) return 0;
            return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        }
      });
    });

    return { grouped, overdue, noDate };
  }, [entries, timelinePeriods, sortBy]);

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'text-green-600 bg-green-100';
    if (progress >= 50) return 'text-blue-600 bg-blue-100';
    if (progress >= 25) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const EntryCard = ({ entry }: { entry: VisionBoardEntry }) => (
    <motion.div
      key={entry.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={() => onEntryClick(entry)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex">
        {/* Image Section */}
        {entry.imageUrl && (
          <div className="w-20 h-16 flex-shrink-0">
            <ProgressLinkedImage
              imageUrl={entry.imageUrl}
              progress={entry.progressPercentage || 0}
              className="w-full h-full"
              showOverlay={false}
            />
          </div>
        )}
        
        {/* Content Section */}
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                {entry.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {entry.description}
              </p>
            </div>
            
            <div className="ml-2 flex-shrink-0">
              <div className={`text-xs px-2 py-1 rounded-full ${getProgressColor(entry.progressPercentage || 0)}`}>
                {entry.progressPercentage || 0}%
              </div>
            </div>
          </div>
          
          {/* Countdown */}
          {entry.targetDate && (
            <div className="mt-2">
              <CountdownClock
                targetDate={entry.targetDate}
                size="small"
                theme="minimal"
              />
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 self-center px-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </motion.div>
  );

  const PeriodSection = ({ period, entries }: { period: TimelinePeriod; entries: VisionBoardEntry[] }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${period.bgColor} rounded-xl p-4 space-y-3`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${period.color} font-bold text-lg`}>
            {period.name}
          </div>
          <div className="text-xs text-gray-500">
            {format(period.startDate, 'MMM d')} - {format(period.endDate, 'MMM d')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{entries.length} goals</span>
          <div className={`w-8 h-8 rounded-full ${period.color.replace('text-', 'bg-').replace('-600', '-100')} flex items-center justify-center`}>
            <Target className={`h-4 w-4 ${period.color}`} />
          </div>
        </div>
      </div>
      
      <div className="grid gap-2">
        <AnimatePresence>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <EntryCard entry={entry} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-lg text-gray-800">Timeline View</h3>
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: 'date' | 'progress' | 'priority') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">By Date</SelectItem>
              <SelectItem value="progress">By Progress</SelectItem>
              <SelectItem value="priority">By Priority</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overdue Section */}
      {groupedEntries.overdue.length > 0 && (
        <PeriodSection
          period={{
            id: 'overdue',
            name: 'Overdue',
            startDate: new Date(),
            endDate: new Date(),
            color: 'text-red-600',
            bgColor: 'bg-red-50 border border-red-200'
          }}
          entries={groupedEntries.overdue}
        />
      )}

      {/* Timeline Periods */}
      {timelinePeriods.map(period => {
        const periodEntries = groupedEntries.grouped[period.id];
        if (!periodEntries || periodEntries.length === 0) return null;
        
        return (
          <PeriodSection
            key={period.id}
            period={period}
            entries={periodEntries}
          />
        );
      })}

      {/* Future Section */}
      {groupedEntries.grouped['future'] && groupedEntries.grouped['future'].length > 0 && (
        <PeriodSection
          period={{
            id: 'future',
            name: 'Future Goals',
            startDate: new Date(),
            endDate: new Date(),
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
          }}
          entries={groupedEntries.grouped['future']}
        />
      )}

      {/* No Date Section */}
      {groupedEntries.noDate.length > 0 && (
        <PeriodSection
          period={{
            id: 'no-date',
            name: 'Someday/Maybe',
            startDate: new Date(),
            endDate: new Date(),
            color: 'text-gray-600',
            bgColor: 'bg-gray-50'
          }}
          entries={groupedEntries.noDate}
        />
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline entries</h3>
          <p className="text-gray-500">Add vision board entries with target dates to see your timeline.</p>
        </div>
      )}
    </div>
  );
};

export default TimelineView;

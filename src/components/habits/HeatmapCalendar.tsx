/**
 * HeatmapCalendar Component
 * Lightweight calendar heatmap for habit visualization
 */

import React, { memo, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '../../types/habit';

interface HeatmapCalendarProps {
  habit: Habit;
  weeks?: number;
  className?: string;
  interactive?: boolean;
}

export const HeatmapCalendar = memo<HeatmapCalendarProps>(({ 
  habit, 
  weeks = 12,
  className = '',
  interactive = false
}) => {
  const [currentOffset, setCurrentOffset] = useState(0);
  
  const maxWeeks = interactive ? 52 : weeks; // Show up to 1 year if interactive
  const displayWeeks = interactive ? weeks : weeks;
  const data = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - ((maxWeeks + currentOffset) * 7));
    
    const days = [];
    const currentDate = new Date(startDate);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - (currentOffset * 7));
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const value = habit.logs[dateStr];
      
      let intensity = 0;
      let status = 'none';
      
      if (habit.type === 'good') {
        if (habit.trackMode === 'binary') {
          if (value === 1) {
            intensity = 4;
            status = 'completed';
          } else if (value === 0) {
            intensity = 1;
            status = 'skipped';
          } else {
            intensity = 0;
            status = 'none';
          }
        } else if (habit.trackMode === 'count' && habit.target.times) {
          const progress = (value || 0) / habit.target.times;
          if (progress >= 1) {
            intensity = 4;
            status = 'completed';
          } else if (progress > 0) {
            intensity = Math.max(1, Math.floor(progress * 4));
            status = 'partial';
          } else {
            intensity = value === 0 ? 1 : 0;
            status = value === 0 ? 'skipped' : 'none';
          }
        } else if (habit.trackMode === 'duration' && habit.target.minutes) {
          const progress = (value || 0) / habit.target.minutes;
          if (progress >= 1) {
            intensity = 4;
            status = 'completed';
          } else if (progress > 0) {
            intensity = Math.max(1, Math.floor(progress * 4));
            status = 'partial';
          } else {
            intensity = value === 0 ? 1 : 0;
            status = value === 0 ? 'skipped' : 'none';
          }
        }
      } else {
        // Bad habits: lower is better, show when user gave in
        if (value === 0 || value === undefined) {
          intensity = 4;
          status = 'avoided';
        } else {
          intensity = Math.min(1, value || 0); // Red for giving in
          status = 'failed';
        }
      }
      
      days.push({
        date: dateStr,
        value: value || 0,
        intensity,
        status,
        day: currentDate.getDay(),
        week: Math.floor(days.length / 7)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days.slice(-displayWeeks * 7); // Show only the requested weeks
  }, [habit, maxWeeks, displayWeeks, currentOffset]);

  const getColor = (intensity: number, status: string) => {
    if (habit.type === 'good') {
      if (status === 'skipped') {
        return 'bg-red-200 dark:bg-red-900 border border-red-300 dark:border-red-700';
      }
      const colors = [
        'bg-gray-100 dark:bg-gray-800',
        'bg-green-200 dark:bg-green-900',
        'bg-green-400 dark:bg-green-700',
        'bg-green-600 dark:bg-green-600',
        'bg-green-800 dark:bg-green-500'
      ];
      return colors[intensity];
    } else {
      // Bad habits
      if (status === 'failed') {
        return 'bg-red-300 dark:bg-red-800 border border-red-400 dark:border-red-600';
      }
      const colors = [
        'bg-gray-100 dark:bg-gray-800',
        'bg-red-200 dark:bg-red-900',
        'bg-yellow-300 dark:bg-yellow-700',
        'bg-green-400 dark:bg-green-700',
        'bg-green-600 dark:bg-green-600'
      ];
      return colors[intensity];
    }
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    
    for (let week = 0; week < displayWeeks; week++) {
      const weekData = data.filter(d => d.week === week);
      if (weekData.length > 0) {
        const month = new Date(weekData[0].date).getMonth();
        if (month !== lastMonth) {
          labels.push({ week, month: new Date(weekData[0].date).toLocaleDateString('en', { month: 'short' }) });
          lastMonth = month;
        }
      }
    }
    return labels;
  }, [data, displayWeeks]);
  
  const canNavigateBack = interactive && currentOffset < 40; // Up to ~10 months back
  const canNavigateForward = interactive && currentOffset > 0;

  const getStatusTooltip = (day: any) => {
    const date = new Date(day.date).toLocaleDateString();
    if (habit.type === 'good') {
      if (day.status === 'completed') return `${date}: ✅ Completed (${day.value})`;
      if (day.status === 'partial') return `${date}: 🟡 Partial (${day.value}/${habit.target.times || habit.target.minutes})`;
      if (day.status === 'skipped') return `${date}: ❌ Skipped`;
      return `${date}: ⚪ No data`;
    } else {
      if (day.status === 'avoided') return `${date}: ✅ Successfully avoided`;
      if (day.status === 'failed') return `${date}: ❌ Gave in (${day.value} times)`;
      return `${date}: ⚪ No data`;
    }
  };
  
  return (
    <div className={`${className}`}>
      {interactive && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCurrentOffset(Math.min(currentOffset + 4, 40))}
            disabled={!canNavigateBack}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
              canNavigateBack 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={14} />
            Earlier
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentOffset === 0 ? 'Recent' : `${currentOffset * 7} days ago`}
          </div>
          <button
            onClick={() => setCurrentOffset(Math.max(currentOffset - 4, 0))}
            disabled={!canNavigateForward}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
              canNavigateForward 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            Recent
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-between mr-2 text-xs text-gray-500 dark:text-gray-400">
          {weekDays.map((day, i) => (
            <div key={i} className="h-3 leading-3">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="flex-1 overflow-x-auto">
          {/* Month labels */}
          <div className="flex mb-1 text-xs text-gray-500 dark:text-gray-400 min-w-max">
            {monthLabels.map(({ week, month }) => (
              <div key={week} style={{ marginLeft: `${week * 13}px` }}>
                {month}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-0.5 min-w-max">
            {Array.from({ length: displayWeeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = data.find(d => d.week === weekIndex && d.day === dayIndex);
                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getColor(day.intensity, day.status)} 
                        hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 dark:hover:ring-blue-500 
                        transition-all cursor-pointer`}
                      title={getStatusTooltip(day)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Enhanced Legend */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{habit.type === 'good' ? 'Completion' : 'Avoidance'}</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`w-3 h-3 rounded-sm ${getColor(i, 'normal')}`} />
            ))}
          </div>
          <span>{habit.type === 'good' ? 'Perfect' : 'Avoided'}</span>
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {habit.type === 'good' ? (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900 border border-red-300 dark:border-red-700"></div>
              <span>Skipped</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-300 dark:bg-red-800 border border-red-400 dark:border-red-600"></div>
              <span>Gave In</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

HeatmapCalendar.displayName = 'HeatmapCalendar';

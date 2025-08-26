/**
 * HeatmapCalendar Component
 * Lightweight calendar heatmap for habit visualization
 */

import React, { memo, useMemo } from 'react';
import { Habit } from '../../types/habit';

interface HeatmapCalendarProps {
  habit: Habit;
  weeks?: number;
  className?: string;
}

export const HeatmapCalendar = memo<HeatmapCalendarProps>(({ 
  habit, 
  weeks = 12,
  className = ''
}) => {
  const data = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const value = habit.logs[dateStr];
      
      let intensity = 0;
      if (habit.type === 'good') {
        if (habit.trackMode === 'binary') {
          intensity = value === 1 ? 4 : 0;
        } else if (habit.trackMode === 'count' && habit.target.times) {
          intensity = Math.min(4, Math.floor((value || 0) / habit.target.times * 4));
        } else if (habit.trackMode === 'duration' && habit.target.minutes) {
          intensity = Math.min(4, Math.floor((value || 0) / habit.target.minutes * 4));
        }
      } else {
        // Bad habits: lower is better
        intensity = value === 0 || value === undefined ? 4 : 0;
      }
      
      days.push({
        date: dateStr,
        value: value || 0,
        intensity,
        day: currentDate.getDay(),
        week: Math.floor(days.length / 7)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [habit, weeks]);

  const getColor = (intensity: number) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-green-200 dark:bg-green-900',
      'bg-green-400 dark:bg-green-700',
      'bg-green-600 dark:bg-green-600',
      'bg-green-800 dark:bg-green-500'
    ];
    return colors[intensity];
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    
    for (let week = 0; week < weeks; week++) {
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
  }, [data, weeks]);

  return (
    <div className={`${className}`}>
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
        <div className="flex-1">
          {/* Month labels */}
          <div className="flex mb-1 text-xs text-gray-500 dark:text-gray-400">
            {monthLabels.map(({ week, month }) => (
              <div key={week} style={{ marginLeft: `${week * 13}px` }}>
                {month}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-0.5">
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = data.find(d => d.week === weekIndex && d.day === dayIndex);
                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getColor(day.intensity)} 
                        hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 dark:hover:ring-blue-500 
                        transition-all cursor-pointer`}
                      title={`${day.date}: ${day.value}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`w-3 h-3 rounded-sm ${getColor(i)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
});

HeatmapCalendar.displayName = 'HeatmapCalendar';

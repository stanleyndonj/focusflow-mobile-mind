
import React, { lazy, Suspense } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProcrastinationForm from '@/components/insights/ProcrastinationForm';
import ProcrastinationList from '@/components/insights/ProcrastinationList';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

// Lazy load the HabitDashboard for better performance
const HabitDashboard = lazy(() => import('@/components/habits/HabitDashboard').then(module => ({ default: module.HabitDashboard })));

const InsightsPage: React.FC = () => {
  const { state: { entries } } = useProcrastination();
  
  // Generate mood data for the chart
  const moodCounts: { [key: string]: number } = {};
  entries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });
  
  const moodData = Object.entries(moodCounts).map(([mood, count]) => ({
    name: mood.charAt(0).toUpperCase() + mood.slice(1),
    value: count
  }));
  
  const MOOD_COLORS = {
    Frustrated: '#EF4444', // red
    Bored: '#F59E0B',      // yellow
    Anxious: '#8B5CF6',    // purple
    Tired: '#3B82F6',      // blue
    Distracted: '#10B981'  // green
  };
  
  // Count overcome vs. not overcome
  const overcomeCount = entries.filter(entry => entry.overcome).length;
  const notOvercomeCount = entries.filter(entry => !entry.overcome).length;
  
  const outcomeData = [
    { name: 'Overcome', value: overcomeCount },
    { name: 'Not yet', value: notOvercomeCount }
  ];
  
  const OUTCOME_COLORS = ['#10B981', '#6B7280']; // green, gray
  
  return (
    <MobileLayout>
      <div className="p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground text-sm">Track habits and overcome procrastination</p>
        </div>
      
      <Tabs defaultValue="habits">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="habits" className="mt-4">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <HabitDashboard />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="log" className="mt-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-medium mb-3">Log Procrastination</h2>
            <p className="text-sm text-gray-500 mb-4">
              Feeling the urge to procrastinate? Log it here to understand your patterns.
            </p>
            <ProcrastinationForm />
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <ProcrastinationList />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">
                No data yet. Log some procrastination entries to see statistics.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-medium mb-3">Mood Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {moodData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={MOOD_COLORS[entry.name as keyof typeof MOOD_COLORS]} 
                          />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-medium mb-3">Success Rate</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={outcomeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {outcomeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={OUTCOME_COLORS[index]} 
                          />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </MobileLayout>
  );
};

export default InsightsPage;

import React, { useMemo } from 'react';
import MobileLayout from '../components/layout/MobileLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useHabitTracker } from '../hooks/useHabitTracker';
import { HabitCard } from '../components/habits/HabitCard';
import { RecommendationsPanel } from '../components/habits/RecommendationsPanel';
import { AddEditHabitModal } from '../components/habits/AddEditHabitModal';
import { HabitDetail } from '../components/habits/HabitDetail';
import { Habit } from '../types/habit';
import { Target, Zap, Brain } from 'lucide-react';

const ProcastinationPage: React.FC = () => {
  const { habits, addHabit, updateHabit, deleteHabit, logHabit } = useHabitTracker();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingHabit, setEditingHabit] = React.useState<Habit | undefined>();
  const [detailHabit, setDetailHabit] = React.useState<Habit | undefined>();
  const today = new Date().toISOString().split('T')[0];

  const procrastinationHabits = useMemo(() => {
    const keywords = ['focus', 'work', 'task', 'productive', 'distraction', 'social media', 'procrastinat'];
    return habits.filter(h => keywords.some(keyword => h.title.toLowerCase().includes(keyword)));
  }, [habits]);

  const quickTemplates = [
    { title: '2-Minute Rule', type: 'good', trackMode: 'count', target: 5, color: '#10b981' },
    { title: 'Deep Work Session', type: 'good', trackMode: 'duration', target: 90, color: '#3b82f6' },
    { title: 'Pomodoro Technique', type: 'good', trackMode: 'count', target: 4, color: '#8b5cf6' },
    { title: 'Social Media Check', type: 'bad', trackMode: 'count', target: 3, color: '#ef4444' }
  ];

  const handleQuickAdd = (template: typeof quickTemplates[0]) => {
    addHabit({
      title: template.title,
      type: template.type as any,
      trackMode: template.trackMode as any,
      target: {
        period: 'daily',
        ...(template.trackMode === 'count' && { times: template.target }),
        ...(template.trackMode === 'duration' && { minutes: template.target })
      },
      settings: { color: template.color }
    });
  };

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Beat Procrastination</h1>
          <p className="text-sm text-muted-foreground">Build focus habits</p>
        </div>

        <Tabs defaultValue="habits">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="mt-4 space-y-4">
            <button onClick={() => setShowAddModal(true)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium">
              + Add Focus Habit
            </button>

            {procrastinationHabits.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium">No Focus Habits Yet</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {procrastinationHabits.map(habit => (
                  <HabitCard key={habit.id} habit={habit}
                    onQuickLog={(id, val) => logHabit(id, today, val)}
                    onEdit={setEditingHabit} onDetail={setDetailHabit} today={today} />
                ))}
              </div>
            )}
            <RecommendationsPanel habits={procrastinationHabits} />
          </TabsContent>

          <TabsContent value="templates" className="mt-4 space-y-3">
            {quickTemplates.map((template, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{template.title}</h3>
                    <p className="text-sm text-gray-500">
                      {template.trackMode === 'count' ? `${template.target} times` : `${template.target} min`}
                    </p>
                  </div>
                  <button onClick={() => handleQuickAdd(template)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">
                    Add
                  </button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <AddEditHabitModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={addHabit} />
        <AddEditHabitModal isOpen={!!editingHabit} onClose={() => setEditingHabit(undefined)} 
          onSave={updateHabit} habit={editingHabit} />
        {detailHabit && (
          <HabitDetail habit={detailHabit} isOpen={!!detailHabit} onClose={() => setDetailHabit(undefined)}
            onEdit={setEditingHabit} onDelete={deleteHabit} onLog={logHabit} />
        )}
      </div>
    </MobileLayout>
  );
};

export default ProcastinationPage;

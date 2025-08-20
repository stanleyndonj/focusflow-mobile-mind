import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Edit3, Save, X, Heart, Star, Target, Lightbulb, Quote, Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisionBoardEntry } from '@/contexts/VisionBoardContext';
import { format } from 'date-fns';

interface ManifestationJournalProps {
  entry: VisionBoardEntry;
  onUpdateEntry: (entry: VisionBoardEntry) => void;
  theme?: string;
}

interface JournalPrompt {
  id: string;
  title: string;
  question: string;
  icon: React.ReactNode;
  category: string;
}

const JOURNAL_PROMPTS: JournalPrompt[] = [
  {
    id: 'why-matters',
    title: 'Why This Matters',
    question: 'Why is this vision important to you? What will achieving this mean for your life?',
    icon: <Heart className="h-4 w-4" />,
    category: 'meaning'
  },
  {
    id: 'how-achieve',
    title: 'How to Achieve',
    question: 'What specific steps will you take to make this vision reality? Break it down.',
    icon: <Target className="h-4 w-4" />,
    category: 'strategy'
  },
  {
    id: 'obstacles',
    title: 'Obstacles & Solutions',
    question: 'What challenges might you face? How will you overcome them?',
    icon: <Lightbulb className="h-4 w-4" />,
    category: 'planning'
  },
  {
    id: 'success-looks-like',
    title: 'Success Looks Like',
    question: 'How will you know when you\'ve achieved this? What will success feel like?',
    icon: <Star className="h-4 w-4" />,
    category: 'vision'
  },
  {
    id: 'daily-actions',
    title: 'Daily Actions',
    question: 'What can you do every day to move closer to this goal?',
    icon: <Target className="h-4 w-4" />,
    category: 'habits'
  },
  {
    id: 'affirmation',
    title: 'Affirmation',
    question: 'Write a powerful affirmation that embodies this vision as if it\'s already true.',
    icon: <Quote className="h-4 w-4" />,
    category: 'mindset'
  }
];

const ManifestationJournal: React.FC<ManifestationJournalProps> = ({
  entry,
  onUpdateEntry,
  theme = 'default'
}) => {
  const [activeTab, setActiveTab] = useState('prompts');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editingCustom, setEditingCustom] = useState<string | null>(null);
  const [newCustomNote, setNewCustomNote] = useState({ title: '', content: '' });
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const getJournalResponse = (promptId: string): string => {
    const journalEntry = entry.journalEntries?.find(j => j.prompt === promptId);
    return journalEntry?.content || '';
  };

  const saveJournalResponse = (promptId: string, content: string) => {
    const updatedJournalEntries = [...(entry.journalEntries || [])];
    const existingIndex = updatedJournalEntries.findIndex(j => j.prompt === promptId);
    
    if (existingIndex >= 0) {
      updatedJournalEntries[existingIndex] = {
        ...updatedJournalEntries[existingIndex],
        content,
        createdAt: new Date().toISOString()
      };
    } else {
      updatedJournalEntries.push({
        id: `${Date.now()}-${Math.random()}`,
        content,
        prompt: promptId,
        createdAt: new Date().toISOString()
      });
    }

    onUpdateEntry({
      ...entry,
      journalEntries: updatedJournalEntries
    });
  };

  const saveCustomNote = () => {
    if (!newCustomNote.title.trim() || !newCustomNote.content.trim()) return;

    const updatedJournalEntries = [...(entry.journalEntries || [])];
    updatedJournalEntries.push({
      id: `${Date.now()}-${Math.random()}`,
      content: newCustomNote.content,
      prompt: newCustomNote.title,
      createdAt: new Date().toISOString()
    });

    onUpdateEntry({
      ...entry,
      journalEntries: updatedJournalEntries
    });

    setNewCustomNote({ title: '', content: '' });
    setIsAddingCustom(false);
  };

  const deleteCustomNote = (id: string) => {
    const updatedJournalEntries = entry.journalEntries?.filter(j => j.id !== id) || [];
    onUpdateEntry({
      ...entry,
      journalEntries: updatedJournalEntries
    });
  };

  const PromptCard = ({ prompt }: { prompt: JournalPrompt }) => {
    const isEditing = editingPrompt === prompt.id;
    const response = getJournalResponse(prompt.id);
    const hasResponse = response.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hasResponse ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {prompt.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
                <Badge variant="outline" className="mt-1 text-xs">
                  {prompt.category}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingPrompt(isEditing ? null : prompt.id)}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-3">{prompt.question}</p>
        </div>

        <div className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={response}
                onChange={(e) => saveJournalResponse(prompt.id, e.target.value)}
                placeholder="Write your thoughts here..."
                className="min-h-32 resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPrompt(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {hasResponse ? (
                <div className="prose prose-sm">
                  <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
                  <div className="text-xs text-gray-500 mt-3">
                    Last updated: {format(new Date(entry.journalEntries?.find(j => j.prompt === prompt.id)?.createdAt || new Date()), 'MMM d, yyyy')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Click edit to start writing</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const customNotes = entry.journalEntries?.filter(j => !JOURNAL_PROMPTS.find(p => p.id === j.prompt)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <BookOpen className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Manifestation Journal</h2>
          <p className="text-sm text-gray-600">Explore your vision deeply and plan for success</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prompts">Guided Prompts</TabsTrigger>
          <TabsTrigger value="custom">My Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-4">
          <div className="grid gap-4">
            {JOURNAL_PROMPTS.map(prompt => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Personal Notes</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingCustom(true)}
              disabled={isAddingCustom}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>

          {/* Add Custom Note Form */}
          <AnimatePresence>
            {isAddingCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-50 rounded-lg p-4 space-y-3"
              >
                <div>
                  <Label>Note Title</Label>
                  <Input
                    value={newCustomNote.title}
                    onChange={(e) => setNewCustomNote({ ...newCustomNote, title: e.target.value })}
                    placeholder="What's this note about?"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={newCustomNote.content}
                    onChange={(e) => setNewCustomNote({ ...newCustomNote, content: e.target.value })}
                    placeholder="Write your thoughts..."
                    className="min-h-24"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setNewCustomNote({ title: '', content: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveCustomNote}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Notes List */}
          <div className="space-y-3">
            {customNotes.length > 0 ? (
              customNotes.map(note => (
                <Card key={note.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{note.prompt}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCustom(editingCustom === note.id ? null : note.id)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCustomNote(note.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingCustom === note.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={note.content}
                          onChange={(e) => {
                            const updatedEntries = entry.journalEntries?.map(j => 
                              j.id === note.id ? { ...j, content: e.target.value } : j
                            ) || [];
                            onUpdateEntry({ ...entry, journalEntries: updatedEntries });
                          }}
                          className="min-h-20"
                        />
                        <Button
                          size="sm"
                          onClick={() => setEditingCustom(null)}
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {format(new Date(note.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No personal notes yet</h3>
                <p className="text-sm">Add custom notes to capture your unique insights</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManifestationJournal;

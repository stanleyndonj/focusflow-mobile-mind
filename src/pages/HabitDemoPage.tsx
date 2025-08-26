/**
 * HabitDemoPage Component
 * Demo page showcasing the Habit Tracker with sample data
 */

import React, { useEffect, useState } from 'react';
import MobileLayout from '../components/layout/MobileLayout';
import { HabitDashboard } from '../components/habits/HabitDashboard';
import { loadDemoData, DEMO_HABITS } from '../utils/habitDemoData';
import { Sparkles, RefreshCw, Database, CheckCircle } from 'lucide-react';

const HabitDemoPage: React.FC = () => {
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLoadDemo = () => {
    loadDemoData();
    setDemoLoaded(true);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    // Force a page refresh to load the demo data into the context
    setTimeout(() => window.location.reload(), 500);
  };

  const handleClearData = () => {
    localStorage.removeItem('ff_habits_v1');
    setDemoLoaded(false);
    setTimeout(() => window.location.reload(), 500);
  };

  useEffect(() => {
    // Check if demo data is already loaded
    const data = localStorage.getItem('ff_habits_v1');
    if (data) {
      const parsed = JSON.parse(data);
      setDemoLoaded(parsed.habits && parsed.habits.length > 0);
    }
  }, []);

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="text-yellow-500" />
            Habit Tracker Demo
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Explore the habit tracker with sample data
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
          rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6">
          <h2 className="font-medium text-gray-900 dark:text-white mb-3">Demo Controls</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleLoadDemo}
              disabled={demoLoaded}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                demoLoaded 
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              <Database size={18} />
              {demoLoaded ? 'Demo Data Loaded' : 'Load Sample Habits'}
            </button>

            {demoLoaded && (
              <button
                onClick={handleClearData}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={18} />
                Clear All Data
              </button>
            )}
          </div>

          {showSuccess && (
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              <span className="text-sm text-green-700 dark:text-green-300">
                Demo data loaded successfully! Refreshing...
              </span>
            </div>
          )}

          <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Habits Include:</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>✅ Morning Meditation (20 min daily)</li>
              <li>✅ Read Technical Books (30 min daily)</li>
              <li>✅ Exercise (3x per week)</li>
              <li>✅ Drink Water (8 glasses daily)</li>
              <li>❌ Social Media Scrolling (limit to 30 min)</li>
              <li>❌ Late Night Snacking (break this habit)</li>
            </ul>
          </div>
        </div>

        {/* Main Dashboard */}
        {demoLoaded ? (
          <div className="space-y-4">
            <HabitDashboard />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Habits Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Load the sample data to explore the habit tracker features
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default HabitDemoPage;

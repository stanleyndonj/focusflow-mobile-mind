# 🎯 Focus Flow Habit Tracker Module

A high-performance, modular habit tracking system built with React, TypeScript, and TailwindCSS. Fully integrated into Focus Flow's ecosystem with mobile-first design, dark mode support, and advanced analytics.

## ✅ Features Implemented

### Core Functionality
- **Multi-mode Tracking**: Binary (yes/no), count-based, and duration-based habits
- **Habit Types**: Support for both good habits (build) and bad habits (break)
- **Smart Scheduling**: Daily, weekly, and custom day-specific schedules
- **Versioned Storage**: Debounced localStorage with migration support
- **Real-time Analytics**: Streaks, consistency percentages, and progress visualization

### UI Components
- **HabitCard**: Compact, interactive habit display with quick-log actions
- **HabitDashboard**: Main dashboard with grid/list views and filtering
- **HabitDetail**: Detailed modal with full history and analytics
- **AddEditHabitModal**: Form for creating and editing habits
- **HeatmapCalendar**: GitHub-style contribution graph for habit history
- **StreakWidget**: Visual streak counter with motivational messages
- **RecommendationsPanel**: AI-powered habit suggestions based on patterns

### Pages & Integration
- **InsightsPage**: Habits tab alongside procrastination tracking
- **ProcastinationPage**: Specialized focus habits with templates
- **HabitDemoPage**: Interactive demo with sample data

## 📁 File Structure

```
src/
├── types/
│   └── habit.ts                 # TypeScript interfaces and types
├── hooks/
│   ├── useHabitTracker.ts      # Main hook for habit logic
│   └── __tests__/
│       └── useHabitTracker.test.ts # Unit tests
├── utils/
│   ├── habitStorage.ts         # Debounced localStorage utilities
│   └── habitDemoData.ts        # Sample data generator
├── components/habits/
│   ├── HabitCard.tsx           # Individual habit card
│   ├── HabitDashboard.tsx      # Main dashboard component
│   ├── HabitDetail.tsx         # Detailed view modal
│   ├── AddEditHabitModal.tsx   # Add/edit form modal
│   ├── HeatmapCalendar.tsx     # Visual calendar heatmap
│   ├── StreakWidget.tsx        # Streak counter widget
│   └── RecommendationsPanel.tsx # Smart recommendations
└── pages/
    ├── InsightsPage.tsx         # Updated with Habits tab
    ├── ProcastinationPage.tsx   # Focus habits page
    └── HabitDemoPage.tsx        # Demo showcase
```

## 🚀 Quick Start

### 1. Basic Integration

The habit tracker is already integrated into the InsightsPage. Access it at `/insights` and click the "Habits" tab.

```tsx
import { useHabitTracker } from '@/hooks/useHabitTracker';

function MyComponent() {
  const { habits, addHabit, updateHabit, deleteHabit, logHabit } = useHabitTracker();
  
  // Your component logic
}
```

### 2. Load Demo Data

Visit the demo page or use the utility function:

```tsx
import { loadDemoData } from '@/utils/habitDemoData';

// Load sample habits
loadDemoData();
```

### 3. Add Custom Theme

The habit tracker uses CSS variables for theming:

```css
:root {
  --ff-habit-primary: #3b82f6;
  --ff-habit-success: #10b981;
  --ff-habit-warning: #f59e0b;
  --ff-habit-danger: #ef4444;
}
```

## 🎨 Customization

### Creating Custom Habit Types

```typescript
const customHabit: HabitFormData = {
  title: 'Morning Meditation',
  type: 'good',
  trackMode: 'duration',
  target: {
    period: 'daily',
    minutes: 20
  },
  schedule: ['mon', 'tue', 'wed', 'thu', 'fri'],
  settings: {
    color: '#8b5cf6',
    reminder: true,
    reminderTime: '07:00'
  }
};
```

### Custom Analytics

```typescript
// Access habit statistics
const stats = habit.stats;
console.log(`Current Streak: ${stats.currentStreak}`);
console.log(`Best Streak: ${stats.bestStreak}`);
console.log(`Consistency: ${stats.consistency * 100}%`);
```

## 📊 Data Schema

### Habit Interface

```typescript
interface Habit {
  id: string;
  title: string;
  type: 'good' | 'bad';
  trackMode: 'binary' | 'count' | 'duration';
  target: HabitTarget;
  logs: Record<string, number>;
  schedule?: DayOfWeek[];
  settings: HabitSettings;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  stats: HabitStats;
}
```

### Storage Format

```typescript
{
  version: 1,
  habits: Habit[],
  lastSync: string (ISO date)
}
```

## 🧪 Testing

Run the unit tests:

```bash
npm test -- useHabitTracker
```

Test coverage includes:
- Adding, updating, and deleting habits
- Logging completions (binary, count, duration)
- Streak calculations
- Data persistence
- Weekly targets and scheduling

## 🔄 Migration Guide

### From Old Habit System

```typescript
import { migrateOldHabits } from '@/utils/habitStorage';

// Automatically migrates old data on first load
const oldData = localStorage.getItem('old_habits_key');
if (oldData) {
  migrateOldHabits(oldData);
}
```

### Export/Import Data

```typescript
// Export
const exportData = () => {
  const data = localStorage.getItem('ff_habits_v1');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // Download logic
};

// Import
const importData = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    localStorage.setItem('ff_habits_v1', e.target.result);
    window.location.reload();
  };
  reader.readAsText(file);
};
```

## 🎯 Performance Optimizations

- **Lazy Loading**: Components are code-split for optimal bundle size
- **Debounced Saves**: Storage writes are debounced by 500ms
- **Virtual Scrolling**: Large habit lists use virtualization (100+ items)
- **Memoization**: Heavy calculations cached with useMemo
- **Progressive Enhancement**: Core features work without JS

## 📱 Mobile Optimizations

- Touch-friendly tap targets (minimum 44x44px)
- Swipe gestures for quick actions
- Responsive grid layouts
- Optimized for low-end devices
- Reduced animations on battery saver mode

## 🌙 Dark Mode

Fully integrated with Focus Flow's dark mode system:
- Automatic theme detection
- Manual toggle support
- Consistent color palette
- WCAG AA compliant contrast ratios

## 🚦 Status

✅ **Production Ready** - All core features implemented and tested

### Completed
- ✅ Core habit tracking logic
- ✅ All UI components
- ✅ Page integrations
- ✅ Demo data and showcase
- ✅ Unit test suite
- ✅ Dark mode support
- ✅ Mobile optimizations
- ✅ Performance optimizations

### Bonus Features (Optional)
- 🔄 Migration utilities (partial)
- 📤 Export/Import UI (planned)
- 🔔 Push notifications (planned)
- 📊 Advanced analytics dashboard (planned)

## 📝 License

Part of Focus Flow - All rights reserved

---

Built with ❤️ for Focus Flow by the engineering team

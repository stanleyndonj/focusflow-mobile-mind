/**
 * Gamification Storage Service
 * Handles persistent storage for all gamification data
 */

import { 
  Quest, 
  ProductivityCompanion, 
  StoreItem, 
  Purchase,
  ShadowModeState,
  DayStreakState,
  ShadowSession,
  AccountabilityReflection,
  ShadowSelf,
  EnhancedGameStats,
  DailyPrediction
} from '@/types/GameTypes';

interface StorageKeys {
  GAME_STATS: 'focusflow_game_stats';
  QUESTS: 'focusflow_quests';
  COMPANION: 'focusflow_companion';
  STORE_ITEMS: 'focusflow_store_items';
  PURCHASES: 'focusflow_purchases';
  SHADOW_MODE: 'focusflow_shadow_mode';
  DAY_STREAK: 'focusflow_day_streak';
  SHADOW_SESSIONS: 'focusflow_shadow_sessions';
  REFLECTIONS: 'focusflow_reflections';
  SHADOW_CHALLENGES: 'focusflow_shadow_challenges';
  DAILY_PREDICTION: 'focusflow_daily_prediction';
  MIND_LOCK_SESSIONS: 'focusflow_mindlock_sessions';
  FROG_MODE_STATE: 'focusflow_frog_mode';
  LAST_SYNC: 'focusflow_last_sync';
}

const STORAGE_KEYS: StorageKeys = {
  GAME_STATS: 'focusflow_game_stats',
  QUESTS: 'focusflow_quests',
  COMPANION: 'focusflow_companion',
  STORE_ITEMS: 'focusflow_store_items',
  PURCHASES: 'focusflow_purchases',
  SHADOW_MODE: 'focusflow_shadow_mode',
  DAY_STREAK: 'focusflow_day_streak',
  SHADOW_SESSIONS: 'focusflow_shadow_sessions',
  REFLECTIONS: 'focusflow_reflections',
  SHADOW_CHALLENGES: 'focusflow_shadow_challenges',
  DAILY_PREDICTION: 'focusflow_daily_prediction',
  MIND_LOCK_SESSIONS: 'focusflow_mindlock_sessions',
  FROG_MODE_STATE: 'focusflow_frog_mode',
  LAST_SYNC: 'focusflow_last_sync'
};

class GamificationStorage {
  private static instance: GamificationStorage;
  private isInitialized = false;
  private syncCallbacks: Array<(data: any) => void> = [];

  private constructor() {}

  static getInstance(): GamificationStorage {
    if (!GamificationStorage.instance) {
      GamificationStorage.instance = new GamificationStorage();
    }
    return GamificationStorage.instance;
  }

  /**
   * Initialize storage service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we need to migrate old data
      await this.migrateOldData();
      
      // Set up auto-save intervals
      this.setupAutoSave();
      
      this.isInitialized = true;
      console.log('GamificationStorage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GamificationStorage:', error);
    }
  }

  /**
   * Save game stats
   */
  async saveGameStats(stats: EnhancedGameStats): Promise<void> {
    try {
      const data = {
        ...stats,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(data));
      await this.triggerSync('game_stats', data);
    } catch (error) {
      console.error('Failed to save game stats:', error);
    }
  }

  /**
   * Load game stats
   */
  async loadGameStats(): Promise<EnhancedGameStats | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_STATS);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('Failed to load game stats:', error);
      return null;
    }
  }

  /**
   * Save quests
   */
  async saveQuests(quests: Quest[]): Promise<void> {
    try {
      const data = {
        quests,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(data));
      await this.triggerSync('quests', data);
    } catch (error) {
      console.error('Failed to save quests:', error);
    }
  }

  /**
   * Load quests
   */
  async loadQuests(): Promise<Quest[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUESTS);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return parsed.quests || [];
    } catch (error) {
      console.error('Failed to load quests:', error);
      return [];
    }
  }

  /**
   * Save companion data
   */
  async saveCompanion(companion: ProductivityCompanion): Promise<void> {
    try {
      const data = {
        ...companion,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.COMPANION, JSON.stringify(data));
      await this.triggerSync('companion', data);
    } catch (error) {
      console.error('Failed to save companion:', error);
    }
  }

  /**
   * Load companion data
   */
  async loadCompanion(): Promise<ProductivityCompanion | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANION);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('Failed to load companion:', error);
      return null;
    }
  }

  /**
   * Save store items and purchases
   */
  async saveStore(items: StoreItem[], purchases: Purchase[]): Promise<void> {
    try {
      const storeData = {
        items,
        lastUpdated: new Date().toISOString()
      };
      const purchaseData = {
        purchases,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.STORE_ITEMS, JSON.stringify(storeData));
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchaseData));
      
      await this.triggerSync('store', { items, purchases });
    } catch (error) {
      console.error('Failed to save store data:', error);
    }
  }

  /**
   * Load store data
   */
  async loadStore(): Promise<{ items: StoreItem[]; purchases: Purchase[] }> {
    try {
      const itemsData = localStorage.getItem(STORAGE_KEYS.STORE_ITEMS);
      const purchasesData = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      
      const items = itemsData ? JSON.parse(itemsData).items || [] : [];
      const purchases = purchasesData ? JSON.parse(purchasesData).purchases || [] : [];
      
      return { items, purchases };
    } catch (error) {
      console.error('Failed to load store data:', error);
      return { items: [], purchases: [] };
    }
  }

  /**
   * Save Shadow Mode state
   */
  async saveShadowMode(shadowMode: ShadowModeState, sessions: ShadowSession[]): Promise<void> {
    try {
      const shadowData = {
        ...shadowMode,
        lastUpdated: new Date().toISOString()
      };
      const sessionsData = {
        sessions,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.SHADOW_MODE, JSON.stringify(shadowData));
      localStorage.setItem(STORAGE_KEYS.SHADOW_SESSIONS, JSON.stringify(sessionsData));
      
      await this.triggerSync('shadow_mode', { shadowMode, sessions });
    } catch (error) {
      console.error('Failed to save shadow mode data:', error);
    }
  }

  /**
   * Load Shadow Mode data
   */
  async loadShadowMode(): Promise<{ shadowMode: ShadowModeState; sessions: ShadowSession[] }> {
    try {
      const shadowData = localStorage.getItem(STORAGE_KEYS.SHADOW_MODE);
      const sessionsData = localStorage.getItem(STORAGE_KEYS.SHADOW_SESSIONS);
      
      const defaultShadowMode: ShadowModeState = {
        isEnabled: true, // Shadow Mode enabled by default
        isActive: false,
        sessionId: null,
        sessionStartTime: null,
        expectedDuration: 0,
        shadowObserverVisible: false,
        currentSessionWins: 0,
        currentSessionLosses: 0,
        totalShadowWins: 0,
        totalShadowLosses: 0,
        lastSessionResult: null
      };
      
      const shadowMode = shadowData ? { ...defaultShadowMode, ...JSON.parse(shadowData) } : defaultShadowMode;
      const sessions = sessionsData ? JSON.parse(sessionsData).sessions || [] : [];
      
      return { shadowMode, sessions };
    } catch (error) {
      console.error('Failed to load shadow mode data:', error);
      return {
        shadowMode: {
          isEnabled: true, // Shadow Mode enabled by default
          isActive: false,
          sessionId: null,
          sessionStartTime: null,
          expectedDuration: 0,
          shadowObserverVisible: false,
          currentSessionWins: 0,
          currentSessionLosses: 0,
          totalShadowWins: 0,
          totalShadowLosses: 0,
          lastSessionResult: null
        },
        sessions: []
      };
    }
  }

  /**
   * Save Day Streak data
   */
  async saveDayStreak(dayStreak: DayStreakState): Promise<void> {
    try {
      const data = {
        ...dayStreak,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.DAY_STREAK, JSON.stringify(data));
      await this.triggerSync('day_streak', data);
    } catch (error) {
      console.error('Failed to save day streak:', error);
    }
  }

  /**
   * Load Day Streak data
   */
  async loadDayStreak(): Promise<DayStreakState> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAY_STREAK);
      if (!data) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          streakSavedWithCoins: 0,
          coinsSavedStreak: 0,
          streakSaveCost: 50,
          canSaveStreak: true,
          todayCompleted: false,
          requiredDailyGoal: {
            tasksCompleted: 3,
            focusMinutes: 60,
            anyActivity: true
          }
        };
      }
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load day streak:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        streakSavedWithCoins: 0,
        coinsSavedStreak: 0,
        streakSaveCost: 50,
        canSaveStreak: true,
        todayCompleted: false,
        requiredDailyGoal: {
          tasksCompleted: 3,
          focusMinutes: 60,
          anyActivity: true
        }
      };
    }
  }

  /**
   * Save reflections and shadow challenges
   */
  async saveReflectionsAndChallenges(
    reflections: AccountabilityReflection[],
    challenges: ShadowSelf[],
    prediction: DailyPrediction | null
  ): Promise<void> {
    try {
      const reflectionData = {
        reflections,
        lastUpdated: new Date().toISOString()
      };
      const challengeData = {
        challenges,
        lastUpdated: new Date().toISOString()
      };
      const predictionData = {
        prediction,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflectionData));
      localStorage.setItem(STORAGE_KEYS.SHADOW_CHALLENGES, JSON.stringify(challengeData));
      localStorage.setItem(STORAGE_KEYS.DAILY_PREDICTION, JSON.stringify(predictionData));
      
      await this.triggerSync('reflections_challenges', { reflections, challenges, prediction });
    } catch (error) {
      console.error('Failed to save reflections and challenges:', error);
    }
  }

  /**
   * Load reflections and challenges
   */
  async loadReflectionsAndChallenges(): Promise<{
    reflections: AccountabilityReflection[];
    challenges: ShadowSelf[];
    prediction: DailyPrediction | null;
  }> {
    try {
      const reflectionData = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
      const challengeData = localStorage.getItem(STORAGE_KEYS.SHADOW_CHALLENGES);
      const predictionData = localStorage.getItem(STORAGE_KEYS.DAILY_PREDICTION);
      
      const reflections = reflectionData ? JSON.parse(reflectionData).reflections || [] : [];
      const challenges = challengeData ? JSON.parse(challengeData).challenges || [] : [];
      const prediction = predictionData ? JSON.parse(predictionData).prediction : null;
      
      return { reflections, challenges, prediction };
    } catch (error) {
      console.error('Failed to load reflections and challenges:', error);
      return { reflections: [], challenges: [], prediction: null };
    }
  }

  /**
   * Clear all gamification data
   */
  async clearAllData(): Promise<void> {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      await this.triggerSync('clear_all', {});
      console.log('All gamification data cleared');
    } catch (error) {
      console.error('Failed to clear gamification data:', error);
    }
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<string> {
    try {
      const data: any = {};
      
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        const item = localStorage.getItem(storageKey);
        if (item) {
          data[key] = JSON.parse(item);
        }
      });
      
      data.exportDate = new Date().toISOString();
      data.version = '1.0';
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Import data from backup
   */
  async importData(dataString: string): Promise<void> {
    try {
      const data = JSON.parse(dataString);
      
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        if (data[key]) {
          localStorage.setItem(storageKey, JSON.stringify(data[key]));
        }
      });
      
      await this.triggerSync('import_data', data);
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  /**
   * Add sync callback for external storage (e.g., Supabase)
   */
  addSyncCallback(callback: (data: any) => void): void {
    this.syncCallbacks.push(callback);
  }

  /**
   * Remove sync callback
   */
  removeSyncCallback(callback: (data: any) => void): void {
    const index = this.syncCallbacks.indexOf(callback);
    if (index > -1) {
      this.syncCallbacks.splice(index, 1);
    }
  }

  private async triggerSync(type: string, data: any): Promise<void> {
    const syncData = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Update last sync timestamp
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    
    // Trigger all sync callbacks
    this.syncCallbacks.forEach(callback => {
      try {
        callback(syncData);
      } catch (error) {
        console.error('Sync callback error:', error);
      }
    });
  }

  private async migrateOldData(): Promise<void> {
    console.log('🔄 Checking for data migration...');
    
    try {
      // Get current app version to track migration progress
      const APP_VERSION = '2.0.0'; // New version with Vision Board features
      const currentVersion = localStorage.getItem('app_version') || '1.0.0';
      
      console.log(`📱 Current app version: ${currentVersion} -> ${APP_VERSION}`);
      
      // Skip if already migrated to latest version
      if (currentVersion === APP_VERSION) {
        console.log('✅ Data is up to date, no migration needed');
        return;
      }
      
      console.log('🔧 Starting data migration...');
      let migrationCount = 0;
      
      // 1. Migrate old task format to new Vision Board compatible format
      await this.migrateTaskData();
      migrationCount++;
      
      // 2. Migrate old game stats format
      await this.migrateGameStatsData();
      migrationCount++;
      
      // 3. Migrate old vision board entries (if any)
      await this.migrateVisionBoardData();
      migrationCount++;
      
      // 4. Migrate theme and UI preferences
      await this.migrateThemeData();
      migrationCount++;
      
      // 5. Migrate notification settings and custom sounds
      await this.migrateNotificationData();
      migrationCount++;
      
      // 6. Migrate timer and productivity data
      await this.migrateTimerData();
      migrationCount++;
      
      // 7. Ensure all storage keys are properly namespaced
      await this.migrateStorageKeys();
      migrationCount++;
      
      // Update app version to prevent re-migration
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('migration_completed', new Date().toISOString());
      localStorage.setItem('migration_count', migrationCount.toString());
      
      console.log(`✅ Migration completed successfully! ${migrationCount} migration steps executed`);
      
    } catch (error) {
      console.error('❌ Data migration failed:', error);
      // Don't throw error - allow app to continue with defaults
      // Log error for debugging but don't crash app
      localStorage.setItem('migration_error', JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }));
    }
  }

  private async migrateTaskData(): Promise<void> {
    try {
      console.log('📋 Migrating task data...');
      
      const tasks = localStorage.getItem('tasks');
      if (tasks) {
        const parsedTasks = JSON.parse(tasks);
        let migrated = false;
        
        const updatedTasks = parsedTasks.map((task: any) => {
          const originalTask = { ...task };
          
          // Add missing Vision Board integration fields
          if (!task.visionBoardLinks) {
            task.visionBoardLinks = [];
            migrated = true;
          }
          
          // Ensure new gamification fields exist
          if (!task.coinReward) {
            task.coinReward = task.isPriority ? 15 : 10;
            migrated = true;
          }
          
          if (!task.completionXP) {
            task.completionXP = task.isPriority ? 25 : 15;
            migrated = true;
          }
          
          // Ensure new scheduling fields exist for Shadow Mode
          if (task.dueDate && task.startTime && !task.scheduledFor) {
            try {
              const [hours, minutes] = task.startTime.split(':').map(Number);
              const scheduledDateTime = new Date(task.dueDate);
              scheduledDateTime.setHours(hours, minutes, 0, 0);
              task.scheduledFor = scheduledDateTime.toISOString();
              migrated = true;
            } catch (e) {
              // Skip if date parsing fails
            }
          }
          
          // Ensure task has all required new fields
          if (!task.focusSessions) {
            task.focusSessions = [];
            migrated = true;
          }
          
          if (!task.totalTimeSpent) {
            task.totalTimeSpent = 0;
            migrated = true;
          }
          
          return task;
        });
        
        if (migrated) {
          localStorage.setItem('tasks', JSON.stringify(updatedTasks));
          console.log('✅ Task data migrated successfully');
        }
      }
    } catch (error) {
      console.error('Failed to migrate task data:', error);
    }
  }

  private async migrateGameStatsData(): Promise<void> {
    try {
      console.log('🎮 Migrating game stats...');
      
      const oldStats = localStorage.getItem('gameStats') || localStorage.getItem('focusflow_game_stats');
      if (oldStats) {
        const parsedStats = JSON.parse(oldStats);
        
        // Ensure all new gamification fields exist
        const enhancedStats = {
          level: parsedStats.level || 1,
          xp: parsedStats.xp || 0,
          coins: parsedStats.coins || 0,
          completedTasks: parsedStats.completedTasks || 0,
          currentStreak: parsedStats.currentStreak || 0,
          longestStreak: parsedStats.longestStreak || 0,
          totalFocusTime: parsedStats.totalFocusTime || 0,
          achievements: parsedStats.achievements || [],
          shadowMode: parsedStats.shadowMode || {
            isEnabled: false,
            currentStreak: 0,
            longestStreak: 0,
            wins: 0,
            losses: 0,
            shadowLevel: 1
          },
          companion: parsedStats.companion || {
            name: 'Focus Buddy',
            level: 1,
            happiness: 75,
            health: 100,
            lastFed: new Date().toISOString()
          },
          lastUpdated: new Date().toISOString()
        };
        
        // Save with new key format
        localStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(enhancedStats));
        console.log('✅ Game stats migrated successfully');
      }
    } catch (error) {
      console.error('Failed to migrate game stats:', error);
    }
  }

  private async migrateVisionBoardData(): Promise<void> {
    try {
      console.log('🎯 Migrating vision board data...');
      
      const oldVisionData = localStorage.getItem('visionBoard') || localStorage.getItem('visionboard_entries');
      if (oldVisionData) {
        const parsedData = JSON.parse(oldVisionData);
        
        // Migrate old vision board entries to new format with enhanced features
        const migratedEntries = (Array.isArray(parsedData) ? parsedData : parsedData.entries || []).map((entry: any) => ({
          ...entry,
          theme: entry.theme || 'default',
          personalizedColors: entry.personalizedColors || {},
          manifestationJournal: entry.manifestationJournal || [],
          linkedTasks: entry.linkedTasks || [],
          countdownEnabled: entry.countdownEnabled !== false, // Default to true
          progressLinked: entry.progressLinked !== false, // Default to true
          lastUpdated: entry.lastUpdated || new Date().toISOString()
        }));
        
        // Save with consistent key
        localStorage.setItem('visionboard_entries', JSON.stringify({
          entries: migratedEntries,
          lastUpdated: new Date().toISOString()
        }));
        
        console.log('✅ Vision board data migrated successfully');
      }
    } catch (error) {
      console.error('Failed to migrate vision board data:', error);
    }
  }

  private async migrateThemeData(): Promise<void> {
    try {
      console.log('🎨 Migrating theme data...');
      
      // Migrate old theme preference
      const oldTheme = localStorage.getItem('darkMode') || localStorage.getItem('isDark');
      if (oldTheme && !localStorage.getItem('theme')) {
        const isDark = oldTheme === 'true';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        console.log('✅ Theme preferences migrated successfully');
      }
      
      // Ensure vision board theme settings exist
      if (!localStorage.getItem('showMotivationalReminders')) {
        localStorage.setItem('showMotivationalReminders', 'true');
      }
      
      if (!localStorage.getItem('showMotivationOnStartup')) {
        localStorage.setItem('showMotivationOnStartup', 'true');
      }
      
    } catch (error) {
      console.error('Failed to migrate theme data:', error);
    }
  }

  private async migrateNotificationData(): Promise<void> {
    try {
      console.log('🔔 Migrating notification data...');
      
      // Ensure notification preferences are preserved
      const oldNotificationSettings = localStorage.getItem('notificationSettings');
      if (oldNotificationSettings) {
        const settings = JSON.parse(oldNotificationSettings);
        
        // Migrate to new format with custom sound support
        const newSettings = {
          ...settings,
          customTimerSound: settings.customTimerSound || null,
          customTaskSound: settings.customTaskSound || null,
          customTimerSoundName: settings.customTimerSoundName || null,
          customTaskSoundName: settings.customTaskSoundName || null,
          urgentCallStyle: settings.urgentCallStyle !== false // Default to true
        };
        
        localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
        console.log('✅ Notification settings migrated successfully');
      }
      
    } catch (error) {
      console.error('Failed to migrate notification data:', error);
    }
  }

  private async migrateTimerData(): Promise<void> {
    try {
      console.log('⏰ Migrating timer data...');
      
      // Ensure timer settings and history are preserved
      const oldTimerData = localStorage.getItem('timerSessions') || localStorage.getItem('pomodoroSessions');
      if (oldTimerData) {
        const sessions = JSON.parse(oldTimerData);
        
        // Ensure sessions have required fields for new features
        const migratedSessions = sessions.map((session: any) => ({
          ...session,
          taskId: session.taskId || null,
          gamificationRewards: session.gamificationRewards || { xp: 15, coins: 10 },
          treeGrowth: session.treeGrowth || 1
        }));
        
        localStorage.setItem('timerSessions', JSON.stringify(migratedSessions));
        console.log('✅ Timer data migrated successfully');
      }
      
    } catch (error) {
      console.error('Failed to migrate timer data:', error);
    }
  }

  private async migrateStorageKeys(): Promise<void> {
    try {
      console.log('🔑 Migrating storage keys to namespace...');
      
      const keyMigrations = [
        { old: 'gameStats', new: STORAGE_KEYS.GAME_STATS },
        { old: 'quests', new: STORAGE_KEYS.QUESTS },
        { old: 'shadowMode', new: STORAGE_KEYS.SHADOW_MODE },
        { old: 'mindLockSessions', new: STORAGE_KEYS.MIND_LOCK_SESSIONS },
        { old: 'focusflow_frog_history', new: STORAGE_KEYS.FROG_MODE_STATE }
      ];
      
      keyMigrations.forEach(({ old, new: newKey }) => {
        const oldData = localStorage.getItem(old);
        if (oldData && !localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldData);
          console.log(`✅ Migrated ${old} -> ${newKey}`);
        }
      });
      
    } catch (error) {
      console.error('Failed to migrate storage keys:', error);
    }
  }

  private setupAutoSave(): void {
    // Set up periodic auto-save (every 5 minutes)
    setInterval(() => {
      // This would trigger a full data sync if needed
      console.log('Auto-save checkpoint');
    }, 5 * 60 * 1000);
  }
}

export default GamificationStorage;

/**
 * Habit Storage Utility
 * Versioned localStorage wrapper with debounced writes and migrations
 */

import { Habit, HabitStorageSchema } from '../types/habit';

const STORAGE_KEY = 'focusflow:habits:v1';
const CURRENT_VERSION = 1;
const WRITE_DEBOUNCE_MS = 500;
const MAX_STORAGE_SIZE_KB = 5000; // 5MB warning threshold

class HabitStorage {
  private writeTimer: NodeJS.Timeout | null = null;
  private pendingWrites: HabitStorageSchema | null = null;
  private cache: HabitStorageSchema | null = null;

  constructor() {
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as HabitStorageSchema;
        this.cache = this.migrate(data);
      } else {
        this.cache = this.getDefaultSchema();
      }
    } catch (error) {
      console.error('Failed to load habit data:', error);
      this.cache = this.getDefaultSchema();
    }
  }

  private getDefaultSchema(): HabitStorageSchema {
    return {
      version: CURRENT_VERSION,
      habits: [],
      lastSync: new Date().toISOString(),
      settings: {
        alpha: 0.25,
        streakMultiplier: 0.02
      }
    };
  }

  /**
   * Migrate data from older versions
   */
  private migrate(data: any): HabitStorageSchema {
    let migrated = { ...data };

    // Migration from version 0 to 1
    if (!migrated.version || migrated.version < 1) {
      // Convert old format if exists
      if (Array.isArray(migrated)) {
        migrated = {
          version: 1,
          habits: migrated,
          lastSync: new Date().toISOString()
        };
      }
      
      // Ensure all habits have required fields
      if (migrated.habits) {
        migrated.habits = migrated.habits.map((habit: any) => ({
          ...habit,
          logs: habit.logs || {},
          stats: habit.stats || {
            currentStreak: 0,
            bestStreak: 0,
            consistency: 0,
            score: 0,
            lastUpdated: new Date().toISOString()
          },
          createdAt: habit.createdAt || new Date().toISOString(),
          updatedAt: habit.updatedAt || new Date().toISOString()
        }));
      }
    }

    // Future migrations would go here
    // if (migrated.version < 2) { ... }

    migrated.version = CURRENT_VERSION;
    return migrated as HabitStorageSchema;
  }

  /**
   * Get all habits
   */
  getHabits(): Habit[] {
    this.ensureCache();
    return this.cache?.habits || [];
  }

  /**
   * Set all habits
   */
  setHabits(habits: Habit[]): void {
    this.ensureCache();
    if (this.cache) {
      this.cache.habits = habits;
      this.cache.lastSync = new Date().toISOString();
      this.scheduleSave();
    }
  }

  /**
   * Get settings
   */
  getSettings(): HabitStorageSchema['settings'] {
    this.ensureCache();
    return this.cache?.settings || { alpha: 0.25, streakMultiplier: 0.02 };
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<HabitStorageSchema['settings']>): void {
    this.ensureCache();
    if (this.cache) {
      this.cache.settings = { ...this.cache.settings, ...settings };
      this.scheduleSave();
    }
  }

  /**
   * Schedule a debounced save
   */
  private scheduleSave(): void {
    if (!this.cache) return;

    this.pendingWrites = this.cache;

    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    this.writeTimer = setTimeout(() => {
      this.flush();
    }, WRITE_DEBOUNCE_MS);
  }

  /**
   * Flush pending writes immediately
   */
  flush(): void {
    if (!this.pendingWrites) return;

    try {
      const data = JSON.stringify(this.pendingWrites);
      
      // Check storage size
      const sizeKB = new Blob([data]).size / 1024;
      if (sizeKB > MAX_STORAGE_SIZE_KB) {
        console.warn(`Habit storage is large (${sizeKB.toFixed(2)}KB). Consider cleanup or IndexedDB.`);
      }

      localStorage.setItem(STORAGE_KEY, data);
      this.pendingWrites = null;

      if (this.writeTimer) {
        clearTimeout(this.writeTimer);
        this.writeTimer = null;
      }
    } catch (error) {
      console.error('Failed to save habit data:', error);
      
      // If quota exceeded, suggest cleanup
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Please clean up old data or switch to IndexedDB.');
        this.notifyStorageIssue();
      }
    }
  }

  /**
   * Clear all habit data
   */
  clear(): void {
    this.cache = this.getDefaultSchema();
    localStorage.removeItem(STORAGE_KEY);
    
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.pendingWrites = null;
  }

  /**
   * Export habits as JSON
   */
  export(): string {
    this.ensureCache();
    return JSON.stringify({
      version: `${CURRENT_VERSION}.0.0`,
      exportedAt: new Date().toISOString(),
      habits: this.cache?.habits || [],
      settings: this.cache?.settings
    }, null, 2);
  }

  /**
   * Import habits from JSON
   */
  import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate import data
      if (!data.habits || !Array.isArray(data.habits)) {
        throw new Error('Invalid import format');
      }

      // Merge or replace habits
      const imported: HabitStorageSchema = {
        version: CURRENT_VERSION,
        habits: data.habits,
        lastSync: new Date().toISOString(),
        settings: data.settings || this.getSettings()
      };

      this.cache = this.migrate(imported);
      this.scheduleSave();
      return true;
    } catch (error) {
      console.error('Failed to import habits:', error);
      return false;
    }
  }

  /**
   * Get storage size in KB
   */
  getStorageSize(): number {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    return new Blob([data]).size / 1024;
  }

  /**
   * Ensure cache is loaded
   */
  private ensureCache(): void {
    if (!this.cache) {
      this.loadCache();
    }
  }

  /**
   * Notify about storage issues (could trigger UI notification)
   */
  private notifyStorageIssue(): void {
    // Dispatch custom event that UI can listen to
    window.dispatchEvent(new CustomEvent('habitStorageIssue', {
      detail: {
        type: 'quota',
        sizeKB: this.getStorageSize(),
        suggestion: 'Consider exporting and clearing old habits, or contact support about IndexedDB migration.'
      }
    }));
  }
}

// Singleton instance
export const habitStorage = new HabitStorage();

// Utility functions for direct use
export const getStoredHabits = (): Habit[] => habitStorage.getHabits();
export const saveHabits = (habits: Habit[]): void => habitStorage.setHabits(habits);
export const flushStorage = (): void => habitStorage.flush();
export const clearHabits = (): void => habitStorage.clear();
export const exportHabits = (): string => habitStorage.export();
export const importHabits = (data: string): boolean => habitStorage.import(data);

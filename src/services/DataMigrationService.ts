import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { get, set, clear } from 'idb-keyval';

interface MigrationResult {
  success: boolean;
  backupCreated: boolean;
  backupPath?: string;
  migratedItems: number;
  errors: string[];
  warnings: string[];
}

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    localStorage: Record<string, any>;
    indexedDB: Record<string, any>;
    gameData: any;
    taskData: any;
    visionData: any;
    timerData: any;
    settings: any;
  };
  metadata: {
    userAgent: string;
    platform: string;
    appVersion: string;
  };
}

class DataMigrationService {
  private readonly BACKUP_KEY = 'focusflow_legacy_backup';
  private readonly MIGRATION_FLAG = 'focusflow_migration_completed';
  private readonly CURRENT_VERSION = '2.0.0';

  // Check if migration is needed
  async needsMigration(): Promise<boolean> {
    try {
      const migrationFlag = localStorage.getItem(this.MIGRATION_FLAG);
      const hasLegacyData = this.hasLegacyData();
      
      return !migrationFlag && hasLegacyData;
    } catch (error) {
      console.warn('Error checking migration status:', error);
      return false;
    }
  }

  // Check for legacy data
  private hasLegacyData(): boolean {
    const legacyKeys = [
      'visionBoardEntries',
      'tasks',
      'gameStats', 
      'focusSession',
      'timerSettings',
      'procrastinationData',
      'shadowSelfData'
    ];

    return legacyKeys.some(key => localStorage.getItem(key) !== null);
  }

  // Create comprehensive backup
  async createBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      const backupData: BackupData = {
        version: this.CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        data: {
          localStorage: this.extractLocalStorageData(),
          indexedDB: await this.extractIndexedDBData(),
          gameData: this.extractGameData(),
          taskData: this.extractTaskData(),
          visionData: this.extractVisionData(),
          timerData: this.extractTimerData(),
          settings: this.extractSettingsData()
        },
        metadata: {
          userAgent: navigator.userAgent,
          platform: Capacitor.getPlatform(),
          appVersion: this.CURRENT_VERSION
        }
      };

      if (Capacitor.isNativePlatform()) {
        // Save to filesystem on native platforms
        const fileName = `focusflow_backup_${Date.now()}.json`;
        const filePath = `backups/${fileName}`;

        await Filesystem.mkdir({
          path: 'backups',
          directory: Directory.Documents,
          recursive: true
        });

        await Filesystem.writeFile({
          path: filePath,
          data: JSON.stringify(backupData, null, 2),
          directory: Directory.Documents
        });

        return { success: true, backupPath: filePath };
      } else {
        // Save to IndexedDB on web
        await set(this.BACKUP_KEY, backupData);
        return { success: true, backupPath: 'IndexedDB' };
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Perform idempotent migration
  async performMigration(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      backupCreated: false,
      migratedItems: 0,
      errors: [],
      warnings: []
    };

    try {
      // Check if already migrated
      if (!await this.needsMigration()) {
        result.warnings.push('Migration already completed or no legacy data found');
        result.success = true;
        return result;
      }

      // Create backup first
      const backupResult = await this.createBackup();
      result.backupCreated = backupResult.success;
      result.backupPath = backupResult.backupPath;

      if (!backupResult.success) {
        result.errors.push(`Backup failed: ${backupResult.error}`);
        return result; // Don't proceed without backup
      }

      // Migrate each data type
      const migrations = [
        this.migrateVisionData.bind(this),
        this.migrateTaskData.bind(this),
        this.migrateGameData.bind(this),
        this.migrateTimerData.bind(this),
        this.migrateSettingsData.bind(this),
        this.migrateProcrastinationData.bind(this)
      ];

      for (const migration of migrations) {
        try {
          const itemsMigrated = await migration();
          result.migratedItems += itemsMigrated;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown migration error';
          result.errors.push(errorMsg);
        }
      }

      // Mark migration as completed
      localStorage.setItem(this.MIGRATION_FLAG, this.CURRENT_VERSION);
      localStorage.setItem('focusflow_migration_timestamp', new Date().toISOString());

      result.success = result.errors.length === 0;

      console.log(`✅ Migration completed: ${result.migratedItems} items migrated`);
      
      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Migration failed');
      return result;
    }
  }

  // Extract data methods
  private extractLocalStorageData(): Record<string, any> {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('focusflow')) {
        try {
          const value = localStorage.getItem(key);
          data[key] = value ? JSON.parse(value) : value;
        } catch {
          data[key] = localStorage.getItem(key); // Store as string if not JSON
        }
      }
    }
    return data;
  }

  private async extractIndexedDBData(): Promise<Record<string, any>> {
    try {
      const visionData = await get('visionBoardEntries') || [];
      const questData = await get('focusflow_completed_quests') || [];
      return { visionBoardEntries: visionData, completedQuests: questData };
    } catch {
      return {};
    }
  }

  private extractGameData(): any {
    return {
      gameStats: this.safeJSONParse(localStorage.getItem('gameStats')),
      shadowSelf: this.safeJSONParse(localStorage.getItem('shadowSelfData')),
      quests: this.safeJSONParse(localStorage.getItem('focusflow_active_quests')),
      completedQuests: this.safeJSONParse(localStorage.getItem('focusflow_completed_quests'))
    };
  }

  private extractTaskData(): any {
    return {
      tasks: this.safeJSONParse(localStorage.getItem('tasks')),
      taskCategories: this.safeJSONParse(localStorage.getItem('taskCategories')),
      taskPreferences: this.safeJSONParse(localStorage.getItem('taskPreferences'))
    };
  }

  private extractVisionData(): any {
    return {
      visionBoardEntries: this.safeJSONParse(localStorage.getItem('visionBoardEntries')),
      visionSettings: this.safeJSONParse(localStorage.getItem('visionBoardSettings'))
    };
  }

  private extractTimerData(): any {
    return {
      timerSettings: this.safeJSONParse(localStorage.getItem('timerSettings')),
      focusSessions: this.safeJSONParse(localStorage.getItem('focusSessions')),
      pomodoroSettings: this.safeJSONParse(localStorage.getItem('pomodoroSettings'))
    };
  }

  private extractSettingsData(): any {
    return {
      theme: localStorage.getItem('theme'),
      notifications: this.safeJSONParse(localStorage.getItem('focusflow_notification_settings')),
      urgentNotifications: localStorage.getItem('urgentNotifications'),
      motivationalReminders: localStorage.getItem('showMotivationalReminders')
    };
  }

  // Migration methods
  private async migrateVisionData(): Promise<number> {
    let migrated = 0;
    
    try {
      const legacyVisions = this.safeJSONParse(localStorage.getItem('visionBoardEntries'));
      if (legacyVisions && Array.isArray(legacyVisions)) {
        // Migrate to new Vision schema with milestones support
        const migratedVisions = legacyVisions.map((vision: any) => ({
          id: vision.id || `vision_${Date.now()}_${migrated++}`,
          title: vision.title || vision.text || '',
          description: vision.description || '',
          category: vision.category || 'personal',
          status: vision.completed ? 'completed' : 'active',
          priority: vision.priority || 'medium',
          targetDate: vision.dueDate || vision.targetDate,
          createdAt: vision.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: vision.completed ? (vision.completedAt || new Date().toISOString()) : undefined,
          milestones: [], // New milestone structure
          linkedVisions: [], // New linked visions
          progress: vision.progress || 0,
          tags: vision.tags || [],
          media: vision.imageUrl ? [{ url: vision.imageUrl, type: 'image' }] : [],
          journalEntries: vision.notes ? [{ 
            id: `journal_${Date.now()}`,
            content: vision.notes,
            createdAt: new Date().toISOString() 
          }] : [],
          metadata: {
            version: '2.0.0',
            migratedFrom: 'legacy'
          }
        }));

        // Store in new format
        if (Capacitor.isNativePlatform()) {
          await Filesystem.writeFile({
            path: 'visions.json',
            data: JSON.stringify(migratedVisions, null, 2),
            directory: Directory.Documents
          });
        } else {
          await set('focusflow_visions_v2', migratedVisions);
        }

        migrated = migratedVisions.length;
      }
    } catch (error) {
      throw new Error(`Vision migration failed: ${error}`);
    }

    return migrated;
  }

  private async migrateTaskData(): Promise<number> {
    let migrated = 0;
    
    try {
      const legacyTasks = this.safeJSONParse(localStorage.getItem('tasks'));
      if (legacyTasks && Array.isArray(legacyTasks)) {
        // Migrate to new task schema
        const migratedTasks = legacyTasks.map((task: any) => ({
          ...task,
          version: '2.0.0',
          migratedFrom: 'legacy',
          updatedAt: new Date().toISOString()
        }));

        localStorage.setItem('focusflow_tasks_v2', JSON.stringify(migratedTasks));
        migrated = migratedTasks.length;
      }
    } catch (error) {
      throw new Error(`Task migration failed: ${error}`);
    }

    return migrated;
  }

  private async migrateGameData(): Promise<number> {
    let migrated = 0;
    
    try {
      const gameStats = this.safeJSONParse(localStorage.getItem('gameStats'));
      if (gameStats) {
        const migratedStats = {
          ...gameStats,
          version: '2.0.0',
          migratedFrom: 'legacy',
          migratedAt: new Date().toISOString()
        };
        
        localStorage.setItem('focusflow_game_stats_v2', JSON.stringify(migratedStats));
        migrated++;
      }

      // Migrate completed quests to persistent storage
      const completedQuests = this.safeJSONParse(localStorage.getItem('focusflow_completed_quests'));
      if (completedQuests) {
        localStorage.setItem('focusflow_completed_quests_v2', JSON.stringify(completedQuests));
        migrated++;
      }
    } catch (error) {
      throw new Error(`Game data migration failed: ${error}`);
    }

    return migrated;
  }

  private async migrateTimerData(): Promise<number> {
    let migrated = 0;
    
    try {
      const timerSettings = this.safeJSONParse(localStorage.getItem('timerSettings'));
      if (timerSettings) {
        const migratedSettings = {
          ...timerSettings,
          version: '2.0.0',
          migratedFrom: 'legacy'
        };
        
        localStorage.setItem('focusflow_timer_settings_v2', JSON.stringify(migratedSettings));
        migrated++;
      }
    } catch (error) {
      throw new Error(`Timer data migration failed: ${error}`);
    }

    return migrated;
  }

  private async migrateSettingsData(): Promise<number> {
    let migrated = 0;
    
    try {
      const settings = {
        theme: localStorage.getItem('theme'),
        urgentNotifications: localStorage.getItem('urgentNotifications'),
        motivationalReminders: localStorage.getItem('showMotivationalReminders'),
        notificationSettings: this.safeJSONParse(localStorage.getItem('focusflow_notification_settings')),
        version: '2.0.0',
        migratedFrom: 'legacy',
        migratedAt: new Date().toISOString()
      };
      
      localStorage.setItem('focusflow_settings_v2', JSON.stringify(settings));
      migrated++;
    } catch (error) {
      throw new Error(`Settings migration failed: ${error}`);
    }

    return migrated;
  }

  private async migrateProcrastinationData(): Promise<number> {
    let migrated = 0;
    
    try {
      const procrastinationData = this.safeJSONParse(localStorage.getItem('procrastinationData'));
      if (procrastinationData) {
        const migratedData = {
          ...procrastinationData,
          version: '2.0.0',
          migratedFrom: 'legacy'
        };
        
        localStorage.setItem('focusflow_procrastination_v2', JSON.stringify(migratedData));
        migrated++;
      }
    } catch (error) {
      throw new Error(`Procrastination data migration failed: ${error}`);
    }

    return migrated;
  }

  // Get backup viewer data
  async getBackupData(): Promise<BackupData | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // List backup files
        const files = await Filesystem.readdir({
          path: 'backups',
          directory: Directory.Documents
        });
        
        if (files.files.length > 0) {
          // Get the most recent backup
          const latestBackup = files.files
            .filter(f => f.name.includes('focusflow_backup_'))
            .sort((a, b) => b.name.localeCompare(a.name))[0];
          
          if (latestBackup) {
            const content = await Filesystem.readFile({
              path: `backups/${latestBackup.name}`,
              directory: Directory.Documents,
              encoding: undefined
            });
            
            return JSON.parse(content.data as string);
          }
        }
      } else {
        return await get(this.BACKUP_KEY);
      }
    } catch (error) {
      console.warn('Error reading backup data:', error);
    }
    
    return null;
  }

  // Retry failed migration
  async retryMigration(): Promise<MigrationResult> {
    // Clear migration flag to allow retry
    localStorage.removeItem(this.MIGRATION_FLAG);
    return this.performMigration();
  }

  // Utility method
  private safeJSONParse(data: string | null): any {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  // Get migration status
  getMigrationStatus(): {
    completed: boolean;
    version?: string;
    timestamp?: string;
    needsMigration: boolean;
  } {
    const migrationFlag = localStorage.getItem(this.MIGRATION_FLAG);
    const migrationTimestamp = localStorage.getItem('focusflow_migration_timestamp');
    
    return {
      completed: !!migrationFlag,
      version: migrationFlag || undefined,
      timestamp: migrationTimestamp || undefined,
      needsMigration: this.hasLegacyData() && !migrationFlag
    };
  }
}

// Singleton instance
const dataMigrationService = new DataMigrationService();

export default dataMigrationService;
export type { MigrationResult, BackupData };

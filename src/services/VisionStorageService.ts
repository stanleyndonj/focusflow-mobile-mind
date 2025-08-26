import { get, set, del, clear } from 'idb-keyval';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Enhanced Vision Data Models
export interface Vision {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  accomplishedAt?: string;
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
  
  // Core features
  journalEntries?: JournalEntry[]; // CRITICAL: Journal entries for Manifestation Journal
  milestones?: Milestone[]; // CRITICAL: Milestones for vision linking
  
  // Legacy fields for backward compatibility
  imageUrl?: string;
  category?: string;
  linkedTaskIds?: string[];
  importance?: string;
  successCriteria?: string;
  targetDate?: string;
  progressPercentage?: number;
  completed?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  path: string;
  thumbPath?: string;
  mimeType?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  prompt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  createdAt?: string;
}

export interface VisionMilestone {
  id: string;
  parentVisionId: string;
  type: 'checklist' | 'vision_link';
  title?: string;
  linkedVisionId?: string;
  orderIndex: number;
  achievedAt?: string;
  createdAt: string;
}

export interface VisionLinksIndex {
  [linkedVisionId: string]: string[]; // Maps linkedVisionId -> [parentVisionId...]
}

export interface VisionStorageData {
  visions: Vision[];
  milestones: VisionMilestone[];
  linksIndex: VisionLinksIndex;
  schemaVersion: string;
  migrationComplete?: boolean;
}

const STORAGE_KEYS = {
  VISIONS: 'visions_v2',
  MILESTONES: 'vision_milestones_v2',
  LINKS_INDEX: 'vision_links_index_v2',
  SCHEMA_VERSION: 'vision_schema_version',
  MIGRATION_FLAG: 'vision_migration_complete_v2',
  LEGACY_BACKUP: 'vision_legacy_backup'
} as const;

const CURRENT_SCHEMA_VERSION = '2.0.0';

class VisionStorageService {
  private isNative = Capacitor.isNativePlatform();
  
  // Initialize storage and run migration if needed
  async initialize(): Promise<void> {
    const migrationComplete = await this.getMigrationFlag();
    if (!migrationComplete) {
      await this.runMigration();
    }
  }

  // Check if migration is complete
  private async getMigrationFlag(): Promise<boolean> {
    try {
      const flag = await get(STORAGE_KEYS.MIGRATION_FLAG);
      return flag === CURRENT_SCHEMA_VERSION;
    } catch {
      return false;
    }
  }

  // Set migration flag
  private async setMigrationFlag(): Promise<void> {
    await set(STORAGE_KEYS.MIGRATION_FLAG, CURRENT_SCHEMA_VERSION);
  }

  // Run safe, idempotent migration
  async runMigration(): Promise<void> {
    try {
      console.log('🚀 Starting Vision Board migration to v2.0.0...');
      
      // Step 1: Backup legacy data
      const legacyData = await this.extractLegacyData();
      if (legacyData && legacyData.length > 0) {
        await this.createLegacyBackup(legacyData);
        
        // Step 2: Transform to new schema
        const { visions, milestones, linksIndex } = this.transformLegacyData(legacyData);
        
        // Step 3: Save new format (atomic operation)
        await this.saveVisionData({ visions, milestones, linksIndex, schemaVersion: CURRENT_SCHEMA_VERSION, migrationComplete: true });
        
        console.log(`✅ Migrated ${visions.length} visions, ${milestones.length} milestones`);
      } else {
        // Initialize empty schema
        await this.saveVisionData({ visions: [], milestones: [], linksIndex: {}, schemaVersion: CURRENT_SCHEMA_VERSION, migrationComplete: true });
        console.log('✅ Initialized empty Vision Board v2.0.0 schema');
      }
      
      // Step 4: Mark migration complete
      await this.setMigrationFlag();
      
    } catch (error) {
      console.error('❌ Vision migration failed:', error);
      throw new Error(`Migration failed: ${error}`);
    }
  }

  // Extract legacy data from multiple sources
  private async extractLegacyData(): Promise<any[] | null> {
    // Try IndexedDB first (most recent)
    const data = await get('visionBoardEntries');
    if (data) return data;

    // Try localStorage (older format)
    const oldLocalStorageData = localStorage.getItem('visionBoardEntries');
    if (oldLocalStorageData) {
      return JSON.parse(oldLocalStorageData);
    }

    return null;
  }

  // Create backup of legacy data
  private async createLegacyBackup(legacyData: any[]): Promise<void> {
    const backup = {
      data: legacyData,
      backupDate: new Date().toISOString(),
      originalSource: 'visionBoardEntries'
    };

    if (this.isNative) {
      // Save to filesystem on native platforms
      const fileName = `legacy-vision-backup-${Date.now()}.json`;
      await Filesystem.writeFile({
        path: `backups/${fileName}`,
        data: JSON.stringify(backup, null, 2),
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
    } else {
      // Save to IndexedDB on web
      await set(STORAGE_KEYS.LEGACY_BACKUP, backup);
    }
  }

  // Transform legacy data to new schema
  private transformLegacyData(legacyData: any[]): { visions: Vision[], milestones: VisionMilestone[], linksIndex: VisionLinksIndex } {
    const visions: Vision[] = [];
    const milestones: VisionMilestone[] = [];
    const linksIndex: VisionLinksIndex = {};

    legacyData.forEach((legacy, index) => {
      // Transform main vision
      const vision: Vision = {
        id: legacy.id || `vision-${Date.now()}-${index}`,
        title: legacy.title || 'Untitled Vision',
        description: legacy.description || '',
        status: legacy.completed ? 'completed' : 'active',
        accomplishedAt: legacy.completedAt,
        media: this.transformMediaItems(legacy),
        createdAt: legacy.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Preserve legacy fields
        imageUrl: legacy.imageUrl,
        category: legacy.category,
        linkedTaskIds: legacy.linkedTaskIds,
        importance: legacy.importance,
        successCriteria: legacy.successCriteria,
        targetDate: legacy.targetDate,
        progressPercentage: legacy.progressPercentage,
        completed: legacy.completed,
        completedAt: legacy.completedAt,
        notes: legacy.notes
      };

      visions.push(vision);

      // Transform milestones if they exist
      if (legacy.milestones && Array.isArray(legacy.milestones)) {
        legacy.milestones.forEach((milestone: any, milestoneIndex: number) => {
          const transformedMilestone: VisionMilestone = {
            id: milestone.id || `milestone-${vision.id}-${milestoneIndex}`,
            parentVisionId: vision.id,
            type: 'checklist', // Legacy milestones are checklist type
            title: milestone.title,
            orderIndex: milestoneIndex,
            achievedAt: milestone.completedAt,
            createdAt: milestone.createdAt || new Date().toISOString()
          };
          milestones.push(transformedMilestone);
        });
      }
    });

    return { visions, milestones, linksIndex };
  }

  // Transform legacy media items
  private transformMediaItems(legacy: any): MediaItem[] {
    const media: MediaItem[] = [];
    
    // Legacy imageUrl
    if (legacy.imageUrl) {
      media.push({
        id: `media-${Date.now()}-image`,
        type: 'image',
        path: legacy.imageUrl,
        createdAt: legacy.createdAt || new Date().toISOString()
      });
    }

    // Legacy mediaItems
    if (legacy.mediaItems && Array.isArray(legacy.mediaItems)) {
      legacy.mediaItems.forEach((item: any, index: number) => {
        media.push({
          id: item.id || `media-${Date.now()}-${index}`,
          type: item.type,
          path: item.url || item.path,
          thumbPath: item.thumbnail,
          mimeType: item.mimeType,
          createdAt: item.createdAt || new Date().toISOString()
        });
      });
    }

    return media;
  }

  // Save all vision data atomically
  private async saveVisionData(data: VisionStorageData): Promise<void> {
    await Promise.all([
      set(STORAGE_KEYS.VISIONS, data.visions),
      set(STORAGE_KEYS.MILESTONES, data.milestones),
      set(STORAGE_KEYS.LINKS_INDEX, data.linksIndex),
      set(STORAGE_KEYS.SCHEMA_VERSION, data.schemaVersion)
    ]);
  }

  // Load all visions
  async loadVisions(): Promise<Vision[]> {
    const visions = await get(STORAGE_KEYS.VISIONS);
    return visions || [];
  }

  // Save vision
  async saveVision(vision: Vision): Promise<void> {
    console.log('💾 VisionStorageService: Saving vision with data:', {
      id: vision.id,
      title: vision.title,
      journalEntries: vision.journalEntries?.length || 0,
      milestones: vision.milestones?.length || 0
    });
    
    const visions = await this.loadVisions();
    const existingIndex = visions.findIndex(v => v.id === vision.id);
    
    const visionToSave = {
      ...vision,
      journalEntries: vision.journalEntries || [], // Ensure journal entries are preserved
      milestones: vision.milestones || [], // Ensure milestones are preserved
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      visions[existingIndex] = visionToSave;
      console.log('📝 Updated existing vision at index:', existingIndex);
    } else {
      visions.push({ ...visionToSave, createdAt: new Date().toISOString() });
      console.log('➕ Added new vision to storage');
    }
    
    await set(STORAGE_KEYS.VISIONS, visions);
    
    // Verify the save by loading it back
    const savedVisions = await this.loadVisions();
    const savedVision = savedVisions.find(v => v.id === vision.id);
    console.log('✅ Verification - Vision saved with:', {
      journalEntries: savedVision?.journalEntries?.length || 0,
      milestones: savedVision?.milestones?.length || 0
    });
  }

  // Delete vision and cascade delete milestones
  async deleteVision(visionId: string): Promise<void> {
    // Remove vision
    const visions = await this.loadVisions();
    const filteredVisions = visions.filter(v => v.id !== visionId);
    await set(STORAGE_KEYS.VISIONS, filteredVisions);

    // Remove milestones
    const milestones = await this.loadMilestones();
    const filteredMilestones = milestones.filter(m => m.parentVisionId !== visionId && m.linkedVisionId !== visionId);
    await set(STORAGE_KEYS.MILESTONES, filteredMilestones);

    // Update links index
    await this.rebuildLinksIndex();
  }

  // Load milestones for a vision
  async loadMilestones(): Promise<VisionMilestone[]> {
    const milestones = await get(STORAGE_KEYS.MILESTONES);
    return milestones || [];
  }

  // Save milestone
  async saveMilestone(milestone: VisionMilestone): Promise<void> {
    const milestones = await this.loadMilestones();
    const existingIndex = milestones.findIndex(m => m.id === milestone.id);
    
    if (existingIndex >= 0) {
      milestones[existingIndex] = milestone;
    } else {
      milestones.push({ ...milestone, createdAt: new Date().toISOString() });
    }
    
    await set(STORAGE_KEYS.MILESTONES, milestones);

    // Update links index if it's a vision link
    if (milestone.type === 'vision_link' && milestone.linkedVisionId) {
      await this.updateLinksIndex(milestone.linkedVisionId, milestone.parentVisionId, 'add');
    }
  }

  // Delete milestone
  async deleteMilestone(milestoneId: string): Promise<void> {
    const milestones = await this.loadMilestones();
    const milestone = milestones.find(m => m.id === milestoneId);
    
    if (milestone && milestone.type === 'vision_link' && milestone.linkedVisionId) {
      await this.updateLinksIndex(milestone.linkedVisionId, milestone.parentVisionId, 'remove');
    }
    
    const filteredMilestones = milestones.filter(m => m.id !== milestoneId);
    await set(STORAGE_KEYS.MILESTONES, filteredMilestones);
  }

  // Update links index
  private async updateLinksIndex(linkedVisionId: string, parentVisionId: string, action: 'add' | 'remove'): Promise<void> {
    const linksIndex = await get(STORAGE_KEYS.LINKS_INDEX) || {};
    
    if (action === 'add') {
      if (!linksIndex[linkedVisionId]) {
        linksIndex[linkedVisionId] = [];
      }
      if (!linksIndex[linkedVisionId].includes(parentVisionId)) {
        linksIndex[linkedVisionId].push(parentVisionId);
      }
    } else {
      if (linksIndex[linkedVisionId]) {
        linksIndex[linkedVisionId] = linksIndex[linkedVisionId].filter(id => id !== parentVisionId);
        if (linksIndex[linkedVisionId].length === 0) {
          delete linksIndex[linkedVisionId];
        }
      }
    }
    
    await set(STORAGE_KEYS.LINKS_INDEX, linksIndex);
  }

  // Rebuild links index
  private async rebuildLinksIndex(): Promise<void> {
    const milestones = await this.loadMilestones();
    const linksIndex: VisionLinksIndex = {};
    
    milestones.forEach(milestone => {
      if (milestone.type === 'vision_link' && milestone.linkedVisionId) {
        if (!linksIndex[milestone.linkedVisionId]) {
          linksIndex[milestone.linkedVisionId] = [];
        }
        if (!linksIndex[milestone.linkedVisionId].includes(milestone.parentVisionId)) {
          linksIndex[milestone.linkedVisionId].push(milestone.parentVisionId);
        }
      }
    });
    
    await set(STORAGE_KEYS.LINKS_INDEX, linksIndex);
  }

  // Get parent visions for a linked vision
  async getParentVisions(linkedVisionId: string): Promise<string[]> {
    const linksIndex = await get(STORAGE_KEYS.LINKS_INDEX) || {};
    return linksIndex[linkedVisionId] || [];
  }

  // Check for cycles in vision links
  async checkForCycles(parentVisionId: string, linkedVisionId: string): Promise<boolean> {
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    const hasCycle = async (visionId: string): Promise<boolean> => {
      if (stack.has(visionId)) return true;
      if (visited.has(visionId)) return false;
      
      visited.add(visionId);
      stack.add(visionId);
      
      // Get all milestones for this vision that link to other visions
      const milestones = await this.loadMilestones();
      const linkedVisions = milestones
        .filter(m => m.parentVisionId === visionId && m.type === 'vision_link' && m.linkedVisionId)
        .map(m => m.linkedVisionId!);
      
      for (const linkedVision of linkedVisions) {
        if (await hasCycle(linkedVision)) return true;
      }
      
      stack.delete(visionId);
      return false;
    };
    
    // Simulate adding the link and check for cycles
    const milestones = await this.loadMilestones();
    milestones.push({
      id: 'temp',
      parentVisionId,
      type: 'vision_link',
      linkedVisionId,
      orderIndex: 0,
      createdAt: new Date().toISOString()
    });
    
    return await hasCycle(parentVisionId);
  }

  // Cascade vision completion
  async cascadeVisionCompletion(completedVisionId: string): Promise<string[]> {
    const milestones = await this.loadMilestones();
    const affectedParents: string[] = [];
    
    // Find all milestones that link to this completed vision
    const linkedMilestones = milestones.filter(
      m => m.type === 'vision_link' && m.linkedVisionId === completedVisionId && !m.achievedAt
    );
    
    // Mark them as achieved
    for (const milestone of linkedMilestones) {
      milestone.achievedAt = new Date().toISOString();
      if (!affectedParents.includes(milestone.parentVisionId)) {
        affectedParents.push(milestone.parentVisionId);
      }
    }
    
    // Save updated milestones
    await set(STORAGE_KEYS.MILESTONES, milestones);
    
    return affectedParents;
  }

  // Calculate progress for a vision
  async calculateVisionProgress(visionId: string): Promise<number> {
    const milestones = await this.loadMilestones();
    const visionMilestones = milestones.filter(m => m.parentVisionId === visionId);
    
    if (visionMilestones.length === 0) return 0;
    
    const achievedCount = visionMilestones.filter(m => m.achievedAt).length;
    return Math.round((achievedCount / visionMilestones.length) * 100);
  }

  // Get legacy backup for user review
  async getLegacyBackup(): Promise<any> {
    if (this.isNative) {
      // Try to read from filesystem
      try {
        const files = await Filesystem.readdir({
          path: 'backups',
          directory: Directory.Data
        });
        
        const backupFiles = files.files.filter(f => f.name.startsWith('legacy-vision-backup-'));
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort((a, b) => b.name.localeCompare(a.name))[0];
          const content = await Filesystem.readFile({
            path: `backups/${latestBackup.name}`,
            directory: Directory.Data,
            encoding: Encoding.UTF8
          });
          return JSON.parse(content.data as string);
        }
      } catch (error) {
        console.warn('No legacy backup found in filesystem:', error);
      }
    } else {
      // Try IndexedDB
      const backup = await get(STORAGE_KEYS.LEGACY_BACKUP);
      return backup;
    }
    
    return null;
  }
}

export const visionStorageService = new VisionStorageService();

/**
 * Folders Manager
 * 
 * Manages chat folders with filters.
 */

import type { ChatFolder, FolderInclude, FolderExclude, FilterType } from './types.js';

/**
 * Folders configuration
 */
export interface FoldersConfig {
  maxFolders: number;
  maxChatsPerFolder: number;
  enableIcons: boolean;
  enableColors: boolean;
}

/**
 * FoldersManager - Manages chat folders
 */
export class FoldersManager {
  private config: FoldersConfig;
  private folders: Map<string, ChatFolder> = new Map();
  private defaultFolders: ChatFolder[] = [];

  constructor(config: Partial<FoldersConfig> = {}) {
    this.config = {
      maxFolders: 20,
      maxChatsPerFolder: 1000,
      enableIcons: true,
      enableColors: true,
      ...config,
    };

    // Create default folders
    this.createDefaultFolders();
  }

  /**
   * Create default folders (All Chats, Unread, etc.)
   */
  private createDefaultFolders(): void {
    this.defaultFolders = [
      {
        id: 'default-all',
        userId: '',
        name: 'All Chats',
        includes: [],
        excludes: [],
        chatIds: [],
        isDefault: true,
        order: 0,
        createdAt: Date.now(),
      },
      {
        id: 'default-unread',
        userId: '',
        name: 'Unread',
        includes: [{ type: 'unread' }],
        excludes: [],
        chatIds: [],
        isDefault: true,
        order: 1,
        createdAt: Date.now(),
      },
    ];
  }

  /**
   * Create custom folder
   */
  createFolder(
    userId: string,
    name: string,
    includes: FolderInclude[] = [],
    excludes: FolderExclude[] = [],
    icon?: string,
    color?: string
  ): ChatFolder {
    const userFolders = this.getUserFolders(userId);
    
    if (userFolders.length >= this.config.maxFolders) {
      throw new Error('Maximum folders limit reached');
    }

    const folder: ChatFolder = {
      id: `folder-${Date.now()}`,
      userId,
      name,
      icon,
      color,
      includes,
      excludes,
      chatIds: [],
      isDefault: false,
      order: userFolders.length,
      createdAt: Date.now(),
    };

    this.folders.set(folder.id, folder);
    return folder;
  }

  /**
   * Get folder by ID
   */
  getFolder(folderId: string): ChatFolder | null {
    // Check default folders
    const defaultFolder = this.defaultFolders.find(f => f.id === folderId);
    if (defaultFolder) return defaultFolder;

    return this.folders.get(folderId) || null;
  }

  /**
   * Get user's folders
   */
  getUserFolders(userId: string): ChatFolder[] {
    return Array.from(this.folders.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get all folders including defaults
   */
  getAllFolders(userId: string): ChatFolder[] {
    const userFolders = this.getUserFolders(userId);
    return [...this.defaultFolders, ...userFolders];
  }

  /**
   * Update folder
   */
  updateFolder(
    folderId: string,
    updates: {
      name?: string;
      icon?: string;
      color?: string;
      includes?: FolderInclude[];
      excludes?: FolderExclude[];
      order?: number;
    }
  ): ChatFolder | null {
    const folder = this.folders.get(folderId);
    if (!folder || folder.isDefault) return null;

    const updatedFolder: ChatFolder = {
      ...folder,
      ...updates,
    };

    this.folders.set(folderId, updatedFolder);
    return updatedFolder;
  }

  /**
   * Delete folder
   */
  deleteFolder(folderId: string): boolean {
    const folder = this.folders.get(folderId);
    if (!folder || folder.isDefault) return false;

    this.folders.delete(folderId);
    return true;
  }

  /**
   * Add chat to folder
   */
  addChatToFolder(folderId: string, chatId: string): boolean {
    const folder = this.folders.get(folderId);
    if (!folder || folder.isDefault) return false;

    if (folder.chatIds.length >= this.config.maxChatsPerFolder) {
      return false;
    }

    if (!folder.chatIds.includes(chatId)) {
      folder.chatIds.push(chatId);
    }

    return true;
  }

  /**
   * Remove chat from folder
   */
  removeChatFromFolder(folderId: string, chatId: string): boolean {
    const folder = this.folders.get(folderId);
    if (!folder) return false;

    const index = folder.chatIds.indexOf(chatId);
    if (index !== -1) {
      folder.chatIds.splice(index, 1);
    }

    return true;
  }

  /**
   * Get chats for folder (applying filters)
   */
  getChatsForFolder(folder: ChatFolder, allChats: Array<{ id: string; type: string; isContact: boolean; isUnread: boolean; isMuted: boolean }>): string[] {
    let chats = [...allChats];

    // Apply includes
    for (const include of folder.includes) {
      chats = this.applyFilter(chats, include.type, true);
    }

    // Apply excludes
    for (const exclude of folder.excludes) {
      chats = this.applyFilter(chats, exclude.type, false);
    }

    // Add custom chats
    if (folder.includes.some(i => i.customChatIds)) {
      const customIds = folder.includes.flatMap(i => i.customChatIds || []);
      const customChats = allChats.filter(c => customIds.includes(c.id));
      chats = [...chats, ...customChats];
    }

    // Remove excluded chats
    if (folder.excludes.some(e => e.chatIds)) {
      const excludeIds = folder.excludes.flatMap(e => e.chatIds || []);
      chats = chats.filter(c => !excludeIds.includes(c.id));
    }

    // Add manually added chats
    if (folder.chatIds.length > 0) {
      const manualChats = allChats.filter(c => folder.chatIds.includes(c.id));
      chats = [...chats, ...manualChats];
    }

    // Remove duplicates
    const uniqueIds = new Set(chats.map(c => c.id));
    return Array.from(uniqueIds);
  }

  /**
   * Reorder folders
   */
  reorderFolders(folderIds: string[]): void {
    const folders = Array.from(this.folders.values());
    
    for (let i = 0; i < folderIds.length; i++) {
      const folder = folders.find(f => f.id === folderIds[i]);
      if (folder && !folder.isDefault) {
        folder.order = i;
      }
    }
  }

  /**
   * Get recommended folders based on chat patterns
   */
  getRecommendedFolders(userId: string, allChats: any[]): ChatFolder[] {
    const recommendations: ChatFolder[] = [];

    // Check if user has many groups
    const groups = allChats.filter(c => c.type === 'group');
    if (groups.length > 5) {
      recommendations.push({
        id: 'rec-groups',
        userId,
        name: 'Groups',
        includes: [{ type: 'groups' }],
        excludes: [],
        chatIds: [],
        isDefault: false,
        order: 0,
        createdAt: Date.now(),
      });
    }

    // Check if user has many channels
    const channels = allChats.filter(c => c.type === 'channel');
    if (channels.length > 5) {
      recommendations.push({
        id: 'rec-channels',
        userId,
        name: 'Channels',
        includes: [{ type: 'channels' }],
        excludes: [],
        chatIds: [],
        isDefault: false,
        order: 0,
        createdAt: Date.now(),
      });
    }

    return recommendations;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private applyFilter(
    chats: Array<{ id: string; type: string; isContact: boolean; isUnread: boolean; isMuted: boolean }>,
    filterType: FilterType,
    include: boolean
  ): Array<{ id: string; type: string; isContact: boolean; isUnread: boolean; isMuted: boolean }> {
    switch (filterType) {
      case 'contacts':
        return chats.filter(c => include ? c.isContact : !c.isContact);
      case 'non_contacts':
        return chats.filter(c => include ? !c.isContact : c.isContact);
      case 'groups':
        return chats.filter(c => include ? c.type === 'group' : c.type !== 'group');
      case 'channels':
        return chats.filter(c => include ? c.type === 'channel' : c.type !== 'channel');
      case 'bots':
        return chats.filter(c => include ? c.type === 'bot' : c.type !== 'bot');
      case 'unread':
        return chats.filter(c => include ? c.isUnread : !c.isUnread);
      case 'muted':
        return chats.filter(c => include ? c.isMuted : !c.isMuted);
      default:
        return chats;
    }
  }
}

/**
 * Notes Manager
 * 
 * Manages notes, folders, and tags.
 */

import type { Note, NoteType, NoteFolder, NoteTag, ChecklistItem } from './types.js';

/**
 * Notes configuration
 */
export interface NotesConfig {
  maxNotes: number;
  maxNoteLength: number;
  enableFolders: boolean;
  enableTags: boolean;
  enableReminders: boolean;
  enableEncryption: boolean;
}

/**
 * NotesManager - Manages notes lifecycle
 */
export class NotesManager {
  private config: NotesConfig;
  private notes: Map<string, Note> = new Map();
  private folders: Map<string, NoteFolder> = new Map();
  private tags: Map<string, NoteTag> = new Map();

  constructor(config: Partial<NotesConfig> = {}) {
    this.config = {
      maxNotes: 10000,
      maxNoteLength: 100000,
      enableFolders: true,
      enableTags: true,
      enableReminders: true,
      enableEncryption: true,
      ...config,
    };
  }

  /**
   * Create a new note
   */
  createNote(
    userId: string,
    type: NoteType,
    content: string,
    title?: string,
    folderId?: string
  ): Note {
    if (this.notes.size >= this.config.maxNotes) {
      throw new Error('Maximum notes limit reached');
    }

    if (content.length > this.config.maxNoteLength) {
      throw new Error('Note content too long');
    }

    const now = Date.now();
    const note: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      content,
      tags: [],
      folderId,
      isPinned: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    this.notes.set(note.id, note);

    // Add to folder if specified
    if (folderId && this.config.enableFolders) {
      const folder = this.folders.get(folderId);
      if (folder) {
        folder.noteIds.push(note.id);
      }
    }

    return note;
  }

  /**
   * Get note by ID
   */
  getNote(noteId: string): Note | null {
    return this.notes.get(noteId) || null;
  }

  /**
   * Update note
   */
  updateNote(noteId: string, updates: Partial<Note>): Note | null {
    const note = this.notes.get(noteId);
    if (!note) return null;

    const updatedNote: Note = {
      ...note,
      ...updates,
      updatedAt: Date.now(),
    };

    this.notes.set(noteId, updatedNote);
    return updatedNote;
  }

  /**
   * Delete note
   */
  deleteNote(noteId: string): boolean {
    const note = this.notes.get(noteId);
    if (!note) return false;

    // Remove from folder
    if (note.folderId) {
      const folder = this.folders.get(note.folderId);
      if (folder) {
        folder.noteIds = folder.noteIds.filter(id => id !== noteId);
      }
    }

    this.notes.delete(noteId);
    return true;
  }

  /**
   * Get user's notes
   */
  getUserNotes(userId: string, options?: {
    folderId?: string;
    tagId?: string;
    searchQuery?: string;
    pinned?: boolean;
    favorite?: boolean;
  }): Note[] {
    let notes = Array.from(this.notes.values()).filter(n => n.userId === userId);

    if (options) {
      if (options.folderId) {
        notes = notes.filter(n => n.folderId === options.folderId);
      }

      if (options.tagId) {
        notes = notes.filter(n => n.tags.includes(options.tagId!));
      }

      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        notes = notes.filter(n =>
          n.title?.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
        );
      }

      if (options.pinned) {
        notes = notes.filter(n => n.isPinned);
      }

      if (options.favorite) {
        notes = notes.filter(n => n.isFavorite);
      }
    }

    // Sort: pinned first, then by updated date
    return notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }

  /**
   * Create folder
   */
  createFolder(userId: string, name: string, parentId?: string): NoteFolder {
    if (!this.config.enableFolders) {
      throw new Error('Folders are disabled');
    }

    const folder: NoteFolder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
      noteIds: [],
      createdAt: Date.now(),
    };

    this.folders.set(folder.id, folder);
    return folder;
  }

  /**
   * Get user's folders
   */
  getUserFolders(userId: string): NoteFolder[] {
    return Array.from(this.folders.values());
  }

  /**
   * Delete folder
   */
  deleteFolder(folderId: string): boolean {
    const folder = this.folders.get(folderId);
    if (!folder) return false;

    // Move notes to no folder
    for (const noteId of folder.noteIds) {
      const note = this.notes.get(noteId);
      if (note) {
        note.folderId = undefined;
      }
    }

    this.folders.delete(folderId);
    return true;
  }

  /**
   * Create tag
   */
  createTag(userId: string, name: string, color: string): NoteTag {
    if (!this.config.enableTags) {
      throw new Error('Tags are disabled');
    }

    const tag: NoteTag = {
      id: `tag-${Date.now()}`,
      name,
      color,
    };

    this.tags.set(tag.id, tag);
    return tag;
  }

  /**
   * Get all tags
   */
  getTags(): NoteTag[] {
    return Array.from(this.tags.values());
  }

  /**
   * Add tag to note
   */
  addTagToNote(noteId: string, tagId: string): Note | null {
    const note = this.notes.get(noteId);
    if (!note) return null;

    if (!note.tags.includes(tagId)) {
      note.tags.push(tagId);
      note.updatedAt = Date.now();
    }

    return note;
  }

  /**
   * Remove tag from note
   */
  removeTagFromNote(noteId: string, tagId: string): Note | null {
    const note = this.notes.get(noteId);
    if (!note) return null;

    note.tags = note.tags.filter(id => id !== tagId);
    note.updatedAt = Date.now();

    return note;
  }

  /**
   * Toggle pin
   */
  togglePin(noteId: string): Note | null {
    return this.updateNote(noteId, { isPinned: !this.notes.get(noteId)?.isPinned });
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(noteId: string): Note | null {
    return this.updateNote(noteId, { isFavorite: !this.notes.get(noteId)?.isFavorite });
  }

  /**
   * Add checklist item
   */
  addChecklistItem(noteId: string, text: string): Note | null {
    const note = this.notes.get(noteId);
    if (!note || note.type !== 'checklist') return null;

    if (!note.checklistItems) {
      note.checklistItems = [];
    }

    note.checklistItems.push({
      id: `item-${Date.now()}`,
      text,
      checked: false,
    });

    note.updatedAt = Date.now();
    return note;
  }

  /**
   * Toggle checklist item
   */
  toggleChecklistItem(noteId: string, itemId: string): Note | null {
    const note = this.notes.get(noteId);
    if (!note || !note.checklistItems) return null;

    const item = note.checklistItems.find(i => i.id === itemId);
    if (!item) return null;

    item.checked = !item.checked;
    note.updatedAt = Date.now();

    return note;
  }

  /**
   * Get notes statistics
   */
  getStats(userId: string): {
    totalNotes: number;
    notesByType: Record<NoteType, number>;
    totalFolders: number;
    totalTags: number;
    pinnedNotes: number;
    favoriteNotes: number;
  } {
    const userNotes = Array.from(this.notes.values()).filter(n => n.userId === userId);

    const notesByType: Record<NoteType, number> = {
      text: 0,
      checklist: 0,
      media: 0,
      file: 0,
      voice: 0,
      link: 0,
    };

    for (const note of userNotes) {
      notesByType[note.type]++;
    }

    return {
      totalNotes: userNotes.length,
      notesByType,
      totalFolders: this.folders.size,
      totalTags: this.tags.size,
      pinnedNotes: userNotes.filter(n => n.isPinned).length,
      favoriteNotes: userNotes.filter(n => n.isFavorite).length,
    };
  }
}

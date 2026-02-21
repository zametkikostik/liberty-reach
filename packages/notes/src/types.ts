/**
 * Notes Types
 */

/**
 * Note types
 */
export type NoteType = 
  | 'text'
  | 'checklist'
  | 'media'
  | 'file'
  | 'voice'
  | 'link';

/**
 * Note tag
 */
export interface NoteTag {
  id: string;
  name: string;
  color: string;
}

/**
 * Note folder
 */
export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;
  noteIds: string[];
  createdAt: number;
}

/**
 * Checklist item
 */
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

/**
 * Note interface
 */
export interface Note {
  id: string;
  userId: string;
  type: NoteType;
  title?: string;
  content: string;
  checklistItems?: ChecklistItem[];
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  tags: string[];
  folderId?: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  reminderAt?: number;
}

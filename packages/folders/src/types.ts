/**
 * Chat Folders Types
 */

/**
 * Filter types for folders
 */
export type FilterType =
  | 'contacts'
  | 'non_contacts'
  | 'groups'
  | 'channels'
  | 'bots'
  | 'unread'
  | 'muted';

/**
 * Folder include filter
 */
export interface FolderInclude {
  type: FilterType;
  customChatIds?: string[];
}

/**
 * Folder exclude filter
 */
export interface FolderExclude {
  type: FilterType;
  chatIds?: string[];
}

/**
 * Chat folder
 */
export interface ChatFolder {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  includes: FolderInclude[];
  excludes: FolderExclude[];
  chatIds: string[];
  isDefault: boolean; // All Chats, Unread, etc.
  order: number;
  createdAt: number;
}

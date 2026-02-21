/**
 * Stories Types
 */

/**
 * Story privacy settings
 */
export type StoryPrivacy = 
  | 'everybody'
  | 'contacts'
  | 'close_friends'
  | 'selected_contacts'
  | 'never_share_with';

/**
 * Story item (photo/video)
 */
export interface StoryItem {
  id: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  duration?: number; // For videos in seconds
  caption?: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Story with multiple items
 */
export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  items: StoryItem[];
  privacy: StoryPrivacy;
  allowedUsers?: string[]; // For selected_contacts
  hiddenFromUsers?: string[]; // For never_share_with
  createdAt: number;
  expiresAt: number;
  views: StoryView[];
  reactions: StoryReaction[];
  isPinned?: boolean;
}

/**
 * Story view
 */
export interface StoryView {
  userId: string;
  userName: string;
  viewedAt: number;
  watchedDuration: number;
}

/**
 * Story reaction
 */
export interface StoryReaction {
  userId: string;
  userName: string;
  reaction: string; // Emoji
  createdAt: number;
}

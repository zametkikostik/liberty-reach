/**
 * Stories Manager
 * 
 * Manages creation, viewing, and expiration of stories.
 */

import type { Story, StoryItem, StoryPrivacy, StoryView, StoryReaction } from './types.js';

/**
 * Stories configuration
 */
export interface StoriesConfig {
  /** Story duration in hours (default: 24) */
  storyDuration: number;
  /** Max items per story */
  maxItemsPerStory: number;
  /** Max story duration for videos (seconds) */
  maxVideoDuration: number;
  /** Enable reactions */
  enableReactions: boolean;
  /** Enable view tracking */
  enableViewTracking: boolean;
}

/**
 * StoriesManager - Manages stories lifecycle
 */
export class StoriesManager {
  private config: StoriesConfig;
  private stories: Map<string, Story> = new Map();
  private userStories: Map<string, string[]> = new Map(); // userId -> storyIds
  private expirationTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(config: Partial<StoriesConfig> = {}) {
    this.config = {
      storyDuration: 24,
      maxItemsPerStory: 100,
      maxVideoDuration: 60,
      enableReactions: true,
      enableViewTracking: true,
      ...config,
    };
  }

  /**
   * Create a new story
   */
  createStory(
    userId: string,
    userName: string,
    items: Omit<StoryItem, 'id' | 'createdAt' | 'expiresAt'>[],
    privacy: StoryPrivacy = 'everybody',
    allowedUsers?: string[],
    hiddenFromUsers?: string[]
  ): Story {
    const now = Date.now();
    const expiresAt = now + (this.config.storyDuration * 60 * 60 * 1000);

    const storyItems: StoryItem[] = items.map((item, index) => ({
      ...item,
      id: `story-item-${Date.now()}-${index}`,
      createdAt: now,
      expiresAt,
    }));

    const story: Story = {
      id: `story-${userId}-${Date.now()}`,
      userId,
      userName,
      items: storyItems,
      privacy,
      allowedUsers,
      hiddenFromUsers,
      createdAt: now,
      expiresAt,
      views: [],
      reactions: [],
      isPinned: false,
    };

    // Store story
    this.stories.set(story.id, story);

    // Add to user's stories
    const userStoryList = this.userStories.get(userId) || [];
    userStoryList.push(story.id);
    this.userStories.set(userId, userStoryList);

    // Set expiration timer
    this.setExpirationTimer(story.id, expiresAt);

    return story;
  }

  /**
   * Add item to existing story
   */
  addStoryItem(
    storyId: string,
    item: Omit<StoryItem, 'id' | 'createdAt' | 'expiresAt'>
  ): Story | null {
    const story = this.stories.get(storyId);
    if (!story) return null;

    if (story.items.length >= this.config.maxItemsPerStory) {
      return null;
    }

    const newItem: StoryItem = {
      ...item,
      id: `story-item-${Date.now()}`,
      createdAt: Date.now(),
      expiresAt: story.expiresAt,
    };

    story.items.push(newItem);
    return story;
  }

  /**
   * Get story by ID
   */
  getStory(storyId: string): Story | null {
    return this.stories.get(storyId) || null;
  }

  /**
   * Get user's active stories
   */
  getUserStories(userId: string): Story[] {
    const storyIds = this.userStories.get(userId) || [];
    const now = Date.now();

    return storyIds
      .map(id => this.stories.get(id))
      .filter((s): s is Story => s !== undefined && s.expiresAt > now);
  }

  /**
   * Get all active stories (for feed)
   */
  getAllStories(currentUserId: string): Story[] {
    const now = Date.now();
    const stories: Story[] = [];

    for (const story of this.stories.values()) {
      if (story.expiresAt <= now) continue;
      if (!this.canViewStory(story, currentUserId)) continue;

      stories.push(story);
    }

    // Sort by creation time (newest first)
    return stories.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Check if user can view story
   */
  canViewStory(story: Story, userId: string): boolean {
    if (story.userId === userId) return true;

    switch (story.privacy) {
      case 'everybody':
        return true;
      case 'contacts':
        // Check if userId is in contacts (implement contacts check)
        return true;
      case 'close_friends':
        // Check if userId is in close friends
        return story.allowedUsers?.includes(userId) ?? false;
      case 'selected_contacts':
        return story.allowedUsers?.includes(userId) ?? false;
      case 'never_share_with':
        return !story.hiddenFromUsers?.includes(userId);
      default:
        return false;
    }
  }

  /**
   * Mark story as viewed
   */
  viewStory(storyId: string, userId: string, userName: string, watchedDuration: number): void {
    if (!this.config.enableViewTracking) return;

    const story = this.stories.get(storyId);
    if (!story) return;

    // Check if already viewed
    const existingView = story.views.find(v => v.userId === userId);
    if (existingView) {
      existingView.watchedDuration = Math.max(existingView.watchedDuration, watchedDuration);
      existingView.viewedAt = Date.now();
    } else {
      story.views.push({
        userId,
        userName,
        viewedAt: Date.now(),
        watchedDuration,
      });
    }
  }

  /**
   * Add reaction to story
   */
  reactToStory(
    storyId: string,
    userId: string,
    userName: string,
    reaction: string
  ): boolean {
    if (!this.config.enableReactions) return false;

    const story = this.stories.get(storyId);
    if (!story) return false;

    // Remove existing reaction from this user
    story.reactions = story.reactions.filter(r => r.userId !== userId);

    // Add new reaction
    story.reactions.push({
      userId,
      userName,
      reaction,
      createdAt: Date.now(),
    });

    return true;
  }

  /**
   * Delete story
   */
  deleteStory(storyId: string): boolean {
    const story = this.stories.get(storyId);
    if (!story) return false;

    // Clear expiration timer
    const timer = this.expirationTimers.get(storyId);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(storyId);
    }

    // Remove from user's stories
    const userStoryList = this.userStories.get(story.userId) || [];
    const index = userStoryList.indexOf(storyId);
    if (index !== -1) {
      userStoryList.splice(index, 1);
    }

    // Remove story
    this.stories.delete(storyId);
    return true;
  }

  /**
   * Pin story
   */
  pinStory(storyId: string, pinned: boolean): boolean {
    const story = this.stories.get(storyId);
    if (!story) return false;

    story.isPinned = pinned;
    return true;
  }

  /**
   * Get story views
   */
  getStoryViews(storyId: string): StoryView[] {
    const story = this.stories.get(storyId);
    return story ? [...story.views] : [];
  }

  /**
   * Get story reactions
   */
  getStoryReactions(storyId: string): StoryReaction[] {
    const story = this.stories.get(storyId);
    return story ? [...story.reactions] : [];
  }

  /**
   * Get unread stories for user
   */
  getUnreadStories(userId: string, viewedStoryIds: Set<string>): Story[] {
    const allStories = this.getAllStories(userId);
    return allStories.filter(s => !viewedStoryIds.has(s.id));
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private setExpirationTimer(storyId: string, expiresAt: number): void {
    const timer = setTimeout(() => {
      this.deleteStory(storyId);
    }, expiresAt - Date.now());

    this.expirationTimers.set(storyId, timer);
  }
}

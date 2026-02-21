/**
 * Story Viewer Component
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Story, StoryItem } from '../types.js';

/**
 * Viewer configuration
 */
export interface ViewerConfig {
  autoAdvance: boolean;
  showReactions: boolean;
  showViews: boolean;
  tapToSkip: boolean;
  swipeToNavigate: boolean;
}

/**
 * StoryViewer props
 */
export interface StoryViewerProps {
  story: Story;
  currentIndex?: number;
  config?: Partial<ViewerConfig>;
  onClose?: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onReaction?: (reaction: string) => void;
  onViewed?: (duration: number) => void;
}

/**
 * StoryViewer - Displays stories with swipe navigation
 */
export const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  currentIndex = 0,
  config = {},
  onClose,
  onNavigate,
  onReaction,
  onViewed,
}) => {
  const defaultConfig: ViewerConfig = {
    autoAdvance: true,
    showReactions: true,
    showViews: true,
    tapToSkip: true,
    swipeToNavigate: true,
    ...config,
  };

  const [currentItemIndex, setCurrentItemIndex] = useState(currentIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentItem = story.items[currentItemIndex];

  // Auto-advance timer
  useEffect(() => {
    if (!defaultConfig.autoAdvance || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const duration = currentItem?.type === 'video' 
      ? (currentItem.duration || 15) * 1000 
      : 5000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = (elapsed / duration) * 100;

      if (newProgress >= 100) {
        advanceToNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentItemIndex, isPaused, currentItem]);

  const advanceToNext = () => {
    if (currentItemIndex < story.items.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      // End of story
      if (onViewed) {
        onViewed(Date.now() - startTimeRef.current);
      }
      if (onNavigate) {
        onNavigate('next');
      }
    }
  };

  const goToPrevious = () => {
    if (progress > 10) {
      // Restart current item
      setProgress(0);
      startTimeRef.current = Date.now();
    } else if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      if (onNavigate) {
        onNavigate('prev');
      }
    }
  };

  const handleTap = (side: 'left' | 'right') => {
    if (!defaultConfig.tapToSkip) return;

    if (side === 'left') {
      goToPrevious();
    } else {
      advanceToNext();
    }
  };

  const handleReaction = (reaction: string) => {
    if (onReaction) {
      onReaction(reaction);
    }
  };

  if (!currentItem) {
    return null;
  }

  return (
    <div className="story-viewer">
      {/* Progress bars */}
      <div className="story-progress">
        {story.items.map((_, index) => (
          <div key={index} className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: index < currentItemIndex
                  ? '100%'
                  : index === currentItemIndex
                  ? `${progress}%`
                  : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header">
        <div className="story-user">
          <img
            src={story.userAvatar}
            alt={story.userName}
            className="story-user-avatar"
          />
          <span className="story-user-name">{story.userName}</span>
          <span className="story-time">
            {formatTimeAgo(story.createdAt)}
          </span>
        </div>
        <button className="story-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Content */}
      <div
        className="story-content"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
      >
        {currentItem.type === 'photo' ? (
          <img src={currentItem.mediaUrl} alt="Story" className="story-media" />
        ) : (
          <video
            src={currentItem.mediaUrl}
            poster={currentItem.thumbnailUrl}
            className="story-media"
            autoPlay
            muted
            loop={false}
          />
        )}

        {currentItem.caption && (
          <div className="story-caption">{currentItem.caption}</div>
        )}

        {/* Tap zones */}
        <div className="story-tap-zones">
          <div
            className="tap-zone left"
            onClick={() => handleTap('left')}
          />
          <div
            className="tap-zone right"
            onClick={() => handleTap('right')}
          />
        </div>
      </div>

      {/* Footer with reactions */}
      {defaultConfig.showReactions && (
        <div className="story-footer">
          <div className="reaction-bar">
            {['❤️', '😂', '😮', '😢', '👏'].map(emoji => (
              <button
                key={emoji}
                className="reaction-button"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

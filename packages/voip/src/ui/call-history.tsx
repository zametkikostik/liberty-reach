/**
 * CallHistory Component
 */

import React from 'react';
import type { CallRecord, CallLog } from '../types.js';

/**
 * CallHistory props
 */
export interface CallHistoryProps {
  calls: CallLog[];
  onCall: (number: string) => void;
  onVideoCall: (number: string) => void;
  onDelete: (callId: string) => void;
  onClearAll: () => void;
}

/**
 * CallHistory - Display call history
 */
export const CallHistory: React.FC<CallHistoryProps> = ({
  calls,
  onCall,
  onVideoCall,
  onDelete,
  onClearAll,
}) => {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'incoming': return '📞↓';
      case 'outgoing': return '📞↑';
      case 'missed': return '📞✕';
      default: return '📞';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'missed': return 'red';
      default: return 'inherit';
    }
  };

  return (
    <div className="call-history">
      <div className="call-history-header">
        <h2>Recents</h2>
        <button onClick={onClearAll}>Clear All</button>
      </div>

      <div className="call-history-list">
        {calls.length === 0 ? (
          <div className="call-history-empty">
            <p>No recent calls</p>
          </div>
        ) : (
          calls.map((call) => (
            <div key={call.id} className="call-history-item">
              <div
                className="call-history-icon"
                style={{ color: getTypeColor(call.type) }}
              >
                {getTypeIcon(call.type)}
              </div>
              <div className="call-history-info">
                <div className="call-history-name">
                  {call.contactName || call.phoneNumber}
                </div>
                <div className="call-history-details">
                  <span>{formatTime(call.timestamp)}</span>
                  {call.duration > 0 && (
                    <span> • {formatDuration(call.duration)}</span>
                  )}
                </div>
              </div>
              <div className="call-history-actions">
                <button
                  className="action-btn"
                  onClick={() => onCall(call.phoneNumber)}
                  title="Call back"
                >
                  📞
                </button>
                <button
                  className="action-btn"
                  onClick={() => onVideoCall(call.phoneNumber)}
                  title="Video call"
                >
                  📹
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => onDelete(call.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

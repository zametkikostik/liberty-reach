/**
 * CallScreen Component
 */

import React, { useState, useEffect } from 'react';
import type { CallState } from '../types.js';

/**
 * CallScreen props
 */
export interface CallScreenProps {
  state: CallState;
  from?: string;
  fromName?: string;
  duration?: number;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onMute: (muted: boolean) => void;
  onHold: () => void;
  onSpeaker: (enabled: boolean) => void;
  onDTMF: (tone: string) => void;
  onTransfer: (number: string) => void;
}

/**
 * CallScreen - Active call screen
 */
export const CallScreen: React.FC<CallScreenProps> = ({
  state,
  from,
  fromName,
  duration = 0,
  onAccept,
  onReject,
  onEnd,
  onMute,
  onHold,
  onSpeaker,
  onDTMF,
  onTransfer,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showDialPad, setShowDialPad] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (state === 'IN_CALL') {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedTime(0);
    }
  }, [state]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    onMute(newMuted);
  };

  const handleSpeaker = () => {
    const newSpeaker = !isSpeaker;
    setIsSpeaker(newSpeaker);
    onSpeaker(newSpeaker);
  };

  const handleHold = () => {
    const newHold = !isOnHold;
    setIsOnHold(newHold);
    if (newHold) {
      onHold();
    } else {
      // Resume
    }
  };

  const handleDTMF = (tone: string) => {
    onDTMF(tone);
  };

  if (state === 'IDLE') {
    return null;
  }

  return (
    <div className="call-screen">
      {/* Caller info */}
      <div className="call-info">
        <div className="call-avatar">
          {fromName?.[0]?.toUpperCase() || '👤'}
        </div>
        <div className="call-name">{fromName || from}</div>
        <div className="call-status">
          {state === 'DIALING' && 'Calling...'}
          {state === 'RINGING' && 'Ringing...'}
          {state === 'IN_CALL' && formatTime(elapsedTime)}
          {state === 'ON_HOLD' && 'On Hold'}
          {state === 'TRANSFERRING' && 'Transferring...'}
        </div>
      </div>

      {/* Call controls */}
      {state === 'RINGING' ? (
        // Incoming call buttons
        <div className="call-buttons-incoming">
          <button className="call-btn reject" onClick={onReject}>
            📞
          </button>
          <button className="call-btn accept" onClick={onAccept}>
            📞
          </button>
        </div>
      ) : (
        // Active call buttons
        <>
          <div className="call-controls">
            <button
              className={`call-control-btn ${isMuted ? 'active' : ''}`}
              onClick={handleMute}
            >
              {isMuted ? '🔇' : '🎤'}
              <span>Mute</span>
            </button>
            <button
              className={`call-control-btn ${showDialPad ? 'active' : ''}`}
              onClick={() => setShowDialPad(!showDialPad)}
            >
              🔢
              <span>Keypad</span>
            </button>
            <button
              className={`call-control-btn ${isOnHold ? 'active' : ''}`}
              onClick={handleHold}
            >
              ⏸️
              <span>Hold</span>
            </button>
            <button
              className={`call-control-btn ${isSpeaker ? 'active' : ''}`}
              onClick={handleSpeaker}
            >
              {isSpeaker ? '🔊' : '🔈'}
              <span>Speaker</span>
            </button>
            <button
              className="call-control-btn"
              onClick={() => onTransfer('')}
            >
              ➡️
              <span>Transfer</span>
            </button>
          </div>

          {/* DTMF Dialpad */}
          {showDialPad && (
            <div className="call-dialpad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(
                (digit) => (
                  <button
                    key={digit}
                    className="dtmf-button"
                    onClick={() => handleDTMF(digit)}
                  >
                    {digit}
                  </button>
                )
              )}
            </div>
          )}

          {/* End call button */}
          <button className="call-btn end" onClick={onEnd}>
            📞
          </button>
        </>
      )}
    </div>
  );
};

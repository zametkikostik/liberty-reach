/**
 * DialPad Component
 */

import React, { useState } from 'react';

/**
 * DialPad props
 */
export interface DialPadProps {
  onCall: (number: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * DialPad - Phone dial pad
 */
export const DialPad: React.FC<DialPadProps> = ({
  onCall,
  onBackspace,
  onClear,
  disabled = false,
}) => {
  const [number, setNumber] = useState('');

  const handlePress = (digit: string) => {
    const newNumber = number + digit;
    setNumber(newNumber);
  };

  const handleCall = () => {
    if (number) {
      onCall(number);
    }
  };

  const handleBackspace = () => {
    setNumber(number.slice(0, -1));
    onBackspace();
  };

  const handleClear = () => {
    setNumber('');
    onClear();
  };

  const buttons = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' },
  ];

  return (
    <div className="dialpad">
      {/* Number display */}
      <div className="dialpad-display">
        <input
          type="text"
          value={number}
          readOnly
          placeholder="Enter number"
          className="dialpad-input"
        />
        {number && (
          <button className="dialpad-clear" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>

      {/* Dial pad buttons */}
      <div className="dialpad-grid">
        {buttons.map((btn) => (
          <button
            key={btn.digit}
            className="dialpad-button"
            onClick={() => handlePress(btn.digit)}
            disabled={disabled}
          >
            <span className="dialpad-digit">{btn.digit}</span>
            {btn.letters && (
              <span className="dialpad-letters">{btn.letters}</span>
            )}
          </button>
        ))}
      </div>

      {/* Call button */}
      <button
        className="dialpad-call"
        onClick={handleCall}
        disabled={!number || disabled}
      >
        📞
      </button>
    </div>
  );
};

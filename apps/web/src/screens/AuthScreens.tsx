/**
 * Auth Screens for Liberty Reach
 * 
 * Registration, login, and verification screens.
 */

import React, { useState } from 'react';

/**
 * Auth Screen Props
 */
export interface AuthScreenProps {
  onAuthenticated: (userId: string, token: string) => void;
  onSwitchToLogin?: () => void;
  onSwitchToRegister?: () => void;
}

/**
 * Registration Screen
 */
export const RegisterScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  onSwitchToLogin,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock registration (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production: POST /api/auth/register
      const userId = `user-${Date.now()}`;
      const token = `token-${Math.random().toString(36).substr(2)}`;
      
      // Store credentials
      localStorage.setItem('userId', userId);
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      onAuthenticated(userId, token);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen register-screen">
      <div className="auth-container">
        <div className="auth-logo">🛡️</div>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join Liberty Reach securely</p>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              required
              pattern="\+?[0-9\s\-()]+"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              minLength={8}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="auth-link">
            Sign In
          </button>
        </div>

        <div className="auth-security">
          <div className="security-badge">🔐</div>
          <p>End-to-end encrypted with CRYSTALS-Kyber-1024</p>
        </div>
      </div>

      <style>{`
        .auth-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .auth-container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 100%;
          color: #111;
        }
        .auth-logo {
          font-size: 64px;
          text-align: center;
          margin-bottom: 20px;
        }
        h1 {
          text-align: center;
          margin-bottom: 10px;
          color: #111;
        }
        .auth-subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        .form-group input {
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .auth-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .auth-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-message {
          background: #ffebee;
          color: #d32f2f;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }
        .auth-footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
        }
        .auth-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        .auth-security {
          margin-top: 30px;
          text-align: center;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 12px;
        }
        .security-badge {
          font-size: 32px;
          margin-bottom: 10px;
        }
        .auth-security p {
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

/**
 * Login Screen
 */
export const LoginScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  onSwitchToRegister,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock login (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production: POST /api/auth/login
      const userId = `user-${Date.now()}`;
      const token = `token-${Math.random().toString(36).substr(2)}`;
      
      // Store credentials
      localStorage.setItem('userId', userId);
      localStorage.setItem('token', token);
      
      onAuthenticated(userId, token);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen login-screen">
      <div className="auth-container">
        <div className="auth-logo">🛡️</div>
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to Liberty Reach</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Username or Phone</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter username or phone"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="auth-link">
            Sign Up
          </button>
        </div>

        <div className="auth-security">
          <div className="security-badge">🔐</div>
          <p>Secured with post-quantum encryption</p>
        </div>
      </div>

      <style>{`
        .login-screen .auth-button {
          background: linear-gradient(135deg, #34C759 0%, #30D158 100%);
        }
      `}</style>
    </div>
  );
};

/**
 * Verification Code Screen
 */
export const VerificationScreen: React.FC<{
  phoneNumber: string;
  onVerified: (code: string) => void;
  onBack: () => void;
}> = ({ phoneNumber, onVerified, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all filled
    if (newCode.every(d => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setLoading(true);
    
    try {
      // Mock verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      onVerified(verificationCode);
    } catch (err) {
      alert('Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen verification-screen">
      <div className="auth-container">
        <div className="auth-logo">📱</div>
        <h1>Verification</h1>
        <p className="auth-subtitle">
          Enter code sent to {phoneNumber}
        </p>

        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              disabled={loading}
              className="code-input"
            />
          ))}
        </div>

        {loading && <div className="loading">Verifying...</div>}

        <div className="auth-footer">
          <button onClick={onBack} className="auth-link">
            Change phone number
          </button>
        </div>
      </div>

      <style>{`
        .verification-screen .auth-logo {
          font-size: 48px;
        }
        .code-inputs {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 30px 0;
        }
        .code-input {
          width: 50px;
          height: 60px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          transition: border-color 0.3s;
        }
        .code-input:focus {
          outline: none;
          border-color: #667eea;
        }
        .loading {
          text-align: center;
          color: #666;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

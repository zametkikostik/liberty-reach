/**
 * Auth API Server
 * 
 * Handles registration, login, and authentication.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// In-memory database (replace with PostgreSQL in production)
const users = new Map();

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'liberty-reach-secret-key-change-in-production';

/**
 * Register new user
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;

    // Validate input
    if (!username || !phoneNumber || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = Array.from(users.values()).find(
      (u: any) => u.username === username || u.phoneNumber === phoneNumber
    );

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: userId,
      username,
      phoneNumber,
      passwordHash,
      createdAt: Date.now(),
      publicKey: null, // Will be set later
      profile: {
        displayName: username,
        avatar: null,
        status: 'Available',
      },
    };

    users.set(userId, user);

    // Generate JWT token
    const token = jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      userId,
      username,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Credentials required' });
    }

    // Find user by username or phone
    const user = Array.from(users.values()).find(
      (u: any) => u.username === identifier || u.phoneNumber === identifier
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      userId: user.id,
      username: user.username,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Verify token
 */
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.json({ valid: false });
  }
});

/**
 * Get user profile
 */
app.get('/api/users/:userId', (req, res) => {
  const user = users.get(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Return public profile (without password hash)
  res.json({
    id: user.id,
    username: user.username,
    profile: user.profile,
    publicKey: user.publicKey,
  });
});

/**
 * Update profile
 */
app.put('/api/users/:userId', (req, res) => {
  const user = users.get(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update profile
  user.profile = { ...user.profile, ...req.body.profile };
  users.set(req.params.userId, user);

  res.json({ success: true, profile: user.profile });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔐 Auth server running on port ${PORT}`);
});

export default app;

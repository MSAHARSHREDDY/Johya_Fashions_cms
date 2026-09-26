import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

export type UserRole = 'admin' | 'superadmin';

export interface AuthUserPayload {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
}

// In-memory fallback user store (ensures resilience even if MongoDB is reconnecting)
const memoryUsers = new Map<string, {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string; // bcrypt hash
  role: UserRole;
  createdAt: string;
}>();

// Helper to check if a password string is already a bcrypt hash
function isBcryptHash(str: string): boolean {
  return /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

// Automatically upgrade any legacy plaintext passwords in MongoDB to bcrypt hashes
async function migratePlaintextPasswordsToBcrypt() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const users = await User.find({});
    let migratedCount = 0;

    for (const u of users) {
      if (u.password && !isBcryptHash(u.password)) {
        const salt = await bcrypt.genSalt(10);
        u.password = await bcrypt.hash(u.password, salt);
        await u.save();
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`[Bcrypt] Successfully migrated ${migratedCount} plaintext user password(s) in MongoDB to bcrypt.`);
    }
  } catch (err: any) {
    console.warn('[Bcrypt] Migration check warning:', err.message);
  }
}

// Trigger initial migration when MongoDB connects
mongoose.connection.on('connected', () => {
  migratePlaintextPasswordsToBcrypt();
});
// Also run once if already connected
if (mongoose.connection.readyState === 1) {
  migratePlaintextPasswordsToBcrypt();
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, and password are required.',
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanPassword = String(password).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : `${cleanUsername}@johyafashions.com`;
    const selectedRole: UserRole = role === 'superadmin' ? 'superadmin' : 'admin';

    if (cleanUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.',
      });
    }

    if (cleanPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long.',
      });
    }

    // Check in-memory store
    if (memoryUsers.has(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: `Username '${cleanUsername}' is already registered. Please choose another username.`,
      });
    }

    // Hash the password with bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    let savedId = `usr_${Date.now()}`;

    // If MongoDB is connected, save into DB with bcrypt hashed password
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ username: cleanUsername });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `Username '${cleanUsername}' already exists. Please choose a different username or sign in.`,
        });
      }

      const newUser = new User({
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword, // Stored as bcrypt hash in MongoDB
        role: selectedRole,
      });

      const saved = await newUser.save();
      savedId = saved._id.toString();
    }

    // Also record in memory store with bcrypt hashed password
    memoryUsers.set(cleanUsername, {
      id: savedId,
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: selectedRole,
      createdAt: new Date().toISOString(),
    });

    const userPayload: AuthUserPayload = {
      id: savedId,
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      role: selectedRole,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      message: `Account created successfully for ${cleanName} as ${selectedRole === 'superadmin' ? 'Super Admin' : 'Admin'}!`,
      user: userPayload,
      token: `token_${cleanUsername}_${Date.now()}`,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create account. Please try again.',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.',
      });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // Check MongoDB first if connected
    if (mongoose.connection.readyState === 1) {
      const dbUser = await User.findOne({
        $or: [{ username: cleanId }, { email: cleanId }],
      });

      if (dbUser) {
        let isMatch = false;

        if (isBcryptHash(dbUser.password)) {
          // Verify with bcrypt
          isMatch = await bcrypt.compare(cleanPassword, dbUser.password);
        } else {
          // If legacy plaintext password in DB, verify and immediately upgrade to bcrypt
          if (dbUser.password === cleanPassword) {
            isMatch = true;
            const salt = await bcrypt.genSalt(10);
            dbUser.password = await bcrypt.hash(cleanPassword, salt);
            await dbUser.save();
          }
        }

        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Incorrect password. Please try again.',
          });
        }

        const userPayload: AuthUserPayload = {
          id: dbUser._id.toString(),
          username: dbUser.username,
          name: dbUser.name,
          email: dbUser.email || `${dbUser.username}@johyafashions.com`,
          role: dbUser.role,
          lastLogin: new Date().toISOString(),
        };

        return res.json({
          success: true,
          message: `Welcome back, ${dbUser.name}!`,
          user: userPayload,
          token: `token_${dbUser.username}_${Date.now()}`,
        });
      }
    }

    // Check in-memory users
    for (const [uname, memUser] of memoryUsers.entries()) {
      if (uname === cleanId || memUser.email.toLowerCase() === cleanId) {
        let isMatch = false;
        if (isBcryptHash(memUser.password)) {
          isMatch = await bcrypt.compare(cleanPassword, memUser.password);
        } else {
          isMatch = memUser.password === cleanPassword;
        }

        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Incorrect password. Please try again.',
          });
        }

        const userPayload: AuthUserPayload = {
          id: memUser.id,
          username: memUser.username,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          lastLogin: new Date().toISOString(),
        };

        return res.json({
          success: true,
          message: `Welcome back, ${memUser.name}!`,
          user: userPayload,
          token: `token_${memUser.username}_${Date.now()}`,
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Account not found. Please check your username/password or sign up to create your account.',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
  }
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  return res.json({
    success: true,
    rolesAllowed: ['admin', 'superadmin'],
    encryption: 'bcrypt',
  });
});

export default router;

import { AuthUser, UserRole } from '@/types/auth';

const STORAGE_KEY_AUTH = 'johya_cms_auth_user';
const STORAGE_KEY_USERS = 'johya_cms_registered_accounts';

export interface RegisterPayload {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
}

interface LocalStoredAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

function getLocalAccounts(): LocalStoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccount(account: LocalStoredAccount) {
  try {
    const accounts = getLocalAccounts();
    const existingIndex = accounts.findIndex(
      (a) => a.username.toLowerCase() === account.username.toLowerCase()
    );
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save account locally:', e);
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role === 'admin' || parsed.role === 'superadmin')) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving user to localStorage:', e);
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch (e) {
    console.error('Error removing user from localStorage:', e);
  }
}

// Register a new user (Create Account)
export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const cleanUsername = payload.username.trim().toLowerCase();
  const cleanName = payload.name.trim();
  const cleanPassword = payload.password.trim();
  const cleanEmail = payload.email?.trim().toLowerCase() || `${cleanUsername}@johyafashions.com`;
  const selectedRole: UserRole = payload.role === 'superadmin' ? 'superadmin' : 'admin';

  if (!cleanName) throw new Error('Please enter your full name.');
  if (cleanUsername.length < 3) throw new Error('Username must be at least 3 characters.');
  if (cleanPassword.length < 4) throw new Error('Password must be at least 4 characters.');

  // Try API registration
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        role: selectedRole,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        setStoredUser(data.user);
        saveLocalAccount({
          id: data.user.id,
          username: cleanUsername,
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: selectedRole,
          createdAt: new Date().toISOString(),
        });
        return data.user;
      }
    } else {
      const err = await res.json().catch(() => null);
      if (err?.message) {
        throw new Error(err.message);
      }
    }
  } catch (err: any) {
    // If it was a duplicate username or server error, throw it unless it's a network offline error
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // Local fallback registration
  const localAccounts = getLocalAccounts();
  const existing = localAccounts.find((a) => a.username.toLowerCase() === cleanUsername);
  if (existing) {
    throw new Error(`Username '${cleanUsername}' already exists. Please pick another username.`);
  }

  const newAccount: LocalStoredAccount = {
    id: `local_usr_${Date.now()}`,
    username: cleanUsername,
    name: cleanName,
    email: cleanEmail,
    password: cleanPassword,
    role: selectedRole,
    createdAt: new Date().toISOString(),
  };

  saveLocalAccount(newAccount);

  const authUser: AuthUser = {
    id: newAccount.id,
    username: newAccount.username,
    name: newAccount.name,
    email: newAccount.email,
    role: newAccount.role,
    lastLogin: new Date().toISOString(),
  };

  setStoredUser(authUser);
  return authUser;
}

// Log in existing user
export async function loginUser(identifier: string, password: string): Promise<AuthUser> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanId) throw new Error('Please enter your username or email.');
  if (!cleanPassword) throw new Error('Please enter your password.');

  // Try API login
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: cleanId,
        password: cleanPassword,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        setStoredUser(data.user);
        return data.user;
      }
    } else {
      const err = await res.json().catch(() => null);
      if (err?.message) {
        throw new Error(err.message);
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // Check locally registered accounts
  const localAccounts = getLocalAccounts();
  const matched = localAccounts.find(
    (a) =>
      (a.username.toLowerCase() === cleanId || a.email.toLowerCase() === cleanId) &&
      a.password === cleanPassword
  );

  if (matched) {
    const user: AuthUser = {
      id: matched.id,
      username: matched.username,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      lastLogin: new Date().toISOString(),
    };
    setStoredUser(user);
    return user;
  }

  throw new Error('Account not found. Please verify your credentials or click "Sign Up" to create an account.');
}

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { localStorageService } from '../services/localStorageService';

interface MockUser {
  id: string;
  uid?: string; // Alias for compatibility with Firebase code
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  emailVerified?: boolean;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

// Export for use in components
export type { MockUser };

interface AuthContextType {
  currentUser: MockUser | null;
  loading: boolean;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to ensure uid is always set
  const setUserWithUid = (user: MockUser | null) => {
    if (user) {
      setCurrentUser({ ...user, uid: user.id });
    } else {
      setCurrentUser(null);
    }
  };

  // Initialize localStorage on mount
  useEffect(() => {
    localStorageService.initialize();

    // Check if there's a current user in localStorage
    const savedUser = localStorageService.getCurrentUser();
    if (savedUser) {
      setUserWithUid(savedUser);
    }
    setLoading(false);
  }, []);

  // Sign up with email and password
  async function signup(email: string, password: string, firstName: string, lastName: string) {
    // Check if user already exists
    const existingUser = localStorageService.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Create new user
    const newUser: MockUser = {
      id: localStorageService.generateId(),
      email,
      displayName: `${firstName} ${lastName}`,
      photoURL: '👤',
      createdAt: new Date(),
    };

    // Save user to localStorage
    localStorageService.saveUser(newUser);
    localStorageService.setCurrentUser(newUser);
    setUserWithUid(newUser);
  }

  // Sign in with email and password
  async function login(email: string, password: string) {
    const user = localStorageService.getUserByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    // In mock mode, we just verify the email exists
    // (password validation skipped for demo purposes)
    localStorageService.setCurrentUser(user);
    setUserWithUid(user);
  }

  // Sign in with Google (mock)
  async function loginWithGoogle() {
    // Use a mock Google account for demo
    let user = localStorageService.getUserByEmail('google@example.com');

    if (!user) {
      user = {
        id: localStorageService.generateId(),
        email: 'google@example.com',
        displayName: 'Google User',
        photoURL: '🔐',
        createdAt: new Date(),
      };
      localStorageService.saveUser(user);
    }

    localStorageService.setCurrentUser(user);
    setUserWithUid(user);
  }

  // Sign out
  async function logout() {
    localStorageService.setCurrentUser(null);
    setCurrentUser(null);
  }

  // Reset password (mock)
  async function resetPassword(email: string) {
    const user = localStorageService.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    // In mock mode, just log a message
    console.log(`Password reset email sent to ${email}`);
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

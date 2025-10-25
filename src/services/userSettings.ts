import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserSettings {
  displayName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  photoURL: string;
  // Privacy settings
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  rentalUpdates: boolean;
  marketingEmails: boolean;
  messageNotifications: boolean;
  // Security settings
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  // Metadata
  createdAt?: any;
  updatedAt?: any;
}

export class UserSettingsService {
  private getSettingsRef(userId: string) {
    return doc(db, 'userSettings', userId);
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const settingsRef = this.getSettingsRef(userId);
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        return settingsSnap.data() as UserSettings;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  async createUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const settingsRef = this.getSettingsRef(userId);
      const defaultSettings: Partial<UserSettings> = {
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        showLocation: true,
        emailNotifications: true,
        pushNotifications: true,
        rentalUpdates: true,
        marketingEmails: false,
        messageNotifications: true,
        twoFactorEnabled: false,
        loginAlerts: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(settingsRef, {
        ...defaultSettings,
        ...settings
      });
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const settingsRef = this.getSettingsRef(userId);
      
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  async saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const settingsRef = this.getSettingsRef(userId);
      
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  async deleteUserSettings(userId: string): Promise<void> {
    try {
      const settingsRef = this.getSettingsRef(userId);
      await setDoc(settingsRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error deleting user settings:', error);
      throw error;
    }
  }

  // Helper method to get default settings
  getDefaultSettings(): Partial<UserSettings> {
    return {
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false,
      showLocation: true,
      emailNotifications: true,
      pushNotifications: true,
      rentalUpdates: true,
      marketingEmails: false,
      messageNotifications: true,
      twoFactorEnabled: false,
      loginAlerts: true
    };
  }
}

// Export singleton instance
export const userSettingsService = new UserSettingsService(); 
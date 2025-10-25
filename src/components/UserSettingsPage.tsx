import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  X,
  Check,
  AlertTriangle,
  LogOut,
  Trash2,
  Lock,
  Key,
  Globe,
  Smartphone,
  Settings
} from 'lucide-react';
import { updateProfile, updatePassword, updateEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserSettings {
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
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserSettingsPage() {
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [settings, setSettings] = useState<UserSettings>({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    location: '',
    bio: '',
    photoURL: currentUser?.photoURL || '',
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
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Load user settings from Firestore
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!currentUser) return;
      
      try {
        const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
        const userSettingsSnap = await getDoc(userSettingsRef);
        
        if (userSettingsSnap.exists()) {
          const data = userSettingsSnap.data();
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, [currentUser]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: settings.displayName,
        photoURL: settings.photoURL
      });

      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: settings.displayName,
        phone: settings.phone,
        location: settings.location,
        bio: settings.bio,
        photoURL: settings.photoURL,
        updatedAt: new Date()
      });

      // Save settings to Firestore
      const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
      await setDoc(userSettingsRef, settings, { merge: true });

      showMessage('success', 'Profile updated successfully!');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentUser || !currentUser.email) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, passwordData.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordData.newPassword);
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password updated successfully!');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    // Validate file size (max 1MB for base64)
    if (file.size > 1024 * 1024) {
      showMessage('error', 'Image size must be less than 1MB');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting image upload for user:', currentUser.uid);

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          console.log('Image converted to base64');

          // Update Firebase Auth profile
          await updateProfile(currentUser, {
            photoURL: base64String
          });
          console.log('Auth profile updated');

          // Update Firestore user document
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            photoURL: base64String,
            updatedAt: new Date()
          }, { merge: true });
          console.log('Firestore document updated');

          setSettings(prev => ({ ...prev, photoURL: base64String }));
          showMessage('success', 'Profile image uploaded successfully!');
          setLoading(false);
        } catch (error: any) {
          console.error('Image upload error:', error);
          showMessage('error', error.message || 'Failed to upload image');
          setLoading(false);
        }
      };

      reader.onerror = () => {
        showMessage('error', 'Failed to read image file');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Image upload error:', error);
      showMessage('error', error.message || 'Failed to upload image');
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || deleteConfirmText !== 'DELETE') return;

    setLoading(true);
    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));
      await deleteDoc(doc(db, 'userSettings', currentUser.uid));

      // Delete user account
      await deleteUser(currentUser);

      navigate('/');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error: any) {
      showMessage('error', 'Failed to log out');
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account Management', icon: Settings }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to access settings</h2>
          <button
            onClick={() => navigate('/auth')}
                            className="px-6 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <LiquidGlassNav />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className={`p-6 rounded-lg shadow-sm ${
              theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-900 text-white'
                        : theme === 'dark'
                        ? 'hover:bg-gray-700/50 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className={`p-6 rounded-lg shadow-sm ${
              theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              {/* Profile Settings */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Profile Settings</h2>
                  
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-purple-900 to-purple-500 flex items-center justify-center">
                        {settings.photoURL ? (
                          <img
                            src={settings.photoURL}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-2xl font-bold">
                            {settings.displayName?.charAt(0) || settings.email?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-900 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-purple-950 transition-colors">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="font-medium">Profile Picture</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Click the camera icon to upload a new picture
                      </p>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Display Name</label>
                      <input
                        type="text"
                        value={settings.displayName}
                        onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-900'
                            : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-900'
                        } focus:outline-none focus:ring-2 focus:ring-purple-900/20`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={settings.email}
                          readOnly
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 border-gray-600 text-gray-400'
                              : 'bg-gray-100 border-gray-300 text-gray-600'
                          } cursor-not-allowed`}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Email cannot be changed here. Contact support if needed.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={settings.phone}
                          onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-900'
                              : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-900'
                          } focus:outline-none focus:ring-2 focus:ring-purple-900/20`}
                          placeholder="+65 1234 5678"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={settings.location}
                          onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-900'
                              : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-900'
                          } focus:outline-none focus:ring-2 focus:ring-purple-900/20`}
                          placeholder="Singapore"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={settings.bio}
                      onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg border resize-none ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-900'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-900'
                      } focus:outline-none focus:ring-2 focus:ring-purple-900/20`}
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-3 bg-purple-900 hover:bg-purple-950 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy & Security */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Privacy & Security</h2>
                  
                  {/* Privacy Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Profile Visibility</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value="public"
                          checked={settings.profileVisibility === 'public'}
                          onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value as any }))}
                          className="text-purple-300"
                        />
                        <div>
                          <span className="font-medium">Public</span>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Anyone can see your profile
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value="private"
                          checked={settings.profileVisibility === 'private'}
                          onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value as any }))}
                          className="text-purple-300"
                        />
                        <div>
                          <span className="font-medium">Private</span>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Only you can see your full profile
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Contact Information Visibility */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Contact Information</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span>Show email address</span>
                        <input
                          type="checkbox"
                          checked={settings.showEmail}
                          onChange={(e) => setSettings(prev => ({ ...prev, showEmail: e.target.checked }))}
                          className="text-purple-300"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span>Show phone number</span>
                        <input
                          type="checkbox"
                          checked={settings.showPhone}
                          onChange={(e) => setSettings(prev => ({ ...prev, showPhone: e.target.checked }))}
                          className="text-purple-300"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span>Show location</span>
                        <input
                          type="checkbox"
                          checked={settings.showLocation}
                          onChange={(e) => setSettings(prev => ({ ...prev, showLocation: e.target.checked }))}
                          className="text-purple-300"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-900'
                                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-900'
                            } focus:outline-none focus:ring-2 focus:ring-purple-900/20`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-900'
                                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-900'
                            } focus:outline-none focus:ring-2 focus:ring-purple-900/20`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-900'
                                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-900'
                            } focus:outline-none focus:ring-2 focus:ring-purple-900/20`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handlePasswordChange}
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-900 hover:bg-purple-950 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        <span>{loading ? 'Updating...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Security Features</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <div>
                          <span>Two-Factor Authentication</span>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.twoFactorEnabled}
                          onChange={(e) => setSettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                          className="text-purple-300"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <div>
                          <span>Login Alerts</span>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Get notified of new login attempts
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.loginAlerts}
                          onChange={(e) => setSettings(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                          className="text-purple-300"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-3 bg-purple-900 hover:bg-purple-950 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">General Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <span>Email Notifications</span>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Receive notifications via email
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                            className="text-purple-300"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div>
                            <span>Push Notifications</span>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Receive push notifications in your browser
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.pushNotifications}
                            onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                            className="text-purple-300"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Activity Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <span>Rental Updates</span>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Get notified about rental status changes
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.rentalUpdates}
                            onChange={(e) => setSettings(prev => ({ ...prev, rentalUpdates: e.target.checked }))}
                            className="text-purple-300"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div>
                            <span>Message Notifications</span>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Get notified about new messages
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.messageNotifications}
                            onChange={(e) => setSettings(prev => ({ ...prev, messageNotifications: e.target.checked }))}
                            className="text-purple-300"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Marketing</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <span>Marketing Emails</span>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Receive promotional emails and updates
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.marketingEmails}
                            onChange={(e) => setSettings(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                            className="text-purple-300"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-3 bg-purple-900 hover:bg-purple-950 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Account Management */}
              {activeSection === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Account Management</h2>
                  
                  <div className="space-y-6">
                    {/* Account Info */}
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50'
                    }`}>
                      <h3 className="font-medium mb-3">Account Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">User ID:</span>
                          <span className="font-mono text-xs">{currentUser.uid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email Verified:</span>
                          <span className={currentUser.emailVerified ? 'text-green-600' : 'text-red-600'}>
                            {currentUser.emailVerified ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Member Since:</span>
                          <span>{currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Sign In:</span>
                          <span>{currentUser.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <LogOut className="w-5 h-5 text-purple-300" />
                            <div>
                              <h4 className="font-medium">Sign Out</h4>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Sign out of your account on this device
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-medium transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg border border-red-200 ${
                        theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <div>
                              <h4 className="font-medium text-red-600">Delete Account</h4>
                              <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                                Permanently delete your account and all data
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500`}
                  placeholder="DELETE"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || loading}
                                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
} 
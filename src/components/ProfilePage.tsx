import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import { useNavigate, useParams } from 'react-router-dom';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import { Edit3, Star, Award, Clock, MapPin, Mail, Phone, User, Settings, Shield, ExternalLink, Trash2, XCircle, CheckCircle, Package, ShoppingBag } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { listings, deleteListing, delistListing, relistListing } = useListings();
  const { getUserRentals, userRentalRequests, receivedRentalRequests } = useRentals();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  // Validate tab parameter
  const validTabs = ['overview', 'listings', 'rentals', 'settings'];
  const initialTab = tab && validTabs.includes(tab) ? tab : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [tab]);
  const [editMode, setEditMode] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phoneNumber || '',
    location: 'Singapore',
    bio: 'Tool sharing enthusiast passionate about making DIY projects accessible to everyone.',
    photoURL: currentUser?.photoURL || '',
    uid: currentUser?.uid || '',
    emailVerified: currentUser?.emailVerified || false,
    creationTime: currentUser?.metadata?.creationTime || '',
    lastSignInTime: currentUser?.metadata?.lastSignInTime || ''
  });

  // Update profile data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || '',
        location: 'Singapore', // This could be stored in user profile later
        bio: 'Tool sharing enthusiast passionate about making DIY projects accessible to everyone.',
        photoURL: currentUser.photoURL || '',
        uid: currentUser.uid || '',
        emailVerified: currentUser.emailVerified || false,
        creationTime: currentUser.metadata?.creationTime || '',
        lastSignInTime: currentUser.metadata?.lastSignInTime || ''
      });
    }
  }, [currentUser]);

  // Get user stats (filter by userId instead of email for better accuracy)
  const userListings = listings.filter(l => l.userId === currentUser?.uid);
  const activeListings = userListings.filter(l => l.isActive !== false);
  const delistedListings = userListings.filter(l => l.isActive === false);
  const userRentals = currentUser ? getUserRentals(currentUser.email || '') : [];
  const completedRentals = userRentals.filter(r => r.status === 'completed');
  const totalEarnings = completedRentals.reduce((sum, r) => sum + r.totalCost, 0);
  const averageRating = userListings.length > 0 ?
    userListings.reduce((sum, l) => sum + l.rating, 0) / userListings.length : 0;

  const stats = [
    { label: 'Tools Listed', value: userListings.length, icon: Award, color: 'text-purple-300' },
    { label: 'Total Rentals', value: userRentals.length, icon: Clock, color: 'text-green-500' },
    { label: 'Total Earnings', value: `$${totalEarnings}`, icon: Star, color: 'text-yellow-500' },
    { label: 'Average Rating', value: averageRating.toFixed(1), icon: Star, color: 'text-purple-400' }
  ];

  const handleSaveProfile = () => {
    // Here you would typically save to Firebase/backend
    setEditMode(false);
    console.log('Saving profile:', profileData);
  };

  const handleDeleteListing = async (listingId: string, listingName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${listingName}"? This action cannot be undone.`)) {
      try {
        await deleteListing(listingId);
        setSuccessMessage('Listing deleted successfully!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing. Please try again.');
      }
    }
  };

  const handleDelistListing = async (listingId: string, listingName: string) => {
    if (window.confirm(`Delist "${listingName}"? The listing will be hidden from other users but you can relist it later.`)) {
      try {
        await delistListing(listingId);
        setSuccessMessage('Listing delisted successfully!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Error delisting listing:', error);
        alert('Failed to delist listing. Please try again.');
      }
    }
  };

  const handleRelistListing = async (listingId: string) => {
    try {
      await relistListing(listingId);
      setSuccessMessage('Listing relisted successfully!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error relisting listing:', error);
      alert('Failed to relist listing. Please try again.');
    }
  };

  const handleViewListing = (listingId: string) => {
    navigate(`/listing/${listingId}`);
  };

  const handleEditListing = (listingId: string) => {
    navigate(`/list-item?edit=${listingId}`);
  };

  const renderToolImage = (imageStr: string, size: 'small' | 'medium' | 'large' = 'small') => {
    const sizeClasses = size === 'large' ? "w-48 h-48 md:w-56 md:h-56" :
                        size === 'medium' ? "w-full aspect-square" : "w-16 h-16";

    if (imageStr && imageStr.startsWith('data:image/')) {
      return (
        <img
          src={imageStr}
          alt="Tool"
          className={`${sizeClasses} object-cover rounded-xl shadow-lg`}
        />
      );
    }
    return (
      <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg ${
        size === 'large' ? 'text-8xl md:text-9xl' : size === 'medium' ? 'text-6xl' : 'text-4xl'
      }`}>
        {imageStr}
      </div>
    );
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'listings', label: 'My Listings' },
    { id: 'rentals', label: 'My Rentals' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <LiquidGlassNav />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Profile Header */}
        <div className={`p-6 rounded-lg shadow-sm mb-8 ${
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              {profileData.photoURL ? (
                <img
                  src={profileData.photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-900 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </div>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-900 hover:bg-purple-950 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                title="Edit profile picture"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
              <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl md:text-2xl font-bold">{profileData.displayName || 'Anonymous User'}</h1>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                </div>
                {profileData.emailVerified && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-300/20 text-purple-300 rounded-full text-xs">
                    <Shield className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{profileData.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{profileData.location}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{profileData.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Joined {profileData.creationTime ? new Date(profileData.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}</span>
                </div>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl`}>
                {profileData.bio}
              </p>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                editMode
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{editMode ? 'Save' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Edit Form */}
          {editMode && (
            <div className="mt-6 pt-6 border-t border-gray-200/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border resize-none ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`p-6 rounded-lg shadow-sm ${
              theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                }`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => navigate(tabItem.id === 'overview' ? '/profile' : `/profile/tab/${tabItem.id}`)}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tabItem.id
                    ? 'bg-purple-900 text-white shadow-lg'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80'
                    : 'bg-white/80 text-gray-700 hover:bg-white/90 backdrop-blur-sm'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`p-6 rounded-lg shadow-sm ${
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information */}
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50'
                }`}>
                  <h4 className="font-semibold mb-3">Account Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">User ID:</span>
                      <span className="font-mono text-xs">{profileData.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email Verified:</span>
                      <span className={profileData.emailVerified ? 'text-green-600' : 'text-red-600'}>
                        {profileData.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Member Since:</span>
                      <span>{profileData.creationTime ? new Date(profileData.creationTime).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Sign In:</span>
                      <span>{profileData.lastSignInTime ? new Date(profileData.lastSignInTime).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50'
                }`}>
                  <h4 className="font-semibold mb-3">Quick Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Active Listings:</span>
                      <span className="font-semibold text-purple-300">{userListings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Rentals:</span>
                      <span className="font-semibold text-green-600">{userRentals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed Rentals:</span>
                      <span className="font-semibold text-purple-300">{completedRentals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Earnings:</span>
                      <span className="font-semibold text-yellow-600">${totalEarnings}</span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-base md:text-lg font-semibold">Recent Activity</h3>
              <div className="space-y-4">
                {userRentals.slice(0, 5).map((rental, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{rental.toolName}</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {rental.startDate} - {rental.endDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-300">${rental.totalCost}</p>
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          rental.status === 'completed' ? 'bg-green-100 text-green-800' :
                          rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rental.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {userRentals.length === 0 && (
                  <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    No rental activity yet. Start by browsing available tools!
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-6">
              {/* Active Listings */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4">Active Listings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeListings.map((listing) => (
                    <div
                      key={listing.id}
                      onClick={() => handleViewListing(listing.id)}
                      className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                      }`}>

                    {/* Image */}
                    <div className="relative">
                      {renderToolImage(listing.image, "medium")}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="text-base font-bold mb-1 text-white truncate">{listing.name}</h3>
                      <p className="text-lg font-bold text-purple-400 mb-2">
                        ${formatPrice(listing.price)}<span className="text-xs font-normal text-gray-400">/{listing.period}</span>
                      </p>

                      <div className="flex items-center space-x-1 mb-2">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-medium">{listing.rating}</span>
                        <span className="text-xs text-gray-400">({listing.reviews})</span>
                      </div>

                      <div className="flex items-center space-x-1 mb-2 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{listing.location}</span>
                      </div>

                      <div className={`text-xs px-2 py-0.5 rounded-lg inline-block mb-2 ${
                        theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.category}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-gray-600/30">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditListing(listing.id);
                          }}
                          className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-300'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelistListing(listing.id, listing.name);
                          }}
                          className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            theme === 'dark'
                              ? 'bg-orange-900/50 hover:bg-orange-900/70 text-orange-300'
                              : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                          Delist
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteListing(listing.id, listing.name);
                          }}
                          className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            theme === 'dark'
                              ? 'bg-red-900/50 hover:bg-red-900/70 text-red-300'
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {activeListings.length === 0 && delistedListings.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      You haven't listed any tools yet.
                    </p>
                    <button
                      onClick={() => navigate('/list-item')}
                      className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-medium transition-colors">
                      List Your First Tool
                    </button>
                  </div>
                )}
                {activeListings.length === 0 && delistedListings.length > 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      No active listings. All your listings are delisted.
                    </p>
                  </div>
                )}
                </div>
              </div>

              {/* Delisted Listings Section */}
              {delistedListings.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-600/30">
                  <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                    Delisted Items
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {delistedListings.map((listing) => (
                      <div
                        key={listing.id}
                        onClick={() => handleViewListing(listing.id)}
                        className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden opacity-60 ${
                          theme === 'dark'
                            ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                            : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                        }`}>

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/90 text-white">
                          Delisted
                        </div>

                        {/* Image */}
                        <div className="relative">
                          {renderToolImage(listing.image, "medium")}
                        </div>

                        {/* Content */}
                        <div className="p-3">
                          <h3 className="text-base font-bold mb-1 text-white truncate">{listing.name}</h3>
                          <p className="text-lg font-bold text-purple-400 mb-2">
                            ${formatPrice(listing.price)}<span className="text-xs font-normal text-gray-400">/{listing.period}</span>
                          </p>

                          <div className="flex items-center space-x-1 mb-2">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs font-medium">{listing.rating}</span>
                            <span className="text-xs text-gray-400">({listing.reviews})</span>
                          </div>

                          <div className="flex items-center space-x-1 mb-2 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{listing.location}</span>
                          </div>

                          <div className={`text-xs px-2 py-0.5 rounded-lg inline-block mb-2 ${
                            theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.category}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-gray-600/30">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditListing(listing.id);
                              }}
                              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                theme === 'dark'
                                  ? 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-300'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRelistListing(listing.id);
                              }}
                              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                theme === 'dark'
                                  ? 'bg-green-900/50 hover:bg-green-900/70 text-green-300'
                                  : 'bg-green-100 hover:bg-green-200 text-green-700'
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              Relist
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteListing(listing.id, listing.name);
                              }}
                              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                theme === 'dark'
                                  ? 'bg-red-900/50 hover:bg-red-900/70 text-red-300'
                                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rentals' && (
            <div className="space-y-8">
              {/* Renting History (As Customer) */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  Renting History (As Customer)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {userRentalRequests.map((rental, index) => (
                    <div
                      key={index}
                      onClick={() => handleViewListing(rental.toolId)}
                      className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                      }`}>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          rental.status === 'completed' ? 'bg-green-500/90 text-white' :
                          rental.status === 'approved' ? 'bg-blue-500/90 text-white' :
                          rental.status === 'pending' ? 'bg-yellow-500/90 text-white' :
                          rental.status === 'declined' ? 'bg-red-500/90 text-white' :
                          'bg-gray-500/90 text-white'
                        }`}>
                          {rental.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                           rental.status === 'pending' ? <Clock className="w-3 h-3" /> :
                           rental.status === 'declined' ? <XCircle className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          <span className="capitalize">{rental.status}</span>
                        </span>
                      </div>

                      {/* Image */}
                      <div className="relative">
                        {renderToolImage(rental.toolImage, "medium")}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-base font-bold mb-1 text-white truncate">{rental.toolName}</h3>
                        <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          from <span className="font-medium">{rental.ownerName}</span>
                        </p>

                        <div className="space-y-1.5 mb-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                              {rental.startDate} - {rental.endDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">Total:</span>
                            <span className="text-lg font-bold text-purple-400">
                              ${formatPrice(rental.totalCost)}
                            </span>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className={`text-xs px-2 py-0.5 rounded-lg inline-block ${
                          theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {rental.category || 'Tool'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {userRentalRequests.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                        No rental requests yet. Start by browsing available tools!
                      </p>
                      <button
                        onClick={() => navigate('/browse')}
                        className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-medium transition-colors">
                        Browse Tools
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Listing History (As Owner) */}
              <div className="pt-8 border-t border-gray-600/30">
                <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  Listing Rental History (As Owner)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {receivedRentalRequests.map((rental, index) => (
                    <div
                      key={index}
                      onClick={() => handleViewListing(rental.toolId)}
                      className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                      }`}>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          rental.status === 'completed' ? 'bg-green-500/90 text-white' :
                          rental.status === 'approved' ? 'bg-blue-500/90 text-white' :
                          rental.status === 'pending' ? 'bg-yellow-500/90 text-white' :
                          rental.status === 'declined' ? 'bg-red-500/90 text-white' :
                          'bg-gray-500/90 text-white'
                        }`}>
                          {rental.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                           rental.status === 'pending' ? <Clock className="w-3 h-3" /> :
                           rental.status === 'declined' ? <XCircle className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          <span className="capitalize">{rental.status}</span>
                        </span>
                      </div>

                      {/* Image */}
                      <div className="relative">
                        {renderToolImage(rental.toolImage, "medium")}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-base font-bold mb-1 text-white truncate">{rental.toolName}</h3>
                        <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          rented by <span className="font-medium">{rental.renterName}</span>
                        </p>

                        <div className="space-y-1.5 mb-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                              {rental.startDate} - {rental.endDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">Earned:</span>
                            <span className="text-lg font-bold text-green-400">
                              ${formatPrice(rental.totalCost)}
                            </span>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className={`text-xs px-2 py-0.5 rounded-lg inline-block ${
                          theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {rental.category || 'Tool'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {receivedRentalRequests.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                        No rental requests for your listings yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`rounded-xl p-4 shadow-lg border-l-4 border-green-500 flex items-center space-x-3 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Success!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
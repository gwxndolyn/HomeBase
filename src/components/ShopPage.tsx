import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useShop } from '../contexts/ShopContext';
import { useNavigate } from 'react-router-dom';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import SuccessModal from './SuccessModal';
import { Store, MapPin, Phone, Globe, Instagram, Clock, Plus, Edit2, Save, X, ArrowLeft } from 'lucide-react';

export default function ShopPage() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { currentShop, createShop, updateShop, loading, error } = useShop();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(!currentShop);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    category: '',
    location: '',
    phone: '',
    website: '',
    instagram: '',
    operatingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '14:00' },
      sunday: { open: '10:00', close: '14:00' }
    }
  });

  const categories = [
    'Handmade Crafts & Artwork',
    'Baked Goods & Desserts',
    'Home Decor & Furniture',
    'Cleaning & Organization Services',
    'Pet Care Services',
    'Beauty & Personal Care',
    'Photography & Videography Services',
    'Consulting & Coaching',
    'Digital Products & Services',
    'Health & Wellness',
    'Writing & Content Services',
    'Music & Audio Services'
  ];

  // Load current shop data
  useEffect(() => {
    if (currentShop) {
      setFormData({
        shopName: currentShop.shopName,
        shopDescription: currentShop.shopDescription,
        category: currentShop.category,
        location: currentShop.location,
        phone: currentShop.phone || '',
        website: currentShop.website || '',
        instagram: currentShop.instagram || '',
        operatingHours: (currentShop.operatingHours || {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '10:00', close: '14:00' },
          sunday: { open: '10:00', close: '14:00' }
        }) as any
      });
      setIsEditing(false);
    }
  }, [currentShop]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoursChange = (
    day: string,
    type: 'open' | 'close',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [type]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert('You must be logged in');
      return;
    }

    if (!formData.shopName || !formData.category || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (currentShop) {
        // Update existing shop
        await updateShop(currentShop.id!, formData);
        setSuccessMessage({
          title: 'Shop Updated!',
          message: 'Your shop information has been updated successfully.'
        });
      } else {
        // Create new shop
        const shopData = {
          ownerId: currentUser.uid,
          ownerEmail: currentUser.email || '',
          ownerName: currentUser.displayName || '',
          ...formData,
          coordinates: { lat: 1.3521, lng: 103.8198 }, // Default Singapore coordinates
          rating: 0,
          reviews: 0
        };

        await createShop(shopData);
        setSuccessMessage({
          title: 'Shop Created!',
          message: 'Welcome to HomeBase! Your shop is now live.'
        });
      }

      setShowSuccessModal(true);
      setIsEditing(false);

      // Redirect after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <LiquidGlassNav />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading your shop...</p>
          </div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Store className="w-8 h-8" />
                {currentShop ? 'Your Shop' : 'Create Your Shop'}
              </h1>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {currentShop ? 'Manage your business information' : 'Set up your first HomeBase shop'}
              </p>
            </div>
          </div>
          {currentShop && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            theme === 'dark'
              ? 'bg-red-900/20 border border-red-500/30 text-red-400'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {error}
          </div>
        )}

        {/* Shop Form */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className={`rounded-2xl p-6 border-0 shadow-sm ${
              theme === 'dark'
                ? 'bg-gray-800/60'
                : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="My Awesome Shop"
                    className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm transition-all focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="shopDescription"
                    value={formData.shopDescription}
                    onChange={handleInputChange}
                    placeholder="Tell customers about your shop..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm resize-none transition-all focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    }`}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm appearance-none cursor-pointer transition-all focus:ring-2 focus:ring-purple-500 ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 text-white hover:bg-gray-700/70'
                          : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                      }`}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Singapore"
                      className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm transition-all focus:ring-2 focus:ring-purple-500 ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 text-white placeholder-gray-400'
                          : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className={`rounded-2xl p-6 border-0 shadow-sm ${
              theme === 'dark'
                ? 'bg-gray-800/60'
                : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+65 1234 5678"
                    className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm transition-all focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://myshop.com"
                    className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm transition-all focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@myshop"
                    className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm transition-all focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className={`rounded-2xl p-6 border-0 shadow-sm ${
              theme === 'dark'
                ? 'bg-gray-800/60'
                : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Operating Hours
              </h2>
              <div className="space-y-3">
                {Object.entries(formData.operatingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 font-medium capitalize">{day}</div>
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                      className={`px-3 py-2 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-purple-500 ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 text-white'
                          : 'bg-gray-50 text-gray-900'
                      }`}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                      className={`px-3 py-2 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-purple-500 ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 text-white'
                          : 'bg-gray-50 text-gray-900'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                }`}
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : currentShop ? 'Update Shop' : 'Create Shop'}
              </button>
              {currentShop && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 hover:bg-gray-700'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        ) : currentShop ? (
          // Shop Display View
          <div className="space-y-6">
            {/* Shop Header Card */}
            <div className={`rounded-2xl p-8 border-0 shadow-sm ${
              theme === 'dark'
                ? 'bg-gray-800/60'
                : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <h2 className="text-4xl font-bold mb-2">{currentShop.shopName}</h2>
              <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentShop.shopDescription}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-100/20 text-purple-400">{currentShop.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{currentShop.location}</span>
                </div>
              </div>
            </div>

            {/* Contact & Social */}
            <div className={`rounded-2xl p-6 border-0 shadow-sm ${
              theme === 'dark'
                ? 'bg-gray-800/60'
                : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Contact & Social</h3>
              <div className="space-y-3">
                {currentShop.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-purple-500" />
                    <span>{currentShop.phone}</span>
                  </div>
                )}
                {currentShop.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-500" />
                    <a href={currentShop.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {currentShop.website}
                    </a>
                  </div>
                )}
                {currentShop.instagram && (
                  <div className="flex items-center gap-3">
                    <Instagram className="w-5 h-5 text-purple-500" />
                    <span>@{currentShop.instagram}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            <div className={`rounded-2xl p-6 border-0 shadow-sm ${
              theme === 'dark'
                ? 'bg-gray-800/60'
                : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Operating Hours
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentShop.operatingHours && Object.entries(currentShop.operatingHours).map(([day, hours]) => (
                  <div key={day} className={`p-3 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700/50'
                      : 'bg-gray-100'
                  }`}>
                    <div className="font-medium capitalize mb-1">{day}</div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {hours.open} - {hours.close}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setShowSuccessModal(false)}
      />

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useShop } from '../contexts/ShopContext';
import { useListings } from '../contexts/ListingsContext';
import { useNavigate, useParams } from 'react-router-dom';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import AnalyticsDashboard from './AnalyticsDashboard';
import SuccessModal from './SuccessModal';
import { Store, Plus, Settings, BarChart3, PackagePlus, Edit2, Save, MapPin, Phone, Globe, Instagram, Clock, X } from 'lucide-react';

export default function ShopPage() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { currentShop, createShop, updateShop } = useShop();
  const { listings, addListing } = useListings();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'add-listing' | 'settings'>('dashboard');

  // Set active tab from URL parameter
  useEffect(() => {
    if (tab && ['dashboard', 'analytics', 'add-listing', 'settings'].includes(tab)) {
      setActiveTab(tab as 'dashboard' | 'analytics' | 'add-listing' | 'settings');
    }
  }, [tab]);
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

  const [listingForm, setListingForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    period: 'unit',
    type: 'product' as 'product' | 'service',
    stock: ''
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

  const shopListings = listings.filter((l: any) => l.shopId === currentShop?.id);

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

  const handleListingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setListingForm(prev => ({
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

  const handleSaveShop = async () => {
    try {
      if (currentShop) {
        await updateShop(currentShop.id, formData);
      } else {
        const shopData = {
          ownerId: currentUser?.id || '',
          ownerEmail: currentUser?.email || '',
          ownerName: currentUser?.displayName || '',
          ...formData,
          coordinates: { lat: 1.3521, lng: 103.8198 },
          rating: 0,
          reviews: 0
        };
        await createShop(shopData);
      }
      setIsEditing(false);
      setSuccessMessage({
        title: 'Success!',
        message: currentShop ? 'Shop updated successfully' : 'Shop created successfully!'
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving shop:', error);
    }
  };

  const handleAddListing = async () => {
    if (!listingForm.name || !listingForm.description || !listingForm.category || !listingForm.price) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const newListing = {
        name: listingForm.name,
        description: listingForm.description,
        category: listingForm.category,
        price: parseFloat(listingForm.price),
        period: listingForm.period,
        location: currentShop?.location || '',
        coordinates: { lat: 1.3521, lng: 103.8198 },
        owner: currentUser?.displayName || '',
        ownerContact: currentUser?.email || '',
        imageUrls: ['📦'],
        type: listingForm.type,
        stock: listingForm.type === 'product' ? parseInt(listingForm.stock) || 0 : undefined,
        shopId: currentShop?.id || '',
        isActive: true
      };

      await addListing(newListing);
      setListingForm({
        name: '',
        description: '',
        category: '',
        price: '',
        period: 'unit',
        type: 'product',
        stock: ''
      });

      setSuccessMessage({
        title: 'Success!',
        message: 'Listing created successfully!'
      });
      setShowSuccessModal(true);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing');
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      <LiquidGlassNav />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-32">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">
              {currentShop ? currentShop.shopName : 'Create Your Shop'}
            </h1>
          </div>
          {currentShop && (
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Manage your business and view analytics
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-300/20">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-purple-500 text-purple-500'
                : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <Store className="inline-block w-5 h-5 mr-2" />
            Shop Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-purple-500 text-purple-500'
                : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <BarChart3 className="inline-block w-5 h-5 mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('add-listing')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'add-listing'
                ? 'border-purple-500 text-purple-500'
                : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <PackagePlus className="inline-block w-5 h-5 mr-2" />
            Add Listing
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-purple-500 text-purple-500'
                : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <Settings className="inline-block w-5 h-5 mr-2" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && currentShop && (
          <div className="space-y-8">
            {/* Shop Info */}
            <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <h2 className="text-2xl font-bold mb-4">Shop Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold mb-2">Shop Name</p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{currentShop.shopName}</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Category</p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{currentShop.category}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold mb-2">Description</p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{currentShop.shopDescription}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Location</p>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{currentShop.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Phone</p>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{currentShop.phone || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Website</p>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{currentShop.website || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Instagram className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Instagram</p>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{currentShop.instagram || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Listings */}
            <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Your Listings ({shopListings.length})</h2>
                <button
                  onClick={() => setActiveTab('add-listing')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add New
                </button>
              </div>
              {shopListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shopListings.map((listing: any) => {
                    const listingImageMap: Record<string, string> = {
                      'listing1': '/images/il_570xN.1636384564_othv.webp',
                      'listing2': '/images/FREYON-S-1-2560x2560-2025-09-29 (1).webp',
                      'listing3': '/images/shading-with-watercolor-complete-vert-kids-activities-blog-735x1103.webp',
                      'listing4': '/images/il_fullxfull.1547382512_10kz.webp',
                      'listing5': '/images/preventivo-ristrutturazione-casa.jpg',
                      'listing6': '/images/cm-63.webp',
                      'listing7': '/images/sourdough-bread.svg',
                      'listing8': '/images/camera.svg',
                      'listing_alice_1': '/images/il_570xN.1636384564_othv.webp',
                      'listing_alice_2': '/images/FREYON-S-1-2560x2560-2025-09-29 (1).webp',
                      'listing_alice_3': '/images/shading-with-watercolor-complete-vert-kids-activities-blog-735x1103.webp',
                      'listing_alice_4': '/images/wooden-furniture.svg',
                      'listing_david_1': '/images/il_fullxfull.1547382512_10kz.webp',
                    };
                    const imagePath = listingImageMap[listing.id] || listing.imageUrls?.[0] || null;

                    return (
                      <div
                        key={listing.id}
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        className={`rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className={`h-40 w-full overflow-hidden ${
                          theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'
                        }`}>
                          {imagePath ? (
                            <img
                              src={imagePath}
                              alt={listing.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-4xl">
                              {listing.imageUrls?.[0] || '📦'}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold mb-2">{listing.name}</h3>
                          <p className="text-sm mb-3 line-clamp-2" style={{ opacity: 0.7 }}>
                            {listing.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-500">${listing.price}</span>
                            <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-500">
                              {listing.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    No listings yet. Start by adding your first product!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && currentShop && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'add-listing' && currentShop && (
          <div className={`rounded-lg p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <h2 className="text-2xl font-bold mb-6">Add New Listing</h2>
            <div className="space-y-6 max-w-2xl">
              {/* Listing Type */}
              <div>
                <label className="block font-semibold mb-2">Type *</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setListingForm({ ...listingForm, type: 'product' })}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      listingForm.type === 'product'
                        ? 'bg-purple-600 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Product
                  </button>
                  <button
                    onClick={() => setListingForm({ ...listingForm, type: 'service' })}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      listingForm.type === 'service'
                        ? 'bg-purple-600 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Service
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={listingForm.name}
                  onChange={handleListingInputChange}
                  placeholder="e.g., Hand-painted Canvas Art"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-2">Description *</label>
                <textarea
                  name="description"
                  value={listingForm.description}
                  onChange={handleListingInputChange}
                  placeholder="Describe your product or service..."
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold mb-2">Category *</label>
                <select
                  name="category"
                  value={listingForm.category}
                  onChange={handleListingInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block font-semibold mb-2">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={listingForm.price}
                  onChange={handleListingInputChange}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {/* Period */}
              <div>
                <label className="block font-semibold mb-2">Price Period</label>
                <select
                  name="period"
                  value={listingForm.period}
                  onChange={handleListingInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="unit">Per Unit</option>
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                  <option value="session">Per Session</option>
                </select>
              </div>

              {/* Stock (for products only) */}
              {listingForm.type === 'product' && (
                <div>
                  <label className="block font-semibold mb-2">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={listingForm.stock}
                    onChange={handleListingInputChange}
                    placeholder="0"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleAddListing}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
              >
                Create Listing
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && currentShop && (
          <div className={`rounded-lg p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 mb-6"
              >
                <Edit2 className="w-5 h-5" />
                Edit Shop Details
              </button>
            ) : (
              <div className="space-y-6 max-w-2xl">
                {/* Shop Details Form */}
                <div>
                  <label className="block font-semibold mb-2">Shop Name</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Description</label>
                  <textarea
                    name="shopDescription"
                    value={formData.shopDescription}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                {/* Operating Hours */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Operating Hours</h3>
                  <div className="space-y-3">
                    {Object.entries(formData.operatingHours).map(([day, hours]: any) => (
                      <div key={day} className="flex items-center gap-4">
                        <span className="w-24 font-semibold capitalize">{day}</span>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                          className={`px-3 py-2 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                          className={`px-3 py-2 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveShop}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!currentShop && (
          <div className={`rounded-lg p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <h2 className="text-2xl font-bold mb-6">Create Your Shop</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block font-semibold mb-2">Shop Name *</label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Description</label>
                <textarea
                  name="shopDescription"
                  value={formData.shopDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <button
                onClick={handleSaveShop}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
              >
                Create Shop
              </button>
            </div>
          </div>
        )}
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
      />

      <Footer />
    </div>
  );
}

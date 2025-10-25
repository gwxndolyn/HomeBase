import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useChat } from '../contexts/ChatContext';
import LiquidGlassNav from './LiquidGlassNav';
import ReviewsSection from './ReviewsSection';
import DateTimePicker from './DateTimePicker';
import { listingsService } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Star, MapPin, Clock, MessageSquare, X, Heart, CheckCircle, Calendar, MessageCircle } from 'lucide-react';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { listings } = useListings();
  const { addRentalRequest, getUnavailableDates } = useRentals();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { createOrGetChat } = useChat();

  // Helper function to get full condition description
  const getConditionLabel = (condition: string) => {
    const conditionMap: { [key: string]: string } = {
      'excellent': 'Excellent - Like new',
      'good': 'Good - Minor wear',
      'fair': 'Fair - Some wear but functional',
      'poor': 'Poor - Heavy wear but working'
    };
    return conditionMap[condition] || condition;
  };

  // Helper function to format price - show decimals only if needed
  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  // Helper function to format creation date
  const formatCreatedDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;

      const weeks = Math.floor(diffInDays / 7);
      if (diffInDays < 30) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;

      const months = Math.floor(diffInDays / 30);
      if (diffInDays < 365) return `${months} ${months === 1 ? 'month' : 'months'} ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const [showRentModal, setShowRentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [emailsSent, setEmailsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rentRequest, setRentRequest] = useState({
    startDateTime: '',
    endDateTime: '',
    message: ''
  });
  const [listingData, setListingData] = useState<any>(null);
  const [unavailableDates, setUnavailableDates] = useState<Array<{ start: string; end: string; status: string }>>([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);

  // Helper function to render tool image (emoji, base64, or URL)
  const renderToolImage = (imageStr: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClasses = size === 'small'
      ? "w-8 h-8 text-2xl"
      : size === 'large'
      ? "w-16 h-16 text-5xl"
      : "w-12 h-12 text-3xl";

    // Check if image is a URL (base64 data URL or Firebase Storage URL)
    if (imageStr && (imageStr.startsWith('data:image/') || imageStr.startsWith('http://') || imageStr.startsWith('https://'))) {
      return (
        <img
          src={imageStr}
          alt="Tool"
          className={`${sizeClasses} object-cover rounded-lg`}
          loading="lazy"
        />
      );
    }
    // Otherwise, treat as emoji
    return (
      <div className={`${sizeClasses} flex items-center justify-center`}>
        {imageStr}
      </div>
    );
  };

  // Use only real listings from Firebase
  // Handle both string and number IDs
  const tool = listings.find(t =>
    t.id === id || t.id === parseInt(id || '0') || String(t.id) === id
  );

  console.log('ListingDetailPage - ID:', id);
  console.log('ListingDetailPage - All tools:', listings.map(t => ({ id: t.id, name: t.name })));
  console.log('ListingDetailPage - Found tool:', tool);

  const loadListingData = async () => {
    if (!id) return;

    try {
      // Try to load from Firebase first (for actual listings)
      const firebaseListing = await listingsService.getListingById(id);
      if (firebaseListing) {
        setListingData(firebaseListing);
      }
    } catch (error) {
      console.error('Error loading listing data:', error);
    }
  };

  useEffect(() => {
    loadListingData();
    
    // Load unavailable dates for this listing
    if (id) {
      const unavailable = getUnavailableDates(String(id));
      setUnavailableDates(unavailable);
      console.log('Unavailable dates for listing', id, ':', unavailable);
    }
  }, [id, getUnavailableDates]);

  useEffect(() => {
    if (!tool) {
      navigate('/browse');
    }
  }, [tool, navigate]);

  // Load owner user ID
  useEffect(() => {
    const loadOwnerUserId = async () => {
      if (!tool?.ownerContact) {
        console.log('[ListingDetail] No owner contact found');
        return;
      }
      
      try {
        console.log('[ListingDetail] Loading owner user ID for email:', tool.ownerContact);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', tool.ownerContact));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userId = querySnapshot.docs[0].id;
          setOwnerUserId(userId);
          console.log('[ListingDetail] Found owner user ID:', userId);
        } else {
          console.warn('[ListingDetail] Owner not found in Firestore for email:', tool.ownerContact);
        }
      } catch (error) {
        console.error('[ListingDetail] Error loading owner user ID:', error);
      }
    };

    loadOwnerUserId();
  }, [tool?.ownerContact]);

  const handleReviewAdded = () => {
    loadListingData(); // Refresh listing data when a review is added
  };

  const handleMessageOwner = async () => {
    console.log('[ListingDetail] handleMessageOwner called');
    console.log('[ListingDetail] ownerUserId:', ownerUserId);
    console.log('[ListingDetail] tool.owner:', tool?.owner);
    console.log('[ListingDetail] currentUser:', currentUser?.uid);
    
    if (!ownerUserId || !tool || !currentUser) {
      console.error('[ListingDetail] Missing required data to create chat:', {
        ownerUserId,
        toolName: tool?.name,
        currentUserId: currentUser?.uid
      });
      alert('Unable to create chat. Owner information not found.');
      return;
    }

    // Don't allow messaging yourself
    if (ownerUserId === currentUser.uid) {
      alert('This is your own listing!');
      return;
    }

    try {
      setCreatingChat(true);
      console.log('[ListingDetail] Creating chat with owner:', ownerUserId, tool.owner);
      const chatId = await createOrGetChat(
        ownerUserId,
        tool.owner,
        '' // We don't have the owner's photo URL here
      );
      console.log('[ListingDetail] Chat created/retrieved:', chatId);
      navigate(`/chat?selected=${chatId}`);
    } catch (error) {
      console.error('[ListingDetail] Error creating chat:', error);
      alert('Failed to create chat. Please try again. Error: ' + (error as Error).message);
    } finally {
      setCreatingChat(false);
    }
  };

  if (!tool) {
    return null;
  }

  const handleRentClick = () => {
    // Prevent users from renting their own listings
    if (currentUser && tool.ownerContact === currentUser.email) {
      alert('You cannot rent your own listing.');
      return;
    }

    setShowRentModal(true);
    // Set default dates (today to tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const startDateTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T09:00`;
    const endDateTime = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T17:00`;

    setRentRequest({
      ...rentRequest,
      startDateTime: startDateTime,
      endDateTime: endDateTime
    });
  };

  const handleRentRequestSubmit = async () => {
    if (!currentUser || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Parse datetime strings
      const startDateTime = new Date(rentRequest.startDateTime);
      const endDateTime = new Date(rentRequest.endDateTime);

      // Calculate total cost based on duration and pricing period
      const millisecondsDiff = endDateTime.getTime() - startDateTime.getTime();

      let totalCost: number;
      if (tool.period.toLowerCase() === 'day') {
        // For daily pricing, calculate number of days (minimum 1 day)
        const days = Math.max(1, Math.ceil(millisecondsDiff / (1000 * 60 * 60 * 24)));
        totalCost = days * tool.price;
      } else {
        // For hourly pricing, calculate number of hours
        const hours = Math.ceil(millisecondsDiff / (1000 * 60 * 60));
        totalCost = hours * tool.price;
      }

      // Ensure 2 decimal places
      totalCost = Math.round(totalCost * 100) / 100;

      // Extract date and time components for compatibility with existing system
      const startDate = startDateTime.toISOString().split('T')[0];
      const endDate = endDateTime.toISOString().split('T')[0];
      const startTime = startDateTime.toTimeString().slice(0, 5);
      const endTime = endDateTime.toTimeString().slice(0, 5);

      // Create rental request and add to context
      const rentalRequestData = {
        toolId: String(tool.id),
        toolName: tool.name,
        toolImage: tool.image,
        renterName: currentUser.displayName || 'Anonymous',
        renterEmail: currentUser.email || '',
        ownerEmail: (tool as any).ownerContact || (tool as any).ownerEmail || tool.ownerContact,
        ownerName: tool.owner,
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        message: rentRequest.message,
        totalCost: totalCost,
        status: 'pending' as const,
        location: tool.location
      };

      const result = await addRentalRequest(rentalRequestData);
      setEmailsSent(result.emailsSent);

      console.log('Rental request sent:', rentalRequestData);
      console.log('Emails sent:', result.emailsSent);

      // Store success data for the modal
      setSuccessData({
        tool,
        startDateTime: startDateTime.toLocaleDateString(),
        startTime,
        endDateTime: endDateTime.toLocaleDateString(),
        endTime,
        totalCost
      });

      // Close rent modal and show success modal
      setShowRentModal(false);
      setShowSuccessModal(true);
      setRentRequest({
        startDateTime: '',
        endDateTime: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting rental request:', error);
      alert('Failed to submit rental request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <LiquidGlassNav />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center space-x-2 mb-6 px-4 py-2 rounded-xl transition-colors ${
            theme === 'dark'
              ? ' text-gray-300'
              : 'bg-white/80 hover:bg-white/90 text-gray-700'
          }`}
        >
          <ArrowLeft className="w-8 h-8" />
          <span></span>
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className={`aspect-square rounded-2xl overflow-hidden ${
              theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              {(tool as any).imageUrls && (tool as any).imageUrls.length > 0 ? (
                <img
                  src={(tool as any).imageUrls[0]}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (tool as any).imageUrl ? (
                <img
                  src={(tool as any).imageUrl}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : tool.image && (tool.image.startsWith('data:image/') || tool.image.startsWith('http://') || tool.image.startsWith('https://')) ? (
                <img
                  src={tool.image}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-8xl">{tool.image}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Owner Info */}
            <div className={`p-4 rounded-2xl ${
              theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <button
                onClick={() => navigate(`/profile/${encodeURIComponent(tool.ownerContact)}`)}
                className="w-full text-left transition-all duration-300 hover:opacity-80"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-300 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                    {tool.owner.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{tool.owner}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm">
                        {listingData?.rating ? `${listingData.rating.toFixed(1)} (${listingData.reviews} reviews)` : `${tool.rating} (${tool.reviews} reviews)`}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Message Owner Button */}
              {(() => {
                console.log('[ListingDetail] Message button check:', {
                  currentUser: currentUser?.email,
                  ownerContact: tool.ownerContact,
                  ownerUserId,
                  shouldShow: currentUser && tool.ownerContact !== currentUser.email && ownerUserId
                });
                return currentUser && tool.ownerContact !== currentUser.email && ownerUserId;
              })() && (
                <button
                  onClick={handleMessageOwner}
                  disabled={creatingChat}
                  className={`mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    creatingChat
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{creatingChat ? 'Loading...' : 'Message Owner'}</span>
                </button>
              )}
            </div>

            {/* Tool Details */}
            <div className={`p-6 rounded-2xl ${
              theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{tool.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="bg-gray-100 dark:bg-gray-700 text-white px-2 py-1 rounded">{tool.category}</span>
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      {getConditionLabel(tool.condition)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(String(tool.id))}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorited(String(tool.id))
                      ? 'bg-pink-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={isFavorited(String(tool.id)) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorited(String(tool.id)) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center space-x-1 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-semibold">
                  {listingData?.rating ? listingData.rating.toFixed(1) : tool.rating}
                </span>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({listingData?.reviews ?? tool.reviews} reviews)
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{tool.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{tool.availability || 'Contact owner for availability'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Listed {formatCreatedDate((tool as any).createdAt)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200/20">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-10`}>
                    {tool.description || 'No description provided for this item.'}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-purple-300">${formatPrice(tool.price)}</span>
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      /{tool.period}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {currentUser && tool.ownerContact === currentUser.email ? (
                    <div className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold text-center cursor-not-allowed">
                      This is Your Listing
                    </div>
                  ) : (
                    <button
                      onClick={handleRentClick}
                      className="flex-1 bg-purple-900 hover:bg-purple-950 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                    >
                      Rent Now
                    </button>
                  )}
                  <button className={`px-6 py-3 rounded-xl border transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <ReviewsSection
            listingId={tool.id?.toString() || ''}
            listingName={tool.name}
            ownerEmail={tool.ownerContact}
            onReviewAdded={handleReviewAdded}
          />
        </div>
      </div>

      {/* Rent Request Modal */}
      {showRentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border-0 shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/20">
              <h3 className="text-lg font-semibold">Request to Rent</h3>
              <button
                onClick={() => setShowRentModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Tool Info */}
              <div className="flex items-center space-x-4">
                {renderToolImage(tool.image, 'medium')}
                <div>
                  <h4 className="font-semibold">{tool.name}</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    by {tool.owner} • {tool.location}
                  </p>
                  <p className="text-lg font-bold text-purple-300">
                    ${formatPrice(tool.price)}/{tool.period}
                  </p>
                </div>
              </div>

              {/* DateTime Selection */}
              <div className="grid grid-cols-1 gap-4">
                <DateTimePicker
                  label="Start Date & Time"
                  value={rentRequest.startDateTime}
                  onChange={(value) => setRentRequest({...rentRequest, startDateTime: value})}
                  unavailableDates={unavailableDates}
                  minDate={new Date()}
                  required
                  isStartDate={true}
                  otherDateTime={rentRequest.endDateTime}
                />
                <DateTimePicker
                  label="End Date & Time"
                  value={rentRequest.endDateTime}
                  onChange={(value) => setRentRequest({...rentRequest, endDateTime: value})}
                  unavailableDates={unavailableDates}
                  minDate={rentRequest.startDateTime ? new Date(rentRequest.startDateTime) : new Date()}
                  required
                  isStartDate={false}
                  otherDateTime={rentRequest.startDateTime}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">Message to Owner (Optional)</label>
                <textarea
                  value={rentRequest.message}
                  onChange={(e) => setRentRequest({...rentRequest, message: e.target.value})}
                  placeholder="Let the owner know about your rental needs..."
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border resize-none ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Cost Calculation */}
              {rentRequest.startDateTime && rentRequest.endDateTime && (() => {
                const startDateTime = new Date(rentRequest.startDateTime);
                const endDateTime = new Date(rentRequest.endDateTime);
                const millisecondsDiff = endDateTime.getTime() - startDateTime.getTime();

                let quantity: number;
                let unitName: string;
                let totalCost: number;

                if (tool.period.toLowerCase() === 'day') {
                  quantity = Math.max(1, Math.ceil(millisecondsDiff / (1000 * 60 * 60 * 24)));
                  unitName = quantity === 1 ? 'day' : 'days';
                  totalCost = quantity * tool.price;
                } else {
                  quantity = Math.ceil(millisecondsDiff / (1000 * 60 * 60));
                  unitName = quantity === 1 ? 'hour' : 'hours';
                  totalCost = quantity * tool.price;
                }

                // Ensure 2 decimal places
                totalCost = Math.round(totalCost * 100) / 100;

                return (
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Cost:</span>
                      <span className="font-bold text-lg text-purple-300">
                        ${formatPrice(totalCost)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quantity} {unitName} × ${formatPrice(tool.price)}/{tool.period}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200/20">
              <button
                onClick={() => setShowRentModal(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleRentRequestSubmit}
                disabled={!rentRequest.startDateTime || !rentRequest.endDateTime || isSubmitting}
                className="flex-1 py-2 px-4 bg-purple-900 hover:bg-purple-950 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border-0 shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Request Sent Successfully!</h3>
              <p className="text-green-100">Your rental request has been sent to {successData.tool.owner}</p>
            </div>

            {/* Request Details */}
            <div className="p-6 space-y-4">
              {/* Tool Info */}
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                {renderToolImage(successData.tool.image, 'medium')}
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-purple-800 dark:text-purple-200">{successData.tool.name}</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    by {successData.tool.owner} • {successData.tool.location}
                  </p>
                </div>
              </div>

              {/* Request Summary */}
              <div className={`p-4 rounded-xl border-2 border-dashed ${
                theme === 'dark' ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
              }`}>
                <h5 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Request Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Start:</span>
                    <span className="font-medium">{successData.startDateTime} {successData.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">End:</span>
                    <span className="font-medium">{successData.endDateTime} {successData.endTime}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Total Cost:</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">${formatPrice(successData.totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className={`p-4 rounded-xl ${
                theme === 'dark' ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">What happens next?</h5>
                <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• The owner can approve or decline your request</li>
                  <li>• Track this request in "My Rentals"</li>
                  <li>• You'll receive updates about the status</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200/20">
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/my-rentals')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  View My Rentals
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
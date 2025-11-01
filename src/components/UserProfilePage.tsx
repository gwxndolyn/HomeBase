import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { reviewsService, listingsService } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import LiquidGlassNav from './LiquidGlassNav';
import { ArrowLeft, Star, Package, MapPin, Calendar, MessageCircle, TrendingUp, Award, Eye } from 'lucide-react';

interface UserStats {
  totalListings: number;
  averageRating: number;
  totalReviews: number;
  joinDate: string;
}

interface UserReview {
  id: string;
  listingName: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: any;
}

export default function UserProfilePage() {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { listings } = useListings();
  const { createOrGetChat } = useChat();
  const { currentUser: authUser } = useAuth();
  
  const [userListings, setUserListings] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalListings: 0,
    averageRating: 0,
    totalReviews: 0,
    joinDate: 'Recently'
  });
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');
  const [creatingChat, setCreatingChat] = useState(false);

  // Decode the email parameter in case it's URL encoded
  const decodedEmail = email ? decodeURIComponent(email) : null;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const loadUserFromFirebase = async (email: string) => {
    try {
      // Try to find user in Firebase users collection by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        setProfileUserId(userDoc.id); // Store the user ID
        console.log('[UserProfile] Found user in Firestore:', userDoc.id, 'for email:', email);
        return {
          name: userData.displayName || 'User',
          joinDate: userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'Recently',
          bio: userData.bio || 'HomeBase community member',
          photoURL: userData.photoURL || ''
        };
      }
      
      // If not found in users collection, create a fallback profile
      console.warn('[UserProfile] User not found in Firestore for email:', email);
      return {
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        joinDate: 'Recently',
        bio: 'HomeBase community member',
        photoURL: ''
      };
    } catch (error) {
      console.error('Error loading user from Firebase:', error);
      // Return fallback profile
      return {
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        joinDate: 'Recently',
        bio: 'HomeBase community member',
        photoURL: ''
      };
    }
  };

  // Single useEffect to load data when email changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!decodedEmail) return;
      
      try {
        setLoading(true);
        
        // Reset all data first to prevent accumulation
        setUserListings([]);
        setUserReviews([]);
        setCurrentUser(null);
        setUserStats({
          totalListings: 0,
          averageRating: 0,
          totalReviews: 0,
          joinDate: 'Recently'
        });
        
        // Load user from Firebase
        const user = await loadUserFromFirebase(decodedEmail);

        setCurrentUser(user);

        // Load user's listings from Firebase
        const firebaseListings = await listingsService.getUserListings(decodedEmail);

        setUserListings(firebaseListings);

        // Load reviews for user's listings
        const allReviews: UserReview[] = [];
        for (const listing of firebaseListings) {
          try {
            const listingId = listing.id?.toString() || '';
            const listingReviews = await reviewsService.getListingReviews(listingId);
            
            for (const review of listingReviews) {
              allReviews.push({
                id: review.id || '',
                listingName: listing.name,
                rating: review.rating,
                comment: review.comment,
                reviewerName: review.reviewerName,
                createdAt: review.createdAt
              });
            }
          } catch (error) {
            console.error(`Error loading reviews for listing ${listing.id}:`, error);
          }
        }
        
        // Deduplicate reviews by id
        const uniqueReviews = allReviews.filter((review, index, self) => 
          index === self.findIndex(r => r.id === review.id)
        );
        
        setUserReviews(uniqueReviews);
        
        // Calculate user stats
        const totalReviews = uniqueReviews.length;
        const averageRating = totalReviews > 0 
          ? uniqueReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
          : 0;
        
        setUserStats({
          totalListings: firebaseListings.length,
          averageRating,
          totalReviews,
          joinDate: user?.joinDate || 'Recently'
        });
        
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [decodedEmail]); // Only depend on decodedEmail

  const handleListingClick = (listing: any) => {
    navigate(`/listing/${listing.id}`);
  };

  const renderToolImage = (imageStr: string, size: 'small' | 'medium' | 'card' = 'small') => {
    const sizeClasses = size === 'card' ? "w-full aspect-square" :
                        size === 'medium' ? "w-20 h-20" : "w-16 h-16";

    if (imageStr && imageStr.startsWith('data:image/')) {
      return (
        <img
          src={imageStr}
          alt="Tool"
          className={`${sizeClasses} object-cover rounded-xl shadow-md`}
        />
      );
    }

    return (
      <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md ${
        size === 'card' ? 'text-6xl' : size === 'medium' ? 'text-4xl' : 'text-3xl'
      }`}>
        {imageStr}
      </div>
    );
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleMessageUser = async () => {
    console.log('[UserProfile] handleMessageUser called');
    console.log('[UserProfile] profileUserId:', profileUserId);
    console.log('[UserProfile] currentUser:', currentUser);
    console.log('[UserProfile] authUser:', authUser?.uid);
    
    if (!profileUserId || !currentUser || !authUser) {
      console.error('[UserProfile] Missing required data to create chat:', {
        profileUserId,
        currentUserName: currentUser?.name,
        authUserId: authUser?.uid
      });
      alert('Unable to create chat. Missing user information.');
      return;
    }

    // Don't allow messaging yourself
    if (profileUserId === authUser.uid) {
      alert('You cannot message yourself!');
      return;
    }

    try {
      setCreatingChat(true);
      console.log('[UserProfile] Creating chat with user:', profileUserId, currentUser.name);
      const chat = await createOrGetChat(
        profileUserId,
        currentUser.name
      );
      console.log('[UserProfile] Chat created/retrieved:', chat.id);
      navigate(`/chat?selected=${chat.id}`);
    } catch (error) {
      console.error('[UserProfile] Error creating chat:', error);
      alert('Failed to create chat. Please try again. Error: ' + (error as Error).message);
    } finally {
      setCreatingChat(false);
    }
  };

  // Show loading while fetching user data
  if (loading && !currentUser) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
      }`}>
        <LiquidGlassNav />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
          <div className={`p-8 rounded-2xl ${
            theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="animate-pulse">
              <div className="flex items-center space-x-8 mb-8">
                <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user not found after loading
  if (!loading && !currentUser) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
      }`}>
        <LiquidGlassNav />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The user profile you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/browse')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              Back to Browse
            </button>
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
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

        {/* Profile Header */}
        <div className={`p-8 rounded-2xl mb-8 ${
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {currentUser.name.charAt(0)}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{currentUser.name}</h1>
                  <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {currentUser.bio}
                  </p>
                </div>
                
                {/* Message Button - only show if not viewing own profile */}
                {(() => {
                  console.log('[UserProfile] Message button check:', {
                    authUser: authUser?.uid,
                    profileUserId,
                    shouldShow: authUser && profileUserId && authUser.uid !== profileUserId
                  });
                  return authUser && profileUserId && authUser.uid !== profileUserId;
                })() && (
                  <button
                    onClick={handleMessageUser}
                    disabled={creatingChat}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      creatingChat
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{creatingChat ? 'Loading...' : 'Message'}</span>
                  </button>
                )}
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold">{userStats.totalListings}</span>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    listing{userStats.totalListings !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">
                    {userStats.averageRating > 0 ? userStats.averageRating.toFixed(1) : 'N/A'}
                  </span>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    ({userStats.totalReviews} review{userStats.totalReviews !== 1 ? 's' : ''})
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Joined {userStats.joinDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`rounded-2xl p-1 mb-8 ${
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-4 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === 'listings'
                  ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700/50'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Listings ({userStats.totalListings})</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700/50'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Reviews ({userStats.totalReviews})</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={`p-8 rounded-2xl ${
            theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'listings' ? (
          <div>
            {userListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {userListings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => handleListingClick(listing)}
                    className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                        : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                    }`}>

                    {/* Image */}
                    <div className="relative">
                      {renderToolImage(listing.image || listing.imageUrls?.[0] || '🔧', 'card')}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="text-base font-bold mb-1 text-white truncate">{listing.name}</h3>
                      <p className="text-lg font-bold text-purple-400 mb-2">
                        ${formatPrice(listing.price)}<span className="text-xs font-normal text-gray-400">/{listing.period}</span>
                      </p>

                      <div className="flex items-center space-x-1 mb-2">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-medium">{listing.rating || 0}</span>
                        <span className="text-xs text-gray-400">({listing.reviews || 0})</span>
                      </div>

                      <div className="flex items-center space-x-1 mb-2 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{listing.location}</span>
                      </div>

                      <div className={`text-xs px-2 py-0.5 rounded-lg inline-block ${
                        theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-12 rounded-2xl text-center ${
                theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
              }`}>
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Listings Yet</h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {currentUser.name} hasn't listed any tools yet.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {userReviews.length > 0 ? (
              userReviews.map((review) => (
                <div
                  key={review.id}
                  className={`p-6 rounded-2xl ${
                    theme === 'dark'
                      ? 'bg-gray-800/60'
                      : 'bg-white/80 backdrop-blur-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{review.listingName}</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Review by {review.reviewerName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.rating}/5</span>
                    </div>
                  </div>
                  
                  <p className={`mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {review.comment}
                  </p>
                  
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className={`p-12 rounded-2xl text-center ${
                theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
              }`}>
                <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Reviews Yet</h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {currentUser.name} hasn't received any reviews yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import LiquidGlassNav from './LiquidGlassNav';
import { Heart, Star, MapPin, Clock, Trash2, Share2, MessageCircle } from 'lucide-react';

export default function FavoritesPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { favorites, loading, removeFavorite } = useFavorites();

  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique categories from favorites
  const allCategories = Array.from(new Set(favorites.map(fav => fav.listing?.category).filter(Boolean)));
  const categories = ['All', ...allCategories];

  const filteredFavorites = favorites.filter(fav =>
    fav.listing && (selectedCategory === 'All' || fav.listing.category === selectedCategory)
  );

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      await removeFavorite(listingId);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleViewListing = (listingId: string) => {
    navigate(`/listing/${listingId}`);
  };

  const getAvailabilityColor = (availability: string) => {
    const isAvailable = availability && availability.toLowerCase().includes('available');
    return isAvailable
      ? 'text-green-500 bg-green-500/10'
      : 'text-orange-500 bg-orange-500/10';
  };

  const isItemAvailable = (availability: string) => {
    return availability && availability.toLowerCase().includes('available');
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  const renderToolImage = (imageUrls: string[], size: 'small' | 'large' | 'full' = 'small') => {
    if (size === 'full') {
      // For full-size images that fill the container
      if (imageUrls && imageUrls.length > 0 && imageUrls[0].startsWith('data:image/')) {
        return (
          <img
            src={imageUrls[0]}
            alt="Tool"
            className="w-full h-full object-cover"
          />
        );
      }
      // Default fallback for full size
      return (
        <div className="w-full h-full flex items-center justify-center text-6xl">
          🔧
        </div>
      );
    }

    // Original logic for small/large sizes
    const sizeClasses = size === 'large' ? "w-20 h-20" : "w-16 h-16";

    if (imageUrls && imageUrls.length > 0 && imageUrls[0].startsWith('data:image/')) {
      return (
        <img
          src={imageUrls[0]}
          alt="Tool"
          className={`${sizeClasses} object-cover rounded-xl`}
        />
      );
    }
    // Default fallback
    return (
      <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl text-4xl`}>
        🔧
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <LiquidGlassNav />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Heart className="w-8 h-8 mr-3 text-pink-500 fill-current" />
            My Favorites
          </h1>
          <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {favorites.length} saved tools
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-pink-500 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80'
                  : 'bg-white/80 text-gray-700 hover:bg-white/90 backdrop-blur-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading your favorites...</p>
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFavorites.map((favorite) => {
              const listing = favorite.listing!;
              const savedDate = favorite.createdAt?.toDate ? favorite.createdAt.toDate().toLocaleDateString() : 'Unknown';

              return (
                <div key={favorite.id} className={`rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group ${
                  theme === 'dark'
                    ? 'bg-gray-800/60 hover:bg-gray-800/80'
                    : 'bg-white/80 hover:bg-white/90 backdrop-blur-sm'
                }`} onClick={() => handleViewListing(listing.id!)}>
                  {/* Tool Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative">
                    {renderToolImage(listing.imageUrls, "full")}
                    <div className="absolute top-3 right-3 bg-purple-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{listing.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(String(listing.id!));
                      }}
                      className="absolute top-3 left-3 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110"
                      title="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 text-pink-500 fill-current" />
                    </button>
                  </div>

                  {/* Tool Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">{listing.name}</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        by <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${encodeURIComponent(listing.ownerContact)}`);
                          }}
                          className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                        >
                          {listing.owner}
                        </button>
                      </p>
                    </div>




                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-purple-300">${formatPrice(listing.price)}</span>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          /{listing.period}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{listing.rating?.toFixed(1) || '0.0'}</span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({listing.reviews || 0})
                        </span>
                      </div>
                    </div>

                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      📍 {listing.location}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className={`text-center py-20 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center mb-4 mx-auto">
                <Heart className="w-12 h-12 text-pink-500/60" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                <span className="text-white text-sm font-bold">♡</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {selectedCategory === 'All' ? 'No favorites yet' : `No ${selectedCategory.toLowerCase()} favorites`}
            </h3>
            <p className="text-lg mb-8 max-w-md mx-auto">
              {selectedCategory === 'All'
                ? "Discover amazing tools and save the ones you love for easy access later!"
                : `Browse ${selectedCategory.toLowerCase()} tools and add them to your favorites.`}
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Start Browsing Tools
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
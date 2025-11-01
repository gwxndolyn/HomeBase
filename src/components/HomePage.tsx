import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import { useShop } from '../contexts/ShopContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import { Star, ChevronLeft, ChevronRight, Users, Clock, CheckCircle, DollarSign, Inbox, MapPin, Heart } from 'lucide-react';

export default function HomePage() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { listings } = useListings();
  const { userRentalRequests = [], receivedRentalRequests = [] } = useRentals();
  const { shops } = useShop();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!currentUser) {
    return null;
  }

  // Get stats safely
  const activeRentals = userRentalRequests.filter((r: any) => r.status === 'approved');
  const completedRentals = userRentalRequests.filter((r: any) => r.status === 'completed');
  const pendingRequests = userRentalRequests.filter((r: any) => r.status === 'pending');
  const incomingRequests = receivedRentalRequests.filter((r: any) => r.status === 'pending');
  const completedBookings = receivedRentalRequests.filter((r: any) => r.status === 'completed');

  const totalEarnings = completedBookings.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);
  const totalSpent = completedRentals.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);

  // Carousel banners
  const banners = [
    {
      id: 1,
      title: `Welcome to HomeBase, ${currentUser?.displayName?.split(' ')[0] || 'User'}!`,
      subtitle: "Start your home business journey",
      icon: "🏪",
      color: "from-indigo-500 to-purple-600",
      action: () => navigate('/browse')
    },
    {
      id: 2,
      title: "Launch Your Shop",
      subtitle: "Sell products and services from home",
      icon: "🛍️",
      color: "from-blue-500 to-purple-600",
      action: () => navigate('/list-item')
    },
    {
      id: 3,
      title: "Discover Local Businesses",
      subtitle: "Support home entrepreneurs in your area",
      icon: "🌍",
      color: "from-green-500 to-blue-500",
      action: () => navigate('/browse')
    },
    {
      id: 4,
      title: "Join the Community",
      subtitle: "Over 1000+ home businesses",
      icon: "👥",
      color: "from-purple-500 to-pink-500",
      action: () => navigate('/browse')
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      {/* Fluid Glass Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -inset-10 opacity-30 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10'
            : 'bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20'
        } blur-3xl animate-pulse`}></div>
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${
          theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-400/10'
        } rounded-sm blur-3xl animate-pulse delay-1000`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${
          theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-400/10'
        } rounded-sm blur-3xl animate-pulse delay-2000`}></div>
      </div>

      <LiquidGlassNav />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Enhanced Carousel Banner */}
        <div className="mb-8 relative overflow-hidden rounded-2xl shadow-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`w-full flex-shrink-0 bg-gradient-to-r ${banner.color} p-6 sm:p-12 md:p-20 cursor-pointer min-h-[300px] sm:min-h-[400px] md:min-h-[450px]`}
                onClick={banner.action}
              >
                <div className="flex items-center justify-between h-full">
                  <div className="text-white z-10 relative">
                    <div className="text-6xl sm:text-8xl md:text-9xl mb-3 md:mb-6">{banner.icon}</div>
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-2 md:mb-4 leading-tight drop-shadow-lg">{banner.title}</h1>
                    <p className="text-base sm:text-xl md:text-2xl opacity-90 mb-4 md:mb-6 drop-shadow-md">{banner.subtitle}</p>
                    <div className="flex space-x-4">
                      <div className="px-4 sm:px-6 py-1.5 sm:py-2 bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium shadow-lg">
                        Click to explore
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="text-8xl">{banner.icon}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-1.5 md:p-2 text-white transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-1.5 md:p-2 text-white transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Popular Categories */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 px-2">Popular Categories</h2>
          <div className="relative">
            <div className="flex overflow-x-auto scrollbar-hide gap-8 pb-6">
              {[
                { name: 'Handmade Crafts', emoji: '🎨', count: '120+', category: 'Handmade Crafts & Artwork' },
                { name: 'Baked Goods', emoji: '🍰', count: '85+', category: 'Baked Goods & Desserts' },
                { name: 'Home Decor', emoji: '🏠', count: '60+', category: 'Home Decor & Furniture' },
                { name: 'Cleaning Svcs', emoji: '🧹', count: '45+', category: 'Cleaning & Organization Services' },
                { name: 'Pet Care', emoji: '🐕', count: '70+', category: 'Pet Care Services' },
                { name: 'Photography', emoji: '📷', count: '35+', category: 'Photography & Videography Services' },
                { name: 'Music & Audio', emoji: '🎵', count: '28+', category: 'Music & Audio Services' },
                { name: 'Fitness', emoji: '💪', count: '42+', category: 'Fitness & Training' },
                { name: 'Beauty Care', emoji: '💄', count: '55+', category: 'Beauty & Personal Care' },
                { name: 'Coaching', emoji: '🎯', count: '38+', category: 'Consulting & Coaching' },
                { name: 'Digital Services', emoji: '💻', count: '25+', category: 'Digital Products & Services' },
                { name: 'Wellness', emoji: '🧘', count: '32+', category: 'Health & Wellness' }
              ].map((category, index) => {
                return (
                  <div
                    key={index}
                    onClick={() => navigate(`/browse?category=${encodeURIComponent(category.category)}`)}
                    className="flex-none cursor-pointer group mt-1 ml-1 mr-1"
                  >
                    <div className={`w-24 h-24 rounded-full border border-gray-200/40 flex items-center justify-center mb-3 transition-all group-hover:border-gray-300/60 group-hover:shadow-lg group-hover:scale-105 overflow-hidden text-4xl ${
                      theme === 'dark' ? 'bg-gray-800/15' : 'bg-gray-100/25'
                    }`}>
                      {category.emoji}
                    </div>
                    <div className="text-center max-w-[96px]">
                      <h3 className="font-medium text-xs mb-1 leading-tight">{category.name}</h3>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{category.count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-16 px-2">Your HomeBase Dashboard</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className={`lg:col-span-2 rounded-xl p-6 shadow-2xl ${
              theme === 'dark'
                ? 'bg-gray-900/90 backdrop-blur-sm border border-purple-500/20'
                : 'bg-white/90 backdrop-blur-sm border border-purple-300/30'
            }`}>
              <h3 className="text-sm font-bold mb-6 flex items-center text-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Order Activity
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <Clock className="w-6 h-6 mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{activeRentals.length}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CheckCircle className="w-6 h-6 mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{completedRentals.length}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                  <Inbox className="w-6 h-6 mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <DollarSign className="w-6 h-6 mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">${totalSpent}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Spent</p>
                </div>
              </div>
            </div>

            {/* Earnings Card */}
            <div className={`rounded-xl p-6 shadow-2xl ${
              theme === 'dark'
                ? 'bg-gray-900/90 backdrop-blur-sm border border-purple-500/20'
                : 'bg-white/90 backdrop-blur-sm border border-purple-300/30'
            }`}>
              <h3 className="text-sm font-bold mb-4 flex items-center text-purple-600">
                <DollarSign className="w-4 h-4 mr-2" />
                Your Earnings
              </h3>
              <p className="text-4xl font-bold text-purple-500 mb-2">${totalEarnings}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>From completed bookings</p>
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="text-green-500">📈</span>
                {completedBookings.length} completed
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {incomingRequests.length} pending requests
              </p>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 px-2">✨ Featured Products & Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.slice(0, 8).map((product: any) => {
              const shop = shops.find(s => s.id === product.shopId);
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/listing/${product.id}`)}
                  className={`rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:scale-105 border ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 border-gray-700/50 hover:border-purple-500/50'
                      : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-purple-400/50'
                  }`}
                >
                  <div className={`h-40 flex items-center justify-center text-6xl ${
                    theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}>
                    {product.imageUrls?.[0] || '📦'}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2 line-clamp-2 text-sm">{product.name}</h3>
                    <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} font-medium`}>
                      {shop?.shopName || product.owner}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-400">${product.price}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold">{product.rating}</span>
                        </div>
                      </div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {product.reviews} reviews • {product.type}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Shops */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 px-2">🏪 Top Rated Shops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.slice(0, 6).map((shop: any) => {
              const shopListings = listings.filter(l => l.shopId === shop.id);
              return (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/shop-front/${shop.id}`)}
                  className={`rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:scale-105 border ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 border-gray-700/50 hover:border-purple-500/50'
                      : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-purple-400/50'
                  }`}
                >
                  <div className={`h-32 bg-gradient-to-r ${theme === 'dark' ? 'from-purple-600/80 to-blue-600/80' : 'from-purple-400/80 to-blue-500/80'} flex items-center justify-center text-5xl`}>
                    {shop.shopName.charAt(0)}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2">{shop.shopName}</h3>
                    <p className={`text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {shop.shopDescription}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{shop.rating}</span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                          ({shop.reviews})
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-200/50 text-purple-700'}`}>
                        {shopListings.length} items
                      </span>
                    </div>
                    {shop.location && (
                      <p className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <MapPin className="w-3 h-3" />
                        {shop.location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

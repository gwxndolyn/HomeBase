import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useShop } from '../contexts/ShopContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import { ArrowLeft, Star, MapPin, Phone, Globe, Instagram, Clock, ShoppingCart, BookOpen, MessageSquare, Share2, Heart } from 'lucide-react';

interface ShopFrontPageProps {}

export default function ShopFrontPage({}: ShopFrontPageProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { shops } = useShop();
  const { listings } = useListings();
  const [shop, setShop] = useState<any>(null);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'instructions' | 'reservations'>('products');

  // Load shop data
  useEffect(() => {
    const foundShop = shops?.find(s => s.id === shopId);
    if (foundShop) {
      setShop(foundShop);
    }
  }, [shopId, shops]);

  // Filter products by shop
  useEffect(() => {
    if (shopId && listings) {
      const shopItems = listings.filter(item => item.shopId === shopId);
      setShopProducts(shopItems);
    }
  }, [shopId, listings]);

  if (!shop) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <LiquidGlassNav />
        <div className="max-w-6xl mx-auto px-4 pt-32 pb-8">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 mb-6 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className={`text-center py-12 rounded-xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Shop not found</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const products = shopProducts.filter(p => p.type === 'product');
  const services = shopProducts.filter(p => p.type === 'service');

  const isOpen = (operatingHours: any) => {
    if (!operatingHours) return true;
    const now = new Date();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const hours = operatingHours[dayName];
    if (!hours) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime < closeTime;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <LiquidGlassNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-6 ${
            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>

        {/* Shop Header */}
        <div className={`rounded-2xl overflow-hidden shadow-2xl mb-8 ${
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          {/* Shop Banner */}
          <div className={`h-40 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-purple-400 to-blue-500'}`}></div>

          {/* Shop Info */}
          <div className="p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className={`w-24 h-24 rounded-full border-4 ${
                theme === 'dark' ? 'border-gray-800 bg-gradient-to-br from-purple-500 to-blue-500' : 'border-white bg-gradient-to-br from-purple-400 to-blue-400'
              } flex items-center justify-center text-white text-2xl font-bold -mt-12`}>
                {shop.shopName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{shop.shopName}</h1>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {shop.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}>
                      <Heart className="w-6 h-6" />
                    </button>
                    <button className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}>
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(shop.rating || 4.5) ? 'fill-yellow-400 text-yellow-400' : theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{shop.rating || 4.5}</span>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    ({shop.reviews || 0} reviews)
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isOpen(shop.operatingHours)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isOpen(shop.operatingHours) ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                {/* Description */}
                {shop.shopDescription && (
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {shop.shopDescription}
                  </p>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {shop.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span>{shop.location}</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <a href={`tel:${shop.phone}`} className="hover:underline">{shop.phone}</a>
                    </div>
                  )}
                  {shop.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <a href={shop.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                  {shop.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-purple-600" />
                      <a href={`https://instagram.com/${shop.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        @{shop.instagram}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        {shop.operatingHours && (
          <div className={`rounded-xl p-6 mb-8 ${
            theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              Operating Hours
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {Object.entries(shop.operatingHours).map(([day, hours]: [string, any]) => (
                <div key={day} className={`p-2 rounded text-center text-sm ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                }`}>
                  <p className="font-medium capitalize text-xs">{day}</p>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {hours.open} - {hours.close}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200/20">
          {['products', 'services', 'instructions', 'reservations'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`
              }`}
            >
              {tab === 'products' && `Products (${products.length})`}
              {tab === 'services' && `Services (${services.length})`}
              {tab === 'instructions' && 'Instructions'}
              {tab === 'reservations' && 'Reservations'}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div
                    key={product.id}
                    className={`rounded-xl overflow-hidden cursor-pointer transform transition-all hover:scale-105 ${
                      theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
                    }`}
                    onClick={() => navigate(`/listing/${product.id}`)}
                  >
                    {/* Product Image Placeholder */}
                    <div className={`h-40 ${theme === 'dark' ? 'bg-gradient-to-br from-purple-600/30 to-blue-600/30' : 'bg-gradient-to-br from-purple-200/30 to-blue-200/30'} flex items-center justify-center text-3xl`}>
                      {typeof product.image === 'string' && (product.image.startsWith('data:') || product.image.startsWith('http')) ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{product.image || '📦'}</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-bold mb-1">{product.name}</h3>
                      <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {product.description?.substring(0, 60)}...
                      </p>

                      {/* Price */}
                      <div className="mb-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-purple-600">
                          ${product.price}
                        </span>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          per {product.period}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {product.rating || 4.5} ({product.reviews || 0})
                        </span>
                      </div>

                      {/* Stock Info */}
                      {product.stock !== undefined && (
                        <div className={`text-xs mb-4 ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </div>
                      )}

                      {/* Action Button */}
                      <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 rounded-xl ${
                theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
              }`}>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  No products available yet
                </p>
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            {services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <div
                    key={service.id}
                    className={`rounded-xl overflow-hidden cursor-pointer transform transition-all hover:scale-105 ${
                      theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
                    }`}
                    onClick={() => navigate(`/listing/${service.id}`)}
                  >
                    {/* Service Image */}
                    <div className={`h-40 ${theme === 'dark' ? 'bg-gradient-to-br from-blue-600/30 to-green-600/30' : 'bg-gradient-to-br from-blue-200/30 to-green-200/30'} flex items-center justify-center text-3xl`}>
                      {typeof service.image === 'string' && (service.image.startsWith('data:') || service.image.startsWith('http')) ? (
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{service.image || '💼'}</span>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="p-4">
                      <h3 className="font-bold mb-1">{service.name}</h3>
                      <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {service.description?.substring(0, 60)}...
                      </p>

                      {/* Price */}
                      <div className="mb-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-blue-600">
                          ${service.price}
                        </span>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          per {service.period}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {service.rating || 4.5} ({service.reviews || 0})
                        </span>
                      </div>

                      {/* Action Button */}
                      <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 rounded-xl ${
                theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
              }`}>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  No services available yet
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions Tab */}
        {activeTab === 'instructions' && (
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-4">How to Order/Book</h3>
              <ol className={`space-y-3 list-decimal list-inside ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li>Browse our products or services using the tabs above</li>
                <li>Click on an item to view full details and reviews</li>
                <li>For products: Add to cart and proceed to checkout</li>
                <li>For services: Select your preferred date/time and confirm booking</li>
                <li>Complete payment and receive confirmation</li>
                <li>Track your order status from your dashboard</li>
              </ol>

              <h3 className="text-lg font-bold mt-6 mb-3">Contact Us</h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Have questions? Message us directly through the chat feature or contact us using the information above.
              </p>

              <button className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message Shop
              </button>
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <h3 className="text-xl font-bold mb-4">Service Reservations</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Click on any service above to view availability and make a reservation.
              Our service providers will confirm your booking within 24 hours.
            </p>

            {services.length > 0 ? (
              <div className="space-y-3">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => navigate(`/listing/${service.id}`)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 hover:bg-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{service.name}</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          ${service.price} per {service.period}
                        </p>
                      </div>
                      <span className="text-purple-600 font-medium">Book Now →</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No services available for reservation at this time.
              </p>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

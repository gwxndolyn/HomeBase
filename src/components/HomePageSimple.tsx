import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useShop } from '../contexts/ShopContext';
import { useNavigate } from 'react-router-dom';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';

export default function HomePageSimple() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { shops } = useShop();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <LiquidGlassNav />

      <div className="pt-32 px-4 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome, {currentUser?.displayName}!</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Featured Shops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops && shops.length > 0 ? (
              shops.slice(0, 3).map(shop => (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/shop-front/${shop.id}`)}
                  className={`p-6 rounded-lg cursor-pointer transition-transform hover:scale-105 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{shop.shopName}</h3>
                  <p className="mb-4">{shop.shopDescription}</p>
                  <div className="flex items-center justify-between">
                    <span>⭐ {shop.rating}</span>
                    <button className={`px-4 py-2 rounded ${
                      theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                    } text-white`}>
                      Visit Shop
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No shops found</p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <button
            onClick={() => navigate('/browse')}
            className="p-6 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-700"
          >
            Browse Products
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="p-6 rounded-lg bg-green-600 text-white font-bold text-lg hover:bg-green-700"
          >
            My Shop
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="p-6 rounded-lg bg-orange-600 text-white font-bold text-lg hover:bg-orange-700"
          >
            My Orders
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

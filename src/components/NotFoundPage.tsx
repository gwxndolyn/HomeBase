import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -inset-10 opacity-30 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10'
            : 'bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20'
        } blur-3xl animate-pulse`}></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className={`text-8xl md:text-9xl font-bold mb-4 ${
            theme === 'dark' ? 'text-purple-300' : 'text-purple-300'
          }`}>
            404
          </h1>
          <div className="text-6xl mb-6">🔍</div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Oops! Page Not Found
          </h2>
          <p className={`text-lg md:text-xl mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            The page you're looking for seems to have gone missing. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-full border-2 transition-all hover:scale-105 ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>

          <button
            onClick={() => navigate('/home')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold transition-all hover:scale-105 hover:shadow-lg`}
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </button>
        </div>

        {/* Help Text */}
        <div className={`mt-8 text-sm ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        }`}>
          <p>Need help? Contact support or check out our help center.</p>
        </div>
      </div>
    </div>
  );
}
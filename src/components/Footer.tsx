import { useTheme } from '../contexts/ThemeContext';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Github } from 'lucide-react';
import shareLahLogo from './sharelah.png';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className={`border-t transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gray-900/50 border-gray-800'
        : 'bg-white/80 border-gray-200 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={shareLahLogo} alt="HomeBase Logo" className="w-8 h-8" />
              <h3 className="text-lg font-bold">
                HomeBase
              </h3>
            </div>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Your trusted platform for sharing and renting tools. Making DIY projects accessible for everyone in Singapore.
            </p>
            <div className="flex space-x-4">
              <button className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}>
                <Facebook className="w-5 h-5" />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}>
                <Twitter className="w-5 h-5" />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}>
                <Instagram className="w-5 h-5" />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}>
                <Github className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <div className="space-y-2">
              {['Browse Tools', 'List Your Tool', 'How It Works', 'Safety Guidelines', 'FAQ'].map((link) => (
                <button
                  key={link}
                  className={`block text-sm transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold">Popular Categories</h4>
            <div className="space-y-2">
              {['Power Tools', 'Garden Tools', 'Electronics', 'Kitchen', 'Sports Equipment'].map((category) => (
                <button
                  key={category}
                  className={`block text-sm transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-purple-300" />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  hello@sharelah.sg
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-purple-300" />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  +65 8888 0000
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-purple-300" />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Singapore
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 HomeBase. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button className={`text-sm transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}>
              Privacy Policy
            </button>
            <button className={`text-sm transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}>
              Terms of Service
            </button>
            <button className={`text-sm transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}>
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
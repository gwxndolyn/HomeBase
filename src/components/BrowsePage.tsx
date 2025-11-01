import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useShop } from '../contexts/ShopContext';
import { loadGoogleMapsScript } from '../utils/googleMaps';
import { emailService } from '../services/emailService';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import { Search, Filter, Star, List, Map as MapIcon, X, TrendingUp, Award, ChevronRight, ChevronDown, CheckCircle2, Calendar, Clock, DollarSign, Eye, Heart, XCircle } from 'lucide-react';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
    rentTool: (toolId: number) => void;
    viewListing: (toolId: string | number) => void;
  }
}

export default function BrowsePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { listings } = useListings();
  const { addRentalRequest } = useRentals();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { shops } = useShop();
  const [browseMode, setBrowseMode] = useState<'products' | 'shops'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rentRequest, setRentRequest] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    message: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [sortBy, setSortBy] = useState('relevance');
  const [distance, setDistance] = useState(50);
  const [navigating, setNavigating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const discoverMapRef = useRef<HTMLDivElement>(null);
  const currentInfoWindowRef = useRef<any>(null);

  // Helper function to render tool image (emoji or base64)
  const renderToolImage = (tool: any, className: string = "text-4xl") => {
    // Check if image is a URL (base64 data URL or Firebase Storage URL)
    if (tool.image && (tool.image.startsWith('data:image/') || tool.image.startsWith('http://') || tool.image.startsWith('https://'))) {
      return (
        <img
          src={tool.image}
          alt={tool.name}
          className={`w-full h-full object-cover rounded-lg ${className.includes('group-hover:scale-110') ? 'group-hover:scale-110 transition-transform' : ''}`}
          loading="lazy"
        />
      );
    }
    // Otherwise, treat as emoji
    return (
      <div className={`${className} group-hover:scale-110 transition-transform`}>
        {tool.image}
      </div>
    );
  };

  // Helper function to get category emoji for map markers
  const getCategoryIcon = (tool: any) => {
    // If it has a base64 image, return category emoji instead
    if (tool.image && tool.image.startsWith('data:image/')) {
      const categoryEmojis = {
        'Handmade Crafts & Artwork': '🎨',
        'Baked Goods & Desserts': '🍰',
        'Home Decor & Furniture': '🏠',
        'Cleaning & Organization Services': '🧹',
        'Pet Care Services': '🐾',
        'Beauty & Personal Care': '💅',
        'Photography & Videography Services': '📸',
        'Consulting & Coaching': '🎓',
        'Digital Products & Services': '💻',
        'Health & Wellness': '🌿',
        'Writing & Content Services': '📝',
        'Music & Audio Services': '🎵',
        'Tutoring & Education': '📚',
        'Fitness & Training': '💪',
        'Event Planning & Coordination': '🎉',
        'Home Repair & Maintenance': '🔧',
        'Fashion & Accessories': '👗',
        'Custom Services': '⭐',
        'Other': '🏠'
      };
      return categoryEmojis[tool.category] || '🏠';
    }
    // Otherwise return the emoji image
    return tool.image;
  };

  const categories = [
    'All',
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
    'Music & Audio Services',
    'Tutoring & Education',
    'Fitness & Training',
    'Event Planning & Coordination',
    'Home Repair & Maintenance',
    'Fashion & Accessories',
    'Custom Services',
    'Other'
  ];

  // Use only real listings from Firebase
  console.log('Firebase listings:', listings);
  const allTools = [...listings];
  console.log('All tools combined:', allTools);

  // Debug coordinates in each listing
  listings.forEach((listing, index) => {
    console.log(`Listing ${index + 1}:`, {
      name: listing.name,
      hasCoordinates: !!listing.coordinates,
      coordinates: listing.coordinates,
      coordsType: typeof listing.coordinates,
      hasLat: listing.coordinates ? !!listing.coordinates.lat : false,
      hasLng: listing.coordinates ? !!listing.coordinates.lng : false,
      latType: listing.coordinates ? typeof listing.coordinates.lat : 'undefined',
      lngType: listing.coordinates ? typeof listing.coordinates.lng : 'undefined'
    });
  });

  const filteredTools = allTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesPrice = tool.price >= priceRange.min && tool.price <= priceRange.max;
    const isActive = (tool as any).isActive !== false; // Filter out delisted items
    return matchesSearch && matchesCategory && matchesPrice && isActive;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return Number(b.id) - Number(a.id);
      default:
        return 0;
    }
  });

  // Get top rated tools - ordered by rating (with minimum reviews for credibility)
  const topRatedTools = (() => {
    const activeTools = allTools.filter(tool => (tool as any).isActive !== false);
    // Sort all tools by rating, then by number of reviews as tiebreaker
    return activeTools
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.reviews - a.reviews;
      })
      .slice(0, 6);
  })();

  // Get trending tools - based on rental count from completed/active rentals
  const trendingTools = (() => {
    const activeTools = allTools.filter(tool => (tool as any).isActive !== false);

    // Calculate rental count for each tool
    const toolsWithRentals = activeTools.map(tool => {
      const rentalCount = (tool as any).rentalCount || 0;
      return { ...tool, rentalCount };
    });

    // Sort by rental count, then by rating as tiebreaker
    return toolsWithRentals
      .sort((a, b) => {
        if (b.rentalCount !== a.rentalCount) {
          return b.rentalCount - a.rentalCount;
        }
        return b.rating - a.rating;
      })
      .slice(0, 6);
  })();

  // Featured categories with product counts
  const featuredCategories = [
    { name: 'Handmade Crafts & Artwork', emoji: '🎨', count: allTools.filter(t => t.category === 'Handmade Crafts & Artwork').length },
    { name: 'Baked Goods & Desserts', emoji: '🍰', count: allTools.filter(t => t.category === 'Baked Goods & Desserts').length },
    { name: 'Beauty & Personal Care', emoji: '💅', count: allTools.filter(t => t.category === 'Beauty & Personal Care').length },
    { name: 'Photography & Videography Services', emoji: '📸', count: allTools.filter(t => t.category === 'Photography & Videography Services').length },
    { name: 'Health & Wellness', emoji: '🌿', count: allTools.filter(t => t.category === 'Health & Wellness').length },
    { name: 'Consulting & Coaching', emoji: '🎓', count: allTools.filter(t => t.category === 'Consulting & Coaching').length }
  ];

  const searchSuggestions = searchTerm.length > 0
    ? allTools
        .filter(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5)
        .map(tool => tool.name)
    : [];

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Fallback to Singapore center if location access denied
          setUserLocation({ lat: 1.3521, lng: 103.8198 });
        }
      );
    } else {
      // Fallback to Singapore center if geolocation not supported
      setUserLocation({ lat: 1.3521, lng: 103.8198 });
    }
  }, []);

  // Initialize Discover Map (only show when not in map view mode)
  useEffect(() => {
    const initializeDiscoverMap = async () => {
      if (discoverMapRef.current && userLocation && !searchSubmitted && !loading && viewMode !== 'map') {
        try {
          // Load Google Maps script if not already loaded
          await loadGoogleMapsScript();

          if (!window.google || !window.google.maps) {
            return;
          }
      const discoverMap = new window.google.maps.Map(discoverMapRef.current, {
        center: userLocation,
        zoom: 14,
        styles: [
          // Hide all POI markers (shopping malls, restaurants, etc.)
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.attraction',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.government',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.park',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.place_of_worship',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.school',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.sports_complex',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit.station',
            stylers: [{ visibility: 'off' }]
          },
          // Dark theme styles when enabled
          ...(theme === 'dark' ? [
            { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
            { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
            { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
            { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
            { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
          ] : [])
        ]
      });

      // Add markers for filtered tools (respects categories and filters)
      // Filter out tools without valid coordinates
      const toolsWithCoordinates = filteredTools.filter(tool =>
        tool.coordinates &&
        typeof tool.coordinates.lat === 'number' &&
        typeof tool.coordinates.lng === 'number'
      );

      console.log('Tools with coordinates for discover map:', toolsWithCoordinates.length, 'out of', filteredTools.length);

      // Set up global function for info window clicks
      window.viewListing = (toolId: string | number) => {
        console.log('viewListing called with:', toolId, 'Type:', typeof toolId);
        const tool = filteredTools.find(t => String(t.id) === String(toolId));
        console.log('Found tool:', tool);
        if (tool) {
          handleCardClick(tool);
        } else {
          console.error('Tool not found for ID:', toolId);
        }
      };

      toolsWithCoordinates.forEach((tool) => {
        // Create custom marker icon with image
        const markerIcon = tool.image && tool.image.startsWith('data:image/')
          ? {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="48" height="64" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <clipPath id="pin-clip-${tool.id}">
                      <circle cx="24" cy="22" r="18"/>
                    </clipPath>
                  </defs>
                  <path d="M24 0C13.507 0 5 8.507 5 19C5 33.25 24 64 24 64S43 33.25 43 19C43 8.507 34.493 0 24 0Z" fill="#3B82F6"/>
                  <circle cx="24" cy="22" r="18" fill="white"/>
                  <image href="${tool.image}" x="6" y="4" width="36" height="36" clip-path="url(#pin-clip-${tool.id})" preserveAspectRatio="xMidYMid slice"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(48, 64),
              anchor: new window.google.maps.Point(24, 64),
            }
          : {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="48" height="64" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 0C13.507 0 5 8.507 5 19C5 33.25 24 64 24 64S43 33.25 43 19C43 8.507 34.493 0 24 0Z" fill="#3B82F6"/>
                  <circle cx="24" cy="22" r="18" fill="white"/>
                  <text x="24" y="28" text-anchor="middle" font-size="20" fill="#3B82F6">${getCategoryIcon(tool)}</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(48, 64),
              anchor: new window.google.maps.Point(24, 64),
            };

        const marker = new window.google.maps.Marker({
          position: tool.coordinates,
          map: discoverMap,
          title: tool.name,
          icon: markerIcon
        });

        // Create info window with conditional image display
        const imageContent = tool.image && tool.image.startsWith('data:image/')
          ? `<img src="${tool.image}" alt="${tool.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; margin-right: 12px;">`
          : `<span style="font-size: 32px; margin-right: 12px;">${tool.image}</span>`;

        const infoWindow = new window.google.maps.InfoWindow({
          disableAutoPan: false,
          content: `
            <style>
              .gm-style-iw-d {
                overflow: visible !important;
                padding: 0 !important;
                max-height: none !important;
              }
              .gm-style-iw {
                padding: 0 !important;
                background: transparent !important;
                max-height: none !important;
              }
              .gm-style-iw-c {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                max-height: none !important;
              }
              .gm-style-iw-tc {
                display: none !important;
              }
              .gm-ui-hover-effect {
                display: none !important;
              }
            </style>
            <div
              onclick="console.log('Clicked tool ID:', '${tool.id}'); if(window.viewListing) { window.viewListing('${tool.id}'); }"
              style="
                width: 200px;
                cursor: pointer;
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                transition: all 0.3s;
                padding: 12px;
              "
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 40px rgba(0, 0, 0, 0.5)'"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.4)'"
            >
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                ${tool.image && tool.image.startsWith('data:image/')
                  ? `<img src="${tool.image}" alt="${tool.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.2);">`
                  : `<div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.2);">${tool.image}</div>`
                }
                <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3); flex: 1;">${tool.name}</h3>
              </div>
              <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #60A5FA;">$${tool.price}<span style="font-size: 12px; font-weight: 400; color: rgba(255,255,255,0.8);">/${tool.period}</span></p>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                <span style="color: #FBBF24;">⭐</span>
                <span style="font-size: 13px; font-weight: 600; color: #fff;">${tool.rating}</span>
                <span style="font-size: 11px; color: rgba(255,255,255,0.6);">(${tool.reviews})</span>
              </div>
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 4px;">
                <span>📍</span><span>${tool.location}</span>
              </p>
            </div>
          `
        });

        marker.addListener('click', () => {
          // Close previous info window if exists
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }
          infoWindow.open(discoverMap, marker);
          currentInfoWindowRef.current = infoWindow;
        });
      });

      // Close info window when clicking on the map
      discoverMap.addListener('click', () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
          currentInfoWindowRef.current = null;
        }
      });

      // Add user location marker if available
      if (userLocation) {
        const userMarker = new window.google.maps.Marker({
          position: userLocation,
          map: discoverMap,
          title: 'Your Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 48 16 48S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#DC2626"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
                <circle cx="16" cy="16" r="4" fill="#DC2626"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 48),
            anchor: new window.google.maps.Point(16, 48),
          }
        });

        // Create simple info window for user location
        const userInfoWindow = new window.google.maps.InfoWindow({
          disableAutoPan: false,
          content: `
            <style>
              .gm-style-iw-d {
                overflow: visible !important;
                padding: 0 !important;
                max-height: none !important;
              }
              .gm-style-iw {
                padding: 0 !important;
                background: transparent !important;
                max-height: none !important;
              }
              .gm-style-iw-c {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                max-height: none !important;
              }
              .gm-style-iw-tc {
                display: none !important;
              }
              .gm-ui-hover-effect {
                display: none !important;
              }
            </style>
            <div
              style="
                width: auto;
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                padding: 12px 16px;
              "
            >
              <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">You are here!</h3>
            </div>
          `
        });

        userMarker.addListener('click', () => {
          // Close previous info window if exists
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }
          userInfoWindow.open(discoverMap, userMarker);
          currentInfoWindowRef.current = userInfoWindow;
        });
      }
        } catch (error) {
          console.error('Failed to load Google Maps for discover map:', error);
        }
      }
    };

    initializeDiscoverMap();
  }, [userLocation, theme, searchSubmitted, loading, viewMode, filteredTools]);

  // Initialize Google Map (for all views - both before and after search)
  useEffect(() => {
    const initializeMainMap = async () => {
      if (viewMode === 'map' && mapRef.current && userLocation) {
        try {
          // Load Google Maps script if not already loaded
          await loadGoogleMapsScript();

          if (!window.google || !window.google.maps) {
            return;
          }
      const map = new window.google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 12,
        styles: [
          // Hide all POI markers (shopping malls, restaurants, etc.)
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.attraction',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.government',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.park',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.place_of_worship',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.school',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.sports_complex',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit.station',
            stylers: [{ visibility: 'off' }]
          },
          // Dark theme styles when enabled
          ...(theme === 'dark' ? [
            { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
            { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
            { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
            { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
            { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
          ] : [])
        ]
      });

      // Add markers based on browse mode
      if (browseMode === 'shops') {
        // Show shops on map
        console.log('Browse mode is shops, shops data:', shops);
        const shopsWithCoordinates = (shops || []).filter((shop: any) => {
          const hasCoords = shop.coordinates && typeof shop.coordinates.lat === 'number' && typeof shop.coordinates.lng === 'number';
          if (!hasCoords) {
            console.log('Shop missing coordinates:', shop.id, shop.shopName);
          }
          return hasCoords;
        });

        console.log('Shops data available:', shops?.length, 'Shops with valid coordinates:', shopsWithCoordinates.length);
        shopsWithCoordinates.forEach(shop => {
          console.log('Adding shop marker:', shop.shopName, shop.coordinates);
        });

        shopsWithCoordinates.forEach((shop: any) => {
          // Create shop marker icon
          const markerIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="48" height="64" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 0C13.507 0 5 8.507 5 19C5 33.25 24 64 24 64S43 33.25 43 19C43 8.507 34.493 0 24 0Z" fill="#EC4899"/>
                <circle cx="24" cy="22" r="18" fill="white"/>
                <text x="24" y="28" text-anchor="middle" font-size="20" fill="#EC4899">🏪</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(48, 64),
            anchor: new window.google.maps.Point(24, 64),
          };

          const marker = new window.google.maps.Marker({
            position: shop.coordinates,
            map: map,
            title: shop.shopName,
            icon: markerIcon
          });

          const infoWindow = new window.google.maps.InfoWindow({
            disableAutoPan: false,
            content: `
              <style>
                .gm-style-iw-d {
                  overflow: visible !important;
                  padding: 0 !important;
                  max-height: none !important;
                }
                .gm-style-iw {
                  padding: 0 !important;
                  background: transparent !important;
                  max-height: none !important;
                }
                .gm-style-iw-c {
                  padding: 0 !important;
                  background: transparent !important;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                  max-height: none !important;
                }
                .gm-style-iw-tc {
                  display: none !important;
                }
                .gm-ui-hover-effect {
                  display: none !important;
                }
              </style>
              <div
                onclick="window.location.href='/shop-front/${shop.id}'"
                style="
                  width: 220px;
                  cursor: pointer;
                  border-radius: 12px;
                  background: rgba(0, 0, 0, 0.75);
                  backdrop-filter: blur(20px);
                  -webkit-backdrop-filter: blur(20px);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                  transition: all 0.3s;
                  padding: 12px;
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 40px rgba(0, 0, 0, 0.5)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.4)'"
              >
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                  <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.2);">🏪</div>
                  <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3); flex: 1;">${shop.shopName}</h3>
                </div>
                <p style="margin: 0 0 6px 0; font-size: 13px; color: rgba(255,255,255,0.9);">${shop.category}</p>
                <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                  <span style="color: #FBBF24;">⭐</span>
                  <span style="font-size: 13px; font-weight: 600; color: #fff;">${shop.rating?.toFixed(1) || 4.5}</span>
                  <span style="font-size: 11px; color: rgba(255,255,255,0.6);">(${shop.reviews || 0} reviews)</span>
                </div>
                <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 4px;">
                  <span>📍</span><span>${shop.location}</span>
                </p>
              </div>
            `
          });

          marker.addListener('click', () => {
            if (currentInfoWindowRef.current) {
              currentInfoWindowRef.current.close();
            }
            infoWindow.open(map, marker);
            currentInfoWindowRef.current = infoWindow;
          });
        });
      } else {
        // Show products on map
        const toolsToShow = searchSubmitted || selectedCategory !== 'All' ? filteredTools : filteredTools;

        // Filter out tools without valid coordinates
        const toolsWithCoordinates = toolsToShow.filter(tool =>
          tool.coordinates &&
          typeof tool.coordinates.lat === 'number' &&
          typeof tool.coordinates.lng === 'number'
        );

        console.log('Tools with coordinates for main map:', toolsWithCoordinates.length, 'out of', toolsToShow.length);

        // Set up global function for info window clicks
        window.viewListing = (toolId: string | number) => {
          console.log('viewListing called with:', toolId, 'Type:', typeof toolId);
          const tool = filteredTools.find(t => String(t.id) === String(toolId));
          console.log('Found tool:', tool);
          if (tool) {
            handleCardClick(tool);
          } else {
            console.error('Tool not found for ID:', toolId);
          }
        };

        toolsWithCoordinates.forEach((tool) => {
        // Create custom marker icon with category emoji
        const categoryEmoji = getCategoryIcon(tool);
        const markerIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="48" height="64" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 0C13.507 0 5 8.507 5 19C5 33.25 24 64 24 64S43 33.25 43 19C43 8.507 34.493 0 24 0Z" fill="#3B82F6"/>
              <circle cx="24" cy="22" r="18" fill="white"/>
              <text x="24" y="28" text-anchor="middle" font-size="20" fill="#3B82F6">${categoryEmoji}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(48, 64),
          anchor: new window.google.maps.Point(24, 64),
        };

        const marker = new window.google.maps.Marker({
          position: tool.coordinates,
          map: map,
          title: tool.name,
          icon: markerIcon
        });

        // Create info window with conditional image display
        const imageContent = tool.image && tool.image.startsWith('data:image/')
          ? `<img src="${tool.image}" alt="${tool.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; margin-right: 12px;">`
          : `<span style="font-size: 32px; margin-right: 12px;">${tool.image}</span>`;

        const infoWindow = new window.google.maps.InfoWindow({
          disableAutoPan: false,
          content: `
            <style>
              .gm-style-iw-d {
                overflow: visible !important;
                padding: 0 !important;
                max-height: none !important;
              }
              .gm-style-iw {
                padding: 0 !important;
                background: transparent !important;
                max-height: none !important;
              }
              .gm-style-iw-c {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                max-height: none !important;
              }
              .gm-style-iw-tc {
                display: none !important;
              }
              .gm-ui-hover-effect {
                display: none !important;
              }
            </style>
            <div
              onclick="console.log('Clicked tool ID:', '${tool.id}'); if(window.viewListing) { window.viewListing('${tool.id}'); }"
              style="
                width: 200px;
                cursor: pointer;
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                transition: all 0.3s;
                padding: 12px;
              "
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 40px rgba(0, 0, 0, 0.5)'"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.4)'"
            >
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                ${tool.image && tool.image.startsWith('data:image/')
                  ? `<img src="${tool.image}" alt="${tool.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.2);">`
                  : `<div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.2);">${tool.image}</div>`
                }
                <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3); flex: 1;">${tool.name}</h3>
              </div>
              <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #60A5FA;">$${tool.price}<span style="font-size: 12px; font-weight: 400; color: rgba(255,255,255,0.8);">/${tool.period}</span></p>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                <span style="color: #FBBF24;">⭐</span>
                <span style="font-size: 13px; font-weight: 600; color: #fff;">${tool.rating}</span>
                <span style="font-size: 11px; color: rgba(255,255,255,0.6);">(${tool.reviews})</span>
              </div>
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 4px;">
                <span>📍</span><span>${tool.location}</span>
              </p>
            </div>
          `
        });

        marker.addListener('click', () => {
          // Close previous info window if exists
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }
          infoWindow.open(map, marker);
          currentInfoWindowRef.current = infoWindow;
        });
        });
      }

      // Close info window when clicking on the map
      map.addListener('click', () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
          currentInfoWindowRef.current = null;
        }
      });

      // Add user location marker if available
      if (userLocation) {
        const userMarker = new window.google.maps.Marker({
          position: userLocation,
          map: map,
          title: 'Your Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 48 16 48S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#DC2626"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
                <circle cx="16" cy="16" r="4" fill="#DC2626"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 48),
            anchor: new window.google.maps.Point(16, 48),
          }
        });

        // Create simple info window for user location
        const userInfoWindow = new window.google.maps.InfoWindow({
          disableAutoPan: false,
          content: `
            <style>
              .gm-style-iw-d {
                overflow: visible !important;
                padding: 0 !important;
                max-height: none !important;
              }
              .gm-style-iw {
                padding: 0 !important;
                background: transparent !important;
                max-height: none !important;
              }
              .gm-style-iw-c {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                max-height: none !important;
              }
              .gm-style-iw-tc {
                display: none !important;
              }
              .gm-ui-hover-effect {
                display: none !important;
              }
            </style>
            <div
              style="
                width: auto;
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                padding: 12px 16px;
              "
            >
              <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">You are here!</h3>
            </div>
          `
        });

        userMarker.addListener('click', () => {
          // Close previous info window if exists
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }
          userInfoWindow.open(map, userMarker);
          currentInfoWindowRef.current = userInfoWindow;
        });
      }
        } catch (error) {
          console.error('Failed to load Google Maps for main map:', error);
        }
      }
    };

    initializeMainMap();
  }, [viewMode, userLocation, filteredTools, theme, searchSubmitted, selectedCategory, browseMode, shops]);

  // Global functions for map info windows
  useEffect(() => {
    window.rentTool = (toolId: number) => {
      const tool = filteredTools.find(t => String(t.id) === String(toolId));
      if (tool) {
        handleRentClick(tool);
      }
    };

    window.viewListing = (toolId: string | number) => {
      const tool = filteredTools.find(t => String(t.id) === String(toolId));
      if (tool) {
        handleCardClick(tool);
      }
    };

    return () => {
      (window as any).rentTool = undefined;
      (window as any).viewListing = undefined;
    };
  }, [filteredTools]);

  // Click outside to close suggestions and filters
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearchSubmitted(true);
    setShowSuggestions(false);

    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setLoading(true);
    setSearchSubmitted(true);

    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleCardClick = (tool: any) => {
    setNavigating(true);
    // Show loading animation for a short time before navigating
    setTimeout(() => {
      navigate(`/listing/${tool.id}`);
    }, 600);
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setLoading(true);
    setSearchSubmitted(true);
    setViewMode('list');

    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleRentClick = (tool: any) => {
    // Prevent users from renting their own listings
    if (currentUser && tool.ownerContact === currentUser.email) {
      setErrorMessage('You cannot rent your own listing.');
      setShowErrorModal(true);
      return;
    }

    setSelectedTool(tool);
    setShowRentModal(true);
    // Set default dates (today to tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setRentRequest({
      ...rentRequest,
      startDate: today.toISOString().split('T')[0],
      endDate: tomorrow.toISOString().split('T')[0]
    });
  };

  const handleRentRequestSubmit = async () => {
    console.log('=== RENT REQUEST SUBMIT CLICKED ===');
    console.log('Start Date:', rentRequest.startDate);
    console.log('End Date:', rentRequest.endDate);

    if (!selectedTool || !currentUser) {
      console.log('No selected tool or current user');
      return;
    }

    // Validation checks - MUST be outside try block
    if (!rentRequest.startDate || !rentRequest.endDate) {
      console.log('VALIDATION FAILED: Missing dates');
      setErrorMessage('Please select both start and end dates.');
      setShowErrorModal(true);
      return;
    }

    if (!rentRequest.startTime || !rentRequest.endTime) {
      setErrorMessage('Please select both start and end times.');
      setShowErrorModal(true);
      return;
    }

    const startDate = new Date(rentRequest.startDate + 'T00:00:00');
    const endDate = new Date(rentRequest.endDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Date comparison:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      today: today.toISOString(),
      endBeforeStart: endDate < startDate
    });

    // Check if dates are in the past
    if (startDate < today) {
      console.log('VALIDATION FAILED: Start date in past');
      setErrorMessage('Start date cannot be in the past. Please select a future date.');
      setShowErrorModal(true);
      return;
    }

    // Check if end date is before start date
    if (endDate < startDate) {
      console.log('VALIDATION FAILED: End date before start date');
      setErrorMessage('End date cannot be before start date. Please check your dates.');
      setShowErrorModal(true);
      return;
    }

    // Check if same day rental (might want to allow this)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) {
      setErrorMessage('Rental period must be at least 1 day. Please select different dates.');
      setShowErrorModal(true);
      return;
    }

    try {
      // Calculate total cost (days already calculated above)
      const totalCost = days * selectedTool.price;

      // Create rental request and add to context
      const rentalRequestData = {
        toolId: String(selectedTool.id),
        toolName: selectedTool.name,
        toolImage: selectedTool.image,
        renterName: currentUser.displayName || 'Anonymous',
        renterEmail: currentUser.email || '',
        ownerEmail: selectedTool.ownerContact,
        ownerName: selectedTool.owner,
        startDate: rentRequest.startDate,
        endDate: rentRequest.endDate,
        startTime: rentRequest.startTime,
        endTime: rentRequest.endTime,
        message: rentRequest.message,
        totalCost: totalCost,
        status: 'pending' as const,
        location: selectedTool.location
      };

      // This will throw an error if dates conflict
      await addRentalRequest(rentalRequestData);

      console.log('Rental request sent:', rentalRequestData);

      // Send email notifications
      try {
        console.log('About to send emails...');
        console.log('Owner email:', selectedTool.ownerContact);
        console.log('Renter email:', currentUser?.email);

        // Send email to owner about new rental request
        const ownerEmailResult = await emailService.sendRentalRequestToOwner({
          ownerName: selectedTool.owner,
          ownerEmail: selectedTool.ownerContact,
          renterName: currentUser?.displayName || currentUser?.email || 'User',
          renterEmail: currentUser?.email || '',
          itemName: selectedTool.name,
          startDate: rentRequest.startDate,
          endDate: rentRequest.endDate,
          totalCost: totalCost,
          message: rentRequest.message
        });
        console.log('Owner email result:', ownerEmailResult);

        // Wait 2 seconds between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Send confirmation email to renter
        const renterEmailResult = await emailService.sendRentalRequestConfirmationToRenter({
          ownerName: selectedTool.owner,
          ownerEmail: selectedTool.ownerContact,
          renterName: currentUser?.displayName || currentUser?.email || 'User',
          renterEmail: currentUser?.email || '',
          itemName: selectedTool.name,
          startDate: rentRequest.startDate,
          endDate: rentRequest.endDate,
          totalCost: totalCost
        });
        console.log('Renter email result:', renterEmailResult);

        console.log('Email notifications sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Continue with the flow even if email fails - don't alert the user
        console.warn('Continuing despite email error (might be rate limited)');
      }

      // Store success data and show success modal
      setSuccessData({
        toolName: selectedTool.name,
        ownerName: selectedTool.owner,
        startDate: rentRequest.startDate,
        endDate: rentRequest.endDate,
        startTime: rentRequest.startTime,
        endTime: rentRequest.endTime,
        totalCost: totalCost
      });

      // Close rent modal and show success modal
      setShowRentModal(false);
      setShowSuccessModal(true);

      // Reset form data
      setSelectedTool(null);
      setRentRequest({
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        message: ''
      });
    } catch (error) {
      console.error('Error sending rental request:', error);

      // Check if it's a conflict error
      if (error instanceof Error && error.message.includes('conflict')) {
        setErrorMessage('This item is already rented during the selected dates. Please choose different dates.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred while processing your request. Please try again.');
      }

      setShowErrorModal(true);
      setShowRentModal(false);
    }
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Browse Products</h1>
          <p className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Find the perfect tool for your project
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar with Suggestions */}
            <div className="flex-1 relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-0 shadow-sm transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 text-white placeholder-gray-400'
                      : 'bg-white/80 text-gray-900 placeholder-gray-500 backdrop-blur-sm'
                  }`}
                />
              </form>

              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border-0 shadow-lg backdrop-blur-sm z-10 ${
                  theme === 'dark'
                    ? 'bg-gray-800/90'
                    : 'bg-white/90'
                }`}>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-4 py-3 transition-all first:rounded-t-2xl last:rounded-b-2xl ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700/50 text-white'
                          : 'hover:bg-gray-100/50 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span>{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Browse Mode Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setBrowseMode('products')}
                className={`px-4 py-3 rounded-xl border-0 shadow-sm transition-all text-sm font-medium ${
                  browseMode === 'products'
                    ? 'bg-purple-900 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 hover:bg-gray-800/80 text-white'
                    : 'bg-white/80 hover:bg-white/90 text-gray-900 backdrop-blur-sm'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setBrowseMode('shops')}
                className={`px-4 py-3 rounded-xl border-0 shadow-sm transition-all text-sm font-medium ${
                  browseMode === 'shops'
                    ? 'bg-purple-900 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 hover:bg-gray-800/80 text-white'
                    : 'bg-white/80 hover:bg-white/90 text-gray-900 backdrop-blur-sm'
                }`}
              >
                Shops
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-0 shadow-sm transition-all ${
                  viewMode === 'list'
                    ? 'bg-purple-900 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 hover:bg-gray-800/80 text-white'
                    : 'bg-white/80 hover:bg-white/90 text-gray-900 backdrop-blur-sm'
                }`}
              >
                <List className="w-5 h-5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-0 shadow-sm transition-all ${
                  viewMode === 'map'
                    ? 'bg-purple-900 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 hover:bg-gray-800/80 text-white'
                    : 'bg-white/80 hover:bg-white/90 text-gray-900 backdrop-blur-sm'
                }`}
              >
                <MapIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-0 shadow-sm transition-all ${
                  showFilters
                    ? 'bg-purple-900 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 hover:bg-gray-800/80 text-white'
                    : 'bg-white/80 hover:bg-white/90 text-gray-900 backdrop-blur-sm'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filter</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showFilters && (
                <div className={`absolute top-full right-0 mt-2 w-72 rounded-2xl border shadow-xl backdrop-blur-md z-20 ${
                  theme === 'dark'
                    ? 'bg-gray-800/95 border-gray-700'
                    : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Filters</h3>
                      <button
                        onClick={() => setShowFilters(false)}
                        className={`p-1 rounded-full transition-colors ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">Price Range (SGD)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Min</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
                            className={`w-full px-3 py-2.5 rounded-xl border-0 text-sm transition-all focus:ring-2 focus:ring-purple-300 ${
                              theme === 'dark'
                                ? 'bg-gray-700/50 text-white placeholder-gray-400'
                                : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Max</label>
                          <input
                            type="number"
                            placeholder="100"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 100})}
                            className={`w-full px-3 py-2.5 rounded-xl border-0 text-sm transition-all focus:ring-2 focus:ring-purple-300 ${
                              theme === 'dark'
                                ? 'bg-gray-700/50 text-white placeholder-gray-400'
                                : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-xl border-0 text-sm transition-all focus:ring-2 focus:ring-purple-300 ${
                          theme === 'dark'
                            ? 'bg-gray-700/50 text-white'
                            : 'bg-gray-50 text-gray-900'
                        }`}
                      >
                        <option value="relevance">Most Relevant</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                        <option value="newest">Newest First</option>
                      </select>
                    </div>

                    {/* Distance */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">Distance</label>
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={distance}
                          onChange={(e) => setDistance(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(distance / 50) * 100}%, ${theme === 'dark' ? '#374151' : '#E5E7EB'} ${(distance / 50) * 100}%, ${theme === 'dark' ? '#374151' : '#E5E7EB'} 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1 km</span>
                          <span className="font-semibold text-purple-300">{distance} km</span>
                          <span>50 km</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-3 border-t border-gray-200/20">
                      <button
                        onClick={() => {
                          setPriceRange({ min: 0, max: 100 });
                          setSortBy('relevance');
                          setDistance(50);
                        }}
                        className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="flex-1 py-2.5 px-4 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-purple-900 text-white shadow-lg'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800/80'
                    : 'bg-white/80 text-gray-700 hover:bg-white/90 backdrop-blur-sm'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

        </div>

        {/* Loading Animation */}
        {loading && (
          <div className={`p-8 rounded-lg mb-8 ${
            theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-300"></div>
              <span className="text-lg">Loading tools...</span>
            </div>
          </div>
        )}

        {/* Discover Tools Near You Map - Only show in list view and when not searched */}
        {!searchSubmitted && !loading && viewMode === 'list' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-300" />
                <h2 className="text-lg md:text-xl font-semibold">Discover tools near you!</h2>
              </div>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-1 text-sm ${theme === 'dark' ? 'text-purple-200 hover:text-purple-200' : 'text-purple-300 hover:text-purple-300'}`}
              >
                <span>Full map view</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className={`h-96 rounded-2xl overflow-hidden shadow-lg ${
              theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <div ref={discoverMapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
            </div>
          </div>
        )}

        {/* Featured Categories - Show in both list and map view when not searched */}
        {!searchSubmitted && !loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Popular Categories</h2>
              {viewMode === 'map' && (
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center space-x-1 text-sm ${theme === 'dark' ? 'text-purple-200 hover:text-purple-200' : 'text-purple-300 hover:text-purple-300'}`}
                >
                  <span>See list view</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`p-4 rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all text-center group ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 hover:bg-gray-800/80'
                      : 'bg-white/80 hover:bg-white/90 backdrop-blur-sm'
                  }`}
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {category.emoji}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {category.count} items
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top Rated Tools - Only show in list view when not searched */}
        {!searchSubmitted && !loading && topRatedTools.length > 0 && viewMode === 'list' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                <h2 className="text-lg md:text-xl font-semibold">Top Rated Tools</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setLoading(true);
                  setSearchSubmitted(true);
                  setViewMode('list');
                  setTimeout(() => setLoading(false), 800);
                }}
                className={`flex items-center space-x-1 text-sm ${theme === 'dark' ? 'text-purple-200 hover:text-purple-200' : 'text-purple-300 hover:text-purple-300'}`}
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {topRatedTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleCardClick(tool)}
                  className={`rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 hover:bg-gray-800/80'
                      : 'bg-white/80 hover:bg-white/90 backdrop-blur-sm'
                  }`}
                >
                  {/* Tool Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative">
                    {renderToolImage(tool, "text-4xl")}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(String(tool.id));
                      }}
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110"
                      title={isFavorited(String(tool.id)) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className={`w-3 h-3 transition-colors ${
                          isFavorited(String(tool.id))
                            ? 'text-pink-500 fill-current'
                            : 'text-gray-400 hover:text-pink-500'
                        }`}
                      />
                    </button>
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{tool.rating}</span>
                    </div>
                  </div>

                  {/* Tool Info */}
                  <div className="p-3 space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2">{tool.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-purple-300">${tool.price}/{tool.period}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {tool.reviews} reviews
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Tools - Only show in list view when not searched */}
        {!searchSubmitted && !loading && trendingTools.length > 0 && viewMode === 'list' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                <h2 className="text-lg md:text-xl font-semibold">Trending Now</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setLoading(true);
                  setSearchSubmitted(true);
                  setViewMode('list');
                  setTimeout(() => setLoading(false), 800);
                }}
                className={`flex items-center space-x-1 text-sm ${theme === 'dark' ? 'text-purple-200 hover:text-purple-200' : 'text-purple-300 hover:text-purple-300'}`}
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {trendingTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleCardClick(tool)}
                  className={`rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 hover:bg-gray-800/80'
                      : 'bg-white/80 hover:bg-white/90 backdrop-blur-sm'
                  }`}
                >
                  {/* Tool Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative">
                    {renderToolImage(tool, "text-4xl")}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(String(tool.id));
                      }}
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110"
                      title={isFavorited(String(tool.id)) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className={`w-3 h-3 transition-colors ${
                          isFavorited(String(tool.id))
                            ? 'text-pink-500 fill-current'
                            : 'text-gray-400 hover:text-pink-500'
                        }`}
                      />
                    </button>
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Hot</span>
                    </div>
                  </div>

                  {/* Tool Info */}
                  <div className="p-3 space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2">{tool.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-purple-300">${tool.price}/{tool.period}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs">{tool.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area - Shows for both initial state and search results */}
        {!loading && (
          <div className="mb-8">
            {/* Header for filtered results */}
            {(searchSubmitted || selectedCategory !== 'All') && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">
                    {searchTerm ? `Search Results for "${searchTerm}"` : `${selectedCategory} Tools`}
                  </h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSearchSubmitted(false);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 hover:bg-gray-800/80 text-white'
                      : 'bg-white/80 hover:bg-white/90 text-gray-900 backdrop-blur-sm'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            )}

            {/* Content based on browse mode and view */}
            {browseMode === 'shops' ? (
              // SHOP BROWSE MODE
              viewMode === 'map' ? (
                // Shop Map View
                <div className={`h-96 rounded-xl overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
                }`}>
                  <div className="w-full h-full flex items-center justify-center">
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Map view coming soon for shops
                    </p>
                  </div>
                </div>
              ) : (
                // Shop List View
                <div className="space-y-4">
                  {(searchTerm || searchSubmitted) ? (
                    // Filtered shops
                    shops?.filter((shop) =>
                      shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      shop.category.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shops?.filter((shop) =>
                          shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shop.category.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((shop) => (
                          <div
                            key={shop.id}
                            onClick={() => navigate(`/shop-front/${shop.id}`)}
                            className={`rounded-xl overflow-hidden cursor-pointer transform transition-all hover:scale-105 shadow-lg ${
                              theme === 'dark'
                                ? 'bg-gray-800/60'
                                : 'bg-white/80 backdrop-blur-sm'
                            }`}
                          >
                            <div className={`h-32 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-purple-400 to-blue-500'}`}></div>
                            <div className="p-4">
                              <h3 className="text-lg font-bold mb-1">{shop.shopName}</h3>
                              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {shop.category}
                              </p>
                              <div className="flex items-center gap-1 mb-4">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{shop.rating || 4.5}</span>
                                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
                                  ({shop.reviews || 0})
                                </span>
                              </div>
                              {shop.location && (
                                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  📍 {shop.location}
                                </p>
                              )}
                              <button className={`w-full py-2 rounded-lg font-medium transition-colors ${
                                theme === 'dark'
                                  ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              }`}>
                                Visit Shop
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
                          No shops found matching "{searchTerm}"
                        </p>
                      </div>
                    )
                  ) : (
                    // Show all shops
                    shops && shops.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shops.map((shop) => (
                          <div
                            key={shop.id}
                            onClick={() => navigate(`/shop-front/${shop.id}`)}
                            className={`rounded-xl overflow-hidden cursor-pointer transform transition-all hover:scale-105 shadow-lg ${
                              theme === 'dark'
                                ? 'bg-gray-800/60'
                                : 'bg-white/80 backdrop-blur-sm'
                            }`}
                          >
                            <div className={`h-32 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-purple-400 to-blue-500'}`}></div>
                            <div className="p-4">
                              <h3 className="text-lg font-bold mb-1">{shop.shopName}</h3>
                              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {shop.category}
                              </p>
                              <div className="flex items-center gap-1 mb-4">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{shop.rating || 4.5}</span>
                                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
                                  ({shop.reviews || 0})
                                </span>
                              </div>
                              {shop.location && (
                                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  📍 {shop.location}
                                </p>
                              )}
                              <button className={`w-full py-2 rounded-lg font-medium transition-colors ${
                                theme === 'dark'
                                  ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              }`}>
                                Visit Shop
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
                          No shops available yet
                        </p>
                      </div>
                    )
                  )}
                </div>
              )
            ) : (
              // PRODUCT BROWSE MODE
              viewMode === 'map' ? (
                /* Map View - Show map for all states */
                <div className={`h-screen rounded-xl overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
                }`}>
                  <div ref={mapRef} className="w-full h-full" style={{ minHeight: '600px' }} />
                </div>
              ) : (
                /* List View - Show tools only when searched/filtered */
                (searchSubmitted || selectedCategory !== 'All') && (
                filteredTools.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTools.map((tool) => (
                      <div
                        key={tool.id}
                        onClick={() => handleCardClick(tool)}
                        className={`rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group ${
                          theme === 'dark'
                            ? 'bg-gray-800/60 hover:bg-gray-800/80'
                            : 'bg-white/80 hover:bg-white/90 backdrop-blur-sm'
                        }`}
                      >
                        {/* Tool Image */}
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative">
                          {renderToolImage(tool, "text-6xl")}
                          <div className="absolute top-3 right-3 bg-purple-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{tool.rating}</span>
                          </div>
                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(String(tool.id));
                            }}
                            className="absolute top-3 left-3 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110"
                            title={isFavorited(String(tool.id)) ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                isFavorited(String(tool.id))
                                  ? 'text-pink-500 fill-current'
                                  : 'text-gray-400 hover:text-pink-500'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Tool Info */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-2">{tool.name}</h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              from <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (tool.shopId) {
                                    const shop = shops.find(s => s.id === tool.shopId);
                                    if (shop) {
                                      navigate(`/shop-front/${tool.shopId}`);
                                    }
                                  }
                                }}
                                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline font-medium"
                              >
                                {(() => {
                                  const shop = shops.find(s => s.id === tool.shopId);
                                  return shop ? shop.shopName : tool.owner;
                                })()}
                              </button>
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xl font-bold text-purple-300">${tool.price}</span>
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                /{tool.period}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{tool.rating}</span>
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                ({tool.reviews})
                              </span>
                            </div>
                          </div>

                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            📍 {tool.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 rounded-2xl ${
                    theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
                  }`}>
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">No tools found</h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {searchTerm
                        ? `No tools match your search for "${searchTerm}"`
                        : `No tools found in the ${selectedCategory} category`
                      }
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('All');
                        setSearchSubmitted(false);
                      }}
                      className="mt-4 px-6 py-3 bg-purple-900 hover:bg-purple-950 text-white rounded-full font-medium transition-colors"
                    >
                      Browse All Tools
                    </button>
                  </div>
                )
              )
            )
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* Rent Request Modal */}
      {showRentModal && selectedTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg border-0 shadow-xl ${
            theme === 'dark'
              ? 'bg-gray-800'
              : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/20">
              <h3 className="text-lg font-semibold">Request to Rent</h3>
              <button
                onClick={() => setShowRentModal(false)}
                className={`p-2 rounded-xl transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Tool Info */}
              <div className="flex items-center space-x-4">
                {renderToolImage(selectedTool, "text-3xl")}
                <div>
                  <h4 className="font-semibold">{selectedTool.name}</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    by <button
                      onClick={() => navigate(`/profile/${encodeURIComponent(selectedTool.ownerContact)}`)}
                      className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                    >
                      {selectedTool.owner}
                    </button> • {selectedTool.location}
                  </p>
                  <p className="text-lg font-bold text-purple-300">
                    ${selectedTool.price}/{selectedTool.period}
                  </p>
                </div>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={rentRequest.startDate}
                    onChange={(e) => setRentRequest({...rentRequest, startDate: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={rentRequest.endDate}
                    onChange={(e) => setRentRequest({...rentRequest, endDate: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={rentRequest.startTime}
                    onChange={(e) => setRentRequest({...rentRequest, startTime: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={rentRequest.endTime}
                    onChange={(e) => setRentRequest({...rentRequest, endTime: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
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
              {rentRequest.startDate && rentRequest.endDate && (
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Cost:</span>
                    <span className="font-bold text-lg text-purple-300">
                      ${Math.ceil((new Date(rentRequest.endDate).getTime() - new Date(rentRequest.startDate).getTime()) / (1000 * 60 * 60 * 24)) * selectedTool.price}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Math.ceil((new Date(rentRequest.endDate).getTime() - new Date(rentRequest.startDate).getTime()) / (1000 * 60 * 60 * 24))} day(s) × ${selectedTool.price}/{selectedTool.period}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200/20">
              <button
                onClick={() => setShowRentModal(false)}
                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleRentRequestSubmit}
                disabled={!rentRequest.startDate || !rentRequest.endDate}
                className="flex-1 py-2 px-4 bg-purple-900 hover:bg-purple-950 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
            theme === 'dark'
              ? 'bg-gray-800'
              : 'bg-white'
          }`}>
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Request Sent Successfully!</h2>
              <p className="text-green-100">Your rental request has been sent to the tool owner</p>
            </div>

            {/* Success Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Request Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-300" />
                  <span>Request Summary</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tool:</span>
                    <span className="font-medium">{successData.toolName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Owner:</span>
                    <span className="font-medium">{successData.ownerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" />
                      <span>Dates:</span>
                    </span>
                    <span className="font-medium">{successData.startDate} to {successData.endDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock className="w-4 h-4" />
                      <span>Time:</span>
                    </span>
                    <span className="font-medium">{successData.startTime} - {successData.endTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <DollarSign className="w-4 h-4" />
                      <span>Total Cost:</span>
                    </span>
                    <span className="font-bold text-lg text-green-500">${successData.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className={`p-4 rounded-xl ${
                theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h4 className="font-semibold text-purple-300 mb-2">What happens next?</h4>
                <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                  <li>• The owner will be notified via email</li>
                  <li>• They can approve or decline your request</li>
                  <li>• You'll receive a notification with their decision</li>
                  <li>• Track your request in "My Rentals"</li>
                </ul>
              </div>
            </div>

            {/* Success Footer */}
            <div className="px-6 pb-6 flex space-x-3">
              <button
                onClick={() => navigate('/my-rentals')}
                className="flex-1 py-3 px-4 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-medium transition-colors"
              >
                View My Rentals
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
            theme === 'dark'
              ? 'bg-gray-800'
              : 'bg-white'
          }`}>
            {/* Error Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Unable to Process Request</h2>
              <p className="text-red-100">Please check the details and try again</p>
            </div>

            {/* Error Content */}
            <div className="px-6 py-6">
              <div className={`p-4 rounded-xl ${
                theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-center ${theme === 'dark' ? 'text-red-200' : 'text-red-700'}`}>
                  {errorMessage}
                </p>
              </div>
            </div>

            {/* Error Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Loading Overlay */}
      {navigating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className={`p-8 rounded-2xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-300"></div>
              <p className="text-lg font-medium">Loading listing...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
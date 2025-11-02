import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import { useShop } from '../contexts/ShopContext';
import { TrendingUp, TrendingDown, Lightbulb, DollarSign, Users, Star, BarChart3, Target, ShoppingCart, Clock, Award, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { generateContent } from '../services/gemini';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: string;
  action: string;
}

interface CompetitorShop {
  id: string;
  name: string;
  category: string;
  coordinates: { lat: number; lng: number };
  avgRating: number;
  priceRange: string;
  popularProducts: string[];
  workshopAvailability: string;
  turnaroundTime: string;
  socialReach: string;
  customizationLevel: string;
}

interface TradingChartProps {
  data: Array<{ date: string; revenue: number; orders: number }>;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  theme: string;
}

function TradingChart({ data, selectedPeriod, onPeriodChange, theme }: TradingChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useState<SVGSVGElement | null>(null)[0];

  const periods = [
    { key: 'week', label: '1W' },
    { key: 'month', label: '1M' },
    { key: 'year', label: '1Y' }
  ];

  // Calculate chart dimensions and scales
  const padding = { top: 40, right: 20, bottom: 40, left: 60 };
  const chartWidth = 1000;
  const chartHeight = 400;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxRevenue = Math.max(...data.map(d => d.revenue)) * 1.1;
  const minRevenue = Math.min(...data.map(d => d.revenue)) * 0.9;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth;
  const getY = (value: number) => padding.top + innerHeight - ((value - minRevenue) / (maxRevenue - minRevenue)) * innerHeight;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest data point
    let closestIndex = 0;
    let closestDistance = Infinity;

    data.forEach((_, i) => {
      const pointX = getX(i);
      const distance = Math.abs(x - pointX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    if (closestDistance < 50) {
      setHoveredIndex(closestIndex);
      setMousePosition({ x: getX(closestIndex), y: getY(data[closestIndex].revenue) });
    } else {
      setHoveredIndex(null);
      setMousePosition(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setMousePosition(null);
  };

  // Generate path data for the line
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.revenue)}`).join(' ');

  return (
    <div className="w-full">
      {/* Period selector pills */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Revenue Trend</h2>
        <div className="flex gap-2 bg-[#0a1018] rounded-lg p-1 border border-[#1a2530]">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => onPeriodChange(period.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === period.key
                  ? 'bg-[#1a2530] text-[#23ff4d] shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #050b11 0%, #0f1724 100%)' }}>
        <div className="p-6">
          {/* Accessibility label */}
          <div className="sr-only" role="status" aria-live="polite">
            {hoveredIndex !== null && `${data[hoveredIndex].date}: $${data[hoveredIndex].revenue}`}
          </div>

          {/* SVG Chart */}
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair"
            role="img"
            aria-label="Revenue trend chart"
          >
            {/* Dotted midline */}
            <line
              x1={padding.left}
              y1={padding.top + innerHeight / 2}
              x2={chartWidth - padding.right}
              y2={padding.top + innerHeight / 2}
              stroke="#1a2530"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Revenue line */}
            <path
              d={linePath}
              fill="none"
              stroke="#23ff4d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const value = minRevenue + (maxRevenue - minRevenue) * ratio;
              const y = padding.top + innerHeight - ratio * innerHeight;
              return (
                <text
                  key={i}
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                  dominantBaseline="middle"
                >
                  ${Math.round(value)}
                </text>
              );
            })}

            {/* X-axis labels - show subset based on data length */}
            {data.map((d, i) => {
              const showLabel = data.length <= 12 || i % Math.ceil(data.length / 12) === 0;
              if (!showLabel) return null;
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {d.date}
                </text>
              );
            })}

            {/* Hover crosshair and dot */}
            {hoveredIndex !== null && mousePosition && (
              <g>
                {/* Vertical crosshair */}
                <line
                  x1={mousePosition.x}
                  y1={padding.top}
                  x2={mousePosition.x}
                  y2={chartHeight - padding.bottom}
                  stroke="#23ff4d"
                  strokeWidth="1"
                  opacity="0.3"
                />

                {/* Bright dot at data point */}
                <circle
                  cx={mousePosition.x}
                  cy={mousePosition.y}
                  r="6"
                  fill="#23ff4d"
                  stroke="#050b11"
                  strokeWidth="2"
                />

                {/* Floating label */}
                <g transform={`translate(${mousePosition.x}, ${padding.top - 10})`}>
                  <rect
                    x="-60"
                    y="-20"
                    width="120"
                    height="30"
                    rx="4"
                    fill="#1a2530"
                    stroke="#23ff4d"
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    y="-10"
                    className="text-xs font-medium fill-gray-200"
                  >
                    {data[hoveredIndex].date}
                  </text>
                  <text
                    textAnchor="middle"
                    y="3"
                    className="text-xs font-bold"
                    style={{ fill: '#23ff4d' }}
                  >
                    ${data[hoveredIndex].revenue.toFixed(0)}
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

// Competitor data constants - Creative & Craft businesses near Bishan Street 22
const ALICE_LOCATION = { lat: 1.3579, lng: 103.8456, address: 'Bishan Street 22, Singapore' };

// Alice's shop profile for AI comparisons
const ALICE_SHOP_PROFILE = {
  name: "Alice's Home Pizza",
  avgRating: 4.8,
  priceRange: "$$",
  workshopsOffered: "Weekend pizza-making workshops available",
  customizationLevel: "High - Custom toppings and dietary options",
  turnaroundTime: "30-45 minutes for fresh orders",
  socialReach: "~2.5K Instagram followers"
};

const COMPETITOR_SHOPS: CompetitorShop[] = [
  {
    id: 'C1',
    name: 'Bishan Creative Studio',
    category: 'Art & Design Workshop',
    coordinates: { lat: 1.3602, lng: 103.8488 },
    avgRating: 4.6,
    priceRange: '$$$',
    popularProducts: ['Watercolor Classes', 'Digital Art Sessions', 'Custom Portrait Commissions'],
    workshopAvailability: 'Daily classes, weekend intensives',
    turnaroundTime: '2-3 weeks for custom work',
    socialReach: '~8.5K followers',
    customizationLevel: 'Very High - Personalized art instruction'
  },
  {
    id: 'C2',
    name: 'Crafty Corner Supply',
    category: 'Craft Supply Store',
    coordinates: { lat: 1.3548, lng: 103.8520 },
    avgRating: 4.3,
    priceRange: '$$',
    popularProducts: ['DIY Craft Kits', 'Scrapbooking Materials', 'Beading Supplies'],
    workshopAvailability: 'Monthly beginner workshops',
    turnaroundTime: 'Immediate for in-stock items',
    socialReach: '~3.2K followers',
    customizationLevel: 'Medium - Pre-packaged kits with some customization'
  },
  {
    id: 'C3',
    name: 'The Pottery Place',
    category: 'Ceramic Workshop',
    coordinates: { lat: 1.3612, lng: 103.8432 },
    avgRating: 4.8,
    priceRange: '$$$',
    popularProducts: ['Pottery Wheel Classes', 'Hand-Building Sessions', 'Custom Dinnerware'],
    workshopAvailability: 'Wed-Sun, walk-ins welcome',
    turnaroundTime: '3-4 weeks (firing & glazing)',
    socialReach: '~12K followers',
    customizationLevel: 'High - Fully customizable ceramics'
  },
  {
    id: 'C4',
    name: 'Artisan Threads Studio',
    category: 'Textile & Sewing',
    coordinates: { lat: 1.3545, lng: 103.8410 },
    avgRating: 4.5,
    priceRange: '$$-$$$',
    popularProducts: ['Sewing Classes', 'Custom Alterations', 'Embroidery Services'],
    workshopAvailability: 'Weekday evenings, Saturdays',
    turnaroundTime: '1-2 weeks for alterations',
    socialReach: '~5.8K followers',
    customizationLevel: 'Very High - Bespoke tailoring & design'
  },
  {
    id: 'C5',
    name: 'Makers Market Collective',
    category: 'Multi-Craft Space',
    coordinates: { lat: 1.3590, lng: 103.8505 },
    avgRating: 4.4,
    priceRange: '$$',
    popularProducts: ['Pop-up Markets', 'Collaborative Workshops', 'Vendor Spaces'],
    workshopAvailability: 'Rotating schedule, weekend events',
    turnaroundTime: 'Varies by vendor',
    socialReach: '~15K followers',
    customizationLevel: 'Medium - Community-driven offerings'
  },
  {
    id: 'C6',
    name: 'Sketched Stories Gallery',
    category: 'Illustration & Gifts',
    coordinates: { lat: 1.3565, lng: 103.8475 },
    avgRating: 4.7,
    priceRange: '$$-$$$',
    popularProducts: ['Custom Illustrations', 'Personalized Stationery', 'Art Prints'],
    workshopAvailability: 'Bi-weekly drawing sessions',
    turnaroundTime: '1-2 weeks for custom orders',
    socialReach: '~6.7K followers',
    customizationLevel: 'High - Personalized artwork & gifts'
  }
];

// Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * CompetitorComparisonModal Component
 *
 * AI-powered competitor analysis modal using Gemini API
 *
 * Requirements:
 * - VITE_GEMINI_API_KEY environment variable must be set
 * - Generates structured comparison between Alice's shop and selected competitor
 * - Caches responses to avoid duplicate API calls
 */
interface CompetitorComparisonModalProps {
  competitor: CompetitorShop | null;
  isOpen: boolean;
  onClose: () => void;
  theme: string;
}

function CompetitorComparisonModal({ competitor, isOpen, onClose, theme }: CompetitorComparisonModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comparison, setComparison] = useState<{
    strengths: string[];
    challenges: string[];
    suggestedActions: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const comparisonCacheRef = useRef<Map<string, {
    strengths: string[];
    challenges: string[];
    suggestedActions: string[];
  }>>(new Map());

  useEffect(() => {
    if (!isOpen || !competitor) {
      return;
    }

    const fetchComparison = async () => {
      // Check cache first
      if (comparisonCacheRef.current.has(competitor.id)) {
        setComparison(comparisonCacheRef.current.get(competitor.id));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const distance = calculateDistance(
          ALICE_LOCATION.lat,
          ALICE_LOCATION.lng,
          competitor.coordinates.lat,
          competitor.coordinates.lng
        );

        const prompt = `You are a business intelligence analyst. Compare these two creative businesses and provide strategic insights.

**Alice's Home Pizza (Your Business)**
- Average Rating: ${ALICE_SHOP_PROFILE.avgRating}⭐
- Price Range: ${ALICE_SHOP_PROFILE.priceRange}
- Workshops: ${ALICE_SHOP_PROFILE.workshopsOffered}
- Customization: ${ALICE_SHOP_PROFILE.customizationLevel}
- Turnaround: ${ALICE_SHOP_PROFILE.turnaroundTime}
- Social Reach: ${ALICE_SHOP_PROFILE.socialReach}
- Products: Pizza (Hawaiian Pepperoni, Truffle Mushroom), Sides (Wings, Fries)

**${competitor.name} (Competitor - ${distance.toFixed(2)}km away)**
- Category: ${competitor.category}
- Average Rating: ${competitor.avgRating}⭐
- Price Range: ${competitor.priceRange}
- Popular Products: ${competitor.popularProducts.join(', ')}
- Workshops: ${competitor.workshopAvailability}
- Customization: ${competitor.customizationLevel}
- Turnaround: ${competitor.turnaroundTime}
- Social Reach: ${competitor.socialReach}

Provide a structured comparison in JSON format (return ONLY the JSON object, no markdown):
{
  "strengths": ["3-4 bullet points on Alice's competitive advantages"],
  "challenges": ["3-4 bullet points on areas where competitor is stronger"],
  "suggestedActions": ["3-4 specific, actionable recommendations for Alice"]
}

Focus on practical insights for a home-based food business competing in the creative Bishan market.`;

        const aiResponse = await generateContent(prompt);

        // Parse JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setComparison(parsed);
          comparisonCacheRef.current.set(competitor.id, parsed);
        } else {
          throw new Error('Failed to parse AI response');
        }
      } catch (err) {
        console.error('Error fetching competitor comparison:', err);
        setError('Unable to generate comparison. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [competitor, isOpen]);

  if (!isOpen || !competitor) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="competitor-modal-title"
    >
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
          theme === 'dark'
            ? 'bg-gray-900 border border-gray-800'
            : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 p-6 border-b ${
          theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 id="competitor-modal-title" className="text-2xl font-bold mb-2">
                Competitor Snapshot
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-1 rounded ${
                  theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                }`}>
                  {competitor.id}
                </span>
                <span className="font-semibold">{competitor.name}</span>
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                  {competitor.category}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Rating
              </div>
              <div className="text-lg font-bold">{competitor.avgRating}⭐</div>
            </div>
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Price
              </div>
              <div className="text-lg font-bold">{competitor.priceRange}</div>
            </div>
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Social
              </div>
              <div className="text-lg font-bold">{competitor.socialReach}</div>
            </div>
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Distance
              </div>
              <div className="text-lg font-bold">
                {calculateDistance(
                  ALICE_LOCATION.lat,
                  ALICE_LOCATION.lng,
                  competitor.coordinates.lat,
                  competitor.coordinates.lng
                ).toFixed(2)} km
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {isLoading && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Generating AI comparison...
              </p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Powered by Gemini
              </p>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-red-900/20 border-red-800 text-red-400'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {!isLoading && !error && comparison && (
            <div className="space-y-6">
              {/* Strengths */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Your Strengths
                </h3>
                <ul className="space-y-2">
                  {comparison.strengths.map((strength, idx) => (
                    <li
                      key={idx}
                      className={`p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-200'
                      }`}
                    >
                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                        {strength}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Challenges */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-orange-500">⚠</span> Competitive Challenges
                </h3>
                <ul className="space-y-2">
                  {comparison.challenges.map((challenge, idx) => (
                    <li
                      key={idx}
                      className={`p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-orange-900/20 border border-orange-800/50' : 'bg-orange-50 border border-orange-200'
                      }`}
                    >
                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                        {challenge}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-blue-500">→</span> Suggested Actions
                </h3>
                <ul className="space-y-2">
                  {comparison.suggestedActions.map((action, idx) => (
                    <li
                      key={idx}
                      className={`p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                        {action}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * NearbyCompetitorsMap Component
 *
 * Dynamically loads Google Maps JavaScript API and renders a custom map
 * centered on Bishan Street 22 with custom markers for Alice's shop and competitors.
 *
 * Requirements:
 * - VITE_GOOGLE_MAPS_API_KEY environment variable must be set
 * - Shows green (#00ff7f) "You" marker at Alice's location
 * - Shows red (#ff375f) competitor markers with white stroke
 * - Clicking markers opens AI comparison modal
 * - Accessible with aria-live announcements
 */
interface NearbyCompetitorsMapProps {
  theme: string;
  onCompetitorClick: (competitor: CompetitorShop) => void;
}

function NearbyCompetitorsMap({ theme, onCompetitorClick }: NearbyCompetitorsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Load Google Maps JavaScript API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('VITE_GOOGLE_MAPS_API_KEY is not set');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => console.error('Failed to load Google Maps API');

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts before load
      if (!mapLoaded) {
        script.remove();
      }
    };
  }, []);

  // Initialize map once API is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current) return;

    try {
      // Create map instance
      const map = new google.maps.Map(mapRef.current, {
        center: ALICE_LOCATION,
        zoom: 15,
        mapTypeId: 'roadmap',
        disableDefaultUI: true, // Disable all default UI
        zoomControl: true, // Re-enable only zoom control
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
        styles: theme === 'dark' ? [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8b92a8' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2c2c54' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0f3460' }]
          }
        ] : []
      });

      googleMapRef.current = map;

      // Create single info window (reused for all markers)
      const infoWindow = new google.maps.InfoWindow();
      infoWindowRef.current = infoWindow;

      // Add Alice's shop marker (solid green #00ff7f marker with white stroke)
      const aliceMarker = new google.maps.Marker({
        position: ALICE_LOCATION,
        map: map,
        title: 'Alice\'s Home Pizza',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#00ff7f',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 4
        },
        label: {
          text: 'You',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold'
        },
        zIndex: 1000
      });

      aliceMarker.addListener('click', () => {
        infoWindow.setContent(`
          <div style="padding: 10px; font-family: system-ui; color: #1a1a1a;">
            <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #00ff7f;">🍕 Alice's Home Pizza</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">Your Shop</p>
            <p style="margin: 0; font-size: 13px; color: #888;">Bishan Street 22, Singapore</p>
          </div>
        `);
        infoWindow.open(map, aliceMarker);
        setSelectedMarker('alice');
      });

      markersRef.current.push(aliceMarker);

      // Add competitor markers (solid red #ff375f markers with white stroke)
      COMPETITOR_SHOPS.forEach((competitor) => {
        const marker = new google.maps.Marker({
          position: competitor.coordinates,
          map: map,
          title: competitor.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: '#ff375f',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          label: {
            text: competitor.id,
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold'
          }
        });

        const distance = calculateDistance(
          ALICE_LOCATION.lat,
          ALICE_LOCATION.lng,
          competitor.coordinates.lat,
          competitor.coordinates.lng
        );

        marker.addListener('click', () => {
          // Close info window and open comparison modal
          infoWindow.close();
          onCompetitorClick(competitor);
          setSelectedMarker(competitor.id);
        });

        // Show info window on hover for quick preview
        marker.addListener('mouseover', () => {
          infoWindow.setContent(`
            <div style="padding: 10px; font-family: system-ui; color: #1a1a1a; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="background: #ff375f; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">${competitor.id}</span>
                <h3 style="margin: 0; font-size: 15px; font-weight: 600;">${competitor.name}</h3>
              </div>
              <p style="margin: 4px 0; font-size: 13px; color: #666;">${competitor.category}</p>
              <div style="display: flex; gap: 14px; margin-top: 8px; font-size: 13px;">
                <span style="color: #f59e0b;">⭐ ${competitor.avgRating}</span>
                <span style="color: #8b5cf6;">📍 ${distance.toFixed(2)} km</span>
                <span style="color: #10b981;">${competitor.priceRange}</span>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #888; font-style: italic;">Click for AI comparison</p>
            </div>
          `);
          infoWindow.open(map, marker);
        });

        marker.addListener('mouseout', () => {
          infoWindow.close();
        });

        markersRef.current.push(marker);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [mapLoaded, theme]);

  return (
    <div className="relative">
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-96 rounded-xl overflow-hidden shadow-inner"
        role="application"
        aria-label="Interactive map showing Alice's Home Pizza and nearby competitors"
      />

      {/* Loading state */}
      {!mapLoaded && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading map...
            </p>
          </div>
        </div>
      )}

      {/* Accessibility: Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {selectedMarker === 'alice' && 'Viewing Alice\'s Home Pizza at Bishan Street 22'}
        {selectedMarker && selectedMarker !== 'alice' &&
          `Viewing ${COMPETITOR_SHOPS.find(c => c.id === selectedMarker)?.name}`
        }
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { listings } = useListings();
  const { receivedRentalRequests = [] } = useRentals();
  const { currentShop } = useShop();
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // week, month, year
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorShop | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const handleCompetitorClick = (competitor: CompetitorShop) => {
    setSelectedCompetitor(competitor);
    setIsComparisonModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsComparisonModalOpen(false);
  };

  if (!currentUser || !currentShop) {
    return (
      <div className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <p>Create a shop to see analytics</p>
      </div>
    );
  }

  // Get shop listings
  const shopListings = listings.filter((l: any) => l.shopId === currentShop.id);

  // Analytics calculations
  const shopOrders = receivedRentalRequests.filter((r: any) => r.shopId === currentShop.id);
  const completedOrders = shopOrders.filter((r: any) => r.status === 'completed');
  const pendingOrders = shopOrders.filter((r: any) => r.status === 'pending');

  const totalRevenue = completedOrders.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const conversionRate = shopOrders.length > 0 ? (completedOrders.length / shopOrders.length) * 100 : 0;

  // Calculate period-based metrics for trend analysis
  const now = new Date();
  const getPeriodData = () => {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period
    const currentCompleted = completedOrders.filter((r: any) => {
      const reqDate = r.requestDate instanceof Date ? r.requestDate : new Date();
      return selectedPeriod === 'week' ? reqDate >= weekAgo : selectedPeriod === 'month' ? reqDate >= monthAgo : true;
    });
    const currentRevenue = currentCompleted.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);
    const currentOrders = currentCompleted.length;

    // Previous period
    const previousCompleted = completedOrders.filter((r: any) => {
      const reqDate = r.requestDate instanceof Date ? r.requestDate : new Date();
      if (selectedPeriod === 'week') {
        return reqDate >= twoWeeksAgo && reqDate < weekAgo;
      } else if (selectedPeriod === 'month') {
        return reqDate >= twoMonthsAgo && reqDate < monthAgo;
      }
      return false;
    });
    const previousRevenue = previousCompleted.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);
    const previousOrders = previousCompleted.length;

    return {
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders
    };
  };

  const periodData = getPeriodData();
  const revenueChange = periodData.previousRevenue > 0
    ? ((periodData.currentRevenue - periodData.previousRevenue) / periodData.previousRevenue) * 100
    : 100;
  const ordersChange = periodData.previousOrders > 0
    ? ((periodData.currentOrders - periodData.previousOrders) / periodData.previousOrders) * 100
    : 100;

  // Generate deterministic revenue chart data based on selected period
  const generateChartData = () => {
    const data = [];

    // Base weekly pattern (deterministic seed based on shop ID)
    const shopSeed = currentShop?.id ? currentShop.id.charCodeAt(5) || 1 : 1;
    const weeklyRevenue = [52, 68, 85, 112, 140, 165, 95]; // Mon-Sun pattern
    const weeklyOrders = [3, 4, 5, 7, 9, 11, 6];

    if (selectedPeriod === 'week') {
      // Show last 7 days with realistic daily pattern
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayIndex = date.getDay(); // 0 = Sunday, 6 = Saturday
        const reorderedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to Mon=0, Sun=6

        data.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: weeklyRevenue[reorderedIndex],
          orders: weeklyOrders[reorderedIndex]
        });
      }
    } else if (selectedPeriod === 'month') {
      // Show 5 weeks with growth trend
      const monthlyWeeklyRevenue = [285, 320, 395, 465, 520]; // Growing trend
      const monthlyWeeklyOrders = [18, 21, 25, 29, 33];

      for (let i = 0; i < 5; i++) {
        data.push({
          date: `W${i + 1}`,
          revenue: monthlyWeeklyRevenue[i],
          orders: monthlyWeeklyOrders[i]
        });
      }
    } else if (selectedPeriod === 'year') {
      // Show 12 months with seasonal pattern and growth
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearlyMonthlyRevenue = [920, 880, 1050, 1180, 1350, 1520, 1680, 1750, 1620, 1800, 2100, 2450];
      const yearlyMonthlyOrders = [58, 52, 65, 72, 84, 95, 105, 110, 98, 112, 132, 155];

      const currentMonth = now.getMonth();
      for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        data.push({
          date: months[monthIndex],
          revenue: yearlyMonthlyRevenue[i],
          orders: yearlyMonthlyOrders[i]
        });
      }
    }

    return data;
  };

  const chartData = generateChartData();

  // Product analytics
  const avgProductRating = shopListings.length > 0
    ? shopListings.reduce((sum: number, l: any) => sum + (l.rating || 0), 0) / shopListings.length
    : 0;

  // Top performing products
  const topProducts = [...shopListings]
    .sort((a: any, b: any) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 3);

  // Generate recommendations
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Low conversion rate
    if (conversionRate < 30 && shopOrders.length > 5) {
      recommendations.push({
        id: '1',
        title: 'Improve Product Descriptions',
        description: `Your conversion rate is ${conversionRate.toFixed(1)}%. Improve product descriptions with details about benefits and use cases.`,
        impact: 'high',
        icon: '📝',
        action: 'Edit Product Descriptions'
      });
    }

    // Low ratings
    if (avgProductRating < 4.5 && shopListings.length > 0) {
      recommendations.push({
        id: '2',
        title: 'Address Quality Concerns',
        description: `Average rating is ${avgProductRating.toFixed(1)}★. Customer feedback suggests improvements needed. Review recent reviews for insights.`,
        impact: 'high',
        icon: '⭐',
        action: 'Review Feedback'
      });
    }

    // Low inventory for high demand products
    if (topProducts.length > 0 && topProducts[0].reviews > 10) {
      recommendations.push({
        id: '3',
        title: 'Restock Popular Items',
        description: `"${topProducts[0].name}" has ${topProducts[0].reviews} reviews but low stock. Consider restocking popular items.`,
        impact: 'high',
        icon: '📦',
        action: 'Manage Inventory'
      });
    }

    // Few products listed
    if (shopListings.length < 5) {
      recommendations.push({
        id: '4',
        title: 'Expand Product Catalog',
        description: `You have ${shopListings.length} products. Listing more products increases visibility and sales opportunities.`,
        impact: 'medium',
        icon: '➕',
        action: 'Add More Products'
      });
    }

    // Pending orders
    if (pendingOrders.length > 0) {
      recommendations.push({
        id: '5',
        title: 'Respond to Orders Quickly',
        description: `You have ${pendingOrders.length} pending orders. Fast responses increase approval rates and customer satisfaction.`,
        impact: 'medium',
        icon: '⚡',
        action: 'View Orders'
      });
    }

    // Optimize pricing
    if (completedOrders.length > 5) {
      recommendations.push({
        id: '6',
        title: 'Optimize Pricing Strategy',
        description: `Average order value is $${avgOrderValue.toFixed(2)}. Analyze competitor pricing and consider bundling options.`,
        impact: 'medium',
        icon: '💰',
        action: 'Check Competitors'
      });
    }

    // Improve shop profile
    if (currentShop.reviews < 5) {
      recommendations.push({
        id: '7',
        title: 'Build Social Proof',
        description: `You have ${currentShop.reviews} shop reviews. More positive reviews help attract new customers.`,
        impact: 'low',
        icon: '👥',
        action: 'Request Reviews'
      });
    }

    return recommendations.slice(0, 5);
  };

  const staticRecommendations = generateRecommendations();

  // Generate AI-powered recommendations using Gemini
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (!currentShop) return;

      setIsLoadingRecommendations(true);
      try {
        const analyticsData = {
          shopName: currentShop.shopName,
          category: currentShop.category,
          totalRevenue: totalRevenue.toFixed(2),
          totalOrders: completedOrders.length,
          conversionRate: conversionRate.toFixed(1),
          avgOrderValue: avgOrderValue.toFixed(2),
          avgProductRating: avgProductRating.toFixed(1),
          productCount: shopListings.length,
          pendingOrdersCount: pendingOrders.length,
          topProduct: topProducts.length > 0 ? topProducts[0].name : 'None',
          revenueChange: revenueChange.toFixed(1),
        };

        const prompt = `You are a business analytics AI consultant. Based on the following shop analytics data, provide 3-5 actionable business recommendations.

Shop Analytics:
- Shop Name: ${analyticsData.shopName}
- Category: ${analyticsData.category}
- Total Revenue: $${analyticsData.totalRevenue}
- Total Orders: ${analyticsData.totalOrders}
- Conversion Rate: ${analyticsData.conversionRate}%
- Average Order Value: $${analyticsData.avgOrderValue}
- Average Product Rating: ${analyticsData.avgProductRating}⭐
- Product Count: ${analyticsData.productCount}
- Pending Orders: ${analyticsData.pendingOrdersCount}
- Top Product: ${analyticsData.topProduct}
- Revenue Change: ${analyticsData.revenueChange}%

Please provide recommendations in the following JSON format (return ONLY the JSON array, no markdown or extra text):
[
  {
    "title": "Recommendation Title",
    "description": "Detailed description of the recommendation",
    "impact": "high|medium|low",
    "icon": "emoji icon",
    "action": "Action Button Text"
  }
]

Focus on practical, actionable advice specific to a ${analyticsData.category} business.`;

        const aiResponse = await generateContent(prompt);

        // Parse the AI response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedRecommendations = JSON.parse(jsonMatch[0]);
          const formattedRecommendations = parsedRecommendations.map((rec: any, index: number) => ({
            id: `ai-${index + 1}`,
            title: rec.title,
            description: rec.description,
            impact: rec.impact,
            icon: rec.icon,
            action: rec.action
          }));
          setAiRecommendations(formattedRecommendations);
        } else {
          // Fallback to static recommendations if parsing fails
          setAiRecommendations(staticRecommendations);
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        // Fallback to static recommendations on error
        setAiRecommendations(staticRecommendations);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchAIRecommendations();
  }, [currentShop?.id, totalRevenue, completedOrders.length, conversionRate]);

  const recommendations = aiRecommendations.length > 0 ? aiRecommendations : staticRecommendations;

  const kpis = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      change: revenueChange,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Total Orders',
      value: completedOrders.length.toString(),
      change: ordersChange,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      change: 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Avg Order Value',
      value: `$${avgOrderValue.toFixed(2)}`,
      change: 0,
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              📊 Shop Analytics
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Personalized insights for {currentShop.shopName}
            </p>
          </div>

          {/* Period Selector - Modern Pills */}
          <div className={`flex gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm shadow-sm'}`}>
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

      {/* KPI Cards - Sleek Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          return (
            <div
              key={idx}
              className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600'
                  : 'bg-white/90 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 shadow-md'
              }`}
            >
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10 ${
                idx === 0 ? 'bg-green-500/20' :
                idx === 1 ? 'bg-blue-500/20' :
                idx === 2 ? 'bg-purple-500/20' :
                'bg-orange-500/20'
              }`} />

              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${kpi.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                {kpi.change !== 0 && (
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm ${
                    isPositive
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                {kpi.label}
              </p>
              <p className="text-3xl font-bold mb-1">{kpi.value}</p>
              {kpi.change !== 0 && (
                <p className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  vs previous {selectedPeriod}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Business Insights */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-500" />
          Business Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Best Selling Category */}
          <div className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-purple-900/70 to-purple-800/50 border border-purple-700/50 backdrop-blur-sm'
              : 'bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 shadow-md'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                <Award className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'} mb-2`}>
              Best Category
            </p>
            <p className="text-2xl font-bold mb-1">
              {currentShop.category}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              {shopListings.length} products listed
            </p>
          </div>

          {/* Customer Satisfaction */}
          <div className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-yellow-900/70 to-yellow-800/50 border border-yellow-700/50 backdrop-blur-sm'
              : 'bg-gradient-to-br from-yellow-100 to-yellow-50 border border-yellow-200 shadow-md'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-500/10'}`}>
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'} mb-2`}>
              Customer Satisfaction
            </p>
            <p className="text-2xl font-bold mb-1">
              {avgProductRating.toFixed(1)}⭐
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Across {shopListings.reduce((sum: number, l: any) => sum + (l.reviews || 0), 0)} reviews
            </p>
          </div>

          {/* Active Orders */}
          <div className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-blue-900/70 to-blue-800/50 border border-blue-700/50 backdrop-blur-sm'
              : 'bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 shadow-md'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} mb-2`}>
              Pending Orders
            </p>
            <p className="text-2xl font-bold mb-1">
              {pendingOrders.length}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              Awaiting your response
            </p>
          </div>

          {/* Shop Performance */}
          <div className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-green-900/70 to-green-800/50 border border-green-700/50 backdrop-blur-sm'
              : 'bg-gradient-to-br from-green-100 to-green-50 border border-green-200 shadow-md'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                <Clock className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'} mb-2`}>
              Shop Performance
            </p>
            <p className="text-2xl font-bold mb-1">
              {conversionRate > 50 ? 'Excellent' : conversionRate > 30 ? 'Good' : 'Fair'}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              {conversionRate.toFixed(1)}% conversion rate
            </p>
          </div>
        </div>
      </div>

      {/* Nearby Competitors - Creative & Craft Businesses with AI Comparison */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-red-500" />
          Nearby Competitors
        </h2>
        <div className={`rounded-2xl p-6 ${
          theme === 'dark'
            ? 'bg-gray-900/80 border border-gray-800/50 backdrop-blur-sm shadow-xl'
            : 'bg-white/90 border border-gray-200/50 backdrop-blur-sm shadow-lg'
        }`}>
          <div className="mb-4">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
              Explore the creative and artisan businesses around <span className="font-semibold text-purple-500">Bishan Street 22, Singapore</span>.
              The <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-bold mx-1">
                <MapPin className="w-3 h-3 mr-0.5" /> Green "You" marker
              </span> shows your location, while <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs font-bold mx-1">
                <MapPin className="w-3 h-3 mr-0.5" /> Red pins (C1-C6)
              </span> indicate nearby design studios, craft workshops, and creative spaces. Click any competitor for AI-powered comparison.
            </p>
          </div>

          {/* Custom Google Maps with markers */}
          <NearbyCompetitorsMap theme={theme} onCompetitorClick={handleCompetitorClick} />

          {/* Competitor Analysis Grid */}
          <div className="mt-6">
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              Competitor Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPETITOR_SHOPS.map((competitor) => {
                const distance = calculateDistance(
                  ALICE_LOCATION.lat,
                  ALICE_LOCATION.lng,
                  competitor.coordinates.lat,
                  competitor.coordinates.lng
                );

                return (
                  <div
                    key={competitor.id}
                    className={`group relative p-4 rounded-xl transition-all duration-300 hover:shadow-lg ${
                      theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'
                    }`}
                    role="article"
                    aria-label={`Competitor ${competitor.name}, ${distance.toFixed(2)} km away, rating ${competitor.avgRating}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 flex-shrink-0">
                          <span className="text-xs font-bold text-red-500">{competitor.id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} truncate`}>
                            {competitor.name}
                          </h4>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} truncate`}>
                            {competitor.category}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className={`text-center p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Award className="w-3 h-3 text-yellow-500" />
                          <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                            {competitor.avgRating}
                          </span>
                        </div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                          Rating
                        </span>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <MapPin className="w-3 h-3 text-purple-500" />
                          <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                            {distance.toFixed(1)}
                          </span>
                        </div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                          km
                        </span>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'
                      }`}>
                        <div className="text-xs font-semibold mb-1" style={{ color: '#10b981' }}>
                          {competitor.priceRange}
                        </div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                          Price
                        </span>
                      </div>
                    </div>

                    {/* Compare Button */}
                    <button
                      onClick={() => handleCompetitorClick(competitor)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30'
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
                      }`}
                      aria-label={`Compare ${competitor.name} with your shop`}
                    >
                      🔍 Compare with AI
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Trading-Style Revenue Chart */}
      <div className="mb-12">
        <TradingChart
          data={chartData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          theme={theme}
        />
      </div>

      {/* Top Products */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          Top Performing Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topProducts.length > 0 ? (
            topProducts.map((product: any, idx: number) => (
              <div
                key={product.id}
                className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  theme === 'dark'
                    ? 'bg-gray-900/80 border border-gray-800/50 backdrop-blur-sm'
                    : 'bg-white/90 border border-gray-200/50 backdrop-blur-sm shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-gray-500/20 text-gray-500' :
                    'bg-orange-500/20 text-orange-500'
                  }`}>
                    #{idx + 1}
                  </div>
                </div>
                <h3 className="font-bold mb-2">{product.name}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Reviews
                    </p>
                    <p className="text-xl font-bold">{product.reviews}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Rating
                    </p>
                    <p className="text-xl font-bold">{product.rating}⭐</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-purple-500">${product.price}/{product.period}</p>
              </div>
            ))
          ) : (
            <div className={`col-span-3 p-6 rounded-lg text-center ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
            }`}>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No products yet. Create your first listing to see analytics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI-Powered Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Smart Recommendations
          </h2>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 text-purple-300 border border-purple-700/50'
              : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            AI-Powered by Gemini
          </span>
        </div>
        {isLoadingRecommendations && (
          <div className={`flex flex-col items-center justify-center py-12 rounded-2xl ${
            theme === 'dark'
              ? 'bg-gray-900/80 border border-gray-800/50 backdrop-blur-sm'
              : 'bg-white/90 border border-gray-200/50 backdrop-blur-sm shadow-md'
          }`}>
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-purple-600/20 rounded-full"></div>
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Analyzing Your Business Data...
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              Gemini AI is generating personalized recommendations
            </p>
          </div>
        )}
        <div className="space-y-4">
          {!isLoadingRecommendations && recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`group relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/80 border border-gray-700/50 backdrop-blur-sm'
                  : 'bg-white/90 border border-gray-200/50 backdrop-blur-sm shadow-md'
              }`}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10 ${
                rec.impact === 'high' ? 'bg-red-500/20' :
                rec.impact === 'medium' ? 'bg-yellow-500/20' :
                'bg-blue-500/20'
              }`} />

              <div className="flex gap-4">
                <div className={`text-4xl p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                  rec.impact === 'high' ? 'bg-red-500/10' :
                  rec.impact === 'medium' ? 'bg-yellow-500/10' :
                  'bg-blue-500/10'
                }`}>
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg">{rec.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rec.impact === 'high' ? 'bg-red-500/20 text-red-500' :
                      rec.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {rec.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <p className={`text-sm mb-4 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {rec.description}
                  </p>
                  <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg">
                    {rec.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Comparison Modal - Requires VITE_GEMINI_API_KEY */}
      <CompetitorComparisonModal
        competitor={selectedCompetitor}
        isOpen={isComparisonModalOpen}
        onClose={handleCloseModal}
        theme={theme}
      />
      </div>
    </div>
  );
}

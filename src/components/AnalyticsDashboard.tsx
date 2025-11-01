import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import { useShop } from '../contexts/ShopContext';
import { TrendingUp, TrendingDown, Lightbulb, DollarSign, Users, Star, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: string;
  action: string;
}

export default function AnalyticsDashboard() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { listings } = useListings();
  const { receivedRentalRequests = [] } = useRentals();
  const { currentShop } = useShop();
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // week, month, year

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

  // Generate revenue chart data
  const generateChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayOrders = completedOrders.filter((r: any) => {
        const reqDate = r.requestDate instanceof Date ? r.requestDate : new Date();
        return reqDate.toDateString() === date.toDateString();
      });
      const revenue = dayOrders.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3),
        revenue: revenue,
        orders: dayOrders.length
      });
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

  const recommendations = generateRecommendations();

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
    <div className={`${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📊 Shop Analytics</h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Personalized insights for {currentShop.shopName}
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-8">
        {['week', 'month', 'year'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedPeriod === period
                ? 'bg-purple-600 text-white'
                : theme === 'dark'
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          return (
            <div
              key={idx}
              className={`rounded-lg p-6 ${
                theme === 'dark'
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
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
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                {kpi.label}
              </p>
              <p className="text-3xl font-bold">{kpi.value}</p>
              {kpi.change !== 0 && (
                <p className={`text-xs mt-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  vs previous {selectedPeriod}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          7-Day Revenue Trend
        </h2>
        <div className={`rounded-lg p-8 ${
          theme === 'dark'
            ? 'bg-gray-900 border border-gray-800'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-end justify-between gap-2 h-64">
            {chartData.map((day: any, idx: number) => {
              const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1000);
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-full h-48 bg-gradient-to-t from-blue-500/30 to-blue-500/10 rounded-t-lg overflow-hidden flex items-end justify-center group-hover:from-blue-500/50 group-hover:to-blue-500/20 transition-all cursor-pointer">
                      <div
                        className="w-4/5 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all group-hover:shadow-lg"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="font-semibold text-sm">{day.date}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${day.revenue.toFixed(0)}
                      </p>
                      <p className={`text-xs font-bold text-blue-500`}>
                        {day.orders} order{day.orders !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
                className={`rounded-lg p-6 ${
                  theme === 'dark'
                    ? 'bg-gray-900 border border-gray-800'
                    : 'bg-white border border-gray-200'
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

      {/* Recommendations */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          Smart Recommendations
        </h2>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`rounded-lg p-6 ${
                theme === 'dark'
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex gap-4">
                <div className="text-3xl">{rec.icon}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{rec.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rec.impact === 'high' ? 'bg-red-500/20 text-red-500' :
                      rec.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {rec.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {rec.description}
                  </p>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition-colors">
                    {rec.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

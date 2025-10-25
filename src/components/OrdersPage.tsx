import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRentals } from '../contexts/RentalsContext';
import { useListings } from '../contexts/ListingsContext';
import { useNavigate } from 'react-router-dom';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, MessageSquare, Download } from 'lucide-react';

export default function OrdersPage() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { userRentalRequests, receivedRentalRequests, updateRentalRequestStatus } = useRentals();
  const { listings } = useListings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'my-orders' | 'my-bookings'>('my-orders');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');

  // Get order details with listing info
  const getOrderDetails = (order: any) => {
    const listing = listings.find(l => l.id === order.toolId);
    return {
      ...order,
      listing
    };
  };

  // Filter orders based on status
  const filteredUserOrders = userRentalRequests.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  }).map(getOrderDetails);

  // Filter bookings based on status
  const filteredReceivedOrders = receivedRentalRequests.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  }).map(getOrderDetails);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateRentalRequestStatus(orderId, newStatus);
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      alert(`Error updating status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100/20 border-green-500/30 text-green-700 dark:text-green-400';
      case 'completed':
        return 'bg-blue-100/20 border-blue-500/30 text-blue-700 dark:text-blue-400';
      case 'declined':
        return 'bg-red-100/20 border-red-500/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100/20 border-gray-500/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'completed':
        return <Package className="w-5 h-5" />;
      case 'declined':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const OrderCard = ({ order, isOwner = false }: { order: any; isOwner?: boolean }) => (
    <div className={`rounded-xl p-6 border-0 shadow-sm mb-4 ${
      theme === 'dark'
        ? 'bg-gray-800/60'
        : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{order.toolName}</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {isOwner ? `From: ${order.renterName}` : `To: ${order.ownerName}`}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="font-medium capitalize">{order.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200/10">
        {/* Order Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Order Total:</span>
            <span className="font-semibold text-green-500">${order.totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Quantity:</span>
            <span className="font-medium">{order.quantity || 1}</span>
          </div>
          {order.startDate && (
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Date:</span>
              <span className="font-medium">
                {order.startDate}
                {order.endDate && ` to ${order.endDate}`}
              </span>
            </div>
          )}
        </div>

        {/* Time Details */}
        <div className="space-y-2">
          {order.startTime && (
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Time:</span>
              <span className="font-medium">
                {order.startTime}
                {order.endTime && ` to ${order.endTime}`}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Created:</span>
            <span className="font-medium">
              {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      {order.message && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
            <span className="font-medium">Message: </span>
            {order.message}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {isOwner && order.status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusUpdate(order.id, 'approved')}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate(order.id, 'declined')}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              <XCircle className="w-4 h-4 inline mr-2" />
              Decline
            </button>
          </>
        )}

        {!isOwner && order.status === 'approved' && (
          <button
            onClick={() => handleStatusUpdate(order.id, 'completed')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Mark Complete
          </button>
        )}

        <button
          onClick={() => navigate(`/listing/${order.toolId}`)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          View Item
        </button>

        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-purple-600/20 hover:bg-purple-600/30'
              : 'bg-purple-100 hover:bg-purple-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Message
        </button>

        {order.status === 'completed' && (
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-600/20 hover:bg-blue-600/30'
                : 'bg-blue-100 hover:bg-blue-200'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Invoice
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <LiquidGlassNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800'
                : 'hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8" />
              Orders & Bookings
            </h1>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Manage your orders and service bookings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-200/20">
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'my-orders'
                ? 'border-purple-600 text-purple-600'
                : theme === 'dark'
                ? 'border-transparent text-gray-400 hover:text-gray-300'
                : 'border-transparent text-gray-600 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            My Orders ({filteredUserOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'my-bookings'
                ? 'border-purple-600 text-purple-600'
                : theme === 'dark'
                ? 'border-transparent text-gray-400 hover:text-gray-300'
                : 'border-transparent text-gray-600 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Incoming ({filteredReceivedOrders.length})
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800/60 text-gray-400 hover:text-gray-300'
                  : 'bg-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'my-orders' ? (
          <div>
            {filteredUserOrders.length > 0 ? (
              filteredUserOrders.map(order => (
                <OrderCard key={order.id} order={order} isOwner={false} />
              ))
            ) : (
              <div className={`text-center py-12 rounded-xl ${
                theme === 'dark'
                  ? 'bg-gray-800/60'
                  : 'bg-white/80 backdrop-blur-sm'
              }`}>
                <Package className={`w-12 h-12 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {statusFilter === 'all'
                    ? 'No orders yet. Browse products to place an order!'
                    : `No ${statusFilter} orders`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredReceivedOrders.length > 0 ? (
              filteredReceivedOrders.map(order => (
                <OrderCard key={order.id} order={order} isOwner={true} />
              ))
            ) : (
              <div className={`text-center py-12 rounded-xl ${
                theme === 'dark'
                  ? 'bg-gray-800/60'
                  : 'bg-white/80 backdrop-blur-sm'
              }`}>
                <Clock className={`w-12 h-12 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {statusFilter === 'all'
                    ? 'No incoming orders yet'
                    : `No ${statusFilter} orders`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

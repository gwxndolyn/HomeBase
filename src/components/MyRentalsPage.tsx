import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import { useRentals } from '../contexts/RentalsContext';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { reviewsService } from '../services/firebase';
import { emailService } from '../services/emailService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import LiquidGlassNav from './LiquidGlassNav';
import RentalCalendar from './RentalCalendar';
import { Package, Clock, CheckCircle, XCircle, MessageCircle, Calendar, AlertTriangle, Edit, Star, TrendingUp, Search, Plus, Inbox, ThumbsUp, ThumbsDown, X, Trash2, Edit3, MapPin, Award, DollarSign } from 'lucide-react';

export default function MyRentalsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { userListings, deleteListing, delistListing, relistListing } = useListings(); // Get user-specific listings
  const { userRentalRequests, receivedRentalRequests, updateRentalStatus, updateRentalData } = useRentals(); // Get user's rental requests directly
  const { createOrGetChat } = useChat();

  // Owner tabs: my-listings, active-rentals, requests, calendar
  // Customer tabs: active-rentals, pending-requests, calendar
  const ownerTabs = ['my-listings', 'active-rentals', 'requests', 'calendar'] as const;
  const customerTabs = ['active-rentals', 'pending-requests', 'calendar'] as const;

  type OwnerTab = typeof ownerTabs[number];
  type CustomerTab = typeof customerTabs[number];

  // Parse URL to get initial view mode and tab
  const getInitialState = () => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view') as 'owner' | 'customer' | null;
    const tab = params.get('tab');

    const initialView = view === 'owner' ? 'owner' : 'customer';
    const initialOwnerTab = (tab && ownerTabs.includes(tab as OwnerTab)) ? tab as OwnerTab : 'my-listings';
    const initialCustomerTab = (tab && customerTabs.includes(tab as CustomerTab)) ? tab as CustomerTab : 'active-rentals';

    return { initialView, initialOwnerTab, initialCustomerTab };
  };

  const { initialView, initialOwnerTab, initialCustomerTab } = getInitialState();

  // View mode: owner or customer
  const [viewMode, setViewMode] = useState<'owner' | 'customer'>(initialView as 'owner' | 'customer');
  const [ownerActiveTab, setOwnerActiveTab] = useState<OwnerTab>(initialOwnerTab);
  const [customerActiveTab, setCustomerActiveTab] = useState<CustomerTab>(initialCustomerTab);

  // Update URL when view mode or tabs change
  useEffect(() => {
    const currentTab = viewMode === 'owner' ? ownerActiveTab : customerActiveTab;
    navigate(`/my-rentals?view=${viewMode}&tab=${currentTab}`, { replace: true });
  }, [viewMode, ownerActiveTab, customerActiveTab]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'decline' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRentalForReview, setSelectedRentalForReview] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Get user's rental activity - separate active rentals, completed rentals, and pending requests
  const activeRentals = userRentalRequests.filter(request =>
    request.status === 'approved'
  );
  const completedRentalsCustomer = userRentalRequests.filter(request =>
    request.status === 'completed'
  );
  const pendingRequests = userRentalRequests.filter(request =>
    request.status === 'pending'
  );
  const userRentals = [...activeRentals, ...pendingRequests]; // Show both active rentals and pending requests
  const userOwnListings = userListings;
  const activeListings = userListings.filter(l => l.isActive !== false);
  const delistedListings = userListings.filter(l => l.isActive === false);
  const incomingRequests = receivedRentalRequests.filter(request => request.status === 'pending');

  // Customer stats
  const completedRentals = userRentalRequests.filter(r => r.status === 'completed');
  const totalSpent = completedRentals.reduce((sum, r) => sum + r.totalCost, 0);

  // Owner stats
  const approvedBookings = receivedRentalRequests.filter(r => r.status === 'approved');
  const completedBookings = receivedRentalRequests.filter(r => r.status === 'completed');
  const totalEarnings = completedBookings.reduce((sum, r) => sum + r.totalCost, 0);

  // Helper function to format datetime
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return dateTime.toLocaleString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return `${date} ${time}`;
    }
  };

  // Helper function to render tool image (emoji or base64) - enhanced for full height
  const renderToolImage = (imageStr: string, size: 'small' | 'medium' | 'large' = 'small') => {
    const sizeClasses = size === 'large'
      ? "w-48 h-48 md:w-56 md:h-56"
      : size === 'medium'
      ? "w-full aspect-square"
      : "w-16 h-16";

    // Check if image is a base64 data URL
    if (imageStr && imageStr.startsWith('data:image/')) {
      return (
        <img
          src={imageStr}
          alt="Tool"
          className={`${sizeClasses} object-cover rounded-xl shadow-lg`}
        />
      );
    }
    // Otherwise, treat as emoji
    return (
      <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg ${
        size === 'large' ? 'text-8xl md:text-9xl' : size === 'medium' ? 'text-6xl' : 'text-4xl'
      }`}>
        {imageStr}
      </div>
    );
  };

  // Helper function to format price - show decimals only if needed
  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  const handleViewListing = (listingId: string) => {
    navigate(`/listing/${listingId}`);
  };

  const handleContactOwner = async (rental: any) => {
    console.log('[MyRentals] handleContactOwner called with rental:', rental);
    
    if (!currentUser) {
      alert('Please login to chat');
      return;
    }

    try {
      // Determine if we're contacting owner or renter
      const isOwner = rental.ownerEmail === currentUser.email;
      const targetEmail = isOwner ? rental.renterEmail : rental.ownerEmail;
      const targetName = isOwner ? rental.renterName : rental.ownerName;

      console.log('[MyRentals] Contact info:', {
        isOwner,
        targetEmail,
        targetName,
        currentUserEmail: currentUser.email
      });

      if (!targetEmail) {
        alert('Unable to find contact information. Email is missing.');
        return;
      }

      // Find the user ID from email
      console.log('[MyRentals] Looking up user by email:', targetEmail);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', targetEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn('[MyRentals] User not found in Firestore for email:', targetEmail);
        alert(`User not found for ${targetEmail}. They may not have logged in yet.`);
        return;
      }

      const targetUserId = querySnapshot.docs[0].id;
      const targetUserData = querySnapshot.docs[0].data();
      console.log('[MyRentals] Found user:', targetUserId);

      // Create or get chat
      console.log('[MyRentals] Creating/getting chat...');
      const chatId = await createOrGetChat(
        targetUserId,
        targetName,
        targetUserData.photoURL || ''
      );
      console.log('[MyRentals] Chat created/retrieved:', chatId);

      // Navigate to chat with the conversation open
      navigate(`/chat?selected=${chatId}`);
    } catch (error) {
      console.error('[MyRentals] Error creating chat:', error);
      alert('Failed to open chat. Error: ' + (error as Error).message);
    }
  };

  const handleExtendRental = (rental: any) => {
    // Navigate to listing page to make a new request for extended dates
    navigate(`/listing/${rental.toolId}`);
  };

  const handleBoostListing = (_listingId: string) => {
    // Future implementation for boosting listings
    alert('Boost listing feature coming soon!');
  };

  const handleEditListing = (listingId: string) => {
    navigate(`/list-item?edit=${listingId}`);
  };

  const handleDeleteListing = async (listingId: string, listingName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${listingName}"? This action cannot be undone.`)) {
      try {
        await deleteListing(listingId);
        setSuccessMessage('Listing deleted successfully!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing. Please try again.');
      }
    }
  };

  const handleDelistListing = async (listingId: string, listingName: string) => {
    if (window.confirm(`Delist "${listingName}"? The listing will be hidden from other users but you can relist it later.`)) {
      try {
        await delistListing(listingId);
        setSuccessMessage('Listing delisted successfully!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Error delisting listing:', error);
        alert('Failed to delist listing. Please try again.');
      }
    }
  };

  const handleRelistListing = async (listingId: string) => {
    try {
      await relistListing(listingId);
      setSuccessMessage('Listing relisted successfully!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error relisting listing:', error);
      alert('Failed to relist listing. Please try again.');
    }
  };

  const handleCancelRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowCancelModal(true);
  };

  const handleApprovalAction = (requestId: string, action: 'approve' | 'decline') => {
    setSelectedRequestId(requestId);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleMarkAsCompleted = async (requestId: string) => {
    if (window.confirm('Mark this rental as completed? The renter will be notified.')) {
      try {
        await updateRentalStatus(requestId, 'completed');
        setSuccessMessage('Rental marked as completed!');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Error marking rental as completed:', error);
        alert('Failed to mark rental as completed. Please try again.');
      }
    }
  };

  const handleLeaveReview = (rental: any) => {
    setSelectedRentalForReview(rental);
    setShowReviewModal(true);
  };

  const confirmApprovalAction = async () => {
    if (!selectedRequestId || !approvalAction) return;

    setIsLoading(true);
    try {
      const status = approvalAction === 'approve' ? 'approved' : 'declined';

      // Find the rental request to get details for email
      const rentalRequest = incomingRequests.find(req => req.id === selectedRequestId);

      await updateRentalStatus(selectedRequestId, status);

      // Send email notification to renter (with delay to avoid rate limiting)
      if (rentalRequest) {
        try {
          // Wait 1 second before sending email to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (approvalAction === 'approve') {
            await emailService.sendRentalAcceptedEmail({
              ownerName: currentUser?.displayName || currentUser?.email || 'Owner',
              ownerEmail: currentUser?.email || '',
              renterName: rentalRequest.renterName,
              renterEmail: rentalRequest.renterEmail,
              itemName: rentalRequest.toolName,
              startDate: rentalRequest.startDate,
              endDate: rentalRequest.endDate,
              totalCost: rentalRequest.totalCost
            });
          } else {
            await emailService.sendRentalDeclinedEmail({
              ownerName: currentUser?.displayName || currentUser?.email || 'Owner',
              ownerEmail: currentUser?.email || '',
              renterName: rentalRequest.renterName,
              renterEmail: rentalRequest.renterEmail,
              itemName: rentalRequest.toolName,
              startDate: rentalRequest.startDate,
              endDate: rentalRequest.endDate
            });
          }
          console.log(`${approvalAction === 'approve' ? 'Acceptance' : 'Decline'} email sent successfully`);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Continue even if email fails (might be rate limited)
        }
      }

      setShowApprovalModal(false);
      setSelectedRequestId(null);
      setApprovalAction(null);
      setSuccessMessage(
        approvalAction === 'approve'
          ? 'Rental request approved successfully!'
          : 'Rental request declined successfully!'
      );
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating rental status:', error);
      alert('Failed to update rental request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedRequestId(null);
    setApprovalAction(null);
  };

  const confirmCancelRequest = async () => {
    if (!selectedRequestId) return;

    setIsLoading(true);
    try {
      await updateRentalStatus(selectedRequestId, 'cancelled');
      setShowCancelModal(false);
      setSelectedRequestId(null);
      setSuccessMessage('Rental request cancelled successfully!');
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedRequestId(null);
  };

  const handleWriteReview = (rental: any) => {
    setSelectedRentalForReview(rental);
    setShowReviewModal(true);
    setReviewData({ rating: 5, comment: '' });
  };

  const handleSubmitReview = async () => {
    if (!selectedRentalForReview || !currentUser) return;

    setSubmittingReview(true);
    try {
      const reviewPayload = {
        listingId: selectedRentalForReview.toolId,
        reviewerName: currentUser.displayName || 'Anonymous User',
        reviewerEmail: currentUser.email || '',
        rating: reviewData.rating,
        comment: reviewData.comment.trim() || ''
      };

      await reviewsService.createReview(reviewPayload);

      // Mark the rental as reviewed
      await updateRentalData(selectedRentalForReview.id, { hasReview: true });

      setShowReviewModal(false);
      setSelectedRentalForReview(null);
      setReviewData({ rating: 5, comment: '' });
      setSuccessMessage('Review submitted successfully!');
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', errorMessage);
      alert(`Failed to submit review: ${errorMessage || 'Please try again.'}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedRentalForReview(null);
    setReviewData({ rating: 5, comment: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-500 bg-green-500/10';
      case 'rented':
        return 'text-white bg-purple-300/10';
      case 'completed':
      case 'available':
        return 'text-green-500 bg-green-500/10';
      case 'overdue':
        return 'text-red-500 bg-red-500/10';
      case 'cancelled':
      case 'declined':
        return 'text-gray-500 bg-gray-500/10';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rented':
        return <Clock className="w-4 h-4" />;
      case 'completed':
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
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
        {/* Enhanced Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                  My Rentals
                </h1>
                <p className={`text-sm md:text-base lg:text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your rental activity and listings
                </p>
              </div>

              {/* Apple-style Toggle */}
              <div className="flex items-center space-x-2 sm:space-x-3 justify-center sm:justify-end">
                <span className={`text-sm font-medium ${viewMode === 'customer' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                  Customer
                </span>
                <button
                  onClick={() => setViewMode(viewMode === 'customer' ? 'owner' : 'customer')}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 ease-in-out ${
                    viewMode === 'owner'
                      ? 'bg-purple-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                      viewMode === 'owner' ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${viewMode === 'owner' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                  Owner
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {viewMode === 'customer' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeRentals.length}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active Rentals</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedRentals.length}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingRequests.length}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Spent</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userOwnListings.length}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>My Listings</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{incomingRequests.length}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Incoming Requests</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Earnings</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedBookings.length}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed Bookings</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs based on view mode */}
        {viewMode === 'customer' ? (
          <div className={`rounded-2xl p-1 mb-8 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setCustomerActiveTab('active-rentals')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-6 rounded-xl text-xs md:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                  customerActiveTab === 'active-rentals'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Active Rentals ({activeRentals.length})</span>
                <span className="sm:hidden">Active ({activeRentals.length})</span>
              </button>
              <button
                onClick={() => setCustomerActiveTab('pending-requests')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-6 rounded-xl text-xs md:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                  customerActiveTab === 'pending-requests'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <Clock className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span>Pending ({pendingRequests.length})</span>
              </button>
              <button
                onClick={() => setCustomerActiveTab('calendar')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-6 rounded-xl text-xs md:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                  customerActiveTab === 'calendar'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span>Calendar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl p-1 mb-8 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm overflow-x-auto`}>
            <div className="grid grid-cols-4 gap-1 min-w-max md:min-w-0">
              <button
                onClick={() => setOwnerActiveTab('my-listings')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-4 lg:px-6 rounded-xl text-xs md:text-sm lg:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap ${
                  ownerActiveTab === 'my-listings'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="hidden lg:inline">My Listings ({userOwnListings.length})</span>
                <span className="lg:hidden">Listings ({userOwnListings.length})</span>
              </button>
              <button
                onClick={() => setOwnerActiveTab('active-rentals')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-4 lg:px-6 rounded-xl text-xs md:text-sm lg:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap ${
                  ownerActiveTab === 'active-rentals'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="hidden lg:inline">Active Rentals ({receivedRentalRequests.filter(r => r.status === 'approved').length})</span>
                <span className="lg:hidden">Active ({receivedRentalRequests.filter(r => r.status === 'approved').length})</span>
              </button>
              <button
                onClick={() => setOwnerActiveTab('requests')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-4 lg:px-6 rounded-xl text-xs md:text-sm lg:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap ${
                  ownerActiveTab === 'requests'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <Inbox className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span>Requests ({incomingRequests.length})</span>
              </button>
              <button
                onClick={() => setOwnerActiveTab('calendar')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-4 lg:px-6 rounded-xl text-xs md:text-sm lg:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap ${
                  ownerActiveTab === 'calendar'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg transform scale-[1.02]'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700/50'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span>Calendar</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Content */}
        {viewMode === 'customer' && customerActiveTab === 'active-rentals' ? (
          <div className="space-y-6">
            {/* Active Rentals Section */}
            {activeRentals.length > 0 && (
              <div>
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Active Rentals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeRentals.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleViewListing(item.toolId)}
                      className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                      }`}>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>

                      {/* Image */}
                      <div className="relative">
                        {renderToolImage(item.toolImage, "medium")}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-base font-bold mb-1 text-white truncate">{item.toolName}</h3>
                        <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          from <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${encodeURIComponent(item.ownerEmail)}`);
                            }}
                            className="font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                          >
                            {item.ownerName}
                          </button>
                        </p>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                              {item.startDate} - {item.endDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Cost:</span>
                            <span className="text-lg font-bold text-purple-400">
                              ${formatPrice(item.totalCost)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-gray-600/30">
                          {item.status === 'approved' && (
                            <div className="flex justify-center gap-3 mb-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsCompleted(item.id);
                                }}
                                className="transition-all hover:scale-110"
                                title="Mark as Completed"
                              >
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveReview(item);
                                }}
                                className="transition-all hover:scale-110"
                                title="Leave Review"
                              >
                                <Star className="w-5 h-5 text-yellow-500" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactOwner(item);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              theme === 'dark'
                                ? 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Rentals Section */}
            {completedRentalsCustomer.length > 0 && (
              <div className="mt-12">
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ✅ Completed Rentals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {completedRentalsCustomer.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleViewListing(item.toolId)}
                      className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                      }`}>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Image */}
                      <div className="relative">
                        {renderToolImage(item.toolImage, "medium")}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-base font-bold mb-1 text-white truncate">{item.toolName}</h3>
                        <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          from <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${encodeURIComponent(item.ownerEmail)}`);
                            }}
                            className="font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                          >
                            {item.ownerName}
                          </button>
                        </p>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                              {item.startDate} - {item.endDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Cost:</span>
                            <span className="text-lg font-bold text-purple-400">
                              ${formatPrice(item.totalCost)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-gray-600/30">
                          <div className="flex justify-center mb-2">
                            {!item.hasReview ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveReview(item);
                                }}
                                className="transition-all hover:scale-110"
                                title="Leave Review"
                              >
                                <Star className="w-5 h-5 text-yellow-500" />
                              </button>
                            ) : (
                              <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Review Left
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactOwner(item);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              theme === 'dark'
                                ? 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            Chat
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/listing/${item.toolId}`);
                            }}
                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Package className="w-3 h-3" />
                            Rent Again
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'customer' && customerActiveTab === 'pending-requests' ? (
          <div className="space-y-6">
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ⏳ Pending Requests
                </h2>
                <div className="space-y-6">
                  {pendingRequests.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      {/* Listing Box - Left 2 Columns Only */}
                      <div
                        onClick={() => handleViewListing(item.toolId)}
                        className={`relative flex items-center p-6 gap-6 flex-none w-3/5 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer overflow-hidden ${
                          theme === 'dark'
                            ? 'bg-gradient-to-r from-gray-800/80 via-gray-800/75 to-transparent backdrop-blur-sm'
                            : 'bg-gradient-to-r from-white/90 via-white/85 to-transparent backdrop-blur-sm'
                        }`}>

                        {/* Large Image on Left */}
                        <div className="flex-shrink-0">
                          {renderToolImage(item.toolImage, "large")}
                        </div>

                        {/* Listing Details in Center */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold mb-1 text-white">{item.toolName}</h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              From <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${encodeURIComponent(item.ownerEmail)}`);
                                }}
                                className="font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                              >
                                {item.ownerName}
                              </button> • {item.location}
                            </p>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Start:</span>
                              <span className="font-semibold text-sm">{formatDateTime(item.startDate, item.startTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>End:</span>
                              <span className="font-semibold text-sm">{formatDateTime(item.endDate, item.endTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cost:</span>
                              <span className="font-black text-2xl text-purple-500">${formatPrice(item.totalCost)}</span>
                            </div>
                          </div>

                          {item.message && (
                            <div className={`p-3 rounded-lg mb-4 ${
                              theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-50'
                            }`}>
                              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>YOUR MESSAGE</p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                "{item.message}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Actions - Outside Box on Right */}
                      <div className="flex flex-col items-end space-y-4 flex-shrink-0 min-w-[200px]">
                        {/* Status Badge */}
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </span>
                          <p className="text-xs text-orange-500 font-medium">⏳ Waiting for approval</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 w-full">
                          <button
                            onClick={() => handleContactOwner(item)}
                            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 ${
                              theme === 'dark'
                                ? 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 border border-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Contact Owner</span>
                          </button>

                          <button
                            onClick={() => handleCancelRequest(item.id)}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancel Request</span>
                          </button>

                        </div>

                        {/* Request Date */}
                        <div className="text-center mt-3">
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Requested: {item.requestDate instanceof Date
                              ? item.requestDate.toLocaleString('en-SG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })
                              : new Date((item.requestDate as any).toDate()).toLocaleString('en-SG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'customer' && customerActiveTab === 'calendar' ? (
          <RentalCalendar viewMode="customer" />
        ) : viewMode === 'owner' && ownerActiveTab === 'my-listings' ? (
          <div className="space-y-6">
            {/* Active Listings */}
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Active Listings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeListings.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleViewListing(item.id)}
                    className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                        : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                    }`}>

                  {/* Image */}
                  <div className="relative">
                    {renderToolImage(item.image, "medium")}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="text-base font-bold mb-1 text-white truncate">{item.name}</h3>
                    <p className="text-lg font-bold text-purple-400 mb-2">
                      ${formatPrice(item.price)}<span className="text-xs font-normal text-gray-400">/{item.period}</span>
                    </p>

                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs font-medium">{item.rating}</span>
                      <span className="text-xs text-gray-400">({item.reviews})</span>
                    </div>

                    <div className="flex items-center space-x-1 mb-2 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    <div className={`text-xs px-2 py-0.5 rounded-lg inline-block mb-2 ${
                      theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.category}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 pt-2 border-t border-gray-600/30 space-y-2">
                      {/* Icon Buttons Row */}
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditListing(item.id);
                          }}
                          className="p-1 transition-transform hover:scale-110"
                          title="Edit"
                        >
                          <Edit3 className="w-5 h-5 text-blue-500" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelistListing(item.id, item.name);
                          }}
                          className="p-1 transition-transform hover:scale-110"
                          title="Delist"
                        >
                          <XCircle className="w-5 h-5 text-orange-500" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteListing(item.id, item.name);
                          }}
                          className="p-1 transition-transform hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>

                      {/* Analytics Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Navigate to analytics page
                          console.log('Analytics for listing:', item.id);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-purple-900/50 hover:bg-purple-900/70 text-purple-300'
                            : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                        }`}
                      >
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {activeListings.length === 0 && delistedListings.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    You haven't listed any tools yet.
                  </p>
                  <button
                    onClick={() => navigate('/list-item')}
                    className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-medium transition-colors">
                    List Your First Tool
                  </button>
                </div>
              )}
              {activeListings.length === 0 && delistedListings.length > 0 && (
                <div className="col-span-full text-center py-8">
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    No active listings. All your listings are delisted.
                  </p>
                </div>
              )}
              </div>
            </div>

            {/* Delisted Listings Section */}
            {delistedListings.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-600/30">
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <XCircle className="w-6 h-6 text-orange-400" />
                  Delisted Items
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {delistedListings.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleViewListing(item.id)}
                      className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden opacity-60 ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm'
                      }`}>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/90 text-white">
                        Delisted
                      </div>

                      {/* Image */}
                      <div className="relative">
                        {renderToolImage(item.image, "medium")}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-base font-bold mb-1 text-white truncate">{item.name}</h3>
                        <p className="text-lg font-bold text-purple-400 mb-2">
                          ${formatPrice(item.price)}<span className="text-xs font-normal text-gray-400">/{item.period}</span>
                        </p>

                        <div className="flex items-center space-x-1 mb-2">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs font-medium">{item.rating}</span>
                          <span className="text-xs text-gray-400">({item.reviews})</span>
                        </div>

                        <div className="flex items-center space-x-1 mb-2 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{item.location}</span>
                        </div>

                        <div className={`text-xs px-2 py-0.5 rounded-lg inline-block mb-2 ${
                          theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.category}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 pt-2 border-t border-gray-600/30 space-y-2">
                          {/* Icon Buttons Row */}
                          <div className="flex justify-center gap-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditListing(item.id);
                              }}
                              className="p-1 transition-transform hover:scale-110"
                              title="Edit"
                            >
                              <Edit3 className="w-5 h-5 text-blue-500" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRelistListing(item.id);
                              }}
                              className="p-1 transition-transform hover:scale-110"
                              title="Relist"
                            >
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteListing(item.id, item.name);
                              }}
                              className="p-1 transition-transform hover:scale-110"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5 text-red-500" />
                            </button>
                          </div>

                          {/* Analytics Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Navigate to analytics page
                              console.log('Analytics for listing:', item.id);
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                              theme === 'dark'
                                ? 'bg-purple-900/50 hover:bg-purple-900/70 text-purple-300'
                                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                            }`}
                          >
                            Analytics
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'owner' && ownerActiveTab === 'active-rentals' ? (
          <div className="space-y-6">
            {/* Active Rentals for Owner */}
            {receivedRentalRequests.filter(r => r.status === 'approved').length > 0 ? (
              <div>
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ✅ Active Rentals
                </h2>
                <div className="space-y-6 mb-12">
                  {receivedRentalRequests
                    .filter(r => r.status === 'approved')
                    .map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      {/* Listing Box */}
                      <div
                        onClick={() => handleViewListing(request.toolId)}
                        className={`relative flex items-center p-6 gap-6 flex-none w-3/5 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer overflow-hidden ${
                          theme === 'dark'
                            ? 'bg-gradient-to-r from-gray-800/80 via-gray-800/75 to-transparent backdrop-blur-sm'
                            : 'bg-gradient-to-r from-white/90 via-white/85 to-transparent backdrop-blur-sm'
                        }`}>
                        <div className="flex-shrink-0">
                          {renderToolImage(request.toolImage, "large")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold mb-1 text-white">{request.toolName}</h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Rented by <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${encodeURIComponent(request.renterEmail)}`);
                                }}
                                className="font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                              >
                                {request.renterName}
                              </button>
                            </p>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Start:</span>
                              <span className="font-semibold text-sm">{formatDateTime(request.startDate, request.startTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>End:</span>
                              <span className="font-semibold text-sm">{formatDateTime(request.endDate, request.endTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Earning:</span>
                              <span className="font-black text-2xl text-green-500">${formatPrice(request.totalCost)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-end space-y-4 flex-shrink-0 min-w-[200px]">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="capitalize">{request.status}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No active rentals at the moment.
                </p>
              </div>
            )}
          </div>
        ) : viewMode === 'owner' && ownerActiveTab === 'requests' ? (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              📬 Pending Requests
            </h2>
            {incomingRequests.length > 0 ? (
              <div className="space-y-6">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between">
                    {/* Listing Box - Left 2 Columns Only */}
                    <div
                      onClick={() => handleViewListing(request.toolId)}
                      className={`relative flex items-center p-6 gap-6 flex-none w-3/5 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-gray-800/80 via-gray-800/75 to-transparent backdrop-blur-sm'
                          : 'bg-gradient-to-r from-white/90 via-white/85 to-transparent backdrop-blur-sm'
                      }`}>

                      {/* Large Image on Left */}
                      <div className="flex-shrink-0">
                        {renderToolImage(request.toolImage, "large")}
                      </div>

                      {/* Listing Details in Center */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold mb-1 text-white">{request.toolName}</h3>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Request from <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${encodeURIComponent(request.renterEmail)}`);
                              }}
                              className="font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                            >
                              {request.renterName}
                            </button> • {request.renterEmail}
                          </p>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Start:</span>
                            <span className="font-semibold text-sm">{formatDateTime(request.startDate, request.startTime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>End:</span>
                            <span className="font-semibold text-sm">{formatDateTime(request.endDate, request.endTime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cost:</span>
                            <span className="font-black text-2xl text-purple-500">${formatPrice(request.totalCost)}</span>
                          </div>
                        </div>

                        {request.message && (
                          <div className={`p-3 rounded-lg mb-4 ${
                            theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-50'
                          }`}>
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>RENTER'S MESSAGE</p>
                            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              "{request.message}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions - Outside Box on Right */}
                    <div className="flex flex-col items-end space-y-4 flex-shrink-0 min-w-[200px]">
                      {/* Status Badge */}
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="capitalize">{request.status}</span>
                        </span>
                        <p className="text-xs text-yellow-500 font-medium">⏳ Awaiting response</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 w-full">
                        <button
                          onClick={() => handleApprovalAction(request.id, 'approve')}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleApprovalAction(request.id, 'decline')}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                        <button
                          onClick={() => handleContactOwner(request)}
                          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 border border-gray-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Contact Renter</span>
                        </button>
                      </div>

                      {/* Request Date */}
                      <div className="text-center mt-3">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Requested: {request.requestDate instanceof Date
                            ? request.requestDate.toLocaleString('en-SG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            : new Date((request.requestDate as any).toDate()).toLocaleString('en-SG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-16 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'
                }`}>
                  <Inbox className="w-12 h-12 opacity-50" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  No Incoming Requests
                </h3>
                <p className="text-lg mb-6 max-w-md mx-auto">
                  When people request to rent your items, you'll see them here for approval.
                </p>
              </div>
            )}
          </div>
        ) : viewMode === 'owner' && ownerActiveTab === 'calendar' ? (
          <RentalCalendar viewMode="owner" />
        ) : null}

      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel Rental Request</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to cancel this rental request? The owner will be notified and you won't be able to rent this item for the selected dates.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={closeCancelModal}
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                Keep Request
              </button>
              <button
                onClick={confirmCancelRequest}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  'Cancel Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                approvalAction === 'approve'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {approvalAction === 'approve' ? (
                  <ThumbsUp className={`w-6 h-6 ${
                    approvalAction === 'approve'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                ) : (
                  <ThumbsDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {approvalAction === 'approve' ? 'Approve Rental Request' : 'Decline Rental Request'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action will notify the renter</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {approvalAction === 'approve'
                ? 'Are you sure you want to approve this rental request? The item will be marked as unavailable for the requested dates.'
                : 'Are you sure you want to decline this rental request? The renter will be notified that their request was declined.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={closeApprovalModal}
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={confirmApprovalAction}
                disabled={isLoading}
                className={`flex-1 py-2 px-4 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : approvalAction === 'approve' ? (
                  'Approve Request'
                ) : (
                  'Decline Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRentalForReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-lg w-full shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Write a Review</h3>
              <button
                onClick={closeReviewModal}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tool Info */}
            <div className="flex items-center space-x-4 mb-6">
              {selectedRentalForReview.toolImage && selectedRentalForReview.toolImage.startsWith('data:image/') ? (
                <img
                  src={selectedRentalForReview.toolImage}
                  alt={selectedRentalForReview.toolName}
                  className="w-16 h-16 object-cover rounded-xl"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl text-4xl">
                  {selectedRentalForReview.toolImage}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-lg">{selectedRentalForReview.toolName}</h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  by <button
                    onClick={() => navigate(`/profile/${encodeURIComponent(selectedRentalForReview.ownerEmail)}`)}
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                  >
                    {selectedRentalForReview.ownerName}
                  </button>
                </p>
              </div>
            </div>

            {/* Rating Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Rating</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= reviewData.rating
                          ? 'text-yellow-400 fill-current'
                          : theme === 'dark' ? 'text-gray-600 hover:text-gray-500' : 'text-gray-300 hover:text-gray-400'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium">
                  {reviewData.rating} star{reviewData.rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Your Review (Optional)</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Share your experience with this tool... (optional)"
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border resize-none ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={closeReviewModal}
                disabled={submittingReview}
                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                {submittingReview ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-xl p-4 shadow-lg border-l-4 border-green-500 flex items-center space-x-3 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {successMessage.includes('approved') ? 'Request Approved' :
                 successMessage.includes('declined') ? 'Request Declined' :
                 successMessage.includes('Review') ? 'Review Submitted' :
                 'Request Cancelled'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { reviewsService, type FirebaseReview } from '../services/firebase';
import { Star, MessageSquare, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface ReviewsSectionProps {
  listingId: string;
  listingName: string;
  ownerEmail: string;
  onReviewAdded?: () => void;
}

export default function ReviewsSection({ listingId, listingName, ownerEmail, onReviewAdded }: ReviewsSectionProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [reviews, setReviews] = useState<FirebaseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [listingId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewsData = await reviewsService.getListingReviews(listingId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !newReview.comment.trim()) return;

    try {
      setSubmitting(true);
      const reviewPayload = {
        listingId,
        reviewerName: currentUser.displayName || 'Anonymous User',
        reviewerEmail: currentUser.email || '',
        rating: newReview.rating,
        comment: newReview.comment.trim()
      };
      
      await reviewsService.createReview(reviewPayload);

      // Reset form and reload reviews
      setNewReview({ rating: 5, comment: '' });
      setShowAddReview(false);
      await loadReviews();
      onReviewAdded?.();
    } catch (error) {
      console.error('Error submitting review from ReviewsSection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to submit review: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const canAddReview = currentUser && currentUser.email !== ownerEmail;
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl ${
        theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl ${
      theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'
    }`}>
      {/* Reviews Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center space-x-4">
              {renderStars(Math.round(averageRating), 'md')}
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Add Review Form - Removed, reviews can only be added through My Rentals */}
      {false && showAddReview && (
        <div className={`mb-6 p-4 rounded-xl border-2 border-dashed ${
          theme === 'dark' ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
        }`}>
          <h4 className="font-semibold mb-4">Write a Review for {listingName}</h4>

          {/* Rating Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= newReview.rating
                        ? 'text-yellow-400 fill-current'
                        : theme === 'dark' ? 'text-gray-600 hover:text-gray-500' : 'text-gray-300 hover:text-gray-400'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium">
                {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Review</label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Share your experience with this tool..."
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
              onClick={() => setShowAddReview(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || !newReview.comment.trim()}
                              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-2">No reviews yet</p>
          <p className="text-sm">Be the first to review this tool!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className={`p-4 rounded-xl border ${
                theme === 'dark'
                  ? 'border-gray-700 bg-gray-700/30'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {review.reviewerName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <button
                        onClick={() => navigate(`/profile/${encodeURIComponent(review.reviewerEmail)}`)}
                        className="font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                      >
                        {review.reviewerName}
                      </button>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-sm font-medium">{review.rating}/5</span>
                      </div>
                    </div>
                    <div className={`text-xs flex items-center space-x-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>

                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Show More/Less Button */}
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <span>
                {showAllReviews
                  ? 'Show Less Reviews'
                  : `Show All ${reviews.length} Reviews`
                }
              </span>
              {showAllReviews ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
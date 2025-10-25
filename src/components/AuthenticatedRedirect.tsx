import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';

export default function AuthenticatedRedirect() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to home page
    if (currentUser && !loading) {
      navigate('/home', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!currentUser) {
    return <LandingPage />;
  }

  // This shouldn't render due to the useEffect redirect, but just in case
  return null;
}
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ListingsProvider } from './contexts/ListingsContext'
import { RentalsProvider } from './contexts/RentalsContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ChatProvider } from './contexts/ChatContext'
import AuthenticatedRedirect from './components/AuthenticatedRedirect'
import AuthPage from './components/AuthPage'
import HomePage from './components/HomePage'
import BrowsePage from './components/BrowsePage'
import ListItemPage from './components/ListItemPage'
import ListingDetailPage from './components/ListingDetailPage'
import MyRentalsPage from './components/MyRentalsPage'
import FavoritesPage from './components/FavoritesPage'
import ChatPage from './components/ChatPage'
import ProfilePage from './components/ProfilePage'
import UserProfilePage from './components/UserProfilePage'
import UserSettingsPage from './components/UserSettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './components/NotFoundPage'
import ScrollToTop from './components/ScrollToTop'
import ChatBot from './components/ChatBot'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ListingsProvider>
          <RentalsProvider>
            <FavoritesProvider>
              <ChatProvider>
                <Router>
                  <ScrollToTop />
                  <ChatBot />
                  <Routes>
                {/* Landing page with authenticated redirect */}
                <Route path="/" element={<AuthenticatedRedirect />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Protected routes for authenticated users */}
                <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/browse" element={<ProtectedRoute><BrowsePage /></ProtectedRoute>} />
                <Route path="/list-item" element={<ProtectedRoute><ListItemPage /></ProtectedRoute>} />
                <Route path="/listing/:id" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
                <Route path="/my-rentals" element={<ProtectedRoute><MyRentalsPage /></ProtectedRoute>} />
                <Route path="/my-rentals/:tab" element={<ProtectedRoute><MyRentalsPage /></ProtectedRoute>} />
                <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/profile/tab/:tab" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/profile/:email" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><UserSettingsPage /></ProtectedRoute>} />

                {/* 404 catch-all route */}
                <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </Router>
              </ChatProvider>
            </FavoritesProvider>
          </RentalsProvider>
        </ListingsProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
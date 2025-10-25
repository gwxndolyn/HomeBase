import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { favoritesService, listingsService, type FirebaseFavorite, type FirebaseListing } from '../services/firebase';

interface FavoriteWithListing extends FirebaseFavorite {
  listing?: FirebaseListing;
}

interface FavoritesContextType {
  favorites: FavoriteWithListing[];
  loading: boolean;
  addFavorite: (listingId: string) => Promise<void>;
  removeFavorite: (listingId: string) => Promise<void>;
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<FavoriteWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load user's favorites
  useEffect(() => {
    if (currentUser) {
      loadFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [currentUser]);

  const loadFavorites = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userFavorites = await favoritesService.getUserFavorites(currentUser.uid);

      // Load listing details for each favorite
      const favoritesWithListings = await Promise.all(
        userFavorites.map(async (favorite) => {
          try {
            const listing = await listingsService.getListingById(favorite.listingId);
            return {
              ...favorite,
              listing
            };
          } catch (error) {
            console.error(`Error loading listing ${favorite.listingId}:`, error);
            return {
              ...favorite,
              listing: null
            };
          }
        })
      );

      // Filter out favorites with missing listings
      const validFavorites = favoritesWithListings.filter(fav => fav.listing !== null);
      setFavorites(validFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (listingId: string) => {
    if (!currentUser) {
      alert('Please sign in to add favorites');
      return;
    }

    try {
      await favoritesService.addFavorite(currentUser.uid, listingId);
      await loadFavorites(); // Refresh the list
    } catch (error) {
      console.error('Error adding favorite:', error);
      alert('Failed to add to favorites. Please try again.');
      throw error;
    }
  };

  const removeFavorite = async (listingId: string) => {
    if (!currentUser) {
      alert('Please sign in to manage favorites');
      return;
    }

    try {
      await favoritesService.removeFavorite(currentUser.uid, listingId);
      // Remove from local state immediately for responsive UI
      setFavorites(prev => prev.filter(fav => fav.listingId !== listingId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites. Please try again.');
      throw error;
    }
  };

  const isFavorited = (listingId: string): boolean => {
    return favorites.some(fav => fav.listingId === listingId);
  };

  const toggleFavorite = async (listingId: string) => {
    if (!currentUser) {
      alert('Please sign in to add favorites');
      return;
    }

    console.log('[FavoritesContext] Toggling favorite for listing:', listingId);
    console.log('[FavoritesContext] Currently favorited:', isFavorited(listingId));

    try {
      if (isFavorited(listingId)) {
        console.log('[FavoritesContext] Removing from favorites...');
        await removeFavorite(listingId);
        console.log('[FavoritesContext] Successfully removed from favorites');
      } else {
        console.log('[FavoritesContext] Adding to favorites...');
        await addFavorite(listingId);
        console.log('[FavoritesContext] Successfully added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        addFavorite,
        removeFavorite,
        isFavorited,
        toggleFavorite,
        refreshFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
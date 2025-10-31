import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { localStorageService } from '../services/localStorageService';
import { useAuth } from './AuthContext';
import type { Listing } from './ListingsContext';

export interface FavoriteWithListing {
  id?: string;
  userId: string;
  listingId: string;
  createdAt: Date;
  listing?: Listing;
}

interface FavoritesContextType {
  favorites: FavoriteWithListing[];
  loading: boolean;
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
  addFavorite: (listingId: string) => Promise<void>;
  removeFavorite: (listingId: string) => Promise<void>;
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

  // Load favorites from localStorage
  useEffect(() => {
    localStorageService.initialize();
    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const userFavorites = localStorageService.getFavoritesByUserId(currentUser.id);
      const listings = localStorageService.getListings();

      // Enrich favorites with listing data
      const favoritesWithListings = userFavorites.map(fav => ({
        ...fav,
        listing: listings.find(l => l.id === fav.listingId),
      }));

      setFavorites(favoritesWithListings);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const isFavorited = (listingId: string): boolean => {
    return favorites.some(f => f.listingId === listingId);
  };

  const addFavorite = async (listingId: string) => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    try {
      const favorite = {
        id: localStorageService.generateId(),
        userId: currentUser.id,
        listingId,
        createdAt: new Date(),
      };

      localStorageService.saveFavorite(favorite);

      const listing = localStorageService.getListingById(listingId);
      setFavorites([...favorites, { ...favorite, listing }]);
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  };

  const removeFavorite = async (listingId: string) => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    try {
      localStorageService.removeFavorite(currentUser.id, listingId);
      setFavorites(favorites.filter(f => f.listingId !== listingId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  };

  const toggleFavorite = async (listingId: string) => {
    if (isFavorited(listingId)) {
      await removeFavorite(listingId);
    } else {
      await addFavorite(listingId);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorited,
        toggleFavorite,
        addFavorite,
        removeFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

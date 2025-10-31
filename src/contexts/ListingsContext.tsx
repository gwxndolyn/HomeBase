import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { localStorageService } from '../services/localStorageService';
import { useAuth } from './AuthContext';

export interface Listing {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  period: string;
  location: string;
  coordinates: { lat: number; lng: number };
  owner: string;
  ownerContact: string;
  image?: string;
  imageUrls?: string[];
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  isActive?: boolean;
  type?: 'product' | 'service';
  stock?: number;
  shopId?: string;
}

interface ListingsContextType {
  listings: Listing[];
  userListings: Listing[];
  loading: boolean;
  addListing: (listing: Omit<Listing, 'id' | 'rating' | 'reviews' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  delistListing: (id: string) => Promise<void>;
  relistListing: (id: string) => Promise<void>;
}

const ListingsContext = createContext<ListingsContextType | null>(null);

export function useListings() {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
}

interface ListingsProviderProps {
  children: ReactNode;
}

export function ListingsProvider({ children }: ListingsProviderProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load listings from localStorage on mount
  useEffect(() => {
    localStorageService.initialize();
    const allListings = localStorageService.getListings();
    setListings(allListings);
    setLoading(false);
  }, []);

  // Load user's listings when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setUserListings([]);
      return;
    }

    // Find listings belonging to current user's shop
    const shops = localStorageService.getShops();
    const userShop = shops.find(s => s.ownerId === currentUser.id);

    if (userShop) {
      const userListingsData = localStorageService.getListingsByShopId(userShop.id);
      setUserListings(userListingsData);
    } else {
      setUserListings([]);
    }
  }, [currentUser]);

  const addListing = async (listingData: Omit<Listing, 'id' | 'rating' | 'reviews' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to create listings');
    }

    try {
      const newListing: Listing = {
        ...listingData,
        id: localStorageService.generateId(),
        rating: 0,
        reviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      localStorageService.saveListing(newListing);

      // Update state
      setListings([newListing, ...listings]);
      setUserListings([newListing, ...userListings]);
    } catch (error) {
      console.error('Error adding listing:', error);
      throw error;
    }
  };

  const updateListing = async (id: string, updates: Partial<Listing>) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to update listings');
    }

    try {
      const listingToUpdate = userListings.find(listing => listing.id === id);
      if (!listingToUpdate) {
        throw new Error('You can only update your own listings');
      }

      const updatedListing = {
        ...listingToUpdate,
        ...updates,
        updatedAt: new Date(),
      };

      localStorageService.saveListing(updatedListing);

      // Update state
      setListings(listings.map(l => l.id === id ? updatedListing : l));
      setUserListings(userListings.map(l => l.id === id ? updatedListing : l));
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  };

  const deleteListing = async (id: string) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to delete listings');
    }

    try {
      const listingToDelete = userListings.find(listing => listing.id === id);
      if (!listingToDelete) {
        throw new Error('You can only delete your own listings');
      }

      localStorageService.deleteListing(id);

      // Update state
      setListings(listings.filter(l => l.id !== id));
      setUserListings(userListings.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  };

  const delistListing = async (id: string) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to delist listings');
    }

    try {
      const listingToDelist = userListings.find(listing => listing.id === id);
      if (!listingToDelist) {
        throw new Error('You can only delist your own listings');
      }

      await updateListing(id, { isActive: false });
    } catch (error) {
      console.error('Error delisting listing:', error);
      throw error;
    }
  };

  const relistListing = async (id: string) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to relist listings');
    }

    try {
      const listingToRelist = userListings.find(listing => listing.id === id);
      if (!listingToRelist) {
        throw new Error('You can only relist your own listings');
      }

      await updateListing(id, { isActive: true });
    } catch (error) {
      console.error('Error relisting listing:', error);
      throw error;
    }
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        userListings,
        loading,
        addListing,
        updateListing,
        deleteListing,
        delistListing,
        relistListing,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
}

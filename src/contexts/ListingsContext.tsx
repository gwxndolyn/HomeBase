import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface Listing {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  period: string;
  location: string;
  condition: string;
  availability: string;
  image: string;
  owner: string;
  ownerContact: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  reviews: number;
  createdAt: Timestamp | Date;
  userId: string;
  isActive?: boolean; // For delisting/relisting
}

interface ListingsContextType {
  listings: Listing[]; // All listings for browsing
  userListings: Listing[]; // Current user's listings only
  loading: boolean;
  addListing: (listing: Omit<Listing, 'id' | 'rating' | 'reviews' | 'createdAt' | 'userId'>) => Promise<void>;
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

  // Subscribe to all listings in real-time (for browsing)
  useEffect(() => {
    const listingsCollection = collection(db, 'listings');
    const listingsQuery = query(listingsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Listing[];

      setListings(listingsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to current user's listings in real-time
  useEffect(() => {
    if (!currentUser) {
      setUserListings([]);
      return;
    }

    const listingsCollection = collection(db, 'listings');
    const userListingsQuery = query(
      listingsCollection,
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(userListingsQuery, (snapshot) => {
      const userListingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Listing[];

      setUserListings(userListingsData);
    }, (error) => {
      console.error('Error fetching user listings:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addListing = async (listingData: Omit<Listing, 'id' | 'rating' | 'reviews' | 'createdAt' | 'userId'>) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to create listings');
    }

    try {
      const newListing = {
        ...listingData,
        rating: 0,
        reviews: 0,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        isActive: true, // New listings are active by default
      };

      await addDoc(collection(db, 'listings'), newListing);
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
      // Verify the listing belongs to the current user
      const listingToUpdate = userListings.find(listing => listing.id === id);
      if (!listingToUpdate) {
        throw new Error('You can only update your own listings');
      }

      const listingRef = doc(db, 'listings', id);
      await updateDoc(listingRef, updates);
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
      // Verify the listing belongs to the current user
      const listingToDelete = userListings.find(listing => listing.id === id);
      if (!listingToDelete) {
        throw new Error('You can only delete your own listings');
      }

      await deleteDoc(doc(db, 'listings', id));
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
      // Verify the listing belongs to the current user
      const listingToDelist = userListings.find(listing => listing.id === id);
      if (!listingToDelist) {
        throw new Error('You can only delist your own listings');
      }

      const listingRef = doc(db, 'listings', id);
      await updateDoc(listingRef, { isActive: false });
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
      // Verify the listing belongs to the current user
      const listingToRelist = userListings.find(listing => listing.id === id);
      if (!listingToRelist) {
        throw new Error('You can only relist your own listings');
      }

      const listingRef = doc(db, 'listings', id);
      await updateDoc(listingRef, { isActive: true });
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
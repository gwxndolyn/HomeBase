import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { localStorageService } from '../services/localStorageService';
import { useAuth } from './AuthContext';

export interface FirebaseShop {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  shopName: string;
  shopDescription: string;
  location: string;
  coordinates: { lat: number; lng: number };
  category: string;
  phone?: string;
  website?: string;
  instagram?: string;
  operatingHours: { [key: string]: { open: string; close: string } };
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ShopContextType {
  currentShop: FirebaseShop | null;
  shops: FirebaseShop[];
  loading: boolean;
  error: string | null;
  createShop: (shop: Omit<FirebaseShop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateShop: (shopId: string, updates: Partial<FirebaseShop>) => Promise<void>;
  deleteShop: (shopId: string) => Promise<void>;
  loadUserShop: () => Promise<void>;
  searchShops: (searchTerm: string, category?: string) => Promise<FirebaseShop[]>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within ShopProvider');
  }
  return context;
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [currentShop, setCurrentShop] = useState<FirebaseShop | null>(null);
  const [shops, setShops] = useState<FirebaseShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all shops on mount
  useEffect(() => {
    localStorageService.initialize();
    const allShops = localStorageService.getShops();
    setShops(allShops);
  }, []);

  // Load user's shop when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadUserShop();
    }
  }, [currentUser]);

  const loadUserShop = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userShops = localStorageService.getShopsByOwnerId(currentUser.id);
      if (userShops.length > 0) {
        setCurrentShop(userShops[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shop';
      setError(errorMessage);
      console.error('Error loading shop:', err);
    } finally {
      setLoading(false);
    }
  };

  const createShop = async (shop: Omit<FirebaseShop, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const shopId = localStorageService.generateId();
      const newShop: FirebaseShop = {
        ...shop,
        id: shopId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorageService.saveShop(newShop);
      setCurrentShop(newShop);
      setShops([newShop, ...shops]);
      return shopId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create shop';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateShop = async (shopId: string, updates: Partial<FirebaseShop>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const shop = localStorageService.getShopById(shopId);
      if (!shop) throw new Error('Shop not found');

      const updatedShop = { ...shop, ...updates, updatedAt: new Date() };
      localStorageService.saveShop(updatedShop);
      setCurrentShop(updatedShop);
      setShops(shops.map(s => s.id === shopId ? updatedShop : s));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shop';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteShop = async (shopId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      // Remove shop from localStorage (handle separately)
      setCurrentShop(null);
      setShops(shops.filter(s => s.id !== shopId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete shop';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchShops = async (searchTerm: string, category?: string): Promise<FirebaseShop[]> => {
    return shops.filter(shop =>
      (shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       shop.shopDescription.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!category || shop.category === category)
    );
  };

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        shops,
        loading,
        error,
        createShop,
        updateShop,
        deleteShop,
        loadUserShop,
        searchShops,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

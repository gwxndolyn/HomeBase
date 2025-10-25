import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { FirebaseShop } from '../services/firebase';
import { shopsService } from '../services/firebase';
import { useAuth } from './AuthContext';

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

export function ShopProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [currentShop, setCurrentShop] = useState<FirebaseShop | null>(null);
  const [shops, setShops] = useState<FirebaseShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's shop on mount
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
      const shop = await shopsService.getShopByOwner(currentUser.email || '');
      setCurrentShop(shop);
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
      const shopId = await shopsService.createShop(shop);

      // Reload the current shop
      if (currentUser) {
        const updatedShop = await shopsService.getShopByOwner(currentUser.email || '');
        setCurrentShop(updatedShop);
      }

      return shopId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create shop';
      setError(errorMessage);
      console.error('Error creating shop:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateShop = async (shopId: string, updates: Partial<FirebaseShop>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await shopsService.updateShop(shopId, updates);

      // Update local state
      setCurrentShop(prev =>
        prev ? { ...prev, ...updates } : null
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shop';
      setError(errorMessage);
      console.error('Error updating shop:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteShop = async (shopId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await shopsService.deleteShop(shopId);

      // Clear local state
      setCurrentShop(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete shop';
      setError(errorMessage);
      console.error('Error deleting shop:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchShops = async (searchTerm: string, category?: string): Promise<FirebaseShop[]> => {
    try {
      setError(null);
      const results = await shopsService.searchShops(searchTerm, category);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search shops';
      setError(errorMessage);
      console.error('Error searching shops:', err);
      return [];
    }
  };

  const value: ShopContextType = {
    currentShop,
    shops,
    loading,
    error,
    createShop,
    updateShop,
    deleteShop,
    loadUserShop,
    searchShops
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextType {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}

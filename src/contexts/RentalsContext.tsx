import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { localStorageService } from '../services/localStorageService';
import { useAuth } from './AuthContext';

export interface RentalRequest {
  id: string;
  toolId: string;
  toolName: string;
  toolImage?: string;
  renterName: string;
  renterEmail: string;
  ownerEmail: string;
  ownerName: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  message: string;
  quantity?: number;
  totalCost: number;
  status: 'pending' | 'approved' | 'declined' | 'completed' | 'cancelled';
  orderType?: 'product' | 'service';
  requestDate?: Date;
  location: string;
  hasReview?: boolean;
  shopId?: string;
}

interface RentalsContextType {
  userRentalRequests: RentalRequest[];
  receivedRentalRequests: RentalRequest[];
  loading: boolean;
  addRentalRequest: (request: Omit<RentalRequest, 'id' | 'requestDate'>) => Promise<{ emailsSent: boolean }>;
  updateRentalStatus: (id: string, status: RentalRequest['status']) => Promise<void>;
  updateRentalData: (id: string, data: Partial<RentalRequest>) => Promise<void>;
  getUserRentals: () => RentalRequest[];
  checkDateConflict: (toolId: string, startDate: string, endDate: string, excludeRequestId?: string) => boolean;
  getUnavailableDates: (toolId: string) => Array<{ start: string; end: string; status: string }>;
}

const RentalsContext = createContext<RentalsContextType | null>(null);

export function useRentals() {
  const context = useContext(RentalsContext);
  if (!context) {
    throw new Error('useRentals must be used within a RentalsProvider');
  }
  return context;
}

interface RentalsProviderProps {
  children: ReactNode;
}

export function RentalsProvider({ children }: RentalsProviderProps) {
  const [userRentalRequests, setUserRentalRequests] = useState<RentalRequest[]>([]);
  const [receivedRentalRequests, setReceivedRentalRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load rentals from localStorage
  useEffect(() => {
    localStorageService.initialize();
    if (!currentUser) {
      setUserRentalRequests([]);
      setReceivedRentalRequests([]);
      setLoading(false);
      return;
    }

    // Load user's rental requests (as renter)
    const userRequests = localStorageService.getRentalsByUserId(currentUser.email || '');
    setUserRentalRequests(userRequests);

    // Load rental requests received by user (as owner)
    const receivedRequests = localStorageService.getRentalsByOwner(currentUser.email || '');
    setReceivedRentalRequests(receivedRequests);

    setLoading(false);
  }, [currentUser]);

  const addRentalRequest = useCallback(async (request: Omit<RentalRequest, 'id' | 'requestDate'>) => {
    try {
      const newRequest: RentalRequest = {
        ...request,
        id: localStorageService.generateId(),
        requestDate: new Date(),
      };

      localStorageService.saveRental(newRequest);

      // Update state
      if (newRequest.renterEmail === currentUser?.email) {
        setUserRentalRequests([newRequest, ...userRentalRequests]);
      }
      if (newRequest.ownerEmail === currentUser?.email) {
        setReceivedRentalRequests([newRequest, ...receivedRentalRequests]);
      }

      return { emailsSent: true };
    } catch (error) {
      console.error('Error adding rental request:', error);
      return { emailsSent: false };
    }
  }, [currentUser, userRentalRequests, receivedRentalRequests]);

  const updateRentalStatus = useCallback(async (id: string, status: RentalRequest['status']) => {
    try {
      const request = localStorageService.getRentalById(id);
      if (!request) throw new Error('Request not found');

      const updated = { ...request, status };
      localStorageService.saveRental(updated);

      // Update state
      setUserRentalRequests(userRentalRequests.map(r => r.id === id ? updated : r));
      setReceivedRentalRequests(receivedRentalRequests.map(r => r.id === id ? updated : r));
    } catch (error) {
      console.error('Error updating rental status:', error);
      throw error;
    }
  }, [userRentalRequests, receivedRentalRequests]);

  const updateRentalData = useCallback(async (id: string, data: Partial<RentalRequest>) => {
    try {
      const request = localStorageService.getRentalById(id);
      if (!request) throw new Error('Request not found');

      const updated = { ...request, ...data };
      localStorageService.saveRental(updated);

      // Update state
      setUserRentalRequests(userRentalRequests.map(r => r.id === id ? updated : r));
      setReceivedRentalRequests(receivedRentalRequests.map(r => r.id === id ? updated : r));
    } catch (error) {
      console.error('Error updating rental data:', error);
      throw error;
    }
  }, [userRentalRequests, receivedRentalRequests]);

  const getUserRentals = useCallback(() => {
    return userRentalRequests;
  }, [userRentalRequests]);

  const checkDateConflict = useCallback((toolId: string, startDate: string, endDate: string, excludeRequestId?: string): boolean => {
    const rentals = localStorageService.getRentals();
    const toolRentals = rentals.filter(r => r.toolId === toolId && (r.status === 'approved' || r.status === 'pending'));

    return toolRentals.some(rental => {
      if (excludeRequestId && rental.id === excludeRequestId) return false;

      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.endDate || rental.startDate);
      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate || startDate);

      return !(requestEnd < rentalStart || requestStart > rentalEnd);
    });
  }, []);

  const getUnavailableDates = useCallback((toolId: string) => {
    const rentals = localStorageService.getRentals();
    const toolRentals = rentals.filter(r => r.toolId === toolId && r.status === 'approved');

    return toolRentals.map(rental => ({
      start: rental.startDate,
      end: rental.endDate || rental.startDate,
      status: rental.status,
    }));
  }, []);

  return (
    <RentalsContext.Provider
      value={{
        userRentalRequests,
        receivedRentalRequests,
        loading,
        addRentalRequest,
        updateRentalStatus,
        updateRentalData,
        getUserRentals,
        checkDateConflict,
        getUnavailableDates,
      }}
    >
      {children}
    </RentalsContext.Provider>
  );
}

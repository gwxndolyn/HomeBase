import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
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
import { emailService } from '../services/emailService';

interface RentalRequest {
  id: string;
  toolId: string;
  toolName: string;
  toolImage: string;
  renterName: string;
  renterEmail: string;
  ownerEmail: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  message: string;
  totalCost: number;
  status: 'pending' | 'approved' | 'declined' | 'completed' | 'cancelled';
  requestDate: Timestamp | Date;
  location: string;
  hasReview?: boolean;
}


interface RentalsContextType {
  userRentalRequests: RentalRequest[]; // Requests made BY the current user
  receivedRentalRequests: RentalRequest[]; // Requests received by the current user (for their listings)
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

  // Subscribe to rental requests made BY the current user
  useEffect(() => {
    if (!currentUser) {
      setUserRentalRequests([]);
      setReceivedRentalRequests([]);
      setLoading(false);
      return;
    }

    const rentalsCollection = collection(db, 'rentalRequests');

    // Get requests made BY the current user (where they are the renter)
    const userRequestsQuery = query(
      rentalsCollection,
      where('renterEmail', '==', currentUser.email || '')
    );

    const unsubscribeUserRequests = onSnapshot(userRequestsQuery, (snapshot) => {
      const userRequestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RentalRequest[];

      setUserRentalRequests(userRequestsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching user rental requests:', error);
      setLoading(false);
    });

    // Get requests received BY the current user (where they are the owner)
    const receivedRequestsQuery = query(
      rentalsCollection,
      where('ownerEmail', '==', currentUser.email || '')
    );

    const unsubscribeReceivedRequests = onSnapshot(receivedRequestsQuery, (snapshot) => {
      const receivedRequestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RentalRequest[];

      setReceivedRentalRequests(receivedRequestsData);
    }, (error) => {
      console.error('Error fetching received rental requests:', error);
    });

    return () => {
      unsubscribeUserRequests();
      unsubscribeReceivedRequests();
    };
  }, [currentUser]);

  const checkDateConflict = useCallback((toolId: string, startDate: string, endDate: string, excludeRequestId?: string) => {
    // Get all approved rentals for this tool
    const approvedRentals = [...userRentalRequests, ...receivedRentalRequests].filter(
      rental =>
        rental.toolId === toolId &&
        rental.status === 'approved' &&
        rental.id !== excludeRequestId // Exclude the current request when checking
    );

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    // Check for overlaps with existing rentals
    return approvedRentals.some(rental => {
      const existingStart = new Date(rental.startDate);
      const existingEnd = new Date(rental.endDate);

      // Check if dates overlap
      return (newStart <= existingEnd) && (newEnd >= existingStart);
    });
  }, [userRentalRequests, receivedRentalRequests]);

  const getUnavailableDates = useCallback((toolId: string) => {
    // Get all approved rentals for this tool
    const approvedRentals = [...userRentalRequests, ...receivedRentalRequests].filter(
      rental =>
        rental.toolId === toolId &&
        rental.status === 'approved'
    );

    return approvedRentals.map(rental => ({
      start: rental.startDate,
      end: rental.endDate,
      status: rental.status
    }));
  }, [userRentalRequests, receivedRentalRequests]);

  const addRentalRequest = async (requestData: Omit<RentalRequest, 'id' | 'requestDate'>) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to create rental requests');
    }

    // Check for date conflicts before creating the request
    if (checkDateConflict(requestData.toolId, requestData.startDate, requestData.endDate)) {
      throw new Error('The selected dates conflict with an existing rental. Please choose different dates.');
    }

    try {
      const newRequest = {
        ...requestData,
        requestDate: serverTimestamp(),
      };

      await addDoc(collection(db, 'rentalRequests'), newRequest);

      // Send email notifications
      const emailData = {
        ownerName: requestData.ownerName,
        ownerEmail: requestData.ownerEmail,
        renterName: requestData.renterName,
        renterEmail: requestData.renterEmail,
        itemName: requestData.toolName,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        totalCost: requestData.totalCost,
        message: requestData.message,
      };

      // Send emails in parallel
      const [ownerEmailResult, renterEmailResult] = await Promise.all([
        emailService.sendRentalRequestToOwner(emailData),
        emailService.sendRentalRequestConfirmationToRenter(emailData),
      ]);

      const emailsSent = ownerEmailResult.success && renterEmailResult.success;

      return { emailsSent };
    } catch (error) {
      console.error('Error adding rental request:', error);
      throw error;
    }
  };

  const updateRentalStatus = async (id: string, status: RentalRequest['status']) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to update rental status');
    }

    try {
      // Verify the user has permission to update this rental
      const canUpdate = [...userRentalRequests, ...receivedRentalRequests].some(
        request => request.id === id &&
        (request.renterEmail === currentUser.email || request.ownerEmail === currentUser.email)
      );

      if (!canUpdate) {
        throw new Error('You can only update rentals you are involved in');
      }

      const rentalRef = doc(db, 'rentalRequests', id);
      await updateDoc(rentalRef, { status });
    } catch (error) {
      console.error('Error updating rental status:', error);
      throw error;
    }
  };

  const updateRentalData = async (id: string, data: Partial<RentalRequest>) => {
    if (!currentUser) {
      throw new Error('User must be authenticated to update rental data');
    }

    try {
      // Verify the user has permission to update this rental
      const canUpdate = [...userRentalRequests, ...receivedRentalRequests].some(
        request => request.id === id &&
        (request.renterEmail === currentUser.email || request.ownerEmail === currentUser.email)
      );

      if (!canUpdate) {
        throw new Error('You can only update rentals you are involved in');
      }

      const rentalRef = doc(db, 'rentalRequests', id);
      await updateDoc(rentalRef, data);
    } catch (error) {
      console.error('Error updating rental data:', error);
      throw error;
    }
  };

  const getUserRentals = () => {
    // Return the user's rental requests (already filtered by current user)
    return userRentalRequests;
  };

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
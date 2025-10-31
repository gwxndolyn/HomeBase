// Service to manage all data with localStorage persistence
import {
  mockUsers,
  mockShops,
  mockListings,
  mockRentals,
  mockReviews,
  mockFavorites,
  mockChats,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'homebase_users',
  SHOPS: 'homebase_shops',
  LISTINGS: 'homebase_listings',
  RENTALS: 'homebase_rentals',
  REVIEWS: 'homebase_reviews',
  FAVORITES: 'homebase_favorites',
  CHATS: 'homebase_chats',
  CURRENT_USER: 'homebase_current_user',
};

class LocalStorageService {
  private initialized = false;

  // Initialize with mock data if not already in storage
  initialize() {
    if (this.initialized) return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHOPS)) {
      localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(mockShops));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
      localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(mockListings));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RENTALS)) {
      localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(mockRentals));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(mockReviews));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(mockFavorites));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(mockChats));
    }

    this.initialized = true;
  }

  // USERS
  getUsers() {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : mockUsers;
  }

  getUserById(id: string) {
    return this.getUsers().find((u: any) => u.id === id);
  }

  getUserByEmail(email: string) {
    return this.getUsers().find((u: any) => u.email === email);
  }

  saveUser(user: any) {
    const users = this.getUsers();
    const index = users.findIndex((u: any) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user: any) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // SHOPS
  getShops() {
    const data = localStorage.getItem(STORAGE_KEYS.SHOPS);
    return data ? JSON.parse(data) : mockShops;
  }

  getShopById(id: string) {
    return this.getShops().find((s: any) => s.id === id);
  }

  getShopsByOwnerId(ownerId: string) {
    return this.getShops().filter((s: any) => s.ownerId === ownerId);
  }

  saveShop(shop: any) {
    const shops = this.getShops();
    const index = shops.findIndex((s: any) => s.id === shop.id);
    if (index >= 0) {
      shops[index] = shop;
    } else {
      shops.push(shop);
    }
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
  }

  // LISTINGS
  getListings() {
    const data = localStorage.getItem(STORAGE_KEYS.LISTINGS);
    return data ? JSON.parse(data) : mockListings;
  }

  getListingById(id: string) {
    return this.getListings().find((l: any) => l.id === id);
  }

  getListingsByShopId(shopId: string) {
    return this.getListings().filter((l: any) => l.shopId === shopId);
  }

  getListingsByOwnerId(ownerId: string) {
    return this.getListings().filter((l: any) => {
      const shop = this.getShopById(l.shopId);
      return shop?.ownerId === ownerId;
    });
  }

  saveListing(listing: any) {
    const listings = this.getListings();
    const index = listings.findIndex((l: any) => l.id === listing.id);
    if (index >= 0) {
      listings[index] = listing;
    } else {
      listings.push(listing);
    }
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }

  deleteListing(id: string) {
    const listings = this.getListings().filter((l: any) => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }

  // RENTALS (Orders & Bookings)
  getRentals() {
    const data = localStorage.getItem(STORAGE_KEYS.RENTALS);
    return data ? JSON.parse(data) : mockRentals;
  }

  getRentalById(id: string) {
    return this.getRentals().find((r: any) => r.id === id);
  }

  getRentalsByUserId(userId: string) {
    return this.getRentals().filter((r: any) => r.renterEmail === userId);
  }

  getRentalsByOwner(ownerEmail: string) {
    return this.getRentals().filter((r: any) => r.ownerEmail === ownerEmail);
  }

  saveRental(rental: any) {
    const rentals = this.getRentals();
    const index = rentals.findIndex((r: any) => r.id === rental.id);
    if (index >= 0) {
      rentals[index] = rental;
    } else {
      rentals.push(rental);
    }
    localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(rentals));
  }

  // REVIEWS
  getReviews() {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : mockReviews;
  }

  getReviewsByListingId(listingId: string) {
    return this.getReviews().filter((r: any) => r.listingId === listingId);
  }

  saveReview(review: any) {
    const reviews = this.getReviews();
    reviews.push(review);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }

  // FAVORITES
  getFavorites() {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : mockFavorites;
  }

  getFavoritesByUserId(userId: string) {
    return this.getFavorites().filter((f: any) => f.userId === userId);
  }

  saveFavorite(favorite: any) {
    const favorites = this.getFavorites();
    favorites.push(favorite);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }

  removeFavorite(userId: string, listingId: string) {
    const favorites = this.getFavorites().filter(
      (f: any) => !(f.userId === userId && f.listingId === listingId)
    );
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }

  // CHATS
  getChats() {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    return data ? JSON.parse(data) : mockChats;
  }

  getChatById(id: string) {
    return this.getChats().find((c: any) => c.id === id);
  }

  getChatsByParticipant(userId: string) {
    return this.getChats().filter((c: any) => c.participants.includes(userId));
  }

  saveChat(chat: any) {
    const chats = this.getChats();
    const index = chats.findIndex((c: any) => c.id === chat.id);
    if (index >= 0) {
      chats[index] = chat;
    } else {
      chats.push(chat);
    }
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }

  addChatMessage(chatId: string, message: any) {
    const chats = this.getChats();
    const chat = chats.find((c: any) => c.id === chatId);
    if (chat) {
      if (!chat.messages) chat.messages = [];
      chat.messages.push(message);
      chat.lastMessage = message.text;
      chat.lastMessageTime = message.createdAt;
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    }
  }

  // RESET - Clear all data
  resetData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SHOPS);
    localStorage.removeItem(STORAGE_KEYS.LISTINGS);
    localStorage.removeItem(STORAGE_KEYS.RENTALS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.initialized = false;
    this.initialize();
  }

  // Generate unique ID
  generateId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }
}

export const localStorageService = new LocalStorageService();

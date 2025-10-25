# HomeBase Implementation Guide

## 🎯 Project Overview

**HomeBase** is a modern shop-centric home business platform built with React, TypeScript, and Firebase that enables home-based entrepreneurs to:
- Create and manage their own digital shops with full storefronts
- List products and services within shops
- Manage orders and service bookings
- Build a customer community with reviews and ratings
- Engage in real-time messaging with customers
- Showcase shops as primary entities with featured and popular listings
- Allow customers to browse shops directly and explore all offerings

## ✅ Completed Features

### Core Platform
- ✅ User authentication (Firebase Auth + Google OAuth)
- ✅ Shop management system with profiles and operating hours
- ✅ Product and service listings with type differentiation
- ✅ Advanced search and filtering with Google Maps integration
- ✅ Real-time messaging between buyers and sellers
- ✅ Review and rating system
- ✅ Favorites/Bookmarking system
- ✅ Orders and bookings management page
- ✅ Service availability calendar management
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark/Light theme support

### Business Features
- ✅ Shop creation and customization
- ✅ Operating hours management
- ✅ Product listing with inventory management
- ✅ Service booking with flexible pricing periods
- ✅ Order status tracking (pending → approved → completed)
- ✅ Customer communication system
- ✅ Email notifications for orders/bookings
- ✅ Service availability time slot management
- ✅ Calendar-based booking for services

### Categories (12 Home Business Types)
1. Handmade Crafts & Artwork
2. Baked Goods & Desserts
3. Home Decor & Furniture
4. Cleaning & Organization Services
5. Pet Care Services
6. Beauty & Personal Care
7. Photography & Videography Services
8. Consulting & Coaching
9. Digital Products & Services
10. Health & Wellness
11. Writing & Content Services
12. Music & Audio Services

## 📊 Database Schema

### Firestore Collections

#### `users/`
```
{
  email: string
  displayName: string
  photoURL?: string
  createdAt: timestamp
}
```

#### `shops/`
```
{
  ownerId: string
  ownerEmail: string
  ownerName: string
  shopName: string
  shopDescription: string
  location: string
  coordinates: { lat, lng }
  category: string
  phone?: string
  website?: string
  instagram?: string
  operatingHours: {
    [day]: { open: string, close: string }
  }
  rating: number
  reviews: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `listings/`
```
{
  name: string
  description: string
  category: string
  price: number
  period: string  // 'unit', 'day', 'hour', 'session', etc.
  location: string
  coordinates: { lat, lng }
  owner: string
  ownerContact: string
  imageUrls: string[]
  type: 'product' | 'service'  // NEW
  stock?: number  // NEW
  shopId?: string  // NEW
  isActive: boolean  // NEW
  rating: number
  reviews: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `rentalRequests/` (Orders & Bookings)
```
{
  toolId: string  // Product/Service ID
  toolName: string
  renterName: string
  renterEmail: string
  ownerEmail: string
  ownerName: string
  shopId?: string  // NEW
  startDate: string
  endDate?: string  // Optional for products
  startTime: string
  endTime?: string  // Optional for products
  message: string
  quantity?: number  // NEW - For products
  totalCost: number
  status: 'pending' | 'approved' | 'declined' | 'completed'
  orderType: 'product' | 'service'  // NEW
  location: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `reviews/`
```
{
  listingId: string
  reviewerName: string
  reviewerEmail: string
  rating: number (1-5)
  comment: string
  createdAt: timestamp
}
```

#### `favorites/`
```
{
  userId: string
  listingId: string
  createdAt: timestamp
}
```

#### `chats/`
```
{
  participants: string[]  // User IDs
  lastMessage: string
  lastMessageTime: timestamp
  createdAt: timestamp
  updatedAt: timestamp

  // Subcollection: messages/
  messages/
    {
      senderId: string
      text: string
      createdAt: timestamp
      read: boolean
    }
}
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 7** - Build tool
- **React Router DOM 7** - Routing
- **Tailwind CSS 3.4** - Styling
- **Lucide React** - Icons
- **Three.js** - 3D animations
- **Google Maps API** - Location services

### Backend
- **Firebase**
  - Authentication (Email/Password + Google OAuth)
  - Firestore Database
  - Cloud Storage
  - Hosting
- **Node.js/Express** - Email service server
- **Nodemailer** - Email notifications

### State Management
- **React Context API** - Global state
- **Providers**:
  - AuthContext
  - ThemeContext
  - ListingsContext
  - RentalsContext
  - FavoritesContext
  - ChatContext
  - ShopContext (NEW)

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm 8+
- Firebase project
- Google Maps API key

### Installation

1. **Clone Repository**
```bash
git clone <repository-url>
cd HomeBase
```

2. **Install Dependencies**
```bash
npm install
cd server && npm install && cd ..
```

3. **Configure Environment**
Create `.env` file:
```env
# Firebase
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# Google APIs
VITE_GOOGLE_MAPS_API_KEY=xxx
VITE_GEMINI_API_KEY=xxx

# Backend
VITE_BACKEND_URL=http://localhost:3001

# Email Service
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=xxx
```

4. **Run Development**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server && npm start
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

## 🗓️ Calendar & Availability Features

### RentalCalendar Component (Enhanced)
- **View Modes**: customer, owner, availability
- **Availability Mode Features**:
  - Click on any date to add time slots
  - Set start and end times for availability
  - Visual representation with purple color coding
  - Remove time slots with one click
  - Real-time callback for availability updates
- **Owner Mode Features**:
  - View all approved and completed bookings
  - Track booking status with color coding
  - Click bookings to see full details
- **Customer Mode Features**:
  - View all your orders and bookings
  - Track rental status
  - Filter by status

### ServiceAvailabilityTab Component (New)
- Manages service availability for sellers
- Service selection dropdown
- Calendar integration for time slot management
- Availability summary display
- Dark/light theme support

## 🏪 Shop-Centric Architecture

### Featured Shops (Homepage)
- Top 6 shops displayed with ratings and descriptions
- Links to individual shop storefronts
- Shop category and location information
- "View All" navigation to browse all shops

### Popular Shops (Homepage)
- Shops sorted by rating (top 8)
- Quick access to highest-rated businesses
- Shop metrics at a glance
- Direct navigation to shop pages

### Shop Browsing (BrowsePage)
- Toggle between "Products" and "Shops" modes
- Search shops by name or category
- Filter shops by business type
- View all available shops in list view
- Shop cards show:
  - Shop name and category
  - Rating and review count
  - Location information
  - Quick "Visit Shop" button

### Shop Storefronts (ShopFrontPage)
- Comprehensive shop display with:
  - Shop header with banner
  - Shop name, description, ratings
  - Operating hours (7-day schedule)
  - Contact information (phone, website, social)
  - Product/Service tabs
- Product showcase:
  - All shop products with details
  - Price, stock, and ratings
  - "View Details" navigation
- Service showcase:
  - All shop services available
  - Pricing and booking options
  - "Book Now" functionality
- Instruction tab:
  - How to order/book guidance
  - Contact information
  - Message shop button
- Reservations tab:
  - Service availability
  - Quick booking shortcuts
  - Service provider information

## 📋 Routes & Pages

### Public Routes
- `/` - Authenticated redirect/landing
- `/auth` - Login/Registration

### Protected Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/home` | HomePage | Dashboard with featured/popular shops |
| `/browse` | BrowsePage | Browse products/shops with toggle |
| `/shop-front/:shopId` | ShopFrontPage | Shop storefront with all products |
| `/list-item` | ListItemPage | Create/edit listings |
| `/listing/:id` | ListingDetailPage | Product/service details |
| `/shop` | ShopPage | Manage your shop |
| `/orders` | OrdersPage | Manage orders & bookings |
| `/favorites` | FavoritesPage | Saved items |
| `/chat` | ChatPage | Messaging |
| `/profile` | ProfilePage | User profile |
| `/profile/:email` | UserProfilePage | View other profiles |
| `/settings` | UserSettingsPage | Account settings |

## 🔄 Key Workflows

### Seller Workflow
1. Sign up → Create Shop → Set shop details & hours
2. List products/services with type, pricing, inventory
3. For services: Set availability time slots via calendar interface
4. Receive orders/booking requests
5. Approve/decline requests
6. Mark complete when done
7. Receive reviews and ratings

### Service Availability Management
1. Navigate to My Shop → Service Availability tab
2. Select service from dropdown
3. Click on any date in calendar to add time slot
4. Set start and end times for availability
5. Time slots appear on calendar in purple
6. Remove slots as needed
7. Customers can only book during available slots

### Buyer Workflow
1. Sign up → Browse products/services
2. Search by category, location, price
3. View details and reviews
4. Place order (products) or booking request (services)
5. For services: Book during provider's available slots
6. Track order status
7. Receive notifications
8. Leave review after completion

## 📊 Admin & Analytics (Future)

Recommended additions:
- Dashboard with statistics
- Sales analytics
- Customer analytics
- Revenue tracking
- Inventory management
- Bulk operations
- Admin moderation panel

## 🔐 Security

### Implemented
- Firebase Authentication (secure)
- Firestore Security Rules
- HTTPS/SSL encryption
- User isolation (users see only public data)
- Email verification (Firebase)

### Recommendations
- Add payment processing (Stripe/PayPal)
- Implement 2FA for shops
- Add content moderation
- Fraud detection system
- GDPR compliance
- Rate limiting on APIs

## 🎨 Customization

### Themes
- Dark mode (default)
- Light mode
- Custom color schemes via Tailwind config

### Branding
- Update logo in components
- Modify colors in tailwind.config.js
- Update brand text in components
- Customize email templates

## 🧪 Testing

### Manual Testing Checklist
- [ ] User authentication flow
- [ ] Shop creation and editing
- [ ] Product/service listing
- [ ] Search and filtering
- [ ] Order placement and tracking
- [ ] Booking requests and approvals
- [ ] Messaging system
- [ ] Review submission
- [ ] Favorite management
- [ ] Dark/light theme toggle
- [ ] Responsive design (mobile)
- [ ] Email notifications

### Automated Testing (To Implement)
```bash
npm install --save-dev vitest @testing-library/react
npm run test
```

## 📦 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Environment Setup
1. Create production `.env.production`
2. Use production Firebase project
3. Update CORS settings
4. Configure custom domain (optional)

### Backend Deployment
1. Deploy to Vercel, Heroku, or AWS
2. Update VITE_BACKEND_URL in production .env
3. Configure environment variables
4. Set up email service credentials

## 📈 Future Enhancements

### Phase 2 (Next Priority)
- [ ] Payment integration (Stripe)
- [ ] Advanced availability calendar for services
- [ ] Inventory management dashboard
- [ ] Analytics and reporting
- [ ] Business tier features (premium shops)
- [ ] Promotional tools

### Phase 3 (Medium-term)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Currency conversion
- [ ] Tax calculator

### Phase 4 (Long-term)
- [ ] Marketplace commission system
- [ ] Seller verification program
- [ ] Advanced analytics
- [ ] Marketing tools
- [ ] API for third-party integrations
- [ ] White-label solutions

## 🆘 Troubleshooting

### Firebase Connection Issues
```
Error: Firebase config invalid
→ Check VITE_ prefix in .env
→ Verify API keys are correct
→ Ensure Firebase project is active
```

### Google Maps Not Loading
```
→ Check API key is enabled
→ Verify Geocoding API is enabled
→ Check usage limits
```

### Email Notifications Not Sending
```
→ Check Gmail credentials
→ Verify GMAIL_APP_PASSWORD is correct
→ Ensure 2FA is enabled on Gmail
→ Check CORS on backend
```

## 📞 Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Google Maps API Docs](https://developers.google.com/maps)

## 📄 License

This project is developed as a home business platform. See LICENSE file for details.

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Status**: Production Ready (MVP)

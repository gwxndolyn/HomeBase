# HomeBase - Home Business Platform

HomeBase is a platform that empowers home-based entrepreneurs to establish their own digital shop, list their products and services, and connect with customers. Built with modern web technologies for a seamless home business experience.

## 🌟 Features

### Core Functionality
- **User Authentication** - Secure Firebase-based authentication system
- **Shop Setup** - Create and manage your own business shop with custom branding
- **Product & Service Listings** - Create, browse, and manage product and service listings with image uploads
- **Flexible Ordering** - E-commerce checkout for products and RSVP system for service-based bookings
- **Availability Calendar** - Service-based businesses can set availability and manage bookings
- **Email Notifications** - Automated email notifications for orders and booking requests
- **Real-time Updates** - Live updates for order and booking status
- **Favorites System** - Save and organize preferred products and services
- **Shop Profiles** - Comprehensive business profiles with ratings and reviews
- **Review System** - Rate and review products and services
- **Map Integration** - Google Maps integration for location-based business discovery

### User Experience
- **Interactive Dashboard** - Personalized home page with earnings and statistics
- **Advanced Search & Filtering** - Find tools by category, location, price, and availability
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme** - Theme switching with user preference persistence
- **Smooth Animations** - Liquid glass navigation and modern UI animations

### Business Categories Supported
- 🎨 Handmade Crafts & Artwork
- 🍰 Baked Goods & Desserts
- 🏠 Home Decor & Furniture
- 🧹 Cleaning & Organization Services
- 🐾 Pet Care Services
- 💅 Beauty & Personal Care
- 📸 Photography & Videography Services
- 🎓 Consulting & Coaching
- 💻 Digital Products & Services
- 🌿 Health & Wellness
- 📝 Writing & Content Services
- 🎵 Music & Audio Services

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Lucide React** - Beautiful, customizable icons
- **Three.js** - 3D graphics and animations

### Backend & Services
- **Node.js & Express** - Email notification service
- **Firebase** - Authentication, Firestore database, and cloud storage
- **Context API** - State management for auth, listings, rentals, and favorites
- **Google Maps API** - Location services and map integration

### UI Components
- **Radix UI** - Accessible, unstyled UI primitives
- **Class Variance Authority** - CSS-in-JS utility for component variants
- **Tailwind Merge** - Intelligent Tailwind class merging

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

Verify your installations:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd WAD2
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies (Email Service)
```bash
cd server
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Backend URL (for email service)
VITE_BACKEND_URL=http://localhost:3001

# Gmail Configuration (for email notifications)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the setup wizard
3. Enable **Email/Password** authentication in **Authentication** > **Sign-in method**
4. Create a **Firestore Database** (start in test mode)
5. Enable **Cloud Storage** (start in test mode)
6. Get your Firebase configuration from **Project Settings** > **General** > **Your apps**
7. Copy the configuration values to your `.env` file

### 5. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API** and **Geocoding API**
3. Create an API key in **Credentials**
4. Add the API key to your `.env` file as `VITE_GOOGLE_MAPS_API_KEY`

### 6. Gmail Setup (for Email Notifications)

1. Enable 2-Factor Authentication on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Create an app password for "Mail"
4. Add the credentials to your `.env` file

## 🏃‍♂️ Running the Application

### Development Mode

Run **both** the frontend and backend servers in separate terminals:

#### Terminal 1 - Frontend
```bash
npm run dev
```
Frontend available at: `http://localhost:5173`

#### Terminal 2 - Backend
```bash
cd server
npm start
```
Backend available at: `http://localhost:3001`

### Production Build
```bash
npm run build
```
Built files will be in the `dist` folder.

## 📁 Project Structure

```
WAD2/
├── public/                 # Static assets
├── server/                # Backend email service
│   ├── index.js          # Express server
│   ├── package.json      # Backend dependencies
│   └── requirements.txt  # Dependencies list
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── AuthPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── BrowsePage.tsx
│   │   ├── ListItemPage.tsx
│   │   ├── ListingDetailPage.tsx
│   │   ├── MyRentalsPage.tsx
│   │   ├── FavoritesPage.tsx
│   │   └── ProfilePage.tsx
│   ├── contexts/        # State management
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── ListingsContext.tsx
│   │   ├── RentalsContext.tsx
│   │   └── FavoritesContext.tsx
│   ├── services/        # External services
│   │   ├── firebase.ts
│   │   └── emailService.ts
│   ├── config/          # Configuration
│   └── utils/           # Utilities
├── .env.example        # Environment template
├── .env               # Your environment variables
├── package.json        # Dependencies
└── README.md          # This file
```

## 🎯 Key Pages & Routes

### Public Routes
- `/` - Landing page
- `/auth` - Login and registration

### Protected Routes
- `/home` - Dashboard
- `/browse` - Browse businesses and products with map
- `/list-item` - Create product/service listings
- `/listing/:id` - Product/Service details
- `/shop` - My shop management
- `/orders` - Order and booking management
- `/favorites` - Saved products and services
- `/profile` - Business profile
- `/profile/:email` - View other business profiles

## 📝 License

This project is developed for the HomeBase home business platform.

---

Made with ❤️ for Home Entrepreneurs

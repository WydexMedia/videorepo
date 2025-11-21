# Product Requirements Document (PRD)
## ProSkill Learning Platform

---

## 1. Project Overview

### 1.1 Product Name
**ProSkill Learning** (Frontend: "proskill-learning")

### 1.2 Product Description
A Next.js-based learning platform that enables users to access video courses. Users authenticate via phone number OTP verification, complete registration, and access a modern dashboard to view and interact with video content.

### 1.3 Technology Stack
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Video Player**: Plyr React
- **State Management**: React Hooks + LocalStorage
- **Notifications**: Sonner (Toast)
- **Theme**: next-themes (Dark/Light mode)
- **Phone Input**: react-international-phone
- **Icons**: Lucide React

---

## 2. User Flows

### 2.1 Authentication Flow

#### Flow 1: New User Registration
```
1. User lands on Login Page (/login)
2. User enters phone number (international format)
3. User clicks "Sign In" → OTP sent to phone
4. User enters 6-digit OTP
5. Backend checks if user exists:
   - If NEW USER → Redirects to Registration Page (/registration)
   - If EXISTING USER → Redirects to Home Page (/home)
6. On Registration Page:
   - User enters: Full Name, Email, Place
   - User submits → Account created
   - Token & user data stored in localStorage
   - Redirects to Home Page (/home)
```

#### Flow 2: Existing User Login
```
1. User enters phone number
2. OTP sent to phone
3. User enters OTP
4. Backend verifies OTP & user exists
5. Token & user data stored
6. Redirects to Home Page (/home)
```

#### Flow 3: Logout Flow
```
1. User clicks logout from Dashboard Header dropdown
2. Token & user data cleared from localStorage
3. Redirects to Login Page (/login)
```

### 2.2 Dashboard Flow
```
1. User authenticated → Home Page (/home)
2. Dashboard displays:
   - Welcome Banner with progress
   - Calendar widget
   - Video courses grid
3. User can:
   - View videos
   - Navigate sidebar (Home, Students, Teachers, Courses, etc.)
   - Access profile page
   - Toggle theme (Dark/Light)
   - Search (UI ready, functionality pending)
```

### 2.3 Video Viewing Flow
```
1. User clicks on video card
2. Video player (Plyr) loads
3. User can:
   - Play/Pause
   - Adjust quality (if multiple qualities available)
   - Adjust playback speed
   - Fullscreen
   - Volume control
4. Video loads from S3 or API endpoint
```

---

## 3. Features & Functionality

### 3.1 Authentication Features

#### Phone Number Authentication
- International phone number input with country selector
- Default country: India (+91)
- Phone number validation
- OTP generation and verification
- Auto-focus OTP input fields
- Auto-submit when 6 digits entered
- Back navigation from OTP to phone input

#### Registration
- Required fields: Name, Email, Place
- Email validation
- Phone number pre-filled from OTP verification
- Error handling with specific field errors
- Success toast notifications

#### Session Management
- JWT token stored in localStorage
- User data persisted in localStorage
- Protected routes (redirects to login if not authenticated)
- Logout clears all stored data

### 3.2 Dashboard Features

#### Welcome Banner
- Personalized greeting with user's first name
- Progress indicator (80% hardcoded, can be dynamic)
- Call-to-action button
- Visual progress dots

#### Calendar Widget
- Monthly calendar view
- Date selection
- Today highlighting
- Community growth indicator (62% hardcoded)
- Month navigation (prev/next)

#### Video Courses Section
- Grid layout (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Video cards with:
  - Video player (Plyr)
  - Video title
  - Duration (if available)
  - Thumbnail/poster image
  - Multiple quality support (1080p, 720p, 480p, 360p)
- Loading states
- Error handling (CORS, network errors)
- Fallback to S3 URLs if API fails

### 3.3 Navigation Features

#### Sidebar Navigation
- Navigation items:
  - Home
  - Students
  - Teachers
  - Courses
  - Live Class
  - Attendance
  - Payments
  - Library
  - Reports
- Active state highlighting
- Upgrade to Pro CTA (UI only)

#### Dashboard Header
- Search bar (UI ready)
- Theme toggle (Dark/Light)
- Notifications bell (UI ready)
- User avatar dropdown with:
  - User name & phone number
  - Member since date
  - Logout option

### 3.4 Profile Page Features
- User information display:
  - Full name
  - Phone number
  - Verification status
  - Member since date
  - Account ID
  - Country code
- Back navigation to home
- Card-based layout

### 3.5 Video Player Features
- Plyr video player with:
  - Play/Pause controls
  - Progress bar
  - Current time / Duration
  - Volume control
  - Quality selector (if multiple qualities)
  - Playback speed control
  - Fullscreen mode
  - Keyboard shortcuts
- Error handling:
  - Network errors
  - CORS errors
  - Decode errors
  - Format not supported
- Loading states
- Multiple video format support (MP4, WebM, OGG, HLS, DASH)

---

## 4. API Integration

### 4.1 API Base Configuration
- Base URL: `process.env.NEXT_PUBLIC_API_URL` or `http://localhost:5001/api`
- All API calls return standardized response:
```typescript
{
  status: 'success' | 'error',
  message: string,
  data?: T,
  errors?: Array<{ path: string, msg: string }>
}
```

### 4.2 Authentication Endpoints

#### POST `/api/auth/send-otp`
- **Purpose**: Send OTP to phone number
- **Request Body**: `{ countryCode: string, phoneNumber: string }`
- **Response**: `ApiResponse`

#### POST `/api/auth/verify-otp`
- **Purpose**: Verify OTP and login
- **Request Body**: `{ countryCode: string, phoneNumber: string, otp: string }`
- **Response**: `ApiResponse<LoginResponse>`
- **LoginResponse**: `{ token: string, user: User, requiresRegistration?: boolean }`

#### POST `/api/auth/resend-otp`
- **Purpose**: Resend OTP
- **Request Body**: `{ countryCode: string, phoneNumber: string }`
- **Response**: `ApiResponse`

#### POST `/api/auth/register`
- **Purpose**: Register new user
- **Request Body**: `{ countryCode: string, phoneNumber: string, name: string, email: string, place: string }`
- **Response**: `ApiResponse<LoginResponse>`

#### GET `/api/auth/me`
- **Purpose**: Get current user info
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `ApiResponse<{ user: User }>`

#### POST `/api/auth/logout`
- **Purpose**: Logout user
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `ApiResponse`

### 4.3 Video Endpoints

#### GET `/api/videos`
- **Purpose**: Get list of videos
- **Headers**: `Authorization: Bearer <token>` (optional)
- **Response**: `ApiResponse<Video[]>`
- **Fallback**: Uses `S3_VIDEOS` from config if API fails

### 4.4 Data Models

#### User Model
```typescript
{
  id: string;
  phoneNumber: string;
  countryCode: string;
  fullPhoneNumber: string;
  isVerified: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
  preferences: {
    language: string;
    notifications: boolean;
  };
  lastLogin?: string;
  createdAt: string;
}
```

#### Video Model
```typescript
{
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  createdAt?: string;
  qualities?: {
    1080?: string;
    720?: string;
    480?: string;
    360?: string;
  };
}
```

---

## 5. UI/UX Components

### 5.1 Design System
- **Color Scheme**: Blue to Purple gradient theme
- **Typography**: Geist Sans & Geist Mono fonts
- **Theme Support**: Dark mode & Light mode
- **Responsive**: Mobile-first design
- **Component Library**: Custom UI components built on Radix UI

### 5.2 Key Components

#### Form Components
- `Button` - Multiple variants (primary, outline, ghost)
- `Input` - Text input with icons
- `Label` - Form labels
- `Card` - Container cards
- `PhoneInput` - International phone input

#### Layout Components
- `Sidebar` - Navigation sidebar
- `DashboardHeader` - Top header with search, theme, notifications
- `WelcomeBanner` - Welcome card with progress
- `Calendar` - Calendar widget
- `VideoCard` - Video player card

#### Feedback Components
- `Toaster` (Sonner) - Toast notifications
- Loading spinners
- Error messages

### 5.3 Page Layouts

#### Login/Registration Pages
- Split layout (50/50 on desktop)
- Left: Form
- Right: Dashboard preview image
- Responsive: Full width on mobile

#### Dashboard Pages
- Sidebar (fixed left)
- Main content area (flexible)
- Header (fixed top)
- Scrollable content area

---

## 6. State Management

### 6.1 Local Storage
- `auth_token` - JWT token
- `user_data` - Serialized user object
- `pending_registration_phone` - Phone data during registration flow

### 6.2 React State
- Component-level state using `useState`
- Route protection using `useEffect` + router
- No global state management library (Redux/Zustand)

---

## 7. Routing Structure

```
/ (root)
  ├── /login - Login page
  ├── /registration - Registration page
  ├── /home - Dashboard home page
  └── /profile - User profile page
```

### Route Protection
- `/home` and `/profile` require authentication
- Unauthenticated users redirected to `/login`
- Registration page requires pending phone data

---

## 8. Error Handling

### 8.1 API Error Handling
- Network errors → Toast notification
- Validation errors → Field-specific error messages
- Generic error fallbacks

### 8.2 Video Error Handling
- CORS errors → User-friendly message
- Network errors → Retry suggestion
- Format errors → Format not supported message
- Loading states during video load

### 8.3 Form Validation
- Phone number validation (minimum 10 digits)
- Email validation (must contain @)
- Required field validation
- Real-time error display

---

## 9. Configuration

### 9.1 Environment Variables
- `NEXT_PUBLIC_API_URL` - Backend API base URL

### 9.2 Video Configuration
- `src/config/videos.ts` - S3 video URLs fallback
- Supports multiple quality URLs per video
- Configurable video sources

---

## 10. Future Enhancements (Not Yet Implemented)

### 10.1 Planned Features
1. Search functionality (UI ready, backend integration pending)
2. Notifications system (UI ready, backend integration pending)
3. Sidebar navigation to other pages (Students, Teachers, Courses, etc.)
4. Live Class functionality
5. Attendance tracking
6. Payment integration
7. Library management
8. Reports & Analytics
9. User progress tracking (currently hardcoded)
10. Video completion tracking
11. Course enrollment
12. Social features (comments, likes, shares)

### 10.2 Technical Improvements
1. Global state management (Zustand/Redux)
2. API error retry mechanism
3. Video caching strategy
4. Offline support
5. Push notifications
6. Analytics integration
7. Performance optimization (lazy loading, code splitting)
8. SEO optimization
9. PWA support
10. Multi-language support

---

## 11. Security Considerations

### 11.1 Current Implementation
- JWT token authentication
- Token stored in localStorage (consider httpOnly cookies for production)
- Protected routes with client-side checks
- Phone number verification via OTP

### 11.2 Recommendations
- Implement server-side route protection
- Use httpOnly cookies for tokens
- Add CSRF protection
- Implement rate limiting for OTP requests
- Add session timeout
- Secure video URLs (signed URLs)

---

## 12. Performance Considerations

### 12.1 Current Optimizations
- Dynamic imports for video player (Plyr)
- Image optimization (Next.js Image component)
- Code splitting (Next.js automatic)
- Lazy loading for video components

### 12.2 Recommendations
- Implement video preloading strategy
- Add service worker for offline support
- Optimize bundle size
- Implement virtual scrolling for large video lists
- Add video thumbnail caching

---

## 13. Testing Considerations

### 13.1 Test Coverage Needed
- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for user flows
- Component tests for UI components

### 13.2 Test Scenarios
- Login flow (new & existing users)
- Registration flow
- Video playback
- Error handling
- Route protection
- Theme switching

---

## 14. Deployment

### 14.1 Build Configuration
- Next.js production build: `npm run build`
- Start production server: `npm start`
- Development server: `npm run dev` (with Turbopack)

### 14.2 Environment Setup
- Set `NEXT_PUBLIC_API_URL` environment variable
- Configure S3 bucket CORS settings for video access
- Set up backend API endpoints

---

## 15. Dependencies Summary

### 15.1 Core Dependencies
- `next` - Next.js framework
- `react` & `react-dom` - React library
- `typescript` - TypeScript support

### 15.2 UI Dependencies
- `@radix-ui/*` - UI primitives
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `next-themes` - Theme management
- `sonner` - Toast notifications

### 15.3 Feature Dependencies
- `plyr-react` - Video player
- `react-international-phone` - Phone input
- `libphonenumber-js` - Phone validation
- `firebase` - (Included but usage unclear)

---

## 16. Known Issues & Limitations

### 16.1 Current Limitations
1. Search functionality is UI-only (no backend integration)
2. Notifications are UI-only (no backend integration)
3. Sidebar navigation items don't have corresponding pages
4. Progress tracking is hardcoded (80%)
5. Community growth is hardcoded (62%)
6. Video completion tracking not implemented
7. No video analytics
8. No user preferences persistence
9. Active session modal logic mentioned in memories but not visible in codebase

### 16.2 Technical Debt
- Token stored in localStorage (should use httpOnly cookies)
- No API error retry mechanism
- No request cancellation for unmounted components
- No video preloading strategy
- Hardcoded values in components

---

## 17. File Structure

```
proskill-learning/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with theme provider
│   │   ├── page.tsx            # Root page (redirects)
│   │   ├── login/
│   │   │   └── page.tsx        # Login page with OTP
│   │   ├── registration/
│   │   │   └── page.tsx        # Registration page
│   │   ├── home/
│   │   │   └── page.tsx        # Dashboard home
│   │   └── profile/
│   │       └── page.tsx        # User profile
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── DashboardHeader.tsx # Top header
│   │   ├── VideoCard.tsx       # Video player card
│   │   ├── WelcomeBanner.tsx  # Welcome banner
│   │   ├── Calendar.tsx       # Calendar widget
│   │   └── theme-provider.tsx  # Theme context
│   ├── lib/
│   │   ├── api.ts              # API functions
│   │   └── utils.ts            # Utility functions
│   └── config/
│       └── videos.ts           # S3 video URLs
├── public/                     # Static assets
├── package.json
└── README.md
```

---

## 18. User Stories

### 18.1 Authentication Stories
- **As a new user**, I want to register with my phone number so I can access the platform
- **As an existing user**, I want to login quickly with OTP so I can access my courses
- **As a user**, I want to logout securely so my session is properly terminated

### 18.2 Video Viewing Stories
- **As a user**, I want to watch videos in different qualities so I can optimize for my connection
- **As a user**, I want to control playback speed so I can learn at my own pace
- **As a user**, I want to see video thumbnails so I can identify content quickly

### 18.3 Dashboard Stories
- **As a user**, I want to see my progress so I know how I'm doing
- **As a user**, I want to navigate easily so I can access different sections
- **As a user**, I want to toggle dark mode so I can use the app comfortably

---

## 19. Acceptance Criteria

### 19.1 Login Flow
- ✅ User can enter phone number
- ✅ OTP is sent successfully
- ✅ User can enter and verify OTP
- ✅ New users redirected to registration
- ✅ Existing users redirected to dashboard
- ✅ Error messages displayed appropriately

### 19.2 Registration Flow
- ✅ User can complete registration form
- ✅ Validation errors shown for invalid inputs
- ✅ Success redirects to dashboard
- ✅ User data persisted after registration

### 19.3 Video Playback
- ✅ Videos load and play correctly
- ✅ Multiple quality options available
- ✅ Error handling for failed loads
- ✅ Loading states shown during load

### 19.4 Dashboard
- ✅ Protected routes require authentication
- ✅ User information displayed correctly
- ✅ Theme toggle works
- ✅ Navigation sidebar functional

---

## 20. Glossary

- **OTP**: One-Time Password
- **JWT**: JSON Web Token
- **CORS**: Cross-Origin Resource Sharing
- **PWA**: Progressive Web App
- **S3**: Amazon Simple Storage Service
- **HLS**: HTTP Live Streaming
- **DASH**: Dynamic Adaptive Streaming over HTTP

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team


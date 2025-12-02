# ProSkill Learning Platform

A modern, Next.js-based video learning platform that enables users to access and interact with video courses. Features phone number OTP authentication, a responsive dashboard, and an advanced video player for an optimal learning experience.

## 🚀 Features

### Authentication & User Management
- 📱 **Phone Number OTP Authentication** - Secure login using phone number verification
- 👤 **User Registration** - Simple registration flow for new users
- 🔐 **Session Management** - Token-based authentication with localStorage
- 🌓 **Theme Toggle** - Dark and light mode support

### Video Learning
- 🎥 **Advanced Video Player** - Powered by Plyr with full control options
- 📚 **Course Management** - Organized video courses grid
- 📊 **Progress Tracking** - Track learning progress with visual indicators
- 🎯 **Quality Control** - Multiple video quality options
- ⚡ **Playback Controls** - Speed adjustment, fullscreen, and volume control

### Dashboard
- 📈 **Welcome Banner** - Personalized greeting with progress overview
- 📅 **Calendar Widget** - Integrated calendar functionality
- 🎨 **Modern UI** - Built with Radix UI primitives for accessibility
- 🔍 **Search Functionality** - Search courses and content
- 📱 **Fully Responsive** - Works seamlessly on all devices

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.5.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 19.1.0** - Latest React features

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
  - Avatar, Dropdown Menu, Label, Progress
  - Scroll Area, Separator, Tabs
- **Lucide React** - Beautiful icon library
- **next-themes** - Theme management

### Video & Media
- **Plyr React** - Modern HTML5 video player
- **AWS S3** - Scalable video storage
- **S3 Request Presigner** - Secure video access

### Backend & Database
- **MongoDB** - NoSQL database with Mongoose ODM
- **Firebase** - Additional backend services
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing

### Communication
- **Twilio** - SMS/OTP service integration
- **react-international-phone** - International phone number input

### Utilities
- **Sonner** - Toast notification system
- **class-variance-authority** - Component variant management
- **clsx & tailwind-merge** - Conditional styling utilities

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB database (local or cloud)
- AWS S3 bucket for video storage
- Twilio account for OTP services
- Firebase project (if using Firebase features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/WydexMedia/videorepo.git
   cd videorepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # AWS S3
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=your_aws_region
   AWS_S3_BUCKET_NAME=your_s3_bucket_name
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # Twilio
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # Firebase (if used)
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   # ... other Firebase config
   
   # App
   NEXT_PUBLIC_API_URL=your_api_url
   NEXT_PUBLIC_SITE_URL=your_site_url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
videorepo/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── registration/      # Registration page
│   ├── home/              # Dashboard/home page
│   └── ...
├── src/                   # Source code
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   ├── types/            # TypeScript types
│   └── ...
├── public/               # Static assets
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind CSS config
├── PRD.md               # Product Requirements Document
├── MIGRATION.md         # Migration documentation
└── DEBUG_VIDEOS.md      # Video debugging guide
```

## 🔐 Authentication Flow

### New User Registration
1. User enters phone number on login page
2. OTP sent via Twilio SMS
3. User enters 6-digit OTP
4. Backend detects new user → redirects to registration
5. User completes registration (name, email, place)
6. Account created → redirects to dashboard

### Existing User Login
1. User enters phone number
2. OTP sent via SMS
3. User enters OTP
4. Backend verifies and authenticates
5. Token stored → redirects to dashboard

## 🎥 Video Player Features

The platform uses Plyr for video playback with:
- Play/pause controls
- Quality selection (if multiple qualities available)
- Playback speed adjustment (0.5x to 2x)
- Fullscreen mode
- Volume control
- Progress tracking
- Keyboard shortcuts

## 🚀 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Vercel will automatically detect Next.js and deploy

### Environment Variables in Production

Ensure all environment variables from `.env.local` are configured in your deployment platform.

## 🧪 Development Scripts

```bash
# Development server with Turbopack
npm run dev

# Build with Turbopack
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📚 Documentation

- [PRD.md](./PRD.md) - Complete Product Requirements Document
- [MIGRATION.md](./MIGRATION.md) - Migration and setup guide
- [DEBUG_VIDEOS.md](./DEBUG_VIDEOS.md) - Video debugging documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is private and proprietary.

## 👥 Maintained by

WydexMedia

---

Built with ❤️ using Next.js and modern web technologies.
<p align="center">
  <a href="https://github.com/gysagsohn/game-tracker-client">
    <img src="https://img.shields.io/github/stars/gysagsohn/game-tracker-client?style=social" alt="GitHub stars">
  </a>
  <a href="https://gy-gametracker.netlify.app">
    <img src="https://img.shields.io/netlify/54a5c9e5-9595-48c7-a422-221e8a15bc1d?label=Netlify%20Deploy&logo=netlify" alt="Netlify frontend">
  </a>
  <a href="https://game-tracker-server-zq2k.onrender.com">
    <img src="https://img.shields.io/badge/Render-Backend-green?logo=render" alt="Render backend">
  </a>
  <img src="https://img.shields.io/badge/status-Live-brightgreen" alt="App status">
</p>

# Game Tracker Frontend

React + Vite frontend for Game Tracker, a full-stack MERN application for tracking board and card game results with friends.

**Live Application:** [https://gy-gametracker.netlify.app](https://gy-gametracker.netlify.app)  
**Backend Repository:** [game-tracker-server](https://github.com/gysagsohn/game-tracker-server)

---

## Tech Stack

**Core:**
- React 19 with Hooks
- Vite 7 (build tooling)
- Tailwind CSS 4 (styling with custom design tokens)
- React Router DOM 7 (routing & navigation)

**State Management:**
- React Context API (authentication, toast notifications)
- localStorage for JWT token persistence

**HTTP Client:**
- Axios with interceptors for automatic token injection and 401 handling

**UI Components:**
- React Icons (navigation icons)
- React Day Picker (date selection)
- date-fns (date formatting)

**Development:**
- ESLint (code quality)
- PostCSS + Autoprefixer

---

## Project Structure
```
game-tracker-client/
├── public/
│   ├── _redirects              # Netlify SPA routing config
│   ├── 404.html                # Custom 404 page
│   ├── logo.png
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   ├── logo.png
│   │   ├── google-logo.svg
│   │   └── wireframes/         # Design mockups
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── PasswordInput.jsx
│   │   │   ├── PasswordStrength.jsx
│   │   │   └── LogoutButton.jsx
│   │   ├── nav/                # Navigation components
│   │   │   ├── SideNav.jsx     # Desktop navigation
│   │   │   └── MobileNav.jsx   # Mobile bottom nav
│   │   ├── friends/
│   │   │   └── FriendSearch.jsx
│   │   ├── forms/
│   │   │   ├── GameSelect.jsx
│   │   │   └── PlayersField.jsx
│   │   ├── dashboard/
│   │   │   ├── ActionButtons.jsx
│   │   │   ├── LastGameCard.jsx
│   │   │   └── StatsCard.jsx
│   │   ├── matches/
│   │   │   └── ActivityLog.jsx
│   │   ├── AuthedShell.jsx     # Layout wrapper for authenticated routes
│   │   ├── ProtectedRoute.jsx  # Route protection HOC
│   │   ├── ErrorBoundary.jsx   # Error handling
│   │   ├── DateInput.jsx       # Date picker component
│   │   └── GoogleButton.jsx    # OAuth button
│   ├── contexts/
│   │   ├── AuthProvider.jsx    # Authentication state
│   │   ├── AuthContextBase.js
│   │   ├── useAuth.js          # Auth hook
│   │   ├── ToastProvider.jsx   # Toast notifications
│   │   ├── toastContext.js
│   │   └── useToast.js         # Toast hook
│   ├── lib/
│   │   ├── axios.js            # Configured axios instance
│   │   └── api/                # API service layer
│   │       ├── friends.js
│   │       ├── notifications.js
│   │       └── sessions.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── CheckEmail.jsx
│   │   ├── VerifyEmail.jsx
│   │   ├── OAuthSuccess.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Matches.jsx
│   │   ├── NewMatch.jsx
│   │   ├── MatchDetail.jsx
│   │   ├── Friends.jsx
│   │   ├── FriendRequests.jsx
│   │   ├── Profile.jsx
│   │   ├── Notifications.jsx
│   │   └── AddGame.jsx
│   ├── utils/
│   │   └── validators.js       # Form validation helpers
│   ├── constants/
│   │   └── notificationTypes.js
│   ├── App.jsx                 # Route configuration
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles & design tokens
├── .env                        # Production environment variables
├── .env.development            # Development environment variables
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## Features

### Authentication & Authorization
- Email/password authentication with JWT tokens
- Google OAuth integration via Passport.js
- Email verification required before login
- Password reset flow with secure token validation
- Session persistence with localStorage
- Protected routes with automatic redirect on 401
- Client-side validation with inline error messages
- Password strength indicator on signup
- CapsLock warning on password fields
- Show/hide password toggle

### User Management
- User profile with editable fields (firstName, lastName)
- Profile statistics (total matches, wins, losses, draws, most played game)
- Account deletion with confirmation
- Password change functionality
- Activity logging for audit trails

### Match Tracking
- Create matches with multiple players (friends or guests)
- Guest player support with optional email invitations
- Match confirmation workflow (requires all players to confirm)
- Match editing (creator only)
- Match deletion (creator only)
- Detailed match view with activity log
- Score tracking per player
- Result tracking (Win/Loss/Draw)
- Match filtering by game and result
- Match history with status indicators
- Email reminders for unconfirmed matches (rate limited: 1 per 6 hours)

### Friend System
- Search for users by name or email (debounced, 2-char minimum)
- Send friend requests via email
- Accept/reject friend requests
- View friends list
- View sent requests
- View suggested friends (friends-of-friends)
- Unfriend functionality
- Friend request notifications

### Notifications
- In-app notification system with badge counts
- Notification types: friend requests, match invites, match updates, confirmations
- Paginated notification list
- Mark individual notifications as read
- Mark all notifications as read
- Filter by read/unread status
- Real-time unread count on navigation

### Games Library
- Browse available games
- Create custom games
- Game search and selection dropdown with autocomplete
- Quick "Add Game" option from match creation flow

### UI/UX Features
- Mobile-first responsive design
- Desktop sidebar navigation with logo and active states
- Mobile bottom navigation bar
- Skeleton loading states for improved perceived performance
- Toast notifications for user feedback (success/error/info)
- Error boundary for graceful error handling
- Empty states with call-to-action buttons
- Inline form validation with error messages
- Loading spinners on async actions
- Disabled buttons during API calls
- Custom 404 page

---

## Design System

### Custom Tailwind Theme
All colors and spacing follow a consistent design token system defined in `index.css`:

**Colors:**
```css
--color-default: #F5F6FA      /* Background */
--color-card: #FFFFFF          /* Card backgrounds */
--color-primary: #1E1F22       /* Primary text */
--color-secondary: #4F545C     /* Secondary text */
--color-placeholder: #8C8C8C   /* Input placeholders */
--color-link: #5865F2          /* Links */
--color-cta: #5865F2           /* Primary buttons */
--color-cta-hover: #4752C4     /* Button hover */
--color-warning: #ED4245       /* Error/warning */
--color-success: #57F287       /* Success */
--color-border-muted: #D1D5DB  /* Borders */
```

**Typography Scale:**
- Heading 1: 32px
- Heading 2: 24px
- Body: 16px
- Small: 14px

**Spacing:** 4px base scale (xs, s, m, l, xl)

**Border Radius:** 8px standard

**Component Classes:**
- `.btn`, `.btn-primary`, `.btn-success`, `.btn-warning`, `.btn-sm`
- `.input`, `.input-error`, `.input-success`
- `.card`, `.shadow-card`, `.shadow-modal`
- `.h1`, `.h2`, `.body-text`, `.text-small`

---

## Architecture

### State Management

**AuthContext** (`src/contexts/AuthProvider.jsx`)
- Manages user authentication state
- Provides `token`, `user`, `loading` state
- Provides `login()`, `signup()`, `logout()` functions
- Automatically hydrates user from token on app load
- Handles token expiry and automatic logout

**ToastContext** (`src/contexts/ToastProvider.jsx`)
- Global toast notification system
- Provides `toast.success()`, `toast.error()`, `toast.info()`, `toast.loading()`
- Auto-dismisses after configurable duration
- Supports manual dismissal
- Limits to 6 simultaneous toasts

### API Client

**Axios Configuration** (`src/lib/axios.js`)
```javascript
// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Automatic 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(new Error(error.response?.data?.message || error.message));
  }
);
```

### Routing

**Protected Routes:**
All routes under `/dashboard`, `/matches`, `/friends`, `/profile`, `/notifications` require authentication. Unauthenticated users are redirected to `/login`.

**Public Routes:**
- `/login` - Login page
- `/signup` - Registration page
- `/verify-email` - Email verification handler
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/check-email` - Email verification pending page
- `/oauth-success` - OAuth callback handler

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- Backend API running (see [game-tracker-server](https://github.com/gysagsohn/game-tracker-server))

### Installation

1. **Clone the repository**
```bash
git clone git@github.com:gysagsohn/game-tracker-client.git
cd game-tracker-client
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.development` for local development:
```env
VITE_API_URL=http://localhost:3001
```

Create `.env` for production:
```env
VITE_API_URL=https://game-tracker-server-zq2k.onrender.com
```

4. **Start development server**
```bash
npm run dev
```

Application will start at `http://localhost:5173`

---

## Available Scripts
```bash
npm run dev      # Start Vite development server with HMR
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality checks
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001` or `https://your-api.com` |

---

## Deployment

### Netlify Configuration

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18 (or higher)

**Environment Variables:**
Add `VITE_API_URL` in Netlify dashboard → Site settings → Environment variables

**Redirects:**
The `public/_redirects` file handles SPA routing:
```
/oauth-success  /index.html  200
/*              /index.html  200
```

**Custom 404:**
The `public/404.html` file provides a branded 404 page with navigation links.

### Manual Deployment Steps

1. Build the application:
```bash
npm run build
```

2. Test the build locally:
```bash
npm run preview
```

3. Deploy `dist/` folder to Netlify (via dashboard or CLI)

4. Configure environment variables in Netlify dashboard

5. Verify deployment at your Netlify URL

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

---

## Key Dependencies

**Production:**
- `react` & `react-dom` (19.1.0) - UI framework
- `react-router-dom` (7.8.0) - Routing
- `axios` (1.11.0) - HTTP client
- `@tailwindcss/vite` (4.1.11) - Styling
- `react-icons` (5.5.0) - Icon library
- `react-day-picker` (9.9.0) - Date picker
- `date-fns` (4.1.0) - Date utilities

**Development:**
- `vite` (7.0.0) - Build tool
- `eslint` (9.29.0) - Linting
- `@vitejs/plugin-react` (4.5.2) - Vite React plugin
- `tailwindcss` (4.1.11) - CSS framework

---

## Code Quality

### ESLint Configuration
- React Hooks linting enabled
- No unused variables (except uppercase constants)
- React Refresh rules for HMR

### Best Practices Followed
- Component-based architecture with single responsibility
- Custom hooks for reusable logic
- Context API for global state management
- Error boundaries for graceful error handling
- Loading states with skeleton components
- Proper form validation with user feedback
- Accessible form labels and ARIA attributes
- Responsive design with mobile-first approach

---

## Known Issues & Limitations

### Current Limitations
- No real-time updates (requires page refresh for new data)
- No offline support (requires internet connection)
- Token stored in localStorage (future: httpOnly cookies for enhanced security)
- No automatic token refresh (tokens expire after 7 days)


### Future Improvements
- WebSocket integration for real-time notifications
- Service worker for offline support
- Refresh token mechanism
- Enhanced keyboard navigation and accessibility
- Comprehensive test coverage (unit + integration + E2E)
- Code splitting for improved initial load time
- React.memo optimization to prevent unnecessary re-renders

---

## Contributing

This is a portfolio project, but feedback and suggestions are welcome:
1. Open an issue for bugs or feature requests
2. Fork the repository
3. Create a feature branch
4. Submit a pull request with clear description

---

## Related Projects

- **Backend:** [game-tracker-server](https://github.com/gysagsohn/game-tracker-server) - Express + MongoDB API
- **Live Application:** [https://gy-gametracker.netlify.app](https://gy-gametracker.netlify.app)

---

## Author

**Gy Sohn**  
Full-Stack Developer  
[LinkedIn](https://www.linkedin.com/in/gysohn) | [GitHub](https://github.com/gysagsohn) | [Portfolio](https://gysohn.com)

Built as a portfolio project to demonstrate:
- Full-stack MERN development
- Production-ready deployment
- Modern React patterns with hooks
- Responsive UI/UX design
- RESTful API integration
- Authentication flows
- Real-world feature implementation

---

## License

This project is open source and available for educational purposes.

---

## Recent Updates (October 2025)

### Version 1.2 - UX & Performance Enhancements
- Added skeleton loading states across all pages
- Implemented error boundary for graceful crash handling
- Enhanced toast notification system with better positioning and animations
- Redesigned sidebar navigation with modern card layout and icons
- Added real-time notification badges on mobile and desktop nav
- Improved Friends page layout with centered, responsive design
- Created reusable LogoutButton component
- Fixed responsive header alignment on Notifications and Matches pages
- Added comprehensive loading states for better perceived performance

### Version 1.1 - Profile & Security
- Complete profile page with user statistics
- Password change functionality
- Account deletion with confirmation
- Silent authentication check (no loading flash)
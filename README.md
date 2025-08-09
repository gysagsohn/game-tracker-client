<p align="center">
  <a href="https://github.com/gysagsohn/game-tracker-client">
    <img src="https://img.shields.io/github/stars/gysagsohn/game-tracker-client?style=social" alt="GitHub stars">
  </a>
  <a href="https://gy-gametracker.netlify.app">
    <img src="https://img.shields.io/netlify/54a5c9e5-9595-48c7-a422-221e8a15bc1d?label=Netlify%20Deploy&logo=netlify" alt="Netlify frontend">
  </a>
  <img src="https://img.shields.io/badge/status-Live%20(beta)-yellowgreen" alt="App status">
</p>


# Game Tracker Frontend – React + Vite (Mobile First)

This is the frontend client for the Game Tracker project — a full-stack MERN application to track wins, losses, and scores from card/board games.
The frontend is built using React, Vite, and Tailwind CSS, following a mobile-first design approach and fully integrated with the backend API.

---

## Tech Stack
- React (Vite build tool)
- Tailwind CSS (custom color palette + design tokens)
- Axios (API requests)
- React Router DOM (routing & protected routes)
- Context API (authentication state)
- LocalStorage / JWT (persistent auth)
- Responsive Design (mobile-first with large-screen optimizations)
---

## 📁 Folder Structure

```bash
game-tracker-client/
├── public/
├── src/
│   ├── assets/           # Logos, images, wireframes
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Buttons, Inputs, etc.
│   │   ├── navigation/   # SideNav, MobileNav
│   │   ├── AuthedShell.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/         # AuthContext (login/signup/logout handling)
│   ├── lib/              # API helper (Axios instance)
│   ├── pages/            # Login, Signup, ForgotPassword, Dashboard, Profile
│   ├── styles/           # Tailwind config + custom utilities
│   ├── App.jsx           # App routes
│   └── main.jsx
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Wireframes
| Page        | Preview |
|-------------|---------|
| Login       | ![Login Page](assets/wireframes/LoginPage.png) |
| Signup      | ![Signup Page](assets/wireframes/SignupPage.png) |
| Dashboard   | ![Dashboard Page](assets/wireframes/DashboardPage.png) |
| Match Log   | ![Match Log Page](assets/wireframes/MatchLogPage.png) |
| Profile     | ![Profile Page](assets/wireframes/ProfilePage.png) |


## Features Implemented
### Authentication
- Login with email & password
- Signup with email verification
- Forgot password with email reset link
- Client-side validation:
- Email format check
- Password rules (no spaces, min 8 chars, must include numbers, letters, and symbols)
- Inline error messages
- CapsLock warning on password fields
- Password strength meter (Signup only)
- "Show password" toggle for password inputs
- Disabled submit button + loading state during API calls

### Navigation
- Mobile bottom nav with icons & active states
- Desktop side nav (Instagram-style) with:
- Logo (click to go home)
- Nav links: Dashboard, Matches, Friends, Profile
- Logout button fixed at bottom
- Responsive layout changes:
- Mobile → bottom nav bar
- Large screen → full-height side nav

### Dashboard
- Welcome heading with user's first name
- Card layout for:
- Last Game Played
- Stats Summary
- Quick Action Buttons
- Responsive spacing & container width improvements for large screens

### Styling
- Custom Tailwind theme variables (--color-default, --color-card, etc.)
- Mobile-first layout, scaling up for desktop
- Default background applied to all auth pages
- Centered layouts for Login, Signup, and Forgot Password
- Spacing & padding adjustments across pages

## Upcoming Features
- Game list search + autocomplete
- Custom dropdown UI for game selection
- Match creation form with friend invites
- Sorting & filtering in match history
- Pagination or infinite scroll
- Friend list management + friend requests
- Stats page with charts

## Getting Started (Local Dev)

1. Clone the repo:
``` bash 
git clone git@github.com:gysagsohn/game-tracker-client.git
cd game-tracker-client
```

2. Install dependencies:
``` bash
npm install
```

3. Run the dev server:
``` bash
npm run dev
```

4. Create a .env file at the root:
``` bash
VITE_API_URL=http://localhost:3001
```
Make sure this matches the port your backend server is running on.

## Pages & Routes

| Route           | Description                                      |
|----------------|--------------------------------------------------|
| `/login`        | Login form with password reset option            |
| `/signup`       | Create new account (with social login placeholder) |
| `/dashboard`    | Welcome, stats, last game, nav buttons           |
| `/matches/new`  | Log a new game result                            |
| `/matches`      | Match history + stats                            |
| `/profile/:id`  | Edit profile, view/add friends (merged with Friends Page) |

---

## Components

- `Navbar`, `MobileDrawer`  
- `GameCard`, `MatchForm`, `MatchHistoryList`  
- `FriendList`, `PrivateRoute`

---


## Related Repositories
- [Backend: game-tracker-server](https://github.com/gysagsohn/game-tracker-server)

## Author
Built by Gy Sohn as part of a full-stack portfolio project during a career transition. Design inspired by Discord's palette & mobile-first UX best practices.
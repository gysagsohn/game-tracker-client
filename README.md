# 🎮 Game Tracker Frontend – React + Vite (Mobile First)

This is the frontend client for the [Game Tracker](https://github.com/gysagsohn/game-tracker-server) project — a full-stack MERN app to track wins, losses, and scores from card/board games. The frontend is built using React, Vite, and Tailwind CSS, with a mobile-first design philosophy.

---

## ⚙️ Tech Stack

- React (with Vite)
- Tailwind CSS
- Axios
- React Router
- Context API (planned)
- LocalStorage / JWT for auth

---

## 📁 Folder Structure

```bash
game-tracker-client/
├── public/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-based pages (Login, Dashboard, etc.)
│   ├── styles/         # Tailwind and custom CSS
│   ├── contexts/       # Global state (e.g., auth)
│   └── App.jsx         # Main app router
├── index.html
├── tailwind.config.js
├── vite.config.js
```

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

## Pages & Components

### Pages
- /login, /signup
- /dashboard – show matches, stats
- /matches/new – record match results
- /games – explore/add games
- /friends – manage friend list
- /profile/:id – user stats (planned)

### Components
- Navbar, MobileDrawer
- GameCard, MatchForm, MatchHistoryList
- FriendList, PrivateRoute


## Related Repositories
Backend: game-tracker-server

## Author
Built by Gy Sohn as part of a career change full-stack portfolio project.
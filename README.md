# Aekagra AI

AI-powered focus and study optimization platform.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express, SQLite (better-sqlite3), JWT (jsonwebtoken)

## Getting Started

```sh
# Install dependencies
npm install

# Start the backend server (port 3001)
npm run server:dev

# Start the frontend dev server (port 8080)
npm run dev
```

## Project Structure

```
├── server/          # Express backend
│   ├── index.js     # Server entry point
│   ├── db.js        # SQLite database setup
│   ├── routes/      # API route handlers
│   └── middleware/   # Auth middleware
├── src/             # React frontend
│   ├── components/  # UI components
│   ├── contexts/    # React contexts (auth)
│   ├── pages/       # Page components
│   └── hooks/       # Custom hooks
└── package.json
```

# WareSphere

AI-augmented Warehouse Management System (WMS) for multi-warehouse operations in India.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6 (centralized with lazy-loading)
- **Styling**: CSS Modules (with CSS custom properties, no CSS frameworks)
- **Icons**: Lucide React
- **Charts**: Recharts

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 (it opens automatically).

Requires Node.js 18+. The frontend runs entirely on built-in mock data, so no
backend or database is needed to use it locally.

Other commands: `npm run build` (type-check + production build) and
`npm run preview` (serve the build at http://localhost:4173).

## Optional backend (FastAPI + PostgreSQL)
The `backend/` folder is a separate API that the UI does not call yet. See
`backend/.env.example` for its settings.

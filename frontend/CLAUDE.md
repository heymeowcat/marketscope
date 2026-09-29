# Frontend Layer Guidelines (frontend/CLAUDE.md)

## 1. UI Stack & Design Principles
- **Framework**: React 18+ with TypeScript and Vite.
- **Styling**: Vanilla CSS / modern CSS Modules with CSS Variables for consistent theming (dark mode, fin-tech green/red indicators).
- **Responsive Layout**: Fluid CSS grid and flexbox ensuring full responsiveness across mobile (< 768px), tablet (768px - 1024px), and desktop (> 1024px) screens.

## 2. Core User Journeys & Views
1. **Authentication & Profile**: Registration (AC-01) and Login views with token persistence.
2. **Stock Catalog Explorer**: Live ticker search, sector filtering, and quote cards with price tick indicators.
3. **Watchlist Manager**: Multi-watchlist tabs (capped at 10 - AC-04), quick-add/remove ticker actions with atomic error toasts (AC-05).
4. **Order Placement Modal**: BUY/SELL toggle, Market/Limit order forms, live calculation of estimated cash cost with real-time purchasing power check (AC-06, AC-08).
5. **Portfolio Valuation Dashboard**: Cards for Total Invested, Current Value, Absolute P&L, and Percentage P&L with positive (green) and negative (red) styling (AC-09).
6. **Analytics View**: Visual leaderboard of Top 5 Gainers and Top 5 Losers from user holdings (AC-10) and sector allocation breakdown.
7. **Admin Console**: User management table with role change dropdown and audited confirmation dialog (AC-02), and stock catalog administration with soft-delete action (AC-03).

## 3. Interaction & Accessibility
- Interactive elements must possess clear `id` and `data-testid` attributes matching AC identifiers (e.g. `data-testid="order-submit-btn"`, `data-testid="portfolio-stats-card"`).
- Micro-interactions: Subtle transitions on price changes and state switches.

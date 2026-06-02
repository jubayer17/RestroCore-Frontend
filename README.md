# RestroCore Client

Restaurant management frontend for RestroCore — POS, kitchen display, reservations, analytics, and day-to-day operations in a single React SPA.

## Features

- **Point of sale** — Notes, discounts, tax, and line-item pricing
- **Kitchen (KDS)** — Per-order status and item-level progress
- **Operations** — Reservations, floor plan, delivery, orders with PDF export
- **Back office** — Menu builder, inventory, customers, staff, settings
- **Analytics** — Revenue, categories, heatmaps, retention, and export
- **Routing** — Client-side SPA with Vercel-friendly deep links

## Tech stack

| Layer | Tools |
| ----- | ----- |
| UI | React 18, TypeScript, shadcn/ui, Tailwind CSS |
| Build | Vite |
| State | Zustand, TanStack Query |
| Charts | Chart.js, Recharts |
| Tests | Vitest, Testing Library |

See [STYLE-GUIDE.md](./STYLE-GUIDE.md) for colors, typography, and component conventions.

## Prerequisites

- Node.js 18+
- npm

## Quick start

From this directory (`client/`):

```bash
npm install
npm run dev
```

The dev server runs at [http://localhost:5173](http://localhost:5173) by default.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint |

## Project layout

```
client/
├── public/          Static assets
├── src/
│   ├── components/  UI and feature modules
│   ├── pages/       Route-level views
│   ├── data/        Mocks, seed data, config
│   ├── hooks/       Shared React hooks
│   ├── lib/         Utilities
│   └── store/       Zustand store
├── index.html
├── vite.config.ts
└── vercel.json      SPA rewrites for deployment
```

## Configuration

- **Environment** — Use `.env` / `.env.local` for client-side variables (prefix with `VITE_` for Vite). Do not commit secrets; `.env` files are gitignored.
- **Analytics** — [@vercel/analytics](https://www.npmjs.com/package/@vercel/analytics) via the `<Analytics />` component.

## Deploying on Vercel

1. Connect this repository to Vercel.
2. Set **Root Directory** to `client` (this folder).
3. Use the default install command: `npm install`.
4. Build command: `npm run build`.
5. Output directory: `dist`.

`vercel.json` rewrites all routes to `/` so deep links (e.g. `/reservations`) work on refresh.

## Testing

```bash
npm test
```

## Notes

- Order details include invoice-equivalent data; there is no separate invoices page.
- POS order numbers are sequential and persisted (starting at 3154 in seed data).

## Related

- **API** — The backend lives in the sibling [`../server`](../server) directory at the repository root.

## License

All rights reserved.

# Traamand — Domestic Worker Marketplace (Zimbabwe)

## Stack
- **Frontend**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Zustand 5, react-router 7
- **Backend**: Firebase (Auth, Firestore, Functions Node 22, Storage, Hosting)
- **Payments**: Paynow (Zimbabwe), SHA-512 hash verified
- **Testing**: Vitest (unit), Playwright (e2e)
- **Linting**: oxlint (no formatter)
- **Deploy**: Firebase Hosting (primary) + Vercel (secondary, bot prerender via Edge middleware)

## Project Structure
```
src/                          # Frontend SPA
├── firebase/                 # Firebase init, auth, firestore CRUD
├── components/               # UI components (admin, auth, booking, layout, etc.)
├── pages/                    # Route pages (admin/*, hire/*, worker/*, role dashboards)
├── stores/                   # Zustand (auth, booking, worker, toast)
├── types/                    # All TS interfaces
├── lib/                      # Utilities (paynow, referral, matching, SEO, upload)
├── App.tsx                   # Root routes + role guards
├── main.tsx                  # Entry point
functions/src/                # Cloud Functions
├── index.ts                  # All handlers (~1053 lines — needs splitting)
├── rewards.ts                # Referral reward crediting
├── commission.ts             # Milestone & cashback rules
├── sitemap.ts                # Dynamic sitemap XML
├── prerender.ts              # Bot SSR rendering

## Roles (8)
client | admin | superadmin | verifier | creator | sponsor | advertise | applicant

## Firestore Collections
workers, users, bookings, categories, applicants, locationPages, transactions, payouts, verifierTasks, creatorSubmissions, sponsorships, adCampaigns, invites, auditLogs, bookingCheckIns

## Key Conventions
- Lazy load all route pages with `lazyWithRetry` (chunk error recovery)
- Auth via `AuthGuard` component wrapping routes with role checks
- Server timestamps via `admin.firestore.FieldValue.serverTimestamp()`
- Referral codes: Shona adj + English noun + 2-digit number
- Paynow: callable function initiates, polling checks status, webhook confirms
- Field whitelisting in Firestore rules for booking creates

## Commands
| npm run | Action |
|---|---|
| `dev` | Vite dev server :5173 |
| `build` | tsc -b && vite build |
| `lint` | oxlint |
| `test` | vitest run |
| `test:e2e` | playwright test |

## Status
| Area | Status |
|---|---|
| `functions/src/` | Split into domain modules (admin, paynow, bookings, referrals, audit, seo, helpers) |
| TypeScript strictness | `noUnusedLocals`/`noUnusedParameters` enabled ✅ |
| Playwright baseURL | Points to `localhost:5173` ✅ |
| Formatting | Prettier configured (`npm run format`) ✅ |
| .env support | `.env.example` + VITE_ env vars in config.ts ✅ |
| N+1 queries | `resolveReferralChain` runs queries in parallel ✅ |
| Server-side rate limiting | Added to `verifyAdminAccess` (20 req/15min) ✅ |
| Admin SDK keys | Already gitignored, never committed ✅ |
| Tests | 54/54 passing ✅ |
| Lint | Clean ✅ |

# External Integrations

**Analysis Date:** 2026-08-24

## APIs & External Services

**Backend REST API (the only external API):**
- Single backend service, reached via **same-origin relative URLs** under `/api/*`. No base URL, no SDK, no axios — plain `fetch` through one wrapper.
  - Client: `apiFetch<T>()` in `lib/api-wrapper.ts` (adds `credentials: "include"`, JSON/FormData headers)
  - Response contract (all endpoints): `{ success: boolean, message: string, data: T, meta?: { page, limit, count, total } }` (`lib/api-wrapper.ts:10-15`)
- The backend itself lives outside this repo; in production a reverse proxy routes `/api/*` and `/uploads/*` to it (no rewrites exist in `next.config.ts`).

**Endpoint map (as called from this codebase):**

| Domain | Endpoints | Callers |
|--------|-----------|---------|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/refresh-token` | `hooks/use-login.ts`, `hooks/use-logout.ts`, `hooks/use-me.ts`, `lib/api-wrapper.ts:24` |
| Account security | `POST /api/auth/change-email/request|confirm`, `POST /api/auth/change-password/request|confirm`, `POST /api/auth/forgot-password/request|confirm`, `POST /api/auth/verify-email/request|confirm` | `features/profile/profile-info.tsx`, `features/change-email/components/change-email-form.tsx`, `features/change-password/components/change-password-form.tsx`, `features/forgot-password/components/forgot-password-form.tsx`, `features/profile/email-verification.tsx`, `features/verify-email/components/verify-email-form.tsx` |
| Attendance | `GET /api/attendance/me`, `GET /api/attendance/record/:id`, `GET /api/attendance/user/me`, `GET /api/attendance/today`, `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, `POST /api/attendance/` | `services/attendance.api.ts` |
| Attendance correction | `GET/POST/PATCH /api/attendance/correction/me`, `/api/attendance/correction/:id` (+ admin variants) | `services/attendance-correction.api.ts` |
| Calendar | `GET /api/calendar/:year/:month` | `services/calendar.api.ts` |
| Notifications | `GET /api/notification/`, `POST /api/notification/subscribe`, `POST /api/notification/enable`, `POST /api/notification/disable` | `services/notification.api.ts`, `hooks/use-push-notification.ts`, `features/notification/register-push.tsx` |
| Uploads | `POST /api/upload/image` (multipart FormData: `image` + `name`) → returns file record | `components/image-upload.tsx:114` |
| User profile | `PATCH /api/user`, `GET /api/user` | `features/profile/profile-info.tsx`, `hooks/use-profile.ts` |
| Admin | `GET /api/admin/users`, `GET /api/admin/user/:id`, `PATCH /api/admin/user/:id`, `POST /api/admin/user/:id/restore`, `POST /api/admin/account` | `features/users/*.tsx`, `app/(main)/users/[id]/page.tsx`, `features/register/user-register.tsx` |

**Web Push (Web Push Protocol via VAPID):**
- Browser-side push subscription + display; backend sends the pushes.
  - Subscription: `hooks/use-push-notification.ts` (`registerPush()`) — registers `public/sw.js`, subscribes with `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`, POSTs subscription JSON to `/api/notification/subscribe`
  - Service worker: `public/sw.js` — handles `push` (show notification) and `notificationclick` (open URL) events
  - Enable/disable toggles: `features/notification/register-push.tsx`
  - Key provisioning: Docker build ARG `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (`Dockerfile:22-23`)
  - Private key is held by the backend; this repo never sees it

## Data Storage

**Databases:**
- None in this repo. All persistence belongs to the external backend. This app is stateless client-side.

**File Storage:**
- Backend-hosted uploads. Uploaded images come back referenced as `/uploads/...` paths (see `lib/image-url.ts`) or absolute `http(s)` URLs; served same-origin.

**Caching:**
- None server-side. TanStack Query provides client cache (`staleTime` set per-query, e.g. `hooks/use-me.ts`).

## Authentication & Identity

**Auth Provider:**
- Custom cookie-based JWT session owned by the backend. No auth library used here (note: `jwt-decode` is installed but never imported).
- Cookies (set by backend, httpOnly): `saher_access_token`, `saher_refresh_token` (names referenced in `proxy.ts:5-6`)
- **Access-token refresh:** single-flight refresh in `lib/api-wrapper.ts` — on any 401, one shared `refreshPromise` POSTs `/api/auth/refresh-token`, then the original request retries exactly once (`_retried` flag); failure toasts "Session expired" and throws
- **Route protection layers:**
  1. Edge/request proxy `proxy.ts` — redirects unauthenticated users (neither cookie present) from private routes to `/login`; bounces logged-in users away from `/login`, `/forgot-password`
  2. Role gating client-side: `components/role-guard.tsx` + admin route group layout `app/(main)/(admin)/layout.tsx`; roles are `"user" | "manager" | "admin"` (`hooks/use-me.ts`)
- Login/logout invalidate the whole query cache (`hooks/use-login.ts` — `invalidateQueries({ queryKey: [] })`)

## Monitoring & Observability

**Error Tracking:**
- None wired up. Placeholder logger at `lib/logger.ts` (`console.error` with comment "Replace this with Sentry later"). React error boundaries at `app/error.tsx` and `app/global-error.tsx`.

**Logs:**
- `console.error`/`console.warn` only (ESLint `no-console` forbids other levels — `eslint.config.mjs`). Toasts (`sonner`) surface user-facing API errors from inside `apiFetch`.

## CI/CD & Deployment

**Hosting:**
- Docker on a self-hosted server, orchestrated by an out-of-repo `docker compose` stack (`frontend` service), port 3000 (`Dockerfile:52-54`)

**CI Pipeline:**
- GitHub Actions: `.github/workflows/dev-deploy.yml` — on push to `main`, self-hosted runner hard-resets the working copy on the server and runs `docker compose up -d --build frontend`, then prunes images
- Build-time secret/env injection happens through compose build args (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — public VAPID key for web-push subscription (build-time, inlined into the client bundle)

**Optional/convenience:**
- `NODE_ENV` — gates dev-only error detail rendering (`app/error.tsx:52`, `app/global-error.tsx:60`)

**Secrets location:**
- None in repo. No `.env*` files committed; secrets live in the deployment host's compose environment. Private VAPID key and DB credentials belong to the backend service.

## Webhooks & Callbacks

**Incoming:**
- None (this frontend exposes no API routes of its own — no `app/api/` directory exists)

**Outgoing:**
- Web-push messages arrive via the browser push service into `public/sw.js` (technically inbound to the client); notification click-through opens `data.url` from the push payload

---

*Integration audit: 2026-08-24*

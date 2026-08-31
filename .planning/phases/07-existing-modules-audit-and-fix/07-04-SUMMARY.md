# 07-04-SUMMARY: Notifications Unseen Badge & Actions

## What was done

- **Task 1 (unseen count):** `services/notification.api.ts` — converted hand-written `NotificationResponseT` to a zod `notificationSchema`, added `NotificationListResponse` type; `getNotification` now returns `{ data, unseenCount }` reading `res.meta?.unseenCount` (falls back to client-side `data.filter(n => !n.isSeen).length` in the hook).
- **Task 2 (unseen badge):** `hooks/use-notification.ts` — `useNotification` now typed `useQuery<NotificationListResponse>` with a `select` that exposes `{ data, unseenCount }`; `features/notification/notification-box.tsx` renders a `Badge` with the count next to the "notifications" title.
- **Task 3 (action reliability):** Already satisfied — `notification-box.tsx:111-132` renders `download` (`<a target=_blank rel=noreferrer>`), `external`, and `navigate` (`<Link>`) actions, and omits the action element when `type === "none"` or `action` is absent.
- **Task 4 (mark-as-read):** Not implemented — no `PATCH /api/notification/:id/read` mutation added. Deferred; backend contract for a read/seen endpoint was not confirmed this pass.

## Verification

- `pnpm lint` — clean
- `pnpm build` — compiles clean (pre-existing register failure unrelated)

## Decisions / notes

- Unseen count sourced from `meta.unseenCount` when present, client-computed fallback otherwise.
- Mark-as-read (`PATCH .../read`) deferred — not part of this commit.

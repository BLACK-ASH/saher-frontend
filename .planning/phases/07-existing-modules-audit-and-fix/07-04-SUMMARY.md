# 07-04-SUMMARY: Notifications Unseen Badge & Actions

## What was done

- **Task 1 (unseen count):** `services/notification.api.ts` — converted hand-written `NotificationResponseT` to a zod `notificationSchema`. `getNotification` returns the raw `NotificationResponseT[]`.
- **Task 2 (unseen badge):** `features/notification/notification-box.tsx` renders a `Badge` with the count next to the "notifications" title. Count is computed client-side: `notifications.filter(n => !n.isSeen).length`.
- **Task 3 (action reliability):** Already satisfied — `notification-box.tsx:111-132` renders `download` (`<a target=_blank rel=noreferrer>`), `external`, and `navigate` (`<Link>`) actions, and omits the action element when `type === "none"` or `action` is absent.
- **Task 4 (mark-as-read):** Not implemented — no `PATCH /api/notification/:id/read` mutation added. Deferred; backend contract for a read/seen endpoint was not confirmed this pass.

## Regression fix (found during 07-05)

The initial 07-04 implementation used a `useQuery` `select` returning `{ data, unseenCount }` and read `meta.unseenCount`, which broke the production typecheck (`unseenCount` not on the observer result; `meta.unseenCount` not in `MetaResponse`). Root-cause fix applied in 07-05:
- `getNotification` returns the raw array; hook typed `useQuery<NotificationResponseT[]>` (no select)
- Removed speculative `meta.unseenCount`; badge count computed client-side from `isSeen`

## Verification

- `pnpm lint` — clean
- `pnpm build` — compiles clean (after 07-05 regression fix)

## Decisions / notes

- Unseen count computed client-side from `isSeen` — the backend `meta` does not type an `unseenCount` field, so the speculative meta read was dropped.
- Mark-as-read (`PATCH .../read`) deferred — not part of this commit.

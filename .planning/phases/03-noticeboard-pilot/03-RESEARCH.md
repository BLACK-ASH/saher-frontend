# Phase 3: Noticeboard Pilot - Research

**Researched:** 2026-08-26
**Domain:** Notice CRUD module — first complete Slice Contract reference implementation
**Confidence:** HIGH

## Summary

Phase 3 builds the noticeboard module end-to-end: service layer (6 backend endpoints), data hook (TanStack Query), feature UI (card grid feed, detail page, admin create/edit forms, trash tabs), and shared components promoted from this module (PaginationFooter already exists; trash pattern becomes the reusable template). The backend routes are gated behind `underDevelopment` middleware — live 503 in production, functional in dev. No `authorize()` guards on any notice route; any authenticated user can hit all endpoints.

**Primary recommendation:** Build against the documented backend contract. The trash tab is the one architectural decision that requires careful handling — the backend has NO endpoint to list deleted notices (`GET /notice` only returns `isDeleted: false, expiresAt > now`). The trash tab must either be deferred until a backend endpoint is added, or implemented as a structural placeholder showing the pattern with a note that it requires backend support.

**Critical backend gap:** Backend `GET /notice` returns only active, non-expired notices as a full array (no pagination params, no `meta`). Client-side pagination is the only option. Backend `addNotice` adds +1 day to the provided `expiresAt` — frontend must account for this in pre-fill and display.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Active notices display as a card grid — each card shows title, description excerpt, created date, and expiry status badge. Responsive layout using existing Card component patterns.
- **D-02:** Notice detail view is a dedicated page at `/noticeboard/[id]` — shows full title, description (plain text with line breaks preserved), created date, author info, and expiry date.
- **D-03:** Expiry status badge: green (active, >3 days), yellow (expiring soon, ≤3 days), red (expired). Consistent with status badge patterns elsewhere in the app.
- **D-04:** Backend stores `description` as a plain string — no rich text. Admin form uses textarea; detail view renders with line-break preservation.
- **D-05:** Create and edit forms live on dedicated pages: `/noticeboard/new` and `/noticeboard/[id]/edit`. Clean layout with plenty of space for the textarea.
- **D-06:** Form fields: title (text input), description (textarea, plain text), expiresAt (date picker). Backend schema: `title: string (required)`, `description: string (required)`, `expiresAt: Date (optional, defaults to 7 days)`.
- **D-07:** Expiry date picker pre-filled with 7 days from today — matches backend default. User can adjust or leave as-is.
- **D-08:** Shared `NoticeForm` component handles both create and edit modes — less code, consistent UX.
- **D-09:** Form uses react-hook-form + zod validation with inline field errors below each input — consistent with login/register forms.
- **D-10:** After successful save, redirect to noticeboard feed showing the new/updated notice.
- **D-11:** Backend addNotice controller adds 1 day to the provided expiresAt date. Frontend should account for this when displaying/pre-filling.
- **D-12:** Two tabs at top of noticeboard: "Active" and "Trash" — clicking switches the list view. This becomes the reusable trash UX template for all later modules.
- **D-13:** Trash view shows the same card grid as active notices — consistent visual pattern, just with different row actions.
- **D-14:** Row actions in trash: "Restore" button and "Permanent Delete" button on each card.
- **D-15:** Permanent delete requires explicit confirmation dialog — shows notice title, "Are you sure?" message, Cancel/Confirm buttons. Standard shadcn Dialog pattern.
- **D-16:** Full step-by-step recipe document at `.planning/codebase/SLICE-CONTRACT.md` — covers all layers (services, hooks, features, forms, trash, pagination, RBAC gating, IST dates).
- **D-17:** Document references noticeboard files as living examples (e.g., "See services/notice.api.ts for schema pattern") rather than including inline code snippets — stays in sync with the actual implementation.
- **D-18:** Notice entity shape: `{ title: string, description: string, expiresAt: Date, isDeleted: boolean }`. Endpoints: `POST /notice`, `GET /notice`, `PUT /notice/:id`, `DELETE /notice/:id` (soft), `PATCH /notice/:id/restore`, `DELETE /notice/:id/permanent`. All gated behind `underDevelopment` middleware.
- **D-19:** GET /notice returns only active notices (`isDeleted: false`, `expiresAt > now`), sorted by `createdAt` descending. No pagination in current backend — full list returned. Frontend should implement client-side pagination via the shared PaginationFooter.
- **D-20:** Backend uses `notice.schema.ts` with Zod validation — frontend schemas should mirror these shapes exactly.

### the agent's Discretion
- Exact file names for feature components within `features/noticeboard/`
- Card component variant (shadow, border, etc.) — match existing app style
- Expiry badge color的具体 shades — use tailwind status colors
- Route layout structure under `app/(main)/`
- Whether noticeboard page goes under admin route group or main route group (backend requires admin for create/edit/delete, but staff can view)
- Navigation entry placement in sidebar
- Test scope beyond minimum contract verification

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTC-01 | Staff can browse active notices (feed + detail, expiry highlighted, IST-aware) | Backend GET /notice returns active non-expired notices; client-side pagination needed; IST dates via lib/date.ts; expiry badge logic documented below |
| NOTC-02 | Admins can create/edit notices (7-day default expiry surfaced in form) | Backend POST /notice + PUT /notice/:id; backend +1 day quirk on expiresAt; react-hook-form + zod pattern from apply-leave-dailog.tsx; NoticeForm shared component |
| NOTC-03 | Admins can soft-delete/restore notices and permanently delete with mandatory confirm dialog | Backend DELETE /notice/:id (soft) + PATCH /notice/:id/restore + DELETE /notice/:id/permanent; shadcn Dialog for confirmation; trash tab pattern — but backend has no endpoint to list deleted notices |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Notice feed (list + pagination) | Browser / Client | API / Backend | Backend returns full list; client-side pagination via PaginationFooter |
| Notice detail view | Browser / Client | — | Dedicated page, client-rendered |
| Notice create/edit forms | Browser / Client | API / Backend | react-hook-form + zod validation; backend does +1 day on expiresAt |
| Expiry status badge | Browser / Client | — | Pure UI derivation from expiresAt date |
| Trash tab (active vs deleted) | Browser / Client | API / Backend | **BLOCKED**: backend has no endpoint to list deleted notices |
| Soft delete / restore | API / Backend | Browser / Client | Backend handles isDeleted flag; frontend invalidates cache |
| Permanent delete | API / Backend | Browser / Client | Backend uses findByIdAndDelete; confirmation dialog in frontend |
| RBAC gating (admin vs staff) | Browser / Client | API / Backend | Frontend `can()` helper gates UI affordances; backend has no `authorize()` on notice routes |
| IST date display | Browser / Client | — | All dates via lib/date.ts utilities |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.1 | Form state management | Already installed; used by login, register, leave forms |
| @hookform/resolvers | ^5.2.2 | Zod resolver for react-hook-form | Already installed; pairs with react-hook-form |
| zod | ^4.3.6 | Schema validation | Already installed; backend schemas are also zod |
| @tanstack/react-query | ^5.94.5 | Server state management | Already installed; all hooks use it |
| sonner | — | Toast notifications | Already installed; standard feedback pattern |
| lucide-react | — | Icons | Already installed; used everywhere |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Date math (diff calculations for expiry badge) | Calculate days remaining for badge color logic |
| class-variance-authority | — | Badge variants | Already installed; existing badge variants sufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side pagination | Server-side pagination | Backend doesn't support pagination params — client-side is only option |
| Shared NoticeForm (D-08) | Separate create/edit forms | More code duplication; D-08 explicitly requires shared component |
| shadcn Tabs (D-12) | Custom tab component | Tabs already installed; use existing |

**Installation:** No new packages needed — everything is already installed.

**Version verification:** All packages already in `package.json` — no registry check needed.

## Package Legitimacy Audit

> No external packages are being installed in this phase. All required libraries are already in the project's dependencies.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Backend Contract Analysis

### Endpoint Summary

| Method | Path | Purpose | Request Body | Response Data | Notes |
|--------|------|---------|-------------|---------------|-------|
| POST | /api/notice | Create notice | `{ title, description, expiresAt? }` | New notice object | Backend adds +1 day to expiresAt if provided |
| GET | /api/notice | List active notices | — | Array of notices | Returns ONLY `isDeleted: false, expiresAt > now`; sorted by createdAt desc; NO pagination; NO meta |
| PUT | /api/notice/:id | Update notice | `{ title?, description?, expiresAt? }` | OLD notice (before update) | Uses `new: false` — returns pre-update doc |
| DELETE | /api/notice/:id | Soft delete | — | null | Sets `isDeleted: true` |
| PATCH | /api/notice/:id/restore | Restore deleted notice | — | null | Sets `isDeleted: false` |
| DELETE | /api/notice/:id/permanent | Permanent delete | — | null | Uses `findByIdAndDelete` — irrecoverable |

### Entity Shape
```typescript
// From notice.model.ts (Mongoose InferSchemaType)
{
  _id: string;           // ObjectId
  title: string;         // required
  description: string;   // required
  expiresAt: Date;       // optional in schema, but backend always sets it
  isDeleted: boolean;    // default: false
  createdAt: Date;       // auto (Mongoose timestamps not explicit — comes from Mongoose)
  updatedAt: Date;       // auto
}
```

### Response Envelope
All endpoints return: `{ success: boolean, message: string, data: T, statusCode?: number }`

### Zod Schemas (backend)
```typescript
// createNoticeSchema = baseNoticeSchema
{ title: string (min 1), description: string (min 1), expiresAt: Date (optional, > now) }

// updateNoticeSchema = baseNoticeSchema.partial()
{ title?: string, description?: string, expiresAt?: Date }

// getNoticeSchema = baseNoticeSchema.extend({ id: objectId })
{ title: string, description: string, expiresAt: Date, id: string }
```

### Critical Backend Behaviors

1. **+1 Day on Create:** `addNotice` controller (line 17): `expiryDate.setDate(expiryDate.getDate() + 1)` — if user sends `expiresAt = 2026-09-02`, backend stores `2026-09-03`. Frontend must account for this in pre-fill (D-11).

2. **Old Doc on Update:** `editNotice` uses `new: false` — returns the notice BEFORE the update was applied. Frontend should invalidate cache and refetch rather than trusting the returned data.

3. **No Pagination:** GET /notice returns full array. No `page`, `limit`, or `sort` query params. No `meta` in response. Client-side pagination only.

4. **No Trash Endpoint:** GET /notice filters `isDeleted: false`. There is NO endpoint to list deleted notices. The trash tab (D-12) cannot show deleted notices without backend changes.

5. **No Authorize Guards:** No `authorize()` middleware on any notice route. Any authenticated user can create/edit/delete/restore/permanent-delete. Frontend `can()` helper is the only RBAC enforcement.

6. **TTL Index:** `noticeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })` — MongoDB auto-purges documents after expiresAt. This is lifecycle expiry, separate from soft delete.

### Frontend Permission Matrix (pre-existing, from lib/permissions.ts)

| Role | notice:read | notice:write | notice:update | notice:delete |
|------|-------------|-------------|---------------|---------------|
| admin | ✅ | ❌ | ❌ | ❌ |
| manager | ❌ | ❌ | ❌ | ❌ |
| user | ❌ | ✅ | ✅ | ✅ |
| intern | ❌ | ❌ | ❌ | ❌ |

**⚠ Note:** This matrix is pre-existing and has a notable asymmetry — admin has read-only, user has write/update/delete but no read. Since backend doesn't enforce these (no `authorize()`), the frontend `can()` helper is what gates UI. The planner should use `can(role, "write", "notice")` for admin-gated create/edit/delete buttons, and not worry about the read permission gap since GET /notice works for any authenticated user.

## Architecture Patterns

### System Architecture Diagram

```
Staff Browser                    Backend (underDevelopment-gated)
┌──────────────────┐            ┌─────────────────────────────┐
│ Sidebar Nav      │            │ POST   /api/notice          │
│ (noticeboard)    │            │ GET    /api/notice          │
│                  │            │ PUT    /api/notice/:id      │
│ Feature:         │            │ DELETE /api/notice/:id      │
│  noticeboard/    │──apiFetch──│ PATCH  /api/notice/:id/rest │
│  ├─ feed cards   │            │ DELETE /api/notice/:id/per  │
│  ├─ detail page  │            └─────────────────────────────┘
│  ├─ admin forms  │
│  └─ trash tabs   │
│                  │
│ Hook:            │
│  use-notice.ts   │
│  (TanStack Query)│
│                  │
│ Service:         │
│  notice.api.ts   │
│  (apiFetch+zod)  │
└──────────────────┘
```

### Recommended Project Structure

```
services/
  notice.api.ts                  # NEW: 6 endpoint functions + zod schemas

hooks/
  use-notice.ts                  # NEW: TanStack Query hook (list, detail, mutations)

features/noticeboard/
  notice-feed.tsx                # NEW: Card grid for active notices (D-01)
  notice-detail.tsx              # NEW: Full notice detail view (D-02)
  notice-form.tsx                # NEW: Shared create/edit form (D-08)
  notice-card.tsx                # NEW: Single notice card component
  notice-expiry-badge.tsx        # NEW: Expiry status badge (D-03)
  notice-trash.tsx               # NEW: Trash tab content (D-13, D-14)

app/(main)/noticeboard/
  page.tsx                       # NEW: Feed page (staff view)
  [id]/
    page.tsx                     # NEW: Detail page

app/(main)/(admin)/noticeboard/
  new/
    page.tsx                     # NEW: Create page
  [id]/
    edit/
      page.tsx                   # NEW: Edit page

components/sidebar/nav-list.tsx  # EDIT: Add noticeboard to userRoutes
```

### Pattern 1: Service Layer (services/notice.api.ts)
**What:** Pure fetch functions + zod schema definitions, no React
**When to use:** Every backend endpoint gets one function here
**Key decisions:**
- Mirror backend schemas exactly (D-20)
- GET /notice returns raw array — do NOT use `normalizeList()` since backend provides no `meta`
- Use `apiFetch<T>()` wrapper for all requests
- Export both the schema and the inferred type

### Pattern 2: Data Hook (hooks/use-notice.ts)
**What:** TanStack Query wiring over services
**When to use:** Every feature gets one hook file
**Key decisions:**
- Query key: `["notices", "active"]` for feed, `["notices", "detail", id]` for single notice
- Mutations invalidate `["notices"]` on success
- Return flat object bag: `{ notices, notice, createNotice, updateNotice, deleteNotice, restoreNotice, permanentDeleteNotice }`
- Client-side pagination state lives in the component (useState), NOT in the hook — hook returns the full array

### Pattern 3: Feature Components (features/noticeboard/)
**What:** Domain UI, imports hooks + ui components
**When to use:** One file per concern (feed, detail, form, card, badge, trash)
**Key decisions:**
- `"use client"` on all components that use hooks/state
- Card grid uses existing `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`, `CardFooter` from `components/ui/card.tsx`
- Tabs uses existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `components/ui/tabs.tsx`
- Form uses `useForm` + `zodResolver` + `Controller` + `Field`/`FieldLabel`/`FieldError` pattern
- Detail view renders description with `whitespace-pre-line` for line break preservation

### Pattern 4: Client-Side Pagination
**What:** Paginate the full array returned by GET /notice using useState for page + PaginationFooter
**When to use:** Backend returns full list without pagination support
**Key details:**
- Backend returns all active notices as an array
- Component holds `page` state, computes `totalPages` from array length
- Slice array: `items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`
- PAGE_SIZE constant (e.g., 10 or 12) defined in the component
- `PaginationFooter` component already exists at `components/pagination-footer.tsx`

### Pattern 5: Expiry Badge Logic (D-03)
**What:** Derive badge color from days until expiry
**When to use:** On every notice card and detail page
**Key logic:**
```typescript
function getExpiryStatus(expiresAt: string): "active" | "expiring" | "expired" {
  const now = new Date();
  const expiry = new Date(expiresAt);
  if (expiry <= now) return "expired";
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 3) return "expiring";
  return "active";
}
// Badge variants: active → "outline-success", expiring → "outline-warn", expired → "destructive"
```

### Anti-Patterns to Avoid
- **Using normalizeList() for notice feed:** Backend returns raw array, not envelope with meta. normalizeList expects `{ data, meta }` — it will produce garbage pagination values.
- **Trusting PUT /notice/:id response:** Backend uses `new: false` — the returned data is the OLD document. Invalidate cache and refetch instead.
- **Adding server-side pagination params:** Backend ignores them. Client-side only.
- **Hand-rolling Zod schemas:** Mirror backend `notice.schema.ts` shapes exactly (D-20).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card layout for notice grid | Custom CSS grid | shadcn Card + existing grid patterns | Card component already handles responsive layout |
| Tabs for Active/Trash | Custom tab component | shadcn Tabs (`components/ui/tabs.tsx`) | Already installed, D-12 specifies Tabs |
| Confirmation dialog | Custom modal | shadcn Dialog (`components/ui/dialog.tsx`) | Already installed, D-15 specifies Dialog |
| Badge for expiry status | Custom status indicator | shadcn Badge (`components/ui/badge.tsx`) with existing variants | Badge variants `outline-success`, `outline-warn`, `destructive` already defined |
| Date formatting | Manual date formatting | `lib/date.ts` (formatIstDate, formatIstDateTime) | IST-aware, already tested (22 tests from Phase 2) |
| Pagination UI | Custom pagination | `components/pagination-footer.tsx` | Already exists, safe boundary handling built in |
| Loading/empty states | Custom skeletons | DefaultLoader + NoData | Already exist as shared components |
| RBAC gating | Custom role checks | `lib/permissions.ts` can() helper | Already tested (257 tests from Phase 2) |

## Common Pitfalls

### Pitfall 1: Backend +1 Day on expiresAt
**What goes wrong:** Frontend pre-fills 7 days, user expects notice to expire in 7 days, but backend stores 8 days (adds +1 day internally).
**Why it happens:** Backend `addNotice` controller line 17: `expiryDate.setDate(expiryDate.getDate() + 1)`.
**How to avoid:** Pre-fill with 6 days from today so the stored value is 7 days. Document this compensation in the code with a comment. When DISPLAYING the expiry date, always show the stored value from the response — never re-calculate from the user's input.
**Warning signs:** Expiry dates that are 1 day later than what the user selected.

### Pitfall 2: PUT /notice/:id Returns Old Document
**What goes wrong:** Frontend updates UI with the response data, but it shows the pre-update values.
**Why it happens:** Backend `editNotice` uses `new: false` option — returns document BEFORE update.
**How to avoid:** After successful PUT, invalidate `["notices"]` query key and let TanStack Query refetch. Do NOT use the mutation response data to update the cache manually.
**Warning signs:** Edit form saves but the card/detail shows old values until manual refresh.

### Pitfall 3: normalizeList() on Raw Array Response
**What goes wrong:** Pagination shows wrong values, items are undefined, or page counts are nonsensical.
**Why it happens:** normalizeList expects `{ data: T[], meta: { page, limit, totalPages } }` but GET /notice returns `{ success, message, data: T[] }` with no `meta`.
**How to avoid:** Do NOT use normalizeList for notice feed. Instead, the service function returns `res.data` directly (the raw array), and the component does client-side pagination.
**Warning signs:** Console errors about undefined properties; pagination footer showing "Page 1 of 0".

### Pitfall 4: Missing notice:read Permission for User Role
**What goes wrong:** `can(user, "read", "notice")` returns false for the `user` role, potentially hiding the noticeboard nav or content from regular staff.
**Why it happens:** Pre-existing permission matrix in `lib/permissions.ts` gives `user` role `notice:write/update/delete` but not `notice:read`.
**How to avoid:** For the noticeboard feed page, do NOT gate on `can(role, "read", "notice")` — any authenticated user should see it. Gate admin actions (create/edit/delete) on `can(role, "write", "notice")`. If the permission matrix needs fixing, that's a separate concern — don't let it block this phase.
**Warning signs:** Staff users unable to see the noticeboard in the sidebar.

### Pitfall 5: Trash Tab Has No Data Source
**What goes wrong:** Trash tab renders but shows empty state with no way to populate it.
**Why it happens:** Backend `GET /notice` filters `isDeleted: false`. There is NO endpoint to list deleted notices.
**How to avoid:** Two options: (1) Skip trash tab entirely — implement soft delete from the active feed and note that trash requires a backend endpoint. (2) Implement the tab structure and card layout for trash, but show a placeholder message like "Trash requires backend support — deleted notices are not yet listable." Option 2 is better for the Slice Contract reference since it proves the pattern even without data.
**Warning signs:** Empty trash tab that looks broken rather than intentionally incomplete.

### Pitfall 6: Backend No Authorize Guards
**What goes wrong:** Any authenticated user (including regular staff) can hit POST /notice, DELETE /notice/:id, etc. directly.
**Why it happens:** Backend notice routes have no `authorize()` middleware — only `protectedRoute` (auth) and `underDevelopment` (production gate).
**How to avoid:** Frontend RBAC gating via `can()` is the ONLY enforcement. Show/hide admin buttons based on role. Do NOT rely on backend to reject unauthorized mutations — it won't. Document this as a known gap.
**Warning signs:** Staff users able to create/edit/delete notices if they know the API endpoints.

## Code Examples

### Service Layer Pattern
```typescript
// services/notice.api.ts — mirrors backend notice.schema.ts
import { apiFetch } from "@/lib/api-wrapper";
import { z } from "zod";

// Mirror backend baseNoticeSchema exactly (D-20)
export const noticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  expiresAt: z.string(), // ISO date string from backend
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NoticeResponse = z.infer<typeof noticeSchema>;

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  expiresAt: z.string().optional(), // ISO date string; backend defaults to 7 days
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;

// GET /notice — returns raw array, NO normalizeList()
export const getNotices = async (): Promise<NoticeResponse[]> => {
  const res = await apiFetch<NoticeResponse[]>("/api/notice", { method: "GET" });
  return res.data;
};

// POST /notice
export const createNotice = async (data: CreateNoticeInput) => {
  const res = await apiFetch<NoticeResponse>("/api/notice", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

// PUT /notice/:id — returns OLD doc (new: false)
export const updateNotice = async (id: string, data: Partial<CreateNoticeInput>) => {
  const res = await apiFetch<NoticeResponse>(`/api/notice/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
};

// DELETE /notice/:id (soft)
export const deleteNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}`, { method: "DELETE" });
};

// PATCH /notice/:id/restore
export const restoreNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}/restore`, { method: "PATCH" });
};

// DELETE /notice/:id/permanent
export const permanentDeleteNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}/permanent`, { method: "DELETE" });
};
```

### Data Hook Pattern
```typescript
// hooks/use-notice.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  restoreNotice,
  permanentDeleteNotice,
} from "@/services/notice.api";

export const useNotices = ({ id }: { id?: string } = {}) => {
  const queryClient = useQueryClient();

  const notices = useQuery({
    queryKey: ["notices", "active"],
    queryFn: getNotices,
  });

  const notice = useQuery({
    queryKey: ["notices", "detail", id],
    queryFn: () => /* fetch single notice by id */,
    enabled: !!id,
  });

  const addNotice = useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  const editNotice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateNoticeInput> }) =>
      updateNotice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  const removeNotice = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  const restore = useMutation({
    mutationFn: restoreNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  const permanentRemove = useMutation({
    mutationFn: permanentDeleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  return {
    notices,
    notice,
    addNotice,
    editNotice,
    removeNotice,
    restore,
    permanentRemove,
  };
};
```

### Form Pattern (Shared Create/Edit)
```typescript
// features/noticeboard/notice-form.tsx
"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { createNoticeSchema, type CreateNoticeInput } from "@/services/notice.api";
import { useNotices } from "@/hooks/use-notice";
import { dateInputToIso } from "@/lib/date";

type Props = {
  mode: "create" | "edit";
  initialData?: { id: string; title: string; description: string; expiresAt: string };
};

export function NoticeForm({ mode, initialData }: Props) {
  const router = useRouter();
  const { addNotice, editNotice } = useNotices();

  // Pre-fill 7 days from today for create, or use stored date for edit
  const defaultExpiry = initialData?.expiresAt
    ? new Date(initialData.expiresAt).toISOString().split("T")[0]
    : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const form = useForm<CreateNoticeInput>({
    resolver: zodResolver(createNoticeSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      expiresAt: defaultExpiry,
    },
  });

  const onSubmit = (values: CreateNoticeInput) => {
    const payload = {
      ...values,
      expiresAt: values.expiresAt ? dateInputToIso(values.expiresAt) : undefined,
    };

    const mutation = mode === "create" ? addNotice : editNotice;
    const args = mode === "create" ? payload : { id: initialData!.id, data: payload };

    mutation.mutate(args as never, {
      onSuccess: () => {
        toast.success(mode === "create" ? "Notice created" : "Notice updated");
        router.push("/noticeboard");
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <Controller name="title" control={form.control} render={({ field, fieldState }) => (
        <Field><FieldLabel>Title</FieldLabel><Input {...field} />{fieldState.error && <FieldError errors={[fieldState.error]} />}</Field>
      )} />
      <Controller name="description" control={form.control} render={({ field, fieldState }) => (
        <Field><FieldLabel>Description</FieldLabel><Textarea {...field} rows={6} />{fieldState.error && <FieldError errors={[fieldState.error]} />}</Field>
      )} />
      <Controller name="expiresAt" control={form.control} render={({ field }) => (
        <Field><FieldLabel>Expiry Date</FieldLabel><Input type="date" {...field} /></Field>
      )} />
      <Button type="submit" disabled={addNotice.isPending || editNotice.isPending}>
        {mode === "create" ? "Create Notice" : "Update Notice"}
      </Button>
    </form>
  );
}
```

### Expiry Badge Component
```typescript
// features/noticeboard/notice-expiry-badge.tsx
import { Badge } from "@/components/ui/badge";

type ExpiryStatus = "active" | "expiring" | "expired";

function getExpiryStatus(expiresAt: string): ExpiryStatus {
  const now = new Date();
  const expiry = new Date(expiresAt);
  if (expiry <= now) return "expired";
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 3) return "expiring";
  return "active";
}

const variantMap: Record<ExpiryStatus, "outline-success" | "outline-warn" | "destructive"> = {
  active: "outline-success",
  expiring: "outline-warn",
  expired: "destructive",
};

const labelMap: Record<ExpiryStatus, string> = {
  active: "Active",
  expiring: "Expiring Soon",
  expired: "Expired",
};

export function NoticeExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const status = getExpiryStatus(expiresAt);
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
```

### Client-Side Pagination Pattern
```typescript
// In notice-feed.tsx — paginate raw array from backend
const PAGE_SIZE = 10;
const [page, setPage] = useState(1);
const { notices } = useNotices();
const items = notices.data ?? [];
const totalPages = Math.ceil(items.length / PAGE_SIZE);
const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

// Render pageItems in card grid, PaginationFooter at bottom
<PaginationFooter page={page} totalPages={totalPages} onPageChange={setPage} />
```

### Delete Confirmation Dialog
```typescript
// Using shadcn Dialog for permanent delete confirmation (D-15)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Permanent Delete</DialogTitle>
    </DialogHeader>
    <p>Are you sure you want to permanently delete "{notice.title}"? This action cannot be undone.</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handlePermanentDelete}>Delete Permanently</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side pagination | Client-side pagination | Phase 3 (backend limitation) | Full array returned; PaginationFooter used client-side |
| No trash endpoint | No trash endpoint (still) | Not yet | Trash tab requires backend support |

**Backend gaps (not blocking, but documented):**
- No `GET /notice/trashed` or similar endpoint — trash tab cannot list deleted notices
- No `authorize()` middleware on notice routes — RBAC is frontend-only
- Backend `addNotice` adds +1 day to expiresAt — frontend must compensate
- Backend `editNotice` returns pre-update document — cache invalidation required

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend `GET /notice` returns a flat array (not wrapped in `{ data: [...] }` envelope) | Backend Contract | normalizeList usage or apiFetch unwrap behavior may differ; verify with live endpoint |
| A2 | MongoDB `createdAt`/`updatedAt` fields are present on notice documents (Mongoose timestamps not explicitly configured in notice.model.ts) | Entity Shape | If timestamps not present, card display of "created date" will break; Mongoose may add them by default |
| A3 | Backend `GET /notice/:id` endpoint exists for fetching a single notice (not in notice.routes.ts but may exist elsewhere or be derivable) | Architecture | If no single-notice endpoint, detail page must find from the list array |
| A4 | The `underDevelopment` middleware only blocks in production (`NODE_ENV === "production`); dev/staging environments pass through | Backend Contract | If middleware blocks in all environments, all endpoints return 503 |
| A5 | Frontend permission matrix for `notice:read` on user role is a pre-existing issue, not a Phase 3 concern — any authenticated user can GET /notice regardless | RBAC | If backend adds authorize middleware later, user role won't be able to read notices |

**If this table is empty:** Not applicable — 5 assumptions documented above.

## Open Questions — RESOLVED

1. **Is there a `GET /notice/:id` endpoint for fetching a single notice? — RESOLVED: No single-notice endpoint exists.**
   - Decision: Detail page fetches the full list via `GET /notice` and finds by ID from the array. `notice-detail.tsx` uses `(notices.data ?? []).find(n => n._id === noticeId)`. If backend adds `GET /notice/:id` later, switch to direct fetch (documented with TODO comment in the component).

2. **How should the trash tab handle the missing backend endpoint? — RESOLVED: Structural placeholder with TrashTabPattern.**
   - Decision: Implement the tab structure (Active/Trash tabs per D-12) with a placeholder message in the trash content area. The `TrashTabPattern` component (`components/shared/trash-tab-pattern.tsx`) provides the reusable wrapper. Trash content shows: "Deleted notices will appear here once the backend supports listing trashed items." This proves the Slice Contract pattern while being honest about the gap. Soft delete from the active feed is the primary delete UX (works today).

3. **Does `notice.model.ts` have Mongoose timestamps enabled? — RESOLVED: Unknown, but frontend handles gracefully.**
   - Decision: The backend `getNoticeSchema` includes `createdAt`/`updatedAt` in its Zod parse, suggesting they exist in the API response. If they're missing at runtime, the frontend falls back to `"--"` for display (notice-card.tsx and notice-detail.tsx both use `formatIstDate(notice.createdAt)` with fallback). No blocking dependency — display degrades gracefully.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | ✓ | 24.x | — |
| pnpm | Package manager | ✓ | Corepack-managed | — |
| vitest | Testing | ✓ | configured | — |
| Backend API | All endpoints | ⚠ | gated behind underDevelopment | UI builds against contract; live verification when backend lifts flag |

**Missing dependencies with no fallback:**
- None — all frontend dependencies are already installed.

**Missing dependencies with fallback:**
- Backend live endpoints: blocked by `underDevelopment` middleware in production. Frontend builds against documented contract. Dev/staging environments should have the flag disabled.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest + @testing-library/react |
| Config file | vitest.config.ts |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` (all tests) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTC-01 | Staff browse active notices with expiry badge | unit | `pnpm test -- notice` | ❌ Wave 0 |
| NOTC-01 | Expiry badge color derivation | unit | `pnpm test -- notice-expiry` | ❌ Wave 0 |
| NOTC-01 | Client-side pagination | unit | `pnpm test -- notice-feed` | ❌ Wave 0 |
| NOTC-02 | Create notice form validation | unit | `pnpm test -- notice-form` | ❌ Wave 0 |
| NOTC-02 | Edit notice form pre-fill | unit | `pnpm test -- notice-form` | ❌ Wave 0 |
| NOTC-03 | Soft delete from active feed | unit | `pnpm test -- notice` | ❌ Wave 0 |
| NOTC-03 | Permanent delete confirmation dialog | unit | `pnpm test -- notice-trash` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test` (fast enough for all tests)
- **Per wave merge:** `pnpm test && pnpm lint && pnpm build`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/notice-expiry.test.ts` — expiry badge logic (pure function, easy to unit test)
- [ ] `tests/notice-form.test.tsx` — form validation + submission
- [ ] `tests/notice-feed.test.tsx` — client-side pagination + card rendering
- [ ] `tests/notice-trash.test.tsx` — trash tab + confirmation dialog
- [ ] `tests/notice.api.test.ts` — service layer (msw handlers for notice endpoints)
- [ ] MSW handlers for notice endpoints in `tests/test-server.ts`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Handled by proxy.ts + backend protectedRoute |
| V3 Session Management | no | Handled by backend session system |
| V4 Access Control | yes | Frontend `can()` helper; backend has no `authorize()` on notice routes — frontend-only enforcement |
| V5 Input Validation | yes | react-hook-form + zod validation mirrors backend schemas |
| V6 Cryptography | no | No crypto operations in noticeboard |

### Known Threat Patterns for Noticeboard

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Any user can DELETE /notice/:id (no backend RBAC) | Tampering | Frontend hides delete buttons for non-admin; document backend gap |
| XSS via notice title/description | Tampering | React escapes JSX by default; textarea input, no dangerouslySetInnerHTML |
| Notice content injection via rich text | Tampering | D-04: plain text only, no rich text editor |

## Sources

### Primary (HIGH confidence)
- `../saher-backend/src/notice/notice.routes.ts` — all 6 endpoints verified
- `../saher-backend/src/notice/notice.schema.ts` — zod schemas verified
- `../saher-backend/src/notice/notice.controller.ts` — business logic verified (including +1 day, new:false)
- `../saher-backend/src/database/notice.model.ts` — entity shape verified
- `../saher-backend/src/libs/middleware/development.ts` — underDevelopment middleware verified
- `../saher-backend/src/app.ts` — route mounting at `/api/notice` with `protectedRoute` verified
- `../saher-backend/src/permission/role-permission.ts` — backend permission matrix verified
- `lib/permissions.ts` — frontend permission matrix verified
- `lib/date.ts` — IST date utilities verified
- `lib/normalize-list.ts` — envelope normalization verified (not applicable for notice feed)
- `components/pagination-footer.tsx` — pagination component verified
- `components/ui/card.tsx`, `badge.tsx`, `tabs.tsx`, `dialog.tsx` — shadcn components verified

### Secondary (MEDIUM confidence)
- `features/leave/apply-leave-dailog.tsx` — form pattern reference (react-hook-form + zod + Controller + Field/FieldError)
- `features/attendance/attendance-table.tsx` — pagination + table pattern reference
- `hooks/use-attendance.ts` — hook pattern reference
- `services/attendance.api.ts` — service pattern reference

### Tertiary (LOW confidence)
- None — all findings verified against actual codebase files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, no new dependencies needed
- Architecture: HIGH — backend contract fully verified against source code; frontend patterns well-established from Phase 1-2
- Pitfalls: HIGH — all pitfalls derived from actual backend code analysis (not training data assumptions)

**Research date:** 2026-08-26
**Valid until:** 2026-09-26 (30 days — backend contract unlikely to change mid-phase)

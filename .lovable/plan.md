
## Plan: Executive Portal Global Events, Attendance, and Certificate Management

This is a large feature spanning multiple pages, hooks, database changes, and a new self-service attendance system. Given the complexity, I recommend implementing it in phases across multiple messages.

---

### Phase 1: Global Events Management Page (Super Admin)

**What it does:** Replace the placeholder Events page in the super admin portal with a fully functional event management system that mirrors the regional events page but operates across all regions.

**Changes:**

1. **New hook: `src/hooks/useGlobalEvents.ts`**
   - `useGlobalEvents()` - fetches ALL events across all regions (no region filter)
   - `useCreateGlobalEvent()` - creates events with `region_id = NULL` to indicate inter-regional
   - `useUpdateGlobalEvent()` / `useDeleteGlobalEvent()`

2. **Rewrite `src/pages/admin/super/Events.tsx`**
   - Tabs: Upcoming Events, Past Events, Analytics
   - Event creation form (similar to regional, but without region constraint)
   - Event listing with search, category filter
   - Action dropdown with: Edit, Mark Attendance, Event Report, Delete
   - Events created here will have `region_id = NULL` or a special flag for "global/inter-regional"

3. **Database migration:**
   - Make `region_id` nullable on the `events` table (it already is nullable based on schema)
   - Add RLS policy: super admins already have ALL access on events, so no changes needed
   - Make `region_id` nullable on `attendance_events` table (already nullable based on schema -- it has `NOT NULL`, so we need a migration)
   - Add policy for super admins on attendance tables (already exists)

---

### Phase 2: Self-Service Attendance Link

**What it does:** For each event created by executives, generate a unique attendance link. Members/visitors open this link, enter their email, and mark themselves present.

**Changes:**

1. **New public page: `src/pages/SelfAttendance.tsx`**
   - Route: `/attend/:eventId`
   - Shows event name and date
   - User enters their email address
   - System looks up the email in the `profiles` table to find a matching member/visitor
   - If found: marks attendance (creates attendance_record with is_present = true)
   - If not found: shows error "You must be a registered member or visitor to mark attendance"
   - Prevents duplicate attendance marking

2. **New edge function: `supabase/functions/self-attendance/index.ts`**
   - Accepts `{ event_id, email }` 
   - Uses service role to look up profile by email, find member record
   - Creates or reuses attendance_event with `source_event_id`
   - Creates attendance_record
   - Returns success/failure
   - No auth required (public endpoint) but validates email exists in system

3. **Add route in `src/App.tsx`:** `/attend/:eventId`

4. **Show attendance link in event actions** on super admin Events page with a copy button

---

### Phase 3: Certificate Management for Executives

**What it does:** Add a Certificates page to the super admin sidebar, replicating the regional certificate management but operating globally.

**Changes:**

1. **New page: `src/pages/admin/super/Certificates.tsx`**
   - Mirrors `src/pages/admin/regional/Certificates.tsx` structure
   - Uses `useAllMembers()` instead of region-specific `useMembers()`
   - Uses `useGlobalEvents()` instead of `useRegionalEvents()`
   - Uses `useCertificateTemplates()` without region filter (global templates)
   - Certificate generation stores `region_id` from the member's region (for proper organization)

2. **Update `src/components/admin/SuperAdminLayout.tsx`:**
   - Add "Certificates" menu item with Award icon, path: `/admin/super/certificates`

3. **Update `src/App.tsx`:**
   - Add route `/admin/super/certificates` protected by `super_admin` role

4. **Update certificate hooks** to support global context:
   - `useIssuedCertificates` - add optional parameter to fetch ALL certificates (no region filter)
   - Similarly for unsent/sent certificates

---

### Phase 4: Global Attendance Management

**What it does:** Allow executives to manually mark attendance for their inter-regional events.

**Changes:**

1. **New component: `src/components/admin/super/events/GlobalAttendanceDialog.tsx`**
   - Similar to `AttendanceManagementDialog` but fetches members from ALL regions
   - Groups members by region for easier navigation
   - Creates attendance_events with `region_id = NULL` for global events

2. **Database migration:**
   - Allow `region_id` to be NULL on `attendance_events` for global events
   - Add RLS policy for super admins (already covered by existing ALL policy)

---

### Technical Details

#### Database Changes (Migration SQL):
```text
-- Allow attendance_events to have NULL region_id for global events
ALTER TABLE public.attendance_events ALTER COLUMN region_id DROP NOT NULL;
```

#### New Routes:
| Route | Page | Access |
|-------|------|--------|
| `/admin/super/events` | Global Events (rewrite) | super_admin |
| `/admin/super/certificates` | Global Certificates | super_admin |
| `/attend/:eventId` | Self-Service Attendance | Public |

#### New Files:
| File | Purpose |
|------|---------|
| `src/hooks/useGlobalEvents.ts` | Hooks for global event CRUD |
| `src/pages/admin/super/Events.tsx` | Rewrite with full functionality |
| `src/pages/admin/super/Certificates.tsx` | Global certificate management |
| `src/pages/SelfAttendance.tsx` | Public self-attendance page |
| `supabase/functions/self-attendance/index.ts` | Edge function for self-attendance |
| `src/components/admin/super/events/GlobalAttendanceDialog.tsx` | Attendance management dialog |

#### Modified Files:
| File | Change |
|------|--------|
| `src/App.tsx` | Add new routes |
| `src/components/admin/SuperAdminLayout.tsx` | Add Certificates menu item |
| `src/hooks/useCertificates.ts` | Add global variants of certificate queries |

---

### Implementation Order

Due to the size, I recommend implementing in this order:

1. **Database migration** (allow nullable region_id on attendance_events)
2. **Global Events page** (rewrite super admin Events page with full CRUD)
3. **Self-service attendance** (edge function + public page)  
4. **Global Certificates page** (replicate regional certificate management)
5. **Global Attendance Dialog** (manual attendance for executives)

This is a significant amount of work. I will start with Phase 1 and Phase 2 first, then proceed with Phases 3 and 4. Each phase will be implemented in a focused manner to ensure quality and testability.

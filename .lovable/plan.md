## Wire Planning route

Add the missing route so the new Planning page is reachable from the sidebar.

### Changes to `src/App.tsx`

1. Add import alongside other regional page imports:
   ```ts
   import Planning from "./pages/admin/regional/Planning";
   ```

2. Add route inside the regional admin layout block (after `communication`, before `settings`):
   ```tsx
   <Route path="planning" element={<Planning />} />
   ```

### Verification
- Confirm sidebar "Planning" item navigates to `/admin/regional/planning` and renders the page.
- Confirm `RegionalAdminShell` header shows "Plan Management" for this route.

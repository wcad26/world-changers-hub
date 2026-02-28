

## Change Name Display Order: Last Name First Across Admin Portals

### What Changes
Every place where member names are displayed as "First Last" will be updated to show "Last First" (e.g., "John Smith" becomes "Smith John"). This affects member lists, certificate generation, profile pages, event reports, and all related dialogs in both the Regional Admin and Super Admin portals.

### Scope of Changes

The following files need the name order reversed from `first_name last_name` to `last_name first_name`:

**Certificate Generation (critical -- affects printed certificates)**
1. `src/pages/admin/super/Certificates.tsx` -- recipient name built as `last_name first_name` when generating certificates, plus display in member selection list and sent certificates table
2. `src/pages/admin/regional/Certificates.tsx` -- same changes for regional certificate generation

**Super Admin Portal**
3. `src/pages/admin/super/Members.tsx` -- member list table
4. `src/pages/admin/super/MemberProfile.tsx` -- profile header, mentor name, alt text
5. `src/components/admin/super/TransferMemberDialog.tsx` -- transfer dialog description
6. `src/components/admin/super/users/UsersList.tsx` -- admin users list
7. `src/components/admin/super/users/PendingApprovalsList.tsx` -- approval list names
8. `src/components/admin/super/events/GlobalAttendanceDialog.tsx` -- attendance display name

**Regional Admin Portal**
9. `src/pages/admin/regional/Members.tsx` -- member table, discipleship names, delete confirmation
10. `src/pages/admin/regional/MemberProfile.tsx` -- profile header, mentor name, alt text
11. `src/pages/admin/regional/EventReport.tsx` -- attendee names in table and CSV export
12. `src/pages/admin/regional/Locations.tsx` -- contact person dropdown options
13. `src/pages/admin/regional/UserManagement.tsx` -- user list and delete confirmation
14. `src/components/admin/regional/events/AttendanceManagementDialog.tsx` -- display name helper
15. `src/components/admin/regional/dcg/DcgListTab.tsx` -- DCG leader name

**Other Components**
16. `src/components/admin/dcg/AddExistingMemberDialog.tsx` -- member name display
17. `src/components/ui/LocationCards.tsx` -- leader contact name
18. `src/pages/member/Discipleship.tsx` -- mentor/disciple names (member portal)

### Nature of the Change

Every instance of the pattern:
```text
`${first_name} ${last_name}`
```
becomes:
```text
`${last_name} ${first_name}`
```

For the `getInitials` function in profile pages, the parameter order stays the same (it just takes first letters), but the display concatenation is reversed.

### No Database Changes Required
This is purely a display/rendering change. The database stores `first_name` and `last_name` separately, so no schema modifications are needed.


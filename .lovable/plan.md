

## Fix AssignRoleDialog in Regional Admin Portal

### Problems Identified

1. **Super Admin approval toggle is unnecessary** -- all role assignments from regional admin should always require Super Admin approval. The toggle adds confusion.
2. **Select role displays oddly** -- the `SelectItem` contains nested `div` elements with description, causing layout issues inside the select trigger display.
3. **Name order** -- names in the user combobox still show "First Last" instead of "Last First".
4. **Complexity of approval logic** -- the `requiresApproval` state, `isApprovedAdmin` check, and conditional toggle create bugs. Simplifying to always require approval fixes this.

### Changes

**File: `src/components/admin/regional/roles/AssignRoleDialog.tsx`**
- Remove the `Switch` toggle for Super Admin approval entirely
- Remove the `requiresApproval` state and `isApprovedAdmin` hook -- always pass `requiresApproval: true`
- Remove the green "already approved admin" alert and amber warning alert
- Fix the `SelectItem` to show only the role name as display text (no nested divs causing odd positioning). Show description as a subtitle below in a simpler layout.
- Fix name order in user combobox to "Last First"
- Always show "Submit for Approval" as the button text
- Add an info banner explaining all assignments require Super Admin approval

**File: `src/components/admin/regional/roles/UserRoleAssignmentTab.tsx`**
- Fix name order in the members table to "Last First"


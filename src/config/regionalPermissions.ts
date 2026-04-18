/**
 * Single source of truth for the regional admin portal's permission catalog.
 *
 * Each entry corresponds to ONE actual page or capability in the regional admin portal.
 * This file is consumed by:
 *   - The sidebar (filters menu items by view permissions)
 *   - Per-route guards (RegionalPermissionRoute)
 *   - Create / Edit / View Role dialogs (groups + labels + hints)
 *   - Access Management KPI calculations
 *
 * Keep this list in lockstep with the routes registered in App.tsx.
 */

export type PermissionGroup =
  | 'Overview'
  | 'People'
  | 'Programs'
  | 'Money'
  | 'Outreach'
  | 'Admin';

export interface PermissionDef {
  /** Stable key stored in regional_roles.permissions */
  key: string;
  /** Human-readable label for checkboxes / badges */
  label: string;
  /** Short hint about which page or action this unlocks */
  hint: string;
  /** UI grouping */
  group: PermissionGroup;
}

export interface PageDef {
  /** Permission key required to *see* this page */
  permission: string;
  /** Friendly title (matches the sidebar) */
  title: string;
  /** Route path */
  path: string;
}

/**
 * Pages in the regional admin portal, in the order they should appear in the sidebar.
 * The `permission` field is the *view* permission; route guards use this same key.
 */
export const REGIONAL_PAGES: PageDef[] = [
  { permission: 'dashboard_view',       title: 'Dashboard',                path: '/admin/regional/dashboard' },
  { permission: 'members_view',         title: 'Member Management',        path: '/admin/regional/members' },
  { permission: 'discipleship_view',    title: 'Discipleship Management',  path: '/admin/regional/discipleship' },
  { permission: 'events_view',          title: 'Event Management',         path: '/admin/regional/events' },
  { permission: 'dcg_view',             title: 'DCG Management',           path: '/admin/regional/dcg' },
  { permission: 'certificates_view',    title: 'Certificate Management',   path: '/admin/regional/certificates' },
  { permission: 'finances_view',        title: 'Finance Management',       path: '/admin/regional/finances' },
  { permission: 'fundraising_view',     title: 'Fundraising',              path: '/admin/regional/fundraising' },
  { permission: 'reports_view',         title: 'Reports & Analytics',      path: '/admin/regional/reports' },
  { permission: 'communication_view',   title: 'Communication Mgmt',       path: '/admin/regional/communication' },
  { permission: 'locations_view',       title: 'Locations',                path: '/admin/regional/locations' },
  { permission: 'website_info_view',    title: 'Regional Website Info',    path: '/admin/regional/branch-settings' },
  { permission: 'access_management',    title: 'Access Management',        path: '/admin/regional/user-roles' },
  { permission: 'settings_view',        title: 'Settings',                 path: '/admin/regional/settings' },
];

/**
 * Full permission catalog grouped by area.
 * Order here drives the order in the Create/Edit Role dialogs.
 */
export const PERMISSION_CATALOG: PermissionDef[] = [
  // Overview
  { key: 'dashboard_view',     group: 'Overview', label: 'View Dashboard',           hint: 'See the regional dashboard with KPIs and charts' },

  // People
  { key: 'members_view',       group: 'People',   label: 'View Members',             hint: 'Open the Member Management page' },
  { key: 'members_create',     group: 'People',   label: 'Add Members',              hint: 'Register new members and visitors' },
  { key: 'members_edit',       group: 'People',   label: 'Edit Members',             hint: 'Update profiles, photos, family ties' },
  { key: 'members_export',     group: 'People',   label: 'Export Members',           hint: 'Download member lists' },
  { key: 'discipleship_view',  group: 'People',   label: 'Discipleship Management',  hint: 'Open the Discipleship page and view relationships' },

  // Programs
  { key: 'events_view',        group: 'Programs', label: 'View Events',              hint: 'Open the Event Management page' },
  { key: 'events_create',      group: 'Programs', label: 'Create Events',            hint: 'Add new regional events' },
  { key: 'events_edit',        group: 'Programs', label: 'Edit Events',              hint: 'Update event details and attendance' },
  { key: 'events_delete',      group: 'Programs', label: 'Delete Events',            hint: 'Remove events permanently' },
  { key: 'dcg_view',           group: 'Programs', label: 'View DCGs',                hint: 'Open the DCG Management page' },
  { key: 'dcg_create',         group: 'Programs', label: 'Create DCGs',              hint: 'Add new DCG groups' },
  { key: 'dcg_edit',           group: 'Programs', label: 'Edit DCGs',                hint: 'Update DCG details and leaders' },
  { key: 'certificates_view',  group: 'Programs', label: 'Certificate Management',   hint: 'Issue, view and email certificates' },

  // Money
  { key: 'finances_view',      group: 'Money',    label: 'View Finances',            hint: 'Open the Finance Management page' },
  { key: 'finances_create',    group: 'Money',    label: 'Record Transactions',      hint: 'Add tithes, offerings, expenses' },
  { key: 'finances_edit',      group: 'Money',    label: 'Edit Transactions',        hint: 'Update or correct existing financial records' },
  { key: 'fundraising_view',   group: 'Money',    label: 'View Fundraising',         hint: 'Open the Fundraising page' },
  { key: 'fundraising_create', group: 'Money',    label: 'Create Campaigns',         hint: 'Launch new fundraising campaigns' },
  { key: 'fundraising_edit',   group: 'Money',    label: 'Edit Campaigns',           hint: 'Update or close campaigns' },
  { key: 'reports_view',       group: 'Money',    label: 'View Reports',             hint: 'Open the Reports & Analytics page' },
  { key: 'reports_export',     group: 'Money',    label: 'Export Reports',           hint: 'Download reports as files' },

  // Outreach
  { key: 'communication_view', group: 'Outreach', label: 'View Communications',      hint: 'Open the Communication page' },
  { key: 'communication_create', group: 'Outreach', label: 'Draft Messages',         hint: 'Compose announcements and templates' },
  { key: 'communication_send', group: 'Outreach', label: 'Send Messages',            hint: 'Broadcast messages to members' },
  { key: 'locations_view',     group: 'Outreach', label: 'View Locations',           hint: 'Open the Locations page' },
  { key: 'locations_create',   group: 'Outreach', label: 'Add Locations',            hint: 'Register new fellowship locations' },
  { key: 'locations_edit',     group: 'Outreach', label: 'Edit Locations',           hint: 'Update or remove locations' },

  // Admin
  { key: 'website_info_view',  group: 'Admin',    label: 'View Regional Website Info', hint: 'Open the Regional Website Info page' },
  { key: 'website_info_edit',  group: 'Admin',    label: 'Edit Regional Website Info', hint: 'Update region branding and content' },
  { key: 'settings_view',      group: 'Admin',    label: 'View Settings',            hint: 'Open the Settings page' },
  { key: 'settings_edit',      group: 'Admin',    label: 'Edit Settings',            hint: 'Change regional settings' },
  { key: 'access_management',  group: 'Admin',    label: 'Access Management',        hint: 'Grant or revoke access to other users' },
];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  'Overview', 'People', 'Programs', 'Money', 'Outreach', 'Admin',
];

/** Lookup helpers */
const PERMISSION_BY_KEY: Record<string, PermissionDef> = Object.fromEntries(
  PERMISSION_CATALOG.map((p) => [p.key, p]),
);

export function getPermissionDef(key: string): PermissionDef | undefined {
  return PERMISSION_BY_KEY[key];
}

export function getPermissionLabel(key: string): string {
  return PERMISSION_BY_KEY[key]?.label
    ?? key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getPermissionsByGroup(group: PermissionGroup): PermissionDef[] {
  return PERMISSION_CATALOG.filter((p) => p.group === group);
}

/** The auto-created per-region "Regional Admin" role is not user-assignable here. */
export const RESERVED_ROLE_NAME = 'Regional Admin';

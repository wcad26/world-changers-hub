/**
 * Super Admin permission catalog — the equivalent of regionalPermissions for
 * the global super admin portal. Each permission gates one page or one
 * capability. The Principal Super Admin role is reserved and bypasses these
 * checks (treated as "all permissions").
 */

export type SuperPermissionGroup =
  | 'Overview'
  | 'People'
  | 'Access'
  | 'Programs'
  | 'Money'
  | 'Outreach'
  | 'Admin';

export interface SuperPermissionDef {
  key: string;
  label: string;
  hint: string;
  group: SuperPermissionGroup;
}

export interface SuperPageDef {
  permission: string;
  title: string;
  path: string;
}

export const SUPER_PAGES: SuperPageDef[] = [
  { permission: 'super_dashboard_view',     title: 'Dashboard',          path: '/admin/super/dashboard' },
  { permission: 'super_members_view',       title: 'Members',            path: '/admin/super/members' },
  { permission: 'super_events_view',        title: 'Events',             path: '/admin/super/events' },
  { permission: 'super_locations_manage',   title: 'Locations',          path: '/admin/super/locations' },
  { permission: 'super_finances_view',      title: 'Finances',           path: '/admin/super/finances' },
  { permission: 'super_regions_view',       title: 'Regions',            path: '/admin/super/regions' },
  { permission: 'super_reports_view',       title: 'Reports',            path: '/admin/super/reports' },
  { permission: 'super_communication_view', title: 'Communication',      path: '/admin/super/communication' },
  { permission: 'super_homepage_manage',    title: 'Homepage Settings',  path: '/admin/super/homepage-settings' },
  { permission: 'super_certificates_view',  title: 'Certificates',       path: '/admin/super/certificates' },
  { permission: 'super_homepage_manage',    title: 'About Us',           path: '/admin/super/about-settings' },
  { permission: 'super_settings_view',      title: 'Settings',           path: '/admin/super/settings' },
];

export const SUPER_PERMISSION_CATALOG: SuperPermissionDef[] = [
  // Overview
  { key: 'super_dashboard_view',     group: 'Overview', label: 'View Dashboard',          hint: 'Open the global super admin dashboard' },

  // People
  { key: 'super_members_view',       group: 'People',   label: 'View Global Members',     hint: 'Open the global members directory' },
  { key: 'super_members_edit',       group: 'People',   label: 'Edit / Delete Members',   hint: 'Modify or remove any member record' },

  // Access
  { key: 'manage_regional_users',    group: 'Access',   label: 'Manage Regional Users & Roles', hint: 'Assign or revoke regional roles, edit regional role catalogs' },
  { key: 'approve_role_requests',    group: 'Access',   label: 'Approve Role Requests',   hint: 'Approve or reject regional access requests' },
  { key: 'manage_super_admin_users', group: 'Access',   label: 'Manage Super Admin Users', hint: 'Promote, revoke, or change super admin assignments' },
  { key: 'manage_super_admin_roles', group: 'Access',   label: 'Manage Super Admin Roles', hint: 'Create, edit, or delete super admin role tiers' },

  // Programs
  { key: 'super_events_view',         group: 'Programs', label: 'View Events',             hint: 'Open the global events page' },
  { key: 'super_events_manage',       group: 'Programs', label: 'Manage Global Events',    hint: 'Create, edit, or delete inter-regional events' },
  { key: 'super_certificates_view',   group: 'Programs', label: 'View Certificates',       hint: 'Open the certificates page' },
  { key: 'super_certificates_manage', group: 'Programs', label: 'Manage Certificates',     hint: 'Issue, edit, delete or email certificates globally' },

  // Money
  { key: 'super_finances_view',       group: 'Money',    label: 'View Finances',           hint: 'Open the global finances and fundraising page' },
  { key: 'super_finances_manage',     group: 'Money',    label: 'Manage Finances',         hint: 'Record, edit or delete global financial entries' },
  { key: 'super_reports_view',        group: 'Money',    label: 'View Reports',            hint: 'Open the global reports & analytics page' },

  // Outreach
  { key: 'super_communication_view',  group: 'Outreach', label: 'View Communications',     hint: 'Open the global communications page' },
  { key: 'super_communication_send',  group: 'Outreach', label: 'Send Communications',    hint: 'Broadcast announcements to regions or members' },

  // Admin
  { key: 'super_regions_view',        group: 'Admin',    label: 'View Regions',            hint: 'Open the regions page' },
  { key: 'super_regions_manage',      group: 'Admin',    label: 'Create / Edit Regions',   hint: 'Add, edit, or deactivate regions' },
  { key: 'super_locations_manage',    group: 'Admin',    label: 'Manage Locations',        hint: 'Add or edit physical locations' },
  { key: 'super_homepage_manage',     group: 'Admin',    label: 'Edit Homepage / About',   hint: 'Edit homepage, about us, hero content' },
  { key: 'super_settings_view',       group: 'Admin',    label: 'View Settings',           hint: 'Open the super admin settings page' },
  { key: 'super_settings_edit',       group: 'Admin',    label: 'Edit System Settings',    hint: 'Change global currencies, preferences, and system options' },
];

export const SUPER_PERMISSION_GROUPS: SuperPermissionGroup[] = [
  'Overview', 'People', 'Access', 'Programs', 'Money', 'Outreach', 'Admin',
];

const BY_KEY: Record<string, SuperPermissionDef> = Object.fromEntries(
  SUPER_PERMISSION_CATALOG.map((p) => [p.key, p]),
);

export function getSuperPermissionsByGroup(group: SuperPermissionGroup): SuperPermissionDef[] {
  return SUPER_PERMISSION_CATALOG.filter((p) => p.group === group);
}

export function getSuperPermissionLabel(key: string): string {
  return BY_KEY[key]?.label
    ?? key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/** The auto-seeded reserved "Principal" role name. */
export const RESERVED_SUPER_ROLE_NAME = 'Principal Super Admin';

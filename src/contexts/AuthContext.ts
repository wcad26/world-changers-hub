import { createContext } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];
type Dcg = Database['public']['Tables']['dcgs']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

export type AppRole = 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin';

export interface AuthContextValue {
  user: any;
  profile: Profile | null;
  userRoles: UserRole[];
  userRegion: Region | null;
  userDcg: Dcg | null;
  memberRecord: Member | null;
  memberId: string | null;
  userRegionalRoles: any[];
  loading: boolean;
  initialized: boolean;
  authReady: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasRegionalPortalAccess: boolean;
  getAvailablePortals: () => string[];
  canAccessPortal: (portalType: string) => boolean;
  hasRegionalPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  isRegionalAdmin: () => boolean;
  isMember: () => boolean;
  isDcgAdmin: () => boolean;
  isDcgMember: boolean;
  signOut: () => Promise<void>;
  refetchUserData: () => Promise<void> | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

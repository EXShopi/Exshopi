export type AdminRole = 'admin' | 'super_admin' | 'finance_manager' | 'support_agent' | null;

export type AdminPermission =
  | 'dashboard:view'
  | 'vendors:view'
  | 'vendors:manage'
  | 'catalog:view'
  | 'catalog:review'
  | 'inventory:view'
  | 'orders:view'
  | 'orders:manage'
  | 'returns:view'
  | 'returns:manage'
  | 'customers:view'
  | 'customers:manage'
  | 'commissions:view'
  | 'payouts:view'
  | 'payouts:manage'
  | 'categories:manage'
  | 'banners:manage'
  | 'offers:manage'
  | 'reports:view'
  | 'settings:manage'
  | 'support:view'
  | 'support:manage'
  | 'audit:view';

const allPermissions: AdminPermission[] = [
  'dashboard:view',
  'vendors:view',
  'vendors:manage',
  'catalog:view',
  'catalog:review',
  'inventory:view',
  'orders:view',
  'orders:manage',
  'returns:view',
  'returns:manage',
  'customers:view',
  'customers:manage',
  'commissions:view',
  'payouts:view',
  'payouts:manage',
  'categories:manage',
  'banners:manage',
  'offers:manage',
  'reports:view',
  'settings:manage',
  'support:view',
  'support:manage',
  'audit:view',
];

export const adminPermissionMatrix: Record<Exclude<AdminRole, null>, AdminPermission[]> = {
  super_admin: allPermissions,
  admin: allPermissions,
  finance_manager: [
    'dashboard:view',
    'orders:view',
    'returns:view',
    'customers:view',
    'commissions:view',
    'payouts:view',
    'payouts:manage',
    'reports:view',
    'audit:view',
  ],
  support_agent: [
    'dashboard:view',
    'orders:view',
    'orders:manage',
    'returns:view',
    'returns:manage',
    'customers:view',
    'customers:manage',
    'support:view',
    'support:manage',
    'audit:view',
  ],
};

export const hasAdminPermission = (role: AdminRole, permission: AdminPermission) =>
  Boolean(role && adminPermissionMatrix[role]?.includes(permission));

export const getAdminRoleLabel = (role: AdminRole) => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'finance_manager':
      return 'Finance Admin';
    case 'support_agent':
      return 'Support Admin';
    case 'admin':
      return 'Operations Admin';
    default:
      return 'Admin';
  }
};

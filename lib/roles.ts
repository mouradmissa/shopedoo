export type AppRole = 'admin' | 'manager' | 'cashier' | 'customer';

export function canAccessCashierArea(role?: string) {
  return role === 'cashier' || role === 'admin';
}

export function canAccessManagerArea(role?: string) {
  return role === 'manager' || role === 'admin';
}

export function canAccessShop(role?: string) {
  return role !== 'cashier' && role !== 'manager';
}

export function canAccessAdmin(role?: string) {
  return role === 'admin';
}

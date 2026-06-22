export type AppRole = 'admin' | 'cashier' | 'customer';

export function canAccessCashierArea(role?: string) {
  return role === 'cashier' || role === 'admin';
}

export function canAccessShop(role?: string) {
  return role !== 'cashier';
}

export function canAccessAdmin(role?: string) {
  return role === 'admin';
}

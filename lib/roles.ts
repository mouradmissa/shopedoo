export type AppRole = 'admin' | 'manager' | 'cashier' | 'customer' | 'online_manager' | 'driver';

export function canAccessCashierArea(role?: string) {
  return role === 'cashier' || role === 'admin';
}

export function canAccessManagerArea(role?: string) {
  return role === 'manager' || role === 'admin';
}

export function canAccessOnlineManagerArea(role?: string) {
  return role === 'online_manager' || role === 'admin';
}

export function canAccessDriverArea(role?: string) {
  return role === 'driver';
}

export function canAccessShop(role?: string) {
  return role !== 'cashier' && role !== 'manager' && role !== 'online_manager' && role !== 'driver';
}

export function canAccessAdmin(role?: string) {
  return role === 'admin';
}

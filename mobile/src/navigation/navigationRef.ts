import { createNavigationContainerRef } from '@react-navigation/native';
import { AppRole, getRoleHomeRoute } from '../lib/roles';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToShop() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Shop' }],
    });
  }
}

export function navigateToRoleHome(role: AppRole) {
  if (navigationRef.isReady()) {
    const route = getRoleHomeRoute(role) as keyof RootStackParamList;
    navigationRef.reset({
      index: 0,
      routes: [{ name: route }],
    });
  }
}

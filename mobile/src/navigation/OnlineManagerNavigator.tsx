import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { StaffShell } from '../components/layout/StaffShell';
import { canAccessOnlineManagerArea } from '../lib/roles';
import {
  OnlineManagerDashboardScreen,
  OnlineManagerProductsScreen,
  OnlineManagerOrdersScreen,
  OnlineManagerDriversScreen,
} from '../screens/online-manager/OnlineManagerScreens';

const Stack = createNativeStackNavigator();

function OnlineManagerMain() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', active: tab === 'dashboard', onPress: () => setTab('dashboard') },
    { key: 'products', label: 'Catalogue', active: tab === 'products', onPress: () => setTab('products') },
    { key: 'orders', label: 'Commandes', active: tab === 'orders', onPress: () => setTab('orders') },
    { key: 'drivers', label: 'Livreurs', active: tab === 'drivers', onPress: () => setTab('drivers') },
  ];

  return (
    <StaffShell
      sectionLabel="Boutique en ligne"
      userName={user?.name}
      userSubtitle="Responsable en ligne"
      navItems={navItems}
      onLogout={logout}
      scrollable={false}
    >
      {tab === 'dashboard' && <OnlineManagerDashboardScreen />}
      {tab === 'products' && <OnlineManagerProductsScreen />}
      {tab === 'orders' && <OnlineManagerOrdersScreen />}
      {tab === 'drivers' && <OnlineManagerDriversScreen />}
    </StaffShell>
  );
}

export function OnlineManagerNavigator() {
  const { user } = useAuth();

  if (!canAccessOnlineManagerArea(user?.role)) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnlineManagerMain" component={OnlineManagerMain} />
    </Stack.Navigator>
  );
}

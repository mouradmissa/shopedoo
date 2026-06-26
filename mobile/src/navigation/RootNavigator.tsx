import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { getRoleHomeRoute } from '../lib/roles';
import { AppRole } from '../lib/roles';
import { ShopNavigator } from './ShopNavigator';
import { AdminNavigator } from './AdminNavigator';
import { ManagerNavigator } from './ManagerNavigator';
import { CashierNavigator } from './CashierNavigator';
import { OnlineManagerNavigator } from './OnlineManagerNavigator';
import { DriverNavigator } from './DriverNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const initialRoute = user ? getRoleHomeRoute(user.role as AppRole) : 'Shop';

  return (
    <Stack.Navigator
      key={user?.id ?? 'guest'}
      initialRouteName={initialRoute as keyof RootStackParamList}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Shop" component={ShopNavigator} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="Manager" component={ManagerNavigator} />
      <Stack.Screen name="Cashier" component={CashierNavigator} />
      <Stack.Screen name="OnlineManager" component={OnlineManagerNavigator} />
      <Stack.Screen name="Driver" component={DriverNavigator} />
    </Stack.Navigator>
  );
}

import React, { useState } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import { StaffShell } from '../components/layout/StaffShell';

import { ManagerDashboardScreen } from '../screens/manager/ManagerDashboardScreen';

import { ManagerProductsScreen } from '../screens/manager/ManagerProductsScreen';

import { ManagerOrdersScreen } from '../screens/manager/ManagerOrdersScreen';

import { ManagerCashiersScreen } from '../screens/manager/ManagerCashiersScreen';



const Stack = createNativeStackNavigator();



function ManagerMain() {

  const { user, logout } = useAuth();

  const [tab, setTab] = useState('dashboard');



  const navItems = [

    { key: 'dashboard', label: 'Tableau de bord', active: tab === 'dashboard', onPress: () => setTab('dashboard') },

    { key: 'orders', label: 'Paiements', active: tab === 'orders', onPress: () => setTab('orders') },

    { key: 'products', label: 'Produits', active: tab === 'products', onPress: () => setTab('products') },

    { key: 'cashiers', label: 'Caissiers', active: tab === 'cashiers', onPress: () => setTab('cashiers') },

  ];



  return (

    <StaffShell
      sectionLabel="Gérant"
      userName={user?.name}
      userSubtitle={user?.store?.name}
      navItems={navItems}
      onLogout={logout}
      scrollable={tab === 'dashboard'}
    >

      {tab === 'dashboard' && (

        <ManagerDashboardScreen

          onGoProducts={() => setTab('products')}

          onGoCashiers={() => setTab('cashiers')}

        />

      )}

      {tab === 'orders' && <ManagerOrdersScreen />}

      {tab === 'products' && <ManagerProductsScreen />}

      {tab === 'cashiers' && <ManagerCashiersScreen />}

    </StaffShell>

  );

}



export function ManagerNavigator() {

  return (

    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="ManagerMain" component={ManagerMain} />

    </Stack.Navigator>

  );

}


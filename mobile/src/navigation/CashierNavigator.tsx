import React, { useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import { StaffShell } from '../components/layout/StaffShell';

import { CashierInvoiceScanner } from '../components/cashier/CashierInvoiceScanner';

import { Button } from '../components/Button';

import { CashierProductsScreen } from '../screens/cashier/CashierProductsScreen';

import { colors } from '../theme';



const Stack = createNativeStackNavigator();



function CashierMain() {

  const { user, logout } = useAuth();

  const [tab, setTab] = useState('home');



  const navItems = [

    { key: 'home', label: 'Accueil', active: tab === 'home', onPress: () => setTab('home') },

    { key: 'products', label: 'Produits', active: tab === 'products', onPress: () => setTab('products') },

    { key: 'scan', label: 'Scanner', active: tab === 'scan', onPress: () => setTab('scan') },

  ];



  return (

    <StaffShell

      sectionLabel="Caisse"

      userName={user?.name}

      userSubtitle={user?.role === 'admin' ? 'Administrateur' : 'Caissier'}

      navItems={navItems}

      onLogout={logout}

      scrollable={tab !== 'scan'}

    >

      {tab === 'home' && (

        <View style={styles.block}>

          <Text style={styles.title}>Bienvenue à la caisse</Text>

          <Text style={styles.sub}>

            Scannez le QR facture du client ou consultez les produits du magasin.

          </Text>

          <Button title="Scanner une facture" onPress={() => setTab('scan')} />

          <Button title="Voir les produits" variant="outline" onPress={() => setTab('products')} />

        </View>

      )}

      {tab === 'scan' && <CashierInvoiceScanner />}

      {tab === 'products' && <CashierProductsScreen />}

    </StaffShell>

  );

}



const styles = StyleSheet.create({

  block: { gap: 12 },

  title: { fontSize: 22, fontWeight: '800' },

  sub: { color: colors.mutedForeground, marginBottom: 8, lineHeight: 20 },

});



export function CashierNavigator() {

  return (

    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="CashierMain" component={CashierMain} />

    </Stack.Navigator>

  );

}


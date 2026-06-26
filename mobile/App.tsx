import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { apiClient } from './src/api/client';
import { LoadingScreen } from './src/components/LoadingScreen';

const STRIPE_PLACEHOLDER_KEY = 'pk_test_placeholder';

export default function App() {
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await apiClient.initialize();
      const config = await apiClient.getPaymentConfig();
      if (config.success && config.data?.publishableKey) {
        setStripeKey(config.data.publishableKey);
      } else if (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        setStripeKey(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      }
      setReady(true);
    };
    void init();
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <StripeProvider publishableKey={stripeKey ?? STRIPE_PLACEHOLDER_KEY}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
              <StatusBar style="dark" />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

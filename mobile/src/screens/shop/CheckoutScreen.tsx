import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  ActivityIndicator,

  Alert,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  View,

} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useStripe } from '@stripe/stripe-react-native';

import { Ionicons } from '@expo/vector-icons';

import { apiClient } from '../../api/client';

import { useAuth } from '../../context/AuthContext';

import { useCart } from '../../context/CartContext';

import { Button } from '../../components/Button';

import { AppHeader } from '../../components/layout/AppHeader';

import { PageTitleBar } from '../../components/layout/PageTitleBar';

import { OrderThankYouModal } from '../../components/checkout/OrderThankYouModal';

import { clearLocalCart } from '../../lib/cartSync';

import { formatPrice } from '../../lib/currency';

import { buildInvoiceQrString } from '../../lib/invoiceQr';

import { InvoiceQrDisplay } from '../../components/checkout/InvoiceQrDisplay';

import { InvoiceBrandHeader } from '../../components/checkout/InvoiceBrandHeader';

import { OrderReceiptData, ReceiptLineItem } from '../../lib/orderReceipt';
import { shareOrderReceiptPdf } from '../../lib/shareOrderReceiptPdf';

import { colors, theme } from '../../theme';

import { ShopStackParamList } from '../../navigation/types';



type Props = NativeStackScreenProps<ShopStackParamList, 'Checkout'>;

type PaymentMethod = 'cash_register' | 'cash_delivery' | 'online';



const TAX_RATE = 0.1;



const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; title: string; desc: string }> = [

  {

    id: 'cash_register',

    title: 'Paiement à la caisse',

    desc: 'Payez en magasin avec un QR code facture',

  },

  {

    id: 'cash_delivery',

    title: 'Espèces à la livraison',

    desc: 'Paiement à la réception',

  },

  {

    id: 'online',

    title: 'Paiement en ligne',

    desc: 'Carte bancaire via Stripe',

  },

];



interface Order {

  _id: string;

  invoiceQrCode?: string;

  subtotal?: number;

  taxAmount?: number;

  totalAmount: number;

  paymentMethod: string;

  status: string;

  shippingAddress?: string;

  createdAt?: string;

}



function buildReceiptFromOrder(

  order: Order,

  items: ReceiptLineItem[],

  customer: { name: string; email?: string }

): OrderReceiptData {

  return {

    orderId: order._id,

    orderRef: order._id.slice(-8).toUpperCase(),

    customerName: customer.name,

    customerEmail: customer.email,

    paymentMethod: order.paymentMethod,

    status: order.status,

    shippingAddress: order.shippingAddress,

    createdAt: order.createdAt ?? new Date().toISOString(),

    subtotal: order.subtotal ?? 0,

    taxAmount: order.taxAmount ?? 0,

    totalAmount: order.totalAmount,

    invoiceQrCode: order.invoiceQrCode,

    items,

  };

}



export function CheckoutScreen({ navigation }: Props) {

  const { isAuthenticated, user, logout } = useAuth();

  const { cart, refreshCart } = useCart();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();



  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_register');

  const [shippingAddress, setShippingAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  const [order, setOrder] = useState<Order | null>(null);

  const [invoiceQrValue, setInvoiceQrValue] = useState<string | null>(null);

  const [receiptItems, setReceiptItems] = useState<ReceiptLineItem[]>([]);

  const [receipt, setReceipt] = useState<OrderReceiptData | null>(null);

  const [showThankYou, setShowThankYou] = useState(false);

  const thankYouShownRef = useRef(false);

  const handleOrderPaid = useCallback(
    (paidOrder: Order) => {
      setOrder((prev) => ({
        ...(prev ?? paidOrder),
        ...paidOrder,
        status: 'paid',
      }));
      if (!user) return;
      const paidReceipt = buildReceiptFromOrder(
        { ...paidOrder, status: 'paid' },
        receiptItems,
        { name: user.name, email: user.email }
      );
      setReceipt(paidReceipt);
      if (!thankYouShownRef.current) {
        thankYouShownRef.current = true;
        setShowThankYou(true);
      }
    },
    [user, receiptItems]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('SignIn');
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (!order || order.status === 'paid' || order.paymentMethod !== 'cash_register') {
      return;
    }

    const orderId = order._id;

    const checkPayment = async () => {
      const response = await apiClient.getOrderPaymentStatus(orderId);
      if (!response.success || response.data?.status !== 'paid') {
        return;
      }

      const fullOrder = await apiClient.getOrder(orderId);
      if (fullOrder.success && fullOrder.data) {
        handleOrderPaid(fullOrder.data as Order);
        return;
      }

      handleOrderPaid({
        ...order,
        status: 'paid',
        totalAmount: response.data.totalAmount ?? order.totalAmount,
      });
    };

    void checkPayment();
    const poll = setInterval(() => {
      void checkPayment();
    }, 2000);

    return () => clearInterval(poll);
  }, [order, handleOrderPaid]);



  const subtotal = useMemo(

    () =>

      (cart?.items ?? []).reduce(

        (sum, item) => sum + item.productId.price * item.quantity,

        0

      ),

    [cart]

  );

  const tax = subtotal * TAX_RATE;

  const total = subtotal + tax;



  const showThankYouForOrder = (completedOrder: Order, items: ReceiptLineItem[]) => {

    if (!user) return;

    const receiptData = buildReceiptFromOrder(completedOrder, items, {

      name: user.name,

      email: user.email,

    });

    setReceipt(receiptData);

    if (!thankYouShownRef.current) {

      thankYouShownRef.current = true;

      setShowThankYou(true);

    }

  };



  const handleStripePayment = async (orderId: string) => {

    const intent = await apiClient.createPaymentIntent(orderId);

    if (!intent.success || !intent.data) {

      throw new Error(intent.error || 'Impossible de créer le paiement');

    }



    const config = await apiClient.getPaymentConfig();

    const publishableKey = config.data?.publishableKey;

    if (!publishableKey) {

      throw new Error('Configuration Stripe indisponible');

    }



    const { error: initError } = await initPaymentSheet({

      paymentIntentClientSecret: intent.data.clientSecret,

      merchantDisplayName: 'Shop-Edoo',

    });



    if (initError) {

      throw new Error(initError.message);

    }



    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {

      throw new Error(presentError.message);

    }



    const confirm = await apiClient.confirmPayment(orderId, intent.data.paymentIntentId);

    if (!confirm.success) {

      throw new Error(confirm.error || 'Confirmation échouée');

    }



    const payload = confirm.data as { order?: Order };

    return payload.order ?? null;

  };



  const handleSubmit = async () => {

    setError('');



    if (paymentMethod === 'cash_delivery' && !shippingAddress.trim()) {

      setError('Adresse de livraison requise.');

      return;

    }



    setSubmitting(true);



    try {

      const items: ReceiptLineItem[] = (cart?.items ?? []).map((item) => ({

        name: item.productId.name,

        quantity: item.quantity,

        price: item.productId.price,

      }));

      setReceiptItems(items);



      const address =

        paymentMethod === 'cash_register'

          ? 'Retrait en magasin'

          : shippingAddress.trim();



      const response = await apiClient.createOrder(address, paymentMethod);

      if (!response.success || !response.data) {

        throw new Error(response.error || 'Commande échouée');

      }



      const createdOrder = response.data as Order;



      if (paymentMethod === 'online') {

        const paidOrder = await handleStripePayment(createdOrder._id);

        if (paidOrder) {

          const finalOrder = { ...paidOrder, status: 'paid', paymentMethod: 'online' };

          await clearLocalCart();

          await refreshCart();

          setOrder(finalOrder);

          showThankYouForOrder(finalOrder, items);

        }

      } else {

        await clearLocalCart();

        await refreshCart();

        setOrder(createdOrder);



        if (

          paymentMethod === 'cash_register' &&

          createdOrder.invoiceQrCode &&

          user

        ) {

          setInvoiceQrValue(

            buildInvoiceQrString(

              { ...createdOrder, invoiceQrCode: createdOrder.invoiceQrCode },

              { name: user.name, email: user.email },

              items

            )

          );

        }



        if (paymentMethod === 'cash_delivery') {

          showThankYouForOrder(createdOrder, items);

        }

      }

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Erreur inconnue');

    } finally {

      setSubmitting(false);

    }

  };



  if (!cart) {

    return (

      <View style={styles.center}>

        <ActivityIndicator color={colors.primary} size="large" />

      </View>

    );

  }



  if (order) {

    const isCashRegister = order.paymentMethod === 'cash_register';

    const isPaid = order.status === 'paid';



    return (

      <View style={styles.root}>

        <AppHeader

          tone="shop"

          sectionLabel="Boutique"

          isAuthenticated

          userName={user?.name}

          logoOnPress={() => navigation.navigate('Home')}

          onLogout={logout}

        />

        <ScrollView style={styles.container} contentContainerStyle={styles.doneContent}>

          <View style={styles.doneIcon}>

            <Ionicons

              name={isPaid ? 'checkmark-circle' : 'time-outline'}

              size={56}

              color={isPaid ? '#16a34a' : colors.primary}

            />

          </View>

          <Text style={styles.doneTitle}>

            {isPaid ? 'Paiement enregistré !' : 'Commande confirmée !'}

          </Text>

          <Text style={styles.doneText}>

            {isPaid

              ? `Merci ${user?.name?.split(/\s+/)[0] ?? ''}, votre règlement de ${formatPrice(order.totalAmount)} est validé.`

              : `Total : ${formatPrice(order.totalAmount)}`}

          </Text>



          {isCashRegister && order.invoiceQrCode && !isPaid ? (

            <View style={styles.qrBox}>

              <Text style={styles.qrHint}>

                Présentez ce QR à la caisse. Un message de remerciement s'affichera après

                l'encaissement.

              </Text>

              <InvoiceBrandHeader

                orderRef={order._id.slice(-8).toUpperCase()}

                status="pending"

              />

              {invoiceQrValue ? <InvoiceQrDisplay value={invoiceQrValue} /> : null}

              <Text style={styles.qrCode} selectable>

                Réf. {order.invoiceQrCode}

              </Text>

              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />

              <Text style={styles.waitingText}>En attente de paiement en caisse...</Text>

            </View>

          ) : null}



          {isPaid && receipt ? (
            <Button
              title="Télécharger le reçu (PDF)"
              variant="outline"
              onPress={() => {
                void shareOrderReceiptPdf(receipt).catch((err) => {
                  Alert.alert(
                    'Erreur',
                    err instanceof Error ? err.message : 'Impossible de générer le PDF.'
                  );
                });
              }}
            />
          ) : null}



          <Button title="Retour à l'accueil" onPress={() => navigation.navigate('Home')} />

        </ScrollView>



        {receipt ? (

          <OrderThankYouModal

            visible={showThankYou}

            receipt={receipt}

            onClose={() => setShowThankYou(false)}

          />

        ) : null}

      </View>

    );

  }



  return (

    <View style={styles.root}>

      <AppHeader

        tone="shop"

        sectionLabel="Boutique"

        isAuthenticated

        userName={user?.name}

        logoOnPress={() => navigation.navigate('Home')}

        onLogout={logout}

        onCart={() => navigation.navigate('Cart')}

      />

      <PageTitleBar

        title="Commande"

        backLabel="Panier"

        onBack={() => navigation.navigate('Cart')}

        icon={<Ionicons name="card-outline" size={18} color={colors.primary} />}

      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.summary}>

          <Text style={styles.summaryRow}>Sous-total : {formatPrice(subtotal)}</Text>

          <Text style={styles.summaryRow}>TVA (10%) : {formatPrice(tax)}</Text>

          <Text style={styles.total}>Total : {formatPrice(total)}</Text>

        </View>



        <Text style={styles.sectionTitle}>Mode de paiement</Text>

        {PAYMENT_OPTIONS.map((opt) => (

          <Pressable

            key={opt.id}

            onPress={() => setPaymentMethod(opt.id)}

            style={[styles.option, paymentMethod === opt.id && styles.optionActive]}

          >

            <Text style={styles.optionTitle}>{opt.title}</Text>

            <Text style={styles.optionDesc}>{opt.desc}</Text>

          </Pressable>

        ))}



        {paymentMethod === 'cash_delivery' && (

          <View style={styles.field}>

            <Text style={styles.label}>Adresse de livraison</Text>

            <TextInput

              value={shippingAddress}

              onChangeText={setShippingAddress}

              placeholder="Rue, ville, gouvernorat..."

              multiline

              style={styles.input}

            />

          </View>

        )}



        {error ? <Text style={styles.error}>{error}</Text> : null}



        <Button

          title="Confirmer la commande"

          onPress={() => void handleSubmit()}

          loading={submitting}

        />

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: colors.background },

  container: {

    flex: 1,

    backgroundColor: colors.background,

  },

  content: {

    padding: 16,

    gap: 12,

    paddingBottom: 32,

  },

  doneContent: {

    padding: 24,

    gap: 16,

    alignItems: 'center',

    paddingBottom: 40,

  },

  center: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  doneIcon: { marginBottom: 4 },

  summary: {

    backgroundColor: colors.card,

    padding: 16,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: colors.border,

    gap: 6,

  },

  summaryRow: {

    color: colors.mutedForeground,

    fontSize: 15,

  },

  total: {

    fontSize: 18,

    fontWeight: '800',

    color: colors.foreground,

    marginTop: 4,

  },

  sectionTitle: {

    fontSize: 16,

    fontWeight: '700',

    color: colors.foreground,

    marginTop: 8,

  },

  option: {

    backgroundColor: colors.card,

    padding: 14,

    borderRadius: 12,

    borderWidth: 2,

    borderColor: colors.border,

  },

  optionActive: {

    borderColor: colors.primary,

    backgroundColor: '#fff5f5',

  },

  optionTitle: {

    fontWeight: '700',

    color: colors.foreground,

  },

  optionDesc: {

    fontSize: 13,

    color: colors.mutedForeground,

    marginTop: 4,

  },

  field: {

    gap: 6,

  },

  label: {

    fontWeight: '600',

    color: colors.foreground,

  },

  input: {

    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    padding: 12,

    minHeight: 80,

    textAlignVertical: 'top',

  },

  error: {

    color: colors.error,

    textAlign: 'center',

  },

  doneTitle: {

    fontSize: 24,

    fontWeight: '800',

    color: colors.success,

    textAlign: 'center',

  },

  doneText: {

    fontSize: 16,

    color: colors.foreground,

    textAlign: 'center',

    lineHeight: 22,

  },

  qrBox: {

    backgroundColor: colors.card,

    padding: 16,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: colors.border,

    width: '100%',

    alignItems: 'center',

    gap: 8,

  },

  qrHint: {

    fontSize: 13,

    color: colors.mutedForeground,

    textAlign: 'center',

    lineHeight: 19,

  },

  qrCode: {

    fontSize: 12,

    color: colors.mutedForeground,

  },

  waitingText: {

    fontSize: 12,

    color: colors.mutedForeground,

    fontStyle: 'italic',

  },

});



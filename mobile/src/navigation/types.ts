export type ShopStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  QRScanner: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type RootStackParamList = {
  Shop: undefined;
  Admin: undefined;
  Manager: undefined;
  Cashier: undefined;
  OnlineManager: undefined;
  Driver: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

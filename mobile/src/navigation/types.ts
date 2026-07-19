export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type TabParamList = {
  Library: undefined;
  Search: undefined;
  Wishlist: undefined;
  Hunter: undefined;
  Alerts: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

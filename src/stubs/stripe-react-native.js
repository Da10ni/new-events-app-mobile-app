// Empty stub for @stripe/stripe-react-native on web
// The native Stripe SDK doesn't support web platform
module.exports = {
  StripeProvider: ({ children }) => children,
  CardField: () => null,
  useConfirmPayment: () => ({ confirmPayment: async () => ({}), loading: false }),
};
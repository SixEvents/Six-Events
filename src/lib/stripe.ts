import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Stripe publishable key not found in environment variables');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export const STRIPE_CONFIG = {
  currency: (import.meta.env.VITE_STRIPE_CURRENCY as string) || 'EUR',
  successUrl: `${window.location.origin}/payment-success`,
  cancelUrl: `${window.location.origin}/payment-cancelled`,
};

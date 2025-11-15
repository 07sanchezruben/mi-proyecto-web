import Stripe from 'stripe';
import { env } from '../config/env.js';

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: '2023-10-16'
});

export function getStripe() {
  return stripe;
}

export async function createPaymentIntent({ amount, currency = 'eur', customerId, metadata = {} }) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    customer: customerId,
    metadata,
    automatic_payment_methods: { enabled: true }
  });
}

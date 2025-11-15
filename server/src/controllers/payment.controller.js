import { createIntentForProposal, handleStripeWebhook } from '../services/payment.service.js';

export const paymentController = {
  createIntent: async (req, res, next) => {
    try {
      const { paymentIntent, amounts } = await createIntentForProposal(req.user.id, req.body.proposalId);
      res.status(201).json({ clientSecret: paymentIntent.client_secret, amounts });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  },
  webhook: async (req, res, next) => {
    try {
      const response = await handleStripeWebhook(req.headers['stripe-signature'], req.body);
      res.json(response);
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

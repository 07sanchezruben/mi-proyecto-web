import { prisma } from '../config/db.js';
import { createPaymentIntent, getStripe } from '../utils/payments.js';
import { env } from '../config/env.js';
import { emitToUser } from '../utils/socket.js';
import { estimateCampaignAmounts } from '../utils/matching.js';

export async function createIntentForProposal(companyId, proposalId) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { driver: true, company: true }
  });
  if (!proposal || proposal.companyId !== companyId) throw new Error('No autorizado');
  const amounts = estimateCampaignAmounts(proposal.driver, proposal.company);
  const paymentIntent = await createPaymentIntent({
    amount: amounts.grossMonthly,
    currency: 'eur',
    customerId: proposal.company.stripeCustomerId || undefined,
    metadata: { proposalId: proposal.id }
  });
  await prisma.payment.upsert({
    where: { proposalId: proposal.id },
    update: {
      stripePaymentIntentId: paymentIntent.id,
      amountGross: amounts.grossMonthly,
      platformFee: amounts.platformFee,
      driverNet: amounts.driverNet,
      status: 'pending',
      currency: 'eur'
    },
    create: {
      proposalId: proposal.id,
      companyId: proposal.companyId,
      driverId: proposal.driverId,
      stripePaymentIntentId: paymentIntent.id,
      amountGross: amounts.grossMonthly,
      platformFee: amounts.platformFee,
      driverNet: amounts.driverNet,
      status: 'pending',
      currency: 'eur'
    }
  });
  return { paymentIntent, amounts };
}

export async function handleStripeWebhook(signature, payload) {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await prisma.payment.update({
      where: { stripePaymentIntentId: intent.id },
      data: { status: 'succeeded' }
    });
    await prisma.eventLog.create({
      data: { type: 'payment_succeeded', paymentId: payment.id, metadata: intent }
    });
    emitToUser(payment.companyId, 'payment:update', { status: 'succeeded', paymentId: payment.id });
    emitToUser(payment.driverId, 'payment:update', { status: 'succeeded', paymentId: payment.id });
  } else if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const payment = await prisma.payment.update({
      where: { stripePaymentIntentId: intent.id },
      data: { status: 'failed' }
    });
    await prisma.eventLog.create({
      data: { type: 'payment_failed', paymentId: payment.id, metadata: intent }
    });
    emitToUser(payment.companyId, 'payment:update', { status: 'failed', paymentId: payment.id });
    emitToUser(payment.driverId, 'payment:update', { status: 'failed', paymentId: payment.id });
  }
  return { received: true };
}

export async function listPayments() {
  return prisma.payment.findMany({
    include: {
      proposal: true,
      company: { include: { user: true } },
      driver: { include: { user: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

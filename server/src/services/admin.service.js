import { prisma } from '../config/db.js';

export async function getSummary() {
  const [money, users, proposals, payments] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amountGross: true, platformFee: true, driverNet: true },
      where: { status: 'succeeded' }
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    }),
    prisma.proposal.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.payment.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  return {
    processedTotal: money._sum.amountGross || 0,
    platformFee: money._sum.platformFee || 0,
    driverNet: money._sum.driverNet || 0,
    usersByRole: users,
    proposalsByStatus: proposals,
    paymentsByStatus: payments
  };
}

export async function listPaymentsAdmin() {
  return prisma.payment.findMany({
    include: {
      company: { include: { user: true } },
      driver: { include: { user: true } },
      proposal: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function listEvents() {
  return prisma.eventLog.findMany({
    include: { user: true, proposal: true, payment: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function listUsers() {
  return prisma.user.findMany({ include: { driver: true, company: true, workshop: true } });
}

export async function toggleUserActive(userId, active) {
  return prisma.user.update({ where: { id: userId }, data: { active } });
}

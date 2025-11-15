import { prisma } from '../config/db.js';
import { validateSpanishDni } from '../utils/validation.js';

export async function getDriverProfile(userId) {
  return prisma.driver.findUnique({
    where: { id: userId },
    include: { user: true }
  });
}

export async function updateDriverProfile(userId, data) {
  if (data.dni && !validateSpanishDni(data.dni)) {
    throw new Error('DNI inválido');
  }
  return prisma.driver.update({ where: { id: userId }, data });
}

export async function listDriverProposals(driverId) {
  return prisma.proposal.findMany({
    where: { driverId },
    include: {
      company: { include: { user: true } },
      selectedVinyl: true,
      selectedWorkshop: true,
      selectedSlot: true,
      payment: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

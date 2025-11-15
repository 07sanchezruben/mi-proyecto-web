import { prisma } from '../config/db.js';
import { emitToUser } from '../utils/socket.js';

async function includeProposal() {
  return {
    include: {
      driver: { include: { user: true } },
      company: { include: { user: true } },
      selectedVinyl: true,
      selectedWorkshop: true,
      selectedSlot: true,
      payment: true
    }
  };
}

export async function listProposalsByRole(user) {
  if (user.role === 'driver') {
    return prisma.proposal.findMany({ where: { driverId: user.id }, ...(await includeProposal()) });
  }
  if (user.role === 'company') {
    return prisma.proposal.findMany({ where: { companyId: user.id }, ...(await includeProposal()) });
  }
  if (user.role === 'workshop') {
    return prisma.proposal.findMany({ where: { selectedWorkshopId: user.id }, ...(await includeProposal()) });
  }
  return prisma.proposal.findMany(await includeProposal());
}

export async function acceptProposal(id, driver) {
  const proposal = await prisma.proposal.update({
    where: { id, driverId: driver.id },
    data: { status: 'accepted' },
    ...(await includeProposal())
  });
  await prisma.eventLog.create({ data: { type: 'proposal_accepted', userId: driver.id, proposalId: id, metadata: {} } });
  emitToUser(proposal.companyId, 'proposal:update', { id: proposal.id, status: proposal.status });
  return proposal;
}

export async function rejectProposal(id, driver) {
  const proposal = await prisma.proposal.update({
    where: { id, driverId: driver.id },
    data: { status: 'rejected' },
    ...(await includeProposal())
  });
  await prisma.eventLog.create({ data: { type: 'proposal_rejected', userId: driver.id, proposalId: id, metadata: {} } });
  emitToUser(proposal.companyId, 'proposal:update', { id: proposal.id, status: proposal.status });
  return proposal;
}

export async function selectWorkshopSlot(id, driverId, workshopId, slotId) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.workshopSlot.findUnique({ where: { id: slotId }, include: { proposal: true } });
    if (!slot || slot.taken) throw new Error('Slot ocupado');
    const proposal = await tx.proposal.update({
      where: { id, driverId },
      data: {
        selectedWorkshopId: workshopId,
        selectedSlotId: slotId
      }
    });
    await tx.workshopSlot.update({ where: { id: slotId }, data: { taken: true, proposalId: proposal.id } });
    await tx.eventLog.create({
      data: {
        type: 'workshop_slot_booked',
        userId: driverId,
        proposalId: proposal.id,
        workshopSlotId: slotId,
        metadata: {}
      }
    });
    emitToUser(proposal.companyId, 'proposal:update', { id: proposal.id, selectedSlotId: slotId });
    emitToUser(workshopId, 'workshop:slot', { slotId, proposalId: proposal.id });
    return proposal;
  });
}

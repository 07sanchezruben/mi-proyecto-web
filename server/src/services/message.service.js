import { prisma } from '../config/db.js';
import { emitToUser } from '../utils/socket.js';

export async function listMessages(proposalId, userId) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error('Propuesta no encontrada');
  if (![proposal.driverId, proposal.companyId].includes(userId)) {
    throw new Error('No autorizado');
  }
  return prisma.message.findMany({
    where: { proposalId },
    include: { fromUser: true, toUser: true },
    orderBy: { createdAt: 'asc' }
  });
}

export async function createMessage(proposalId, fromUserId, content) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error('Propuesta no encontrada');
  const toUserId = proposal.driverId === fromUserId ? proposal.companyId : proposal.driverId;
  const message = await prisma.message.create({
    data: {
      proposalId,
      fromUserId,
      toUserId,
      content
    },
    include: { fromUser: true, toUser: true }
  });
  emitToUser(toUserId, 'message:new', { proposalId, message });
  await prisma.eventLog.create({
    data: {
      type: 'message_sent',
      userId: fromUserId,
      proposalId,
      metadata: { content }
    }
  });
  return message;
}

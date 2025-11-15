import { prisma } from '../config/db.js';

export async function listWorkshops() {
  return prisma.workshop.findMany({ include: { user: true } });
}

export async function getWorkshopSlots(workshopId) {
  return prisma.workshopSlot.findMany({
    where: { workshopId },
    orderBy: { time: 'asc' }
  });
}

export async function createSlot(workshopId, time) {
  return prisma.workshopSlot.create({ data: { workshopId, time: new Date(time) } });
}

export async function updateSlot(workshopId, slotId, data) {
  const slot = await prisma.workshopSlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.workshopId !== workshopId) throw new Error('No autorizado');
  return prisma.workshopSlot.update({ where: { id: slotId }, data });
}

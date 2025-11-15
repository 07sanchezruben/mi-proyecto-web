import { prisma } from '../config/db.js';

export async function listDesigns(companyId) {
  return prisma.vinylDesign.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
}

export async function createDesign(companyId, { name, dataUrl }) {
  if (!name || !dataUrl) throw new Error('Nombre e imagen requeridos');
  return prisma.vinylDesign.create({
    data: {
      name,
      fileUrl: dataUrl,
      companyId
    }
  });
}

export async function deleteDesign(companyId, id) {
  const design = await prisma.vinylDesign.findUnique({ where: { id } });
  if (!design || design.companyId !== companyId) throw new Error('No autorizado');
  await prisma.vinylDesign.delete({ where: { id } });
}

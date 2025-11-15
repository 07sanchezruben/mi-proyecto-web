import { prisma } from '../config/db.js';
import { calculateMatchScore, estimateCampaignAmounts } from '../utils/matching.js';

export async function getCompanyProfile(userId) {
  return prisma.company.findUnique({ where: { id: userId }, include: { user: true } });
}

export async function updateCompanyProfile(userId, data) {
  return prisma.company.update({ where: { id: userId }, data });
}

export async function listMatches(userId) {
  const company = await prisma.company.findUnique({ where: { id: userId } });
  if (!company) return [];
  const drivers = await prisma.driver.findMany();
  const matches = drivers.map((driver) => {
    const score = calculateMatchScore(driver, company);
    const economics = estimateCampaignAmounts(driver, company);
    return {
      driver,
      company,
      ...score,
      ...economics
    };
  });
  return matches.filter((m) => m.matchScore >= 50).sort((a, b) => b.matchScore - a.matchScore);
}

export async function createOrUpdateProposal(companyId, payload) {
  const { driverId, selectedVinylId } = payload;
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!driver || !company) throw new Error('Datos inválidos');
  const { matchScore } = calculateMatchScore(driver, company);
  const { driverNet } = estimateCampaignAmounts(driver, company);
  const proposal = await prisma.proposal.upsert({
    where: {
      driverId_companyId: {
        driverId,
        companyId
      }
    },
    update: {
      matchScore,
      estEarning: driverNet,
      status: 'pending_driver',
      selectedVinylId
    },
    create: {
      driverId,
      companyId,
      matchScore,
      estEarning: driverNet,
      selectedVinylId
    },
    include: {
      driver: { include: { user: true } },
      company: { include: { user: true } },
      selectedVinyl: true
    }
  });
  await prisma.eventLog.create({
    data: {
      type: 'proposal_created',
      userId: companyId,
      proposalId: proposal.id,
      metadata: { matchScore, estEarning: driverNet }
    }
  });
  return proposal;
}

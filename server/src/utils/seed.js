import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { calculateMatchScore, estimateCampaignAmounts } from '../utils/matching.js';

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany();
    await tx.message.deleteMany();
    await tx.eventLog.deleteMany();
    await tx.payment.deleteMany();
    await tx.proposal.deleteMany();
    await tx.vinylDesign.deleteMany();
    await tx.workshopSlot.deleteMany();
    await tx.workshop.deleteMany();
    await tx.company.deleteMany();
    await tx.driver.deleteMany();
    await tx.user.deleteMany();
  });

  const passwordHash = await bcrypt.hash('publicar123', 10);

  const driverUser = await prisma.user.create({
    data: {
      username: 'driver_demo',
      email: 'driver@example.com',
      passwordHash,
      role: 'driver',
      emailVerified: true,
      driver: {
        create: {
          name: 'Carlos Conductor',
          residenceCity: 'Madrid',
          contactPhone: '+34 600 111 222',
          dni: '12345678Z',
          circulationCity: 'Madrid',
          circulationZones: ['centro', 'norte'],
          kmPerMonthRange: '1000-1500',
          kmPerMonth: 1200,
          vehicleModel: 'Seat Ibiza',
          wrapSize: 'medium',
          categories: ['tecnología', 'finanzas'],
          drivingSlot: 'morning',
          paymentMethod: 'transferencia',
          paymentDetails: { iban: 'ES7620770024003102575766' }
        }
      }
    }
  });

  const companyUser = await prisma.user.create({
    data: {
      username: 'company_demo',
      email: 'marketing@example.com',
      passwordHash,
      role: 'company',
      emailVerified: true,
      company: {
        create: {
          brand: 'TechWave',
          companyName: 'TechWave Labs SL',
          nif: 'B12345678',
          address: 'Calle Mayor 1',
          city: 'Madrid',
          contactPhone: '+34 910 555 666',
          circulationCity: 'Madrid',
          targetZones: ['centro', 'norte'],
          desiredKmRange: '1000-2000',
          minKmPerMonth: 900,
          wrapSize: 'medium',
          categories: ['tecnología'],
          targetSlot: 'morning',
          budgetPerMonth: 150,
          campaignDurationMonths: 6
        }
      }
    }
  });

  const workshopUser = await prisma.user.create({
    data: {
      username: 'workshop_demo',
      email: 'taller@example.com',
      passwordHash,
      role: 'workshop',
      emailVerified: true,
      workshop: {
        create: {
          name: 'Vinilos Madrid Centro',
          location: 'Calle Arte 22, Madrid',
          scheduleDescription: 'Lunes a Viernes 9:00-19:00',
          contactPhone: '+34 911 222 333'
        }
      }
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@publicar.com',
      passwordHash,
      role: 'admin',
      emailVerified: true
    }
  });

  const vinyl = await prisma.vinylDesign.create({
    data: {
      companyId: companyUser.id,
      name: 'Campaña TechWave 2024',
      fileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
    }
  });

  await prisma.workshopSlot.createMany({
    data: [
      { workshopId: workshopUser.id, time: new Date(Date.now() + 86400000) },
      { workshopId: workshopUser.id, time: new Date(Date.now() + 2 * 86400000) },
      { workshopId: workshopUser.id, time: new Date(Date.now() + 3 * 86400000), taken: true }
    ]
  });

  const driverProfile = await prisma.driver.findUnique({ where: { id: driverUser.id } });
  const companyProfile = await prisma.company.findUnique({ where: { id: companyUser.id } });
  const score = calculateMatchScore(driverProfile, companyProfile);
  const economics = estimateCampaignAmounts(driverProfile, companyProfile);

  await prisma.proposal.create({
    data: {
      driverId: driverProfile.id,
      companyId: companyProfile.id,
      status: 'pending_driver',
      matchScore: score.matchScore,
      estEarning: economics.driverNet,
      selectedVinylId: vinyl.id
    }
  });

  console.log('Seed completado. Usuarios de demo:');
  console.log('- Driver: driver_demo / publicar123');
  console.log('- Company: company_demo / publicar123');
  console.log('- Workshop: workshop_demo / publicar123');
  console.log('- Admin: admin / publicar123');
}

main()
  .catch((error) => {
    console.error('Error en seed', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

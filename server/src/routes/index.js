import authRoutes from './auth.routes.js';
import driverRoutes from './driver.routes.js';
import companyRoutes from './company.routes.js';
import vinylRoutes from './vinyl.routes.js';
import workshopRoutes from './workshop.routes.js';
import workshopSlotRoutes from './workshopSlot.routes.js';
import proposalRoutes from './proposal.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';

export function registerRoutes(app) {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/drivers', driverRoutes);
  app.use('/api/v1/companies', companyRoutes);
  app.use('/api/v1/vinyl-designs', vinylRoutes);
  app.use('/api/v1/workshops', workshopRoutes);
  app.use('/api/v1/workshop-slots', workshopSlotRoutes);
  app.use('/api/v1/proposals', proposalRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/admin', adminRoutes);
}

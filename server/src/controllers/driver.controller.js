import { getDriverProfile, updateDriverProfile, listDriverProposals } from '../services/driver.service.js';

export const driverController = {
  me: async (req, res, next) => {
    try {
      const profile = await getDriverProfile(req.user.id);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const profile = await updateDriverProfile(req.user.id, req.body);
      res.json({ profile });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  },
  proposals: async (req, res, next) => {
    try {
      const proposals = await listDriverProposals(req.user.id);
      res.json({ proposals });
    } catch (error) {
      next(error);
    }
  }
};

import { getCompanyProfile, updateCompanyProfile, listMatches, createOrUpdateProposal } from '../services/company.service.js';

export const companyController = {
  me: async (req, res, next) => {
    try {
      const profile = await getCompanyProfile(req.user.id);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const profile = await updateCompanyProfile(req.user.id, req.body);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
  matches: async (req, res, next) => {
    try {
      const matches = await listMatches(req.user.id);
      res.json({ matches });
    } catch (error) {
      next(error);
    }
  },
  proposals: async (req, res, next) => {
    try {
      const proposal = await createOrUpdateProposal(req.user.id, req.body);
      res.status(201).json({ proposal });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

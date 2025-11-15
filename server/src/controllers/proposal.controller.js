import { listProposalsByRole, acceptProposal, rejectProposal, selectWorkshopSlot } from '../services/proposal.service.js';

export const proposalController = {
  list: async (req, res, next) => {
    try {
      const proposals = await listProposalsByRole(req.user);
      res.json({ proposals });
    } catch (error) {
      next(error);
    }
  },
  accept: async (req, res, next) => {
    try {
      const proposal = await acceptProposal(Number(req.params.id), req.user);
      res.json({ proposal });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  },
  reject: async (req, res, next) => {
    try {
      const proposal = await rejectProposal(Number(req.params.id), req.user);
      res.json({ proposal });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  },
  selectWorkshop: async (req, res, next) => {
    try {
      const proposal = await selectWorkshopSlot(
        Number(req.params.id),
        req.user.id,
        req.body.workshopId,
        req.body.slotId
      );
      res.json({ proposal });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

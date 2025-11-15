import { listDesigns, createDesign, deleteDesign } from '../services/vinyl.service.js';

export const vinylController = {
  list: async (req, res, next) => {
    try {
      const designs = await listDesigns(req.user.id);
      res.json({ designs });
    } catch (error) {
      next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const design = await createDesign(req.user.id, req.body);
      res.status(201).json({ design });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  },
  remove: async (req, res, next) => {
    try {
      await deleteDesign(req.user.id, Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

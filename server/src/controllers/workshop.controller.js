import { listWorkshops, getWorkshopSlots, createSlot, updateSlot } from '../services/workshop.service.js';

export const workshopController = {
  list: async (req, res, next) => {
    try {
      const workshops = await listWorkshops();
      res.json({ workshops });
    } catch (error) {
      next(error);
    }
  },
  slots: async (req, res, next) => {
    try {
      const slots = await getWorkshopSlots(Number(req.params.id));
      res.json({ slots });
    } catch (error) {
      next(error);
    }
  },
  createSlot: async (req, res, next) => {
    try {
      const slot = await createSlot(req.user.id, req.body.time);
      res.status(201).json({ slot });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  },
  updateSlot: async (req, res, next) => {
    try {
      const slot = await updateSlot(req.user.id, Number(req.params.id), req.body);
      res.json({ slot });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

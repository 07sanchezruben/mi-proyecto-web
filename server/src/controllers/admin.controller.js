import { getSummary, listPaymentsAdmin, listEvents, listUsers, toggleUserActive } from '../services/admin.service.js';

export const adminController = {
  summary: async (req, res, next) => {
    try {
      const summary = await getSummary();
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  },
  payments: async (req, res, next) => {
    try {
      const payments = await listPaymentsAdmin();
      res.json({ payments });
    } catch (error) {
      next(error);
    }
  },
  events: async (req, res, next) => {
    try {
      const events = await listEvents();
      res.json({ events });
    } catch (error) {
      next(error);
    }
  },
  users: async (req, res, next) => {
    try {
      const users = await listUsers();
      res.json({ users });
    } catch (error) {
      next(error);
    }
  },
  toggleUser: async (req, res, next) => {
    try {
      const user = await toggleUserActive(Number(req.params.id), req.body.active);
      res.json({ user });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

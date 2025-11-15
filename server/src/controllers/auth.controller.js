import { authService } from '../services/auth.service.js';
import { validateSpanishDni } from '../utils/validation.js';

export const authController = {
  registerDriver: async (req, res, next) => {
    try {
      const { username, password, email, profile } = req.body;
      if (!validateSpanishDni(profile?.dni)) {
        return res.status(400).json({ message: 'DNI inválido' });
      }
      const user = await authService.registerDriver({ username, password, email, profile });
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },
  registerCompany: async (req, res, next) => {
    try {
      const { username, password, email, profile } = req.body;
      const user = await authService.registerCompany({ username, password, email, profile });
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },
  registerWorkshop: async (req, res, next) => {
    try {
      const { username, password, email, profile } = req.body;
      const user = await authService.registerWorkshop({ username, password, email, profile });
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const { token, user } = await authService.login({ username, password });
      res.json({ token, user });
    } catch (error) {
      error.status = 401;
      next(error);
    }
  },
  me: async (req, res) => {
    res.json({ user: req.user });
  },
  verifyEmail: async (req, res, next) => {
    try {
      await authService.verifyEmail(req.query.token);
      res.json({ message: 'Email verificado correctamente' });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

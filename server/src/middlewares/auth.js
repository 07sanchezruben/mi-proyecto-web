import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticate(required = true) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (required) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('JWT verification failed', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

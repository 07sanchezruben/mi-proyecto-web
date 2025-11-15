import { listMessages, createMessage } from '../services/message.service.js';

export const messageController = {
  list: async (req, res, next) => {
    try {
      const messages = await listMessages(Number(req.params.id), req.user.id);
      res.json({ messages });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const message = await createMessage(Number(req.params.id), req.user.id, req.body.content);
      res.status(201).json({ message });
    } catch (error) {
      error.status = 400;
      next(error);
    }
  }
};

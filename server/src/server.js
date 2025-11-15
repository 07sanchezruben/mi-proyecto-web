import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import { connectDb, prisma } from './config/db.js';
import { registerRoutes } from './routes/index.js';
import { initSocket } from './utils/socket.js';

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

registerRoutes(app);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: env.corsOrigin, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
});

initSocket(io);

async function start() {
  await connectDb();
  const port = env.port;
  server.listen(port, () => console.log(`🚀 PubliCar API listening on port ${port}`));
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

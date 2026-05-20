import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectToDatabase, disconnectFromDatabase } from './services/db.js';

const app = createApp();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: env.corsOrigin,
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.emit('server:ready', {
    message: 'Socket.IO scaffold is online.'
  });

  socket.on('client:ping', () => {
    socket.emit('server:pong', {
      timestamp: new Date().toISOString()
    });
  });
});

async function start() {
  await connectToDatabase();

  httpServer.listen(env.port, () => {
    console.log(`rapport-server listening on http://localhost:${env.port}`);
  });
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down rapport-server...`);
  io.close();
  httpServer.close(async () => {
    await disconnectFromDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

start().catch((error) => {
  console.error('Failed to start rapport-server.');
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});


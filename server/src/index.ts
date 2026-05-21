import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createAuthService } from './services/auth.js';
import { createChannelService } from './services/channels.js';
import { connectToDatabase, disconnectFromDatabase } from './services/db.js';
import { createMessageService } from './services/messages.js';
import { createWorkspaceService } from './services/workspaces.js';
import { registerChatHandlers } from './sockets/chat.js';

// Create services once so the REST app and socket handler share the same
// instances without duplicating Mongoose model interactions.
const authService = createAuthService({ runtimeEnv: env });
const channelService = createChannelService();
const messageService = createMessageService();
const workspaceService = createWorkspaceService({
  provisionDefaultChannel: channelService.provisionDefaultChannelForWorkspace.bind(channelService)
});

const app = createApp({ authService, channelService, messageService, workspaceService });
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: env.corsOrigin,
    credentials: true
  }
});

registerChatHandlers(io, { authService, messageService });

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

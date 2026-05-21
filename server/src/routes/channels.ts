import { Router, type RequestHandler } from 'express';
import { createChannelController } from '../controllers/channels.js';
import type { ChannelService } from '../services/channels.js';

type CreateChannelRouterOptions = {
  channelService: ChannelService;
  requireAuthenticatedUser: RequestHandler;
};

/**
 * Registers channel routes beneath a workspace path and preserves parent params
 * via `mergeParams` so controllers can read `workspaceId` reliably.
 */
export function createChannelRouter(options: CreateChannelRouterOptions) {
  const controller = createChannelController(options.channelService);
  const router = Router({ mergeParams: true });

  router.use(options.requireAuthenticatedUser);
  router.get('/', controller.listChannels);
  router.post('/', controller.createChannel);

  return router;
}


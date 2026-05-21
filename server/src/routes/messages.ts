import { Router, type RequestHandler } from 'express';
import { createMessageController } from '../controllers/messages.js';
import type { MessageService } from '../services/messages.js';

type CreateMessageRouterOptions = {
  messageService: MessageService;
  requireAuthenticatedUser: RequestHandler;
};

/**
 * Registers the most deeply nested HTTP resource in the current API surface and
 * preserves parent route params so controllers receive workspace and channel ids.
 */
export function createMessageRouter(options: CreateMessageRouterOptions) {
  const controller = createMessageController(options.messageService);
  const router = Router({ mergeParams: true });

  router.use(options.requireAuthenticatedUser);
  router.get('/', controller.listMessages);
  router.post('/', controller.createMessage);

  return router;
}


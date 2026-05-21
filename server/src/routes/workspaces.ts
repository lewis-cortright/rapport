import { Router, type RequestHandler } from 'express';
import { createWorkspaceController } from '../controllers/workspaces.js';
import type { WorkspaceService } from '../services/workspaces.js';

type CreateWorkspaceRouterOptions = {
  workspaceService: WorkspaceService;
  requireAuthenticatedUser: RequestHandler;
};

/**
 * Registers workspace endpoints behind a shared auth middleware because every
 * workspace action is membership-aware and requires an authenticated user.
 */
export function createWorkspaceRouter(options: CreateWorkspaceRouterOptions) {
  const controller = createWorkspaceController(options.workspaceService);
  const router = Router();

  router.use(options.requireAuthenticatedUser);
  router.get('/', controller.listWorkspaces);
  router.post('/', controller.createWorkspace);
  router.post('/join', controller.joinWorkspace);

  return router;
}


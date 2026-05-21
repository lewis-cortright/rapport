import type express from 'express';
import { getAuthenticatedUser } from '../http/authentication.js';
import { sendServiceError } from '../http/service-errors.js';
import type { WorkspaceService } from '../services/workspaces.js';

/**
 * Keeps workspace HTTP handlers focused on translating request state into the
 * workspace-service calls that drive the actual business rules.
 */
export function createWorkspaceController(workspaceService: WorkspaceService) {
  return {
    listWorkspaces: async (_request: express.Request, response: express.Response) => {
      try {
        const workspaces = await workspaceService.listWorkspacesForUser(getAuthenticatedUser(response));

        response.json({
          ok: true,
          workspaces
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected workspace error occurred.');
      }
    },

    createWorkspace: async (request: express.Request, response: express.Response) => {
      try {
        const workspace = await workspaceService.createWorkspaceForUser(getAuthenticatedUser(response), request.body);

        response.status(201).json({
          ok: true,
          workspace
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected workspace error occurred.');
      }
    },

    joinWorkspace: async (request: express.Request, response: express.Response) => {
      try {
        const workspace = await workspaceService.joinWorkspaceForUser(getAuthenticatedUser(response), request.body);

        response.json({
          ok: true,
          workspace
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected workspace error occurred.');
      }
    }
  };
}


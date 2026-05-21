import type express from 'express';
import { getAuthenticatedUser } from '../http/authentication.js';
import { getSingleRouteParam } from '../http/route-params.js';
import { sendServiceError } from '../http/service-errors.js';
import type { MessageService } from '../services/messages.js';

// Message routes are nested below both a workspace and a channel so the
// controller keeps both path identifiers explicit.
type MessageRouteParams = {
  workspaceId: string;
  channelId: string;
};

/**
 * Adapts message-service flows to the nested workspace/channel HTTP endpoints
 * without re-implementing authorization or persistence rules here.
 */
export function createMessageController(messageService: MessageService) {
  return {
    listMessages: async (request: express.Request<MessageRouteParams>, response: express.Response) => {
      try {
        const messages = await messageService.listMessagesForUser(
          getAuthenticatedUser(response),
          getSingleRouteParam(request.params.workspaceId),
          getSingleRouteParam(request.params.channelId)
        );

        response.json({
          ok: true,
          messages
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected message error occurred.');
      }
    },

    createMessage: async (request: express.Request<MessageRouteParams>, response: express.Response) => {
      try {
        const message = await messageService.createMessageForUser(
          getAuthenticatedUser(response),
          getSingleRouteParam(request.params.workspaceId),
          getSingleRouteParam(request.params.channelId),
          request.body
        );

        response.status(201).json({
          ok: true,
          message
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected message error occurred.');
      }
    }
  };
}


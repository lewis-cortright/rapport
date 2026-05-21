import type express from 'express';
import { getAuthenticatedUser } from '../http/authentication.js';
import { getSingleRouteParam } from '../http/route-params.js';
import { sendServiceError } from '../http/service-errors.js';
import type { ChannelService } from '../services/channels.js';

// Channel routes are nested below a workspace, so that identifier is always
// part of the request path and needs to be preserved explicitly here.
type ChannelRouteParams = {
  workspaceId: string;
};

/**
 * Translates nested channel HTTP requests into channel-service calls while
 * keeping param normalization and response-shape decisions inside the HTTP layer.
 */
export function createChannelController(channelService: ChannelService) {
  return {
    listChannels: async (request: express.Request<ChannelRouteParams>, response: express.Response) => {
      try {
        const channels = await channelService.listChannelsForUser(
          getAuthenticatedUser(response),
          getSingleRouteParam(request.params.workspaceId)
        );

        response.json({
          ok: true,
          channels
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected channel error occurred.');
      }
    },

    createChannel: async (request: express.Request<ChannelRouteParams>, response: express.Response) => {
      try {
        const channel = await channelService.createChannelForUser(
          getAuthenticatedUser(response),
          getSingleRouteParam(request.params.workspaceId),
          request.body
        );

        response.status(201).json({
          ok: true,
          channel
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected channel error occurred.');
      }
    }
  };
}


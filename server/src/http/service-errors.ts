import type express from 'express';
import { AuthServiceError } from '../services/auth.js';
import { ChannelServiceError } from '../services/channels.js';
import { MessageServiceError } from '../services/messages.js';
import { WorkspaceServiceError } from '../services/workspaces.js';

// Keep the HTTP layer aware only of normalized domain errors rather than every
// individual failure shape that lower layers might throw.
function isServiceError(error: unknown): error is AuthServiceError | WorkspaceServiceError | ChannelServiceError | MessageServiceError {
  return (
    error instanceof AuthServiceError ||
    error instanceof WorkspaceServiceError ||
    error instanceof ChannelServiceError ||
    error instanceof MessageServiceError
  );
}

/**
 * Converts expected service-layer failures into stable API responses while keeping
 * unexpected exceptions behind generic 500 payloads.
 */
export function sendServiceError(error: unknown, response: express.Response, unexpectedMessage: string) {
  if (isServiceError(error)) {
    response.status(error.statusCode).json({
      ok: false,
      error: error.message
    });

    return;
  }

  response.status(500).json({
    ok: false,
    error: unexpectedMessage
  });
}


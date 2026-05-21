import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from './src/app.js';
import { connectToDatabase, disconnectFromDatabase } from './src/services/db.js';

/**
 * Closes the temporary HTTP server used by the readiness probe.
 */
async function closeServer(server: ReturnType<typeof createServer>) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

/**
 * Verifies end-to-end local readiness by connecting to MongoDB, booting the
 * Express app on an ephemeral port, and calling `/api/health`.
 */
async function main() {
  const server = createServer(createApp());

  try {
    await connectToDatabase();

    await new Promise<void>((resolve, reject) => {
      const handleError = (error: Error) => {
        server.off('error', handleError);
        reject(error);
      };

      server.once('error', handleError);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', handleError);
        resolve();
      });
    });

    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Unable to determine the readiness probe port.');
    }

    const { port } = address as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const payload = await response.json();

    console.log(
      JSON.stringify(
        {
          statusCode: response.status,
          payload
        },
        null,
        2
      )
    );

    if (!response.ok || !payload?.ok || !payload?.database?.connected) {
      throw new Error('Local readiness verification failed. Inspect the payload above for details.');
    }
  } finally {
    if (server.listening) {
      await closeServer(server);
    }

    await disconnectFromDatabase();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});


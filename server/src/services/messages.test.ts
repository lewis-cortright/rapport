import { describe, expect, it, vi } from 'vitest';
import { MessageServiceError, createMessageService, createMongooseMessageStore, type MessageStore, type StoredMessage } from './messages';
import type { StoredChannel } from './channels';
import type { StoredWorkspace } from './workspaces';
import type { StoredUser } from './auth';

function createWorkspace(overrides: Partial<StoredWorkspace> = {}): StoredWorkspace {
  return {
    id: overrides.id ?? 'workspace-1',
    name: overrides.name ?? 'Rapport Core',
    ownerId: overrides.ownerId ?? 'user-1',
    inviteCode: overrides.inviteCode ?? 'CORE1234',
    members: overrides.members ?? [
      {
        userId: 'user-1',
        role: 'owner',
        joinedAt: '2026-05-21T00:00:00.000Z'
      }
    ],
    createdAt: overrides.createdAt ?? '2026-05-21T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-21T00:00:00.000Z'
  };
}

function createChannel(overrides: Partial<StoredChannel> = {}): StoredChannel {
  return {
    id: overrides.id ?? 'channel-1',
    workspaceId: overrides.workspaceId ?? 'workspace-1',
    name: overrides.name ?? 'general',
    createdBy: overrides.createdBy ?? 'user-1',
    createdAt: overrides.createdAt ?? '2026-05-23T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-23T00:00:00.000Z'
  };
}

function createUser(overrides: Partial<StoredUser> = {}): StoredUser {
  return {
    id: overrides.id ?? 'user-1',
    username: overrides.username ?? 'builder',
    email: overrides.email ?? 'builder@example.com',
    passwordHash: overrides.passwordHash ?? 'hash',
    createdAt: overrides.createdAt ?? '2026-05-20T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-20T00:00:00.000Z'
  };
}

function createMessageStore(initialMessages: StoredMessage[] = []): { messages: StoredMessage[]; store: MessageStore } {
  const messages = [...initialMessages];

  return {
    messages,
    store: {
      async createMessage(input) {
        const timestamp = '2026-05-24T00:05:00.000Z';
        const message: StoredMessage = {
          id: `message-${messages.length + 1}`,
          workspaceId: input.workspaceId,
          channelId: input.channelId,
          authorId: input.authorId,
          content: input.content,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        messages.push(message);

        return message;
      },
      async listRecentMessagesForChannel(channelId: string) {
        return messages.filter((message) => message.channelId === channelId);
      },
      async findMessageById(messageId: string) {
        return messages.find((m) => m.id === messageId) ?? null;
      },
      async updateMessage(messageId: string, content: string) {
        const index = messages.findIndex((m) => m.id === messageId);
        if (index === -1) return null;
        messages[index] = { ...messages[index], content, updatedAt: new Date().toISOString() };
        return messages[index];
      },
      async deleteMessage(messageId: string) {
        const index = messages.findIndex((m) => m.id === messageId);
        if (index === -1) return false;
        messages.splice(index, 1);
        return true;
      }
    }
  };
}

function createMessageDocument(overrides: Partial<StoredMessage> = {}) {
  return {
    _id: overrides.id ?? 'message-1',
    workspaceId: overrides.workspaceId ?? 'workspace-1',
    channelId: overrides.channelId ?? 'channel-1',
    authorId: overrides.authorId ?? 'user-1',
    content: overrides.content ?? 'Welcome to Rapport.',
    createdAt: new Date(overrides.createdAt ?? '2026-05-24T00:00:00.000Z'),
    updatedAt: new Date(overrides.updatedAt ?? '2026-05-24T00:00:00.000Z')
  };
}

describe('createMongooseMessageStore', () => {
  it('maps message documents and supports create/list flows', async () => {
    const fakeModel = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            exec: vi.fn(async () => [
              {
                ...createMessageDocument({
                  id: 'message-2',
                  content: 'Second message',
                  createdAt: '2026-05-24T00:02:00.000Z'
                }),
                _id: { toString: (): string => 'message-2' }
              },
              createMessageDocument()
            ])
          }))
        }))
      })),
      create: vi.fn(async (input) =>
        createMessageDocument({
          id: 'message-3',
          workspaceId: input.workspaceId,
          channelId: input.channelId,
          authorId: input.authorId,
          content: input.content,
          createdAt: '2026-05-24T00:03:00.000Z',
          updatedAt: '2026-05-24T00:03:00.000Z'
        })
      ),
      findById: vi.fn(async () => createMessageDocument()),
      findByIdAndUpdate: vi.fn(async (_id, update: { $set?: { content?: string } }) =>
        createMessageDocument({ content: update.$set?.content ?? 'Updated' })
      ),
      findByIdAndDelete: vi.fn(async () => createMessageDocument())
    };

    const store = createMongooseMessageStore(fakeModel);

    await expect(store.listRecentMessagesForChannel('channel-1', 50)).resolves.toEqual([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-1',
        content: 'Welcome to Rapport.',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      },
      {
        id: 'message-2',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-1',
        content: 'Second message',
        createdAt: '2026-05-24T00:02:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);
    await expect(
      store.createMessage({
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-1',
        content: 'Persist me'
      })
    ).resolves.toMatchObject({
      id: 'message-3',
      content: 'Persist me'
    });
  });
});

describe('createMessageService', () => {
  it('lists recent messages and creates a persisted message for authorized members', async () => {
    const { store } = createMessageStore([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-1',
        content: 'Welcome to Rapport.',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);
    const service = createMessageService({
      messageStore: store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () => createWorkspace())
      },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: {
        findById: vi.fn(async () => createUser())
      }
    } as unknown as Parameters<typeof createMessageService>[0]);
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.listMessagesForUser(user, 'workspace-1', 'channel-1')).resolves.toEqual([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        author: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com'
        },
        content: 'Welcome to Rapport.',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);
    await expect(service.createMessageForUser(user, 'workspace-1', 'channel-1', { content: 'Hello again' })).resolves.toEqual({
      id: 'message-2',
      workspaceId: 'workspace-1',
      channelId: 'channel-1',
      author: {
        id: 'user-1',
        username: 'builder',
        email: 'builder@example.com'
      },
      content: 'Hello again',
      createdAt: '2026-05-24T00:05:00.000Z',
      updatedAt: '2026-05-24T00:05:00.000Z'
    });
  });

  it('rejects invalid workspace/channel/message payloads', async () => {
    const service = createMessageService({
      messageStore: createMessageStore().store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () => createWorkspace())
      },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: {
        findById: vi.fn(async () => createUser())
      }
    } as unknown as Parameters<typeof createMessageService>[0]);
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.listMessagesForUser(user, '   ', 'channel-1')).rejects.toEqual(new MessageServiceError('Workspace id is required.', 400));
    await expect(service.listMessagesForUser(user, 'workspace-1', '   ')).rejects.toEqual(new MessageServiceError('Channel id is required.', 400));
    await expect(service.createMessageForUser(user, 'workspace-1', 'channel-1', 'invalid')).rejects.toEqual(
      new MessageServiceError('Message content is required.', 400)
    );
    await expect(service.createMessageForUser(user, 'workspace-1', 'channel-1', { content: '   ' })).rejects.toEqual(
      new MessageServiceError('Message content is required.', 400)
    );
    await expect(service.createMessageForUser(user, 'workspace-1', 'channel-1', { content: 'x'.repeat(2001) })).rejects.toEqual(
      new MessageServiceError('Message content must be 2000 characters or fewer.', 400)
    );
  });

  it('rejects unknown or unauthorized workspace/channel access', async () => {
    const missingWorkspaceService = createMessageService({
      messageStore: createMessageStore().store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () => null)
      },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: {
        findById: vi.fn(async () => createUser())
      }
    } as unknown as Parameters<typeof createMessageService>[0]);
    const unauthorizedWorkspaceService = createMessageService({
      messageStore: createMessageStore().store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () =>
          createWorkspace({
            members: [
              {
                userId: 'user-1',
                role: 'owner',
                joinedAt: '2026-05-21T00:00:00.000Z'
              }
            ]
          })
        )
      },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: {
        findById: vi.fn(async () => createUser())
      }
    } as unknown as Parameters<typeof createMessageService>[0]);
    const missingChannelService = createMessageService({
      messageStore: createMessageStore().store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () => createWorkspace())
      },
      findChannelById: vi.fn(async () => createChannel({ workspaceId: 'workspace-2' })),
      userStore: {
        findById: vi.fn(async () => createUser())
      }
    } as unknown as Parameters<typeof createMessageService>[0]);
    const outsider = {
      id: 'user-9',
      username: 'outsider',
      email: 'outsider@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(missingWorkspaceService.listMessagesForUser(outsider, 'workspace-1', 'channel-1')).rejects.toEqual(
      new MessageServiceError('Workspace could not be found.', 404)
    );
    await expect(unauthorizedWorkspaceService.listMessagesForUser(outsider, 'workspace-1', 'channel-1')).rejects.toEqual(
      new MessageServiceError('You do not have access to this workspace.', 403)
    );
    await expect(missingChannelService.listMessagesForUser(createUser(), 'workspace-1', 'channel-1')).rejects.toEqual(
      new MessageServiceError('Channel could not be found in this workspace.', 404)
    );
  });

  it('resolves without error when checkChannelAccess passes authorization', async () => {
    const service = createMessageService({
      messageStore: createMessageStore().store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () => createWorkspace())
      },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: {
        findById: vi.fn(async () => createUser())
      }
    } as unknown as Parameters<typeof createMessageService>[0]);
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.checkChannelAccess(user, 'workspace-1', 'channel-1')).resolves.toBeUndefined();
  });

  it('rejects checkChannelAccess when the user is not a workspace member', async () => {
    const service = createMessageService({
      messageStore: createMessageStore().store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () => createWorkspace())
      },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: {
        findById: vi.fn(async () => createUser())
      }
    } as unknown as Parameters<typeof createMessageService>[0]);
    const outsider = {
      id: 'user-99',
      username: 'outsider',
      email: 'outsider@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.checkChannelAccess(outsider, 'workspace-1', 'channel-1')).rejects.toEqual(
      new MessageServiceError('You do not have access to this workspace.', 403)
    );
  });

  it('surfaces a 500 error when the message author cannot be resolved', async () => {
    const service = createMessageService({
      messageStore: createMessageStore([
        {
          id: 'message-1',
          workspaceId: 'workspace-1',
          channelId: 'channel-1',
          authorId: 'missing-user',
          content: 'Ghost author',
          createdAt: '2026-05-24T00:00:00.000Z',
          updatedAt: '2026-05-24T00:00:00.000Z'
        }
      ]).store,
      workspaceStore: {
        findWorkspaceById: vi.fn(async () => createWorkspace())
      },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: {
        findById: vi.fn(async () => null)
      }
    } as unknown as Parameters<typeof createMessageService>[0]);

    await expect(service.listMessagesForUser(createUser(), 'workspace-1', 'channel-1')).rejects.toEqual(
      new MessageServiceError('Message author could not be resolved.', 500)
    );
  });

  it('editMessageForUser updates content and returns the edited message summary', async () => {
    const { store } = createMessageStore([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-1',
        content: 'Original',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);
    const service = createMessageService({
      messageStore: store,
      workspaceStore: { findWorkspaceById: vi.fn(async () => createWorkspace()) },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: { findById: vi.fn(async () => createUser()) }
    });

    const result = await service.editMessageForUser(createUser(), 'workspace-1', 'channel-1', 'message-1', { content: 'Edited' });

    expect(result.content).toBe('Edited');
    expect(result.id).toBe('message-1');
  });

  it('editMessageForUser rejects when the message does not belong to the caller', async () => {
    const { store } = createMessageStore([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-2',
        content: 'Someone else wrote this',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);
    const service = createMessageService({
      messageStore: store,
      workspaceStore: { findWorkspaceById: vi.fn(async () => createWorkspace()) },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: { findById: vi.fn(async () => createUser()) }
    });

    await expect(
      service.editMessageForUser(createUser(), 'workspace-1', 'channel-1', 'message-1', { content: 'Hijack' })
    ).rejects.toEqual(new MessageServiceError('You can only edit your own messages.', 403));
  });

  it('editMessageForUser rejects when the message does not exist', async () => {
    const service = createMessageService({
      messageStore: createMessageStore().store,
      workspaceStore: { findWorkspaceById: vi.fn(async () => createWorkspace()) },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: { findById: vi.fn(async () => createUser()) }
    });

    await expect(
      service.editMessageForUser(createUser(), 'workspace-1', 'channel-1', 'nonexistent', { content: 'x' })
    ).rejects.toEqual(new MessageServiceError('Message could not be found.', 404));
  });

  it('deleteMessageForUser removes the message for the author', async () => {
    const { store, messages } = createMessageStore([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-1',
        content: 'Delete me',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);
    const service = createMessageService({
      messageStore: store,
      workspaceStore: { findWorkspaceById: vi.fn(async () => createWorkspace()) },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: { findById: vi.fn(async () => createUser()) }
    });

    await service.deleteMessageForUser(createUser(), 'workspace-1', 'channel-1', 'message-1');

    expect(messages).toHaveLength(0);
  });

  it('deleteMessageForUser rejects when the caller is not the author', async () => {
    const { store } = createMessageStore([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        authorId: 'user-2',
        content: 'Not yours',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);
    const service = createMessageService({
      messageStore: store,
      workspaceStore: { findWorkspaceById: vi.fn(async () => createWorkspace()) },
      findChannelById: vi.fn(async () => createChannel()),
      userStore: { findById: vi.fn(async () => createUser()) }
    });

    await expect(
      service.deleteMessageForUser(createUser(), 'workspace-1', 'channel-1', 'message-1')
    ).rejects.toEqual(new MessageServiceError('You can only delete your own messages.', 403));
  });
});


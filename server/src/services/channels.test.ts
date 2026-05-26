import { describe, expect, it, vi } from 'vitest';
import { ChannelServiceError, createChannelService, createMongooseChannelStore, type ChannelStore, type StoredChannel } from './channels';
import type { StoredWorkspace, WorkspaceStore } from './workspaces';

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

function createChannelStore(initialChannels: StoredChannel[] = []): { channels: StoredChannel[]; store: ChannelStore } {
  const channels = [...initialChannels];

  return {
    channels,
    store: {
      async createChannel(input) {
        const timestamp = '2026-05-23T00:00:00.000Z';
        const channel: StoredChannel = {
          id: `channel-${channels.length + 1}`,
          workspaceId: input.workspaceId,
          name: input.name,
          createdBy: input.createdBy,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        channels.push(channel);

        return channel;
      },
      async listChannelsForWorkspace(workspaceId: string) {
        return channels.filter((channel) => channel.workspaceId === workspaceId);
      },
      async findByWorkspaceAndName(workspaceId: string, name: string) {
        return channels.find((channel) => channel.workspaceId === workspaceId && channel.name === name) ?? null;
      },
      async findChannelById(channelId: string) {
        return channels.find((channel) => channel.id === channelId) ?? null;
      }
    }
  };
}

function createWorkspaceStore(workspaces: StoredWorkspace[]): Pick<WorkspaceStore, 'findWorkspaceById'> {
  return {
    async findWorkspaceById(workspaceId: string) {
      return workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
    }
  };
}

function createChannelDocument(overrides: Partial<StoredChannel> = {}) {
  return {
    _id: overrides.id ?? 'channel-1',
    workspaceId: overrides.workspaceId ?? 'workspace-1',
    name: overrides.name ?? 'general',
    createdBy: overrides.createdBy ?? 'user-1',
    createdAt: new Date(overrides.createdAt ?? '2026-05-23T00:00:00.000Z'),
    updatedAt: new Date(overrides.updatedAt ?? '2026-05-23T00:00:00.000Z')
  };
}

describe('createMongooseChannelStore', () => {
  it('maps model documents and supports create/list/find flows', async () => {
    const fakeModel = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          exec: vi.fn(async () => [
            {
              ...createChannelDocument(),
              _id: { toString: (): string => 'channel-1' }
            },
            createChannelDocument({
              id: 'channel-2',
              name: 'frontend',
              createdAt: '2026-05-23T00:05:00.000Z',
              updatedAt: '2026-05-23T00:05:00.000Z'
            })
          ])
        }))
      })),
      findById: vi.fn((id: string) => ({
        exec: vi.fn(async () => (id === 'channel-1' ? createChannelDocument() : null))
      })),
      findOne: vi.fn(({ workspaceId, name }: { workspaceId: string; name: string }) => ({
        exec: vi.fn(async () => (workspaceId === 'workspace-1' && name === 'general' ? createChannelDocument() : null))
      })),
      create: vi.fn(async (input) =>
        createChannelDocument({
          id: 'channel-3',
          workspaceId: input.workspaceId,
          name: input.name,
          createdBy: input.createdBy,
          createdAt: '2026-05-23T00:10:00.000Z',
          updatedAt: '2026-05-23T00:10:00.000Z'
        })
      )
    };

    const store = createMongooseChannelStore(fakeModel);

    await expect(store.listChannelsForWorkspace('workspace-1')).resolves.toEqual([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdBy: 'user-1',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      },
      {
        id: 'channel-2',
        workspaceId: 'workspace-1',
        name: 'frontend',
        createdBy: 'user-1',
        createdAt: '2026-05-23T00:05:00.000Z',
        updatedAt: '2026-05-23T00:05:00.000Z'
      }
    ]);
    await expect(store.findChannelById('channel-1')).resolves.toMatchObject({ id: 'channel-1' });
    await expect(store.findChannelById('missing')).resolves.toBeNull();
    await expect(store.findByWorkspaceAndName('workspace-1', 'GENERAL')).resolves.toMatchObject({ id: 'channel-1' });
    await expect(store.findByWorkspaceAndName('workspace-1', 'missing')).resolves.toBeNull();
    await expect(store.createChannel({ workspaceId: 'workspace-1', name: 'design', createdBy: 'user-1' })).resolves.toMatchObject({
      id: 'channel-3',
      name: 'design'
    });
  });
});

describe('createChannelService', () => {
  it('lists channels for workspace members and lets owners create channels', async () => {
    const workspace = createWorkspace();
    const { channels, store } = createChannelStore([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdBy: 'user-1',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      }
    ]);
    const service = createChannelService({
      channelStore: store,
      workspaceStore: createWorkspaceStore([workspace])
    });
    const owner = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.listChannelsForUser(owner, 'workspace-1')).resolves.toEqual([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      }
    ]);
    await expect(service.createChannelForUser(owner, 'workspace-1', { name: 'frontend' })).resolves.toEqual({
      id: 'channel-2',
      workspaceId: 'workspace-1',
      name: 'frontend',
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z'
    });
    expect(channels).toHaveLength(2);
  });

  it('permits members to list channels but not create them', async () => {
    const workspace = createWorkspace({
      members: [
        {
          userId: 'user-1',
          role: 'owner',
          joinedAt: '2026-05-21T00:00:00.000Z'
        },
        {
          userId: 'user-2',
          role: 'member',
          joinedAt: '2026-05-21T00:10:00.000Z'
        }
      ]
    });
    const { store } = createChannelStore([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdBy: 'user-1',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      }
    ]);
    const service = createChannelService({
      channelStore: store,
      workspaceStore: createWorkspaceStore([workspace])
    });
    const member = {
      id: 'user-2',
      username: 'teammate',
      email: 'teammate@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.listChannelsForUser(member, 'workspace-1')).resolves.toHaveLength(1);
    await expect(service.createChannelForUser(member, 'workspace-1', { name: 'frontend' })).rejects.toEqual(
      new ChannelServiceError('Only workspace owners can create channels.', 403)
    );
  });

  it('rejects unknown or unauthorized workspace access', async () => {
    const service = createChannelService({
      channelStore: createChannelStore().store,
      workspaceStore: createWorkspaceStore([
        createWorkspace({
          members: [
            {
              userId: 'user-1',
              role: 'owner',
              joinedAt: '2026-05-21T00:00:00.000Z'
            }
          ]
        })
      ])
    });
    const outsider = {
      id: 'user-9',
      username: 'outsider',
      email: 'outsider@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.listChannelsForUser(outsider, 'workspace-1')).rejects.toEqual(
      new ChannelServiceError('You do not have access to this workspace.', 403)
    );
    await expect(service.listChannelsForUser(outsider, 'missing-workspace')).rejects.toEqual(
      new ChannelServiceError('Workspace could not be found.', 404)
    );
  });

  it('validates workspace ids and channel names', async () => {
    const service = createChannelService({
      channelStore: createChannelStore().store,
      workspaceStore: createWorkspaceStore([createWorkspace()])
    });
    const owner = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.listChannelsForUser(owner, '   ')).rejects.toEqual(new ChannelServiceError('Workspace id is required.', 400));
    await expect(service.createChannelForUser(owner, 'workspace-1', 'invalid')).rejects.toEqual(
      new ChannelServiceError('Channel name must be at least 2 characters long.', 400)
    );
    await expect(service.createChannelForUser(owner, 'workspace-1', { name: 'a' })).rejects.toEqual(
      new ChannelServiceError('Channel name must be at least 2 characters long.', 400)
    );
    await expect(service.createChannelForUser(owner, 'workspace-1', { name: 123 })).rejects.toEqual(
      new ChannelServiceError('Channel name must be at least 2 characters long.', 400)
    );
    await expect(service.createChannelForUser(owner, 'workspace-1', { name: 'x'.repeat(51) })).rejects.toEqual(
      new ChannelServiceError('Channel name must be 50 characters or fewer.', 400)
    );
    await expect(service.createChannelForUser(owner, 'workspace-1', { name: 'Front End' })).rejects.toEqual(
      new ChannelServiceError('Channel name may only contain lowercase letters, numbers, and hyphens.', 400)
    );
  });

  it('surfaces duplicate-name conflicts for explicit channel creation', async () => {
    const service = createChannelService({
      channelStore: {
        createChannel: vi.fn(async () => {
          throw { code: 11000 };
        }),
        listChannelsForWorkspace: vi.fn(async () => []),
        findByWorkspaceAndName: vi.fn(async () => null),
        findChannelById: vi.fn(async () => null)
      },
      workspaceStore: createWorkspaceStore([createWorkspace()])
    });
    const owner = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.createChannelForUser(owner, 'workspace-1', { name: 'general' })).rejects.toEqual(
      new ChannelServiceError('A channel with that name already exists in this workspace.', 409)
    );
  });

  it('provisions the default general channel idempotently', async () => {
    const store = createChannelStore([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdBy: 'user-1',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      }
    ]).store;
    const service = createChannelService({
      channelStore: store,
      workspaceStore: createWorkspaceStore([])
    });

    await expect(service.provisionDefaultChannelForWorkspace('workspace-1', 'user-1')).resolves.toEqual({
      id: 'channel-1',
      workspaceId: 'workspace-1',
      name: 'general',
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z'
    });
  });

  it('creates the default general channel when one does not exist yet', async () => {
    const service = createChannelService({
      channelStore: createChannelStore().store,
      workspaceStore: createWorkspaceStore([])
    });

    await expect(service.provisionDefaultChannelForWorkspace('workspace-1', 'user-1')).resolves.toEqual({
      id: 'channel-1',
      workspaceId: 'workspace-1',
      name: 'general',
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z'
    });
  });

  it('recovers from duplicate default-channel provisioning races', async () => {
    const findByWorkspaceAndName = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdBy: 'user-1',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      });
    const service = createChannelService({
      channelStore: {
        createChannel: vi.fn(async () => {
          throw { code: 11000 };
        }),
        listChannelsForWorkspace: vi.fn(async () => []),
        findByWorkspaceAndName,
        findChannelById: vi.fn(async () => null)
      },
      workspaceStore: createWorkspaceStore([])
    });

    await expect(service.provisionDefaultChannelForWorkspace('workspace-1', 'user-1')).resolves.toEqual({
      id: 'channel-1',
      workspaceId: 'workspace-1',
      name: 'general',
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z'
    });
  });

  it('rethrows unexpected persistence failures', async () => {
    const service = createChannelService({
      channelStore: {
        createChannel: vi.fn(async () => {
          throw new Error('database unavailable');
        }),
        listChannelsForWorkspace: vi.fn(async () => []),
        findByWorkspaceAndName: vi.fn(async () => null),
        findChannelById: vi.fn(async () => null)
      },
      workspaceStore: createWorkspaceStore([createWorkspace()])
    });
    const owner = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.createChannelForUser(owner, 'workspace-1', { name: 'frontend' })).rejects.toThrow('database unavailable');
  });

  it('rethrows duplicate provisioning failures when the channel still cannot be reloaded', async () => {
    const service = createChannelService({
      channelStore: {
        createChannel: vi.fn(async () => {
          throw { code: 11000 };
        }),
        listChannelsForWorkspace: vi.fn(async () => []),
        findByWorkspaceAndName: vi.fn(async () => null),
        findChannelById: vi.fn(async () => null)
      },
      workspaceStore: createWorkspaceStore([])
    });

    await expect(service.provisionDefaultChannelForWorkspace('workspace-1', 'user-1')).rejects.toEqual({ code: 11000 });
  });
});





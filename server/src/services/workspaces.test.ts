import { describe, expect, it, vi } from 'vitest';
import { WorkspaceServiceError, createMongooseWorkspaceStore, createWorkspaceService, type StoredWorkspace, type WorkspaceMember, type WorkspaceStore } from './workspaces';

function createWorkspaceStore(initialWorkspaces: StoredWorkspace[] = []): { workspaces: StoredWorkspace[]; store: WorkspaceStore } {
  const workspaces = [...initialWorkspaces];

  return {
    workspaces,
    store: {
      async createWorkspace(input) {
        const timestamp = '2026-05-21T00:00:00.000Z';
        const workspace: StoredWorkspace = {
          id: `workspace-${workspaces.length + 1}`,
          name: input.name,
          ownerId: input.ownerId,
          inviteCode: input.inviteCode,
          members: input.members,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        workspaces.push(workspace);

        return workspace;
      },
      async listWorkspacesForUser(userId: string) {
        return workspaces.filter((workspace) => workspace.members.some((member) => member.userId === userId));
      },
      async findByInviteCode(inviteCode: string) {
        return workspaces.find((workspace) => workspace.inviteCode === inviteCode) ?? null;
      },
      async addMemberToWorkspace(workspaceId: string, member: WorkspaceMember) {
        const workspace = workspaces.find((candidate) => candidate.id === workspaceId);

        if (!workspace) {
          throw new WorkspaceServiceError('Workspace could not be found.', 404);
        }

        if (!workspace.members.some((existingMember) => existingMember.userId === member.userId)) {
          workspace.members = [...workspace.members, member];
          workspace.updatedAt = '2026-05-21T00:30:00.000Z';
        }

        return workspace;
      }
    }
  };
}

function createWorkspaceDocument(overrides: Partial<StoredWorkspace> = {}) {
  return {
    _id: overrides.id ?? 'workspace-1',
    name: overrides.name ?? 'Rapport Core',
    ownerId: overrides.ownerId ?? 'user-1',
    inviteCode: overrides.inviteCode ?? 'CORE1234',
    members: (overrides.members ?? [
      {
        userId: 'user-1',
        role: 'owner',
        joinedAt: '2026-05-21T00:00:00.000Z'
      }
    ]).map((member) => ({
      ...member,
      joinedAt: new Date(member.joinedAt)
    })),
    createdAt: new Date(overrides.createdAt ?? '2026-05-21T00:00:00.000Z'),
    updatedAt: new Date(overrides.updatedAt ?? '2026-05-21T00:00:00.000Z')
  };
}

describe('createMongooseWorkspaceStore', () => {
  it('maps model documents into stored workspaces and supports list/find/create/update flows', async () => {
    const fakeModel = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          exec: vi.fn(async () => [
            {
              ...createWorkspaceDocument(),
              _id: { toString: () => 'workspace-1' }
            },
            createWorkspaceDocument({
              id: 'workspace-2',
              name: 'Product Team',
              inviteCode: 'PROD5678',
              members: [
                {
                  userId: 'user-2',
                  role: 'owner',
                  joinedAt: '2026-05-21T00:10:00.000Z'
                },
                {
                  userId: 'user-1',
                  role: 'member',
                  joinedAt: '2026-05-21T00:11:00.000Z'
                }
              ],
              updatedAt: '2026-05-21T00:20:00.000Z'
            })
          ])
        }))
      })),
      findOne: vi.fn(({ inviteCode }: { inviteCode: string }) => ({
        exec: vi.fn(async () => (inviteCode === 'CORE1234' ? createWorkspaceDocument() : null))
      })),
      findById: vi.fn((id: string) => ({
        exec: vi.fn(async () => (id === 'workspace-1' ? createWorkspaceDocument() : null))
      })),
      findOneAndUpdate: vi.fn((filter: { _id: string; 'members.userId': { $ne: string } }) => ({
        exec: vi.fn(async () =>
          filter['members.userId'].$ne === 'user-2'
            ? createWorkspaceDocument({
                members: [
                  {
                    userId: 'user-1',
                    role: 'owner',
                    joinedAt: '2026-05-21T00:00:00.000Z'
                  },
                  {
                    userId: 'user-2',
                    role: 'member',
                    joinedAt: '2026-05-21T00:15:00.000Z'
                  }
                ],
                updatedAt: '2026-05-21T00:15:00.000Z'
              })
            : null
        )
      })),
      create: vi.fn(async (input) =>
        createWorkspaceDocument({
          id: 'workspace-3',
          name: input.name,
          ownerId: input.ownerId,
          inviteCode: input.inviteCode,
          members: input.members.map((member: WorkspaceMember & { joinedAt: Date }) => ({
            ...member,
            joinedAt: member.joinedAt.toISOString()
          })),
          createdAt: '2026-05-21T01:00:00.000Z',
          updatedAt: '2026-05-21T01:00:00.000Z'
        })
      )
    };

    const store = createMongooseWorkspaceStore(fakeModel);

    await expect(store.listWorkspacesForUser('user-1')).resolves.toEqual([
      {
        id: 'workspace-1',
        name: 'Rapport Core',
        ownerId: 'user-1',
        inviteCode: 'CORE1234',
        members: [
          {
            userId: 'user-1',
            role: 'owner',
            joinedAt: '2026-05-21T00:00:00.000Z'
          }
        ],
        createdAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:00:00.000Z'
      },
      {
        id: 'workspace-2',
        name: 'Product Team',
        ownerId: 'user-1',
        inviteCode: 'PROD5678',
        members: [
          {
            userId: 'user-2',
            role: 'owner',
            joinedAt: '2026-05-21T00:10:00.000Z'
          },
          {
            userId: 'user-1',
            role: 'member',
            joinedAt: '2026-05-21T00:11:00.000Z'
          }
        ],
        createdAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:20:00.000Z'
      }
    ]);
    await expect(store.findByInviteCode('CORE1234')).resolves.toMatchObject({ id: 'workspace-1' });
    await expect(store.findByInviteCode('missing')).resolves.toBeNull();
    await expect(
      store.createWorkspace({
        name: 'Design Team',
        ownerId: 'user-3',
        inviteCode: 'DESIGN12',
        members: [
          {
            userId: 'user-3',
            role: 'owner',
            joinedAt: '2026-05-21T01:00:00.000Z'
          }
        ]
      })
    ).resolves.toMatchObject({
      id: 'workspace-3',
      inviteCode: 'DESIGN12'
    });
    await expect(
      store.addMemberToWorkspace('workspace-1', {
        userId: 'user-2',
        role: 'member',
        joinedAt: '2026-05-21T00:15:00.000Z'
      })
    ).resolves.toMatchObject({
      members: expect.arrayContaining([
        expect.objectContaining({ userId: 'user-2', role: 'member' })
      ])
    });
    await expect(
      store.addMemberToWorkspace('workspace-1', {
        userId: 'user-1',
        role: 'member',
        joinedAt: '2026-05-21T00:15:00.000Z'
      })
    ).resolves.toMatchObject({ id: 'workspace-1' });
  });

  it('throws a not-found error when addMember fallback cannot reload the workspace', async () => {
    const fakeModel = {
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(() => ({ exec: vi.fn(async () => null) })),
      findOneAndUpdate: vi.fn(() => ({ exec: vi.fn(async () => null) })),
      create: vi.fn()
    };

    const store = createMongooseWorkspaceStore(fakeModel);

    await expect(
      store.addMemberToWorkspace('missing-workspace', {
        userId: 'user-2',
        role: 'member',
        joinedAt: '2026-05-21T00:15:00.000Z'
      })
    ).rejects.toMatchObject({
      message: 'Workspace could not be found.',
      statusCode: 404
    });
  });
});

describe('createWorkspaceService', () => {
  it('creates, lists, and joins workspaces with owner/member role summaries', async () => {
    const { workspaces, store } = createWorkspaceStore();
    const inviteCodes = ['CORE1234', 'PROD5678'];
    const service = createWorkspaceService({
      workspaceStore: store,
      generateInviteCode: () => inviteCodes.shift() ?? 'FALLBACK1',
      now: () => '2026-05-21T00:00:00.000Z'
    });
    const owner = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };
    const member = {
      id: 'user-2',
      username: 'teammate',
      email: 'teammate@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.createWorkspaceForUser(owner, { name: '  Rapport Core  ' })).resolves.toEqual({
      id: 'workspace-1',
      name: 'Rapport Core',
      inviteCode: 'CORE1234',
      role: 'owner',
      memberCount: 1,
      createdAt: '2026-05-21T00:00:00.000Z',
      updatedAt: '2026-05-21T00:00:00.000Z'
    });
    await expect(service.listWorkspacesForUser(owner)).resolves.toEqual([
      {
        id: 'workspace-1',
        name: 'Rapport Core',
        inviteCode: 'CORE1234',
        role: 'owner',
        memberCount: 1,
        createdAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:00:00.000Z'
      }
    ]);
    await expect(service.joinWorkspaceForUser(member, { inviteCode: 'core1234' })).resolves.toEqual({
      id: 'workspace-1',
      name: 'Rapport Core',
      inviteCode: 'CORE1234',
      role: 'member',
      memberCount: 2,
      createdAt: '2026-05-21T00:00:00.000Z',
      updatedAt: '2026-05-21T00:30:00.000Z'
    });
    await expect(service.joinWorkspaceForUser(member, { inviteCode: 'CORE1234' })).resolves.toEqual({
      id: 'workspace-1',
      name: 'Rapport Core',
      inviteCode: 'CORE1234',
      role: 'member',
      memberCount: 2,
      createdAt: '2026-05-21T00:00:00.000Z',
      updatedAt: '2026-05-21T00:30:00.000Z'
    });
    expect(workspaces[0]?.members).toHaveLength(2);
  });

  it('validates create and join payloads and rejects unknown invite codes', async () => {
    const { store } = createWorkspaceStore();
    const service = createWorkspaceService({
      workspaceStore: store,
      generateInviteCode: () => 'CORE1234',
      now: () => '2026-05-21T00:00:00.000Z'
    });
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.createWorkspaceForUser(user, { name: 'a' })).rejects.toEqual(
      new WorkspaceServiceError('Workspace name must be at least 2 characters long.', 400)
    );
    await expect(service.createWorkspaceForUser(user, 'invalid')).rejects.toEqual(
      new WorkspaceServiceError('Workspace name must be at least 2 characters long.', 400)
    );
    await expect(service.createWorkspaceForUser(user, { name: 123 })).rejects.toEqual(
      new WorkspaceServiceError('Workspace name must be at least 2 characters long.', 400)
    );
    await expect(service.createWorkspaceForUser(user, { name: 'x'.repeat(81) })).rejects.toEqual(
      new WorkspaceServiceError('Workspace name must be 80 characters or fewer.', 400)
    );
    await expect(service.joinWorkspaceForUser(user, { inviteCode: '' })).rejects.toEqual(
      new WorkspaceServiceError('Invite code is required.', 400)
    );
    await expect(service.joinWorkspaceForUser(user, 'invalid')).rejects.toEqual(
      new WorkspaceServiceError('Invite code is required.', 400)
    );
    await expect(service.joinWorkspaceForUser(user, { inviteCode: 123 })).rejects.toEqual(
      new WorkspaceServiceError('Invite code is required.', 400)
    );
    await expect(service.joinWorkspaceForUser(user, { inviteCode: 'missing' })).rejects.toEqual(
      new WorkspaceServiceError('Workspace invite code was not recognized.', 404)
    );
  });

  it('retries duplicate invite codes and eventually surfaces an exhaustion error', async () => {
    const createWorkspace = vi
      .fn()
      .mockRejectedValueOnce({ code: 11000 })
      .mockResolvedValue({
        id: 'workspace-1',
        name: 'Rapport Core',
        ownerId: 'user-1',
        inviteCode: 'FRESH567',
        members: [
          {
            userId: 'user-1',
            role: 'owner',
            joinedAt: '2026-05-21T00:00:00.000Z'
          }
        ],
        createdAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:00:00.000Z'
      });
    const service = createWorkspaceService({
      workspaceStore: {
        createWorkspace,
        listWorkspacesForUser: vi.fn(async () => []),
        findByInviteCode: vi.fn(async () => null),
        addMemberToWorkspace: vi.fn(async () => {
          throw new Error('not used');
        })
      },
      generateInviteCode: vi.fn()
        .mockReturnValueOnce('DUPLICAT')
        .mockReturnValueOnce('FRESH567'),
      now: () => '2026-05-21T00:00:00.000Z'
    });
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.createWorkspaceForUser(user, { name: 'Rapport Core' })).resolves.toMatchObject({
      inviteCode: 'FRESH567'
    });
    expect(createWorkspace).toHaveBeenCalledTimes(2);

    const exhaustedService = createWorkspaceService({
      workspaceStore: {
        createWorkspace: vi.fn(async () => {
          throw { code: 11000 };
        }),
        listWorkspacesForUser: vi.fn(async () => []),
        findByInviteCode: vi.fn(async () => null),
        addMemberToWorkspace: vi.fn(async () => {
          throw new Error('not used');
        })
      },
      generateInviteCode: () => 'DUPLICAT',
      now: () => '2026-05-21T00:00:00.000Z'
    });

    await expect(exhaustedService.createWorkspaceForUser(user, { name: 'Rapport Core' })).rejects.toEqual(
      new WorkspaceServiceError('Unable to generate a unique workspace invite code.', 500)
    );
  });

  it('surfaces inconsistent membership data when a listed workspace does not include the current user', async () => {
    const service = createWorkspaceService({
      workspaceStore: {
        createWorkspace: vi.fn(async () => {
          throw new Error('not used');
        }),
        listWorkspacesForUser: vi.fn(async () => [
          {
            id: 'workspace-1',
            name: 'Rapport Core',
            ownerId: 'user-2',
            inviteCode: 'CORE1234',
            members: [
              {
                userId: 'user-2',
                role: 'owner',
                joinedAt: '2026-05-21T00:00:00.000Z'
              }
            ],
            createdAt: '2026-05-21T00:00:00.000Z',
            updatedAt: '2026-05-21T00:00:00.000Z'
          }
        ]),
        findByInviteCode: vi.fn(async () => null),
        addMemberToWorkspace: vi.fn(async () => {
          throw new Error('not used');
        })
      }
    });
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.listWorkspacesForUser(user)).rejects.toEqual(
      new WorkspaceServiceError('Workspace membership could not be resolved for the current user.', 500)
    );
  });

  it('uses the default invite generator when no override is supplied', async () => {
    const { store } = createWorkspaceStore();
    const service = createWorkspaceService({
      workspaceStore: store,
      now: () => '2026-05-21T00:00:00.000Z'
    });
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.createWorkspaceForUser(user, { name: 'Rapport Core' })).resolves.toMatchObject({
      name: 'Rapport Core',
      inviteCode: expect.stringMatching(/^[A-Z2-9]{8}$/),
      role: 'owner'
    });
  });

  it('rethrows unexpected persistence failures', async () => {
    const service = createWorkspaceService({
      workspaceStore: {
        createWorkspace: vi.fn(async () => {
          throw new Error('database unavailable');
        }),
        listWorkspacesForUser: vi.fn(async () => []),
        findByInviteCode: vi.fn(async () => null),
        addMemberToWorkspace: vi.fn(async () => {
          throw new Error('not used');
        })
      },
      generateInviteCode: () => 'CORE1234',
      now: () => '2026-05-21T00:00:00.000Z'
    });
    const user = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    await expect(service.createWorkspaceForUser(user, { name: 'Rapport Core' })).rejects.toThrow('database unavailable');
  });
});


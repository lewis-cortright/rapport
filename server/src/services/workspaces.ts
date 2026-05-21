import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import type { AuthUser } from './auth.js';

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const MAX_INVITE_CODE_ATTEMPTS = 5;

/**
 * Membership roles supported by the MVP workspace model.
 */
export type WorkspaceRole = 'owner' | 'member';

/**
 * Embedded membership record stored on each workspace so authorization checks can
 * answer both "is this user a member?" and "what role do they have?" without a
 * separate join table.
 */
export type WorkspaceMember = {
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
};

/**
 * Normalized application-facing workspace shape returned by the persistence
 * adapter after converting Mongo document identifiers and dates into plain
 * serializable values.
 */
export type StoredWorkspace = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Lightweight workspace payload returned to the frontend for sidebar and active
 * workspace rendering.
 *
 * The current user's role is derived from their embedded membership rather than
 * from `ownerId` so owner/member UI can be driven from one consistent source.
 */
export type WorkspaceSummary = {
  id: string;
  name: string;
  inviteCode: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceCreateInput = {
  name: string;
  ownerId: string;
  inviteCode: string;
  members: WorkspaceMember[];
};

export type WorkspaceStore = {
  createWorkspace: (input: WorkspaceCreateInput) => Promise<StoredWorkspace>;
  listWorkspacesForUser: (userId: string) => Promise<StoredWorkspace[]>;
  findWorkspaceById: (workspaceId: string) => Promise<StoredWorkspace | null>;
  findByInviteCode: (inviteCode: string) => Promise<StoredWorkspace | null>;
  addMemberToWorkspace: (workspaceId: string, member: WorkspaceMember) => Promise<StoredWorkspace>;
};

/**
 * Business-logic contract used by the HTTP layer for create/list/join workspace
 * flows.
 */
export type WorkspaceService = {
  createWorkspaceForUser: (user: AuthUser, input: unknown) => Promise<WorkspaceSummary>;
  listWorkspacesForUser: (user: AuthUser) => Promise<WorkspaceSummary[]>;
  joinWorkspaceForUser: (user: AuthUser, input: unknown) => Promise<WorkspaceSummary>;
};

type CreateWorkspaceRequest = {
  name: string;
};

type JoinWorkspaceRequest = {
  inviteCode: string;
};

type GenerateInviteCode = () => string;
type ProvisionDefaultChannel = (workspaceId: string, userId: string) => Promise<unknown>;

type WorkspaceMemberDocumentLike = {
  userId: string;
  role: WorkspaceRole;
  joinedAt: string | Date;
};

type WorkspaceDocumentLike = {
  _id: string | { toString: () => string };
  name: string;
  ownerId: string;
  inviteCode: string;
  members: WorkspaceMemberDocumentLike[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type FindManyQueryLike = {
  sort: (sort: Record<string, 1 | -1>) => {
    exec: () => PromiseLike<WorkspaceDocumentLike[]>;
  };
};

type FindOneQueryLike = {
  exec: () => PromiseLike<WorkspaceDocumentLike | null>;
};

type WorkspaceModelLike = {
  find: (filter: { 'members.userId': string }) => FindManyQueryLike;
  findOne: (filter: { inviteCode: string }) => FindOneQueryLike;
  findById: (id: string) => FindOneQueryLike;
  findOneAndUpdate: (
    filter: { _id: string; 'members.userId': { $ne: string } },
    update: { $push: { members: { userId: string; role: WorkspaceRole; joinedAt: Date } } },
    options: { new: true }
  ) => FindOneQueryLike;
  create: (input: { name: string; ownerId: string; inviteCode: string; members: Array<{ userId: string; role: WorkspaceRole; joinedAt: Date }> }) => PromiseLike<WorkspaceDocumentLike>;
};

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: INVITE_CODE_LENGTH,
      maxlength: INVITE_CODE_LENGTH
    },
    members: [
      {
        _id: false,
        userId: {
          type: String,
          required: true,
          index: true
        },
        role: {
          type: String,
          enum: ['owner', 'member'],
          required: true
        },
        joinedAt: {
          type: Date,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

workspaceSchema.index({ 'members.userId': 1, updatedAt: -1 });

const WorkspaceModel =
  (mongoose.models.Workspace as mongoose.Model<WorkspaceDocumentLike> | undefined) ??
  mongoose.model<WorkspaceDocumentLike>('Workspace', workspaceSchema);

/**
 * Normalized application error used for workspace-related HTTP responses.
 */
export class WorkspaceServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'WorkspaceServiceError';
    this.statusCode = statusCode;
  }
}

function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}

function toStoredWorkspace(document: WorkspaceDocumentLike): StoredWorkspace {
  return {
    id: typeof document._id === 'string' ? document._id : document._id.toString(),
    name: document.name,
    ownerId: document.ownerId,
    inviteCode: normalizeInviteCode(document.inviteCode),
    members: document.members.map((member) => ({
      userId: member.userId,
      role: member.role,
      joinedAt: new Date(member.joinedAt).toISOString()
    })),
    createdAt: new Date(document.createdAt).toISOString(),
    updatedAt: new Date(document.updatedAt).toISOString()
  };
}

/**
 * Projects a stored workspace into the sidebar-friendly summary returned to the
 * current authenticated user.
 */
function toWorkspaceSummary(workspace: StoredWorkspace, userId: string): WorkspaceSummary {
  const membership = workspace.members.find((member) => member.userId === userId);

  if (!membership) {
    throw new WorkspaceServiceError('Workspace membership could not be resolved for the current user.', 500);
  }

  return {
    id: workspace.id,
    name: workspace.name,
    inviteCode: workspace.inviteCode,
    role: membership.role,
    memberCount: workspace.members.length,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt
  };
}

function parseCreateWorkspaceInput(input: unknown): CreateWorkspaceRequest {
  const candidate = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';

  if (name.length < 2) {
    throw new WorkspaceServiceError('Workspace name must be at least 2 characters long.', 400);
  }

  if (name.length > 80) {
    throw new WorkspaceServiceError('Workspace name must be 80 characters or fewer.', 400);
  }

  return { name };
}

function parseJoinWorkspaceInput(input: unknown): JoinWorkspaceRequest {
  const candidate = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const inviteCode = typeof candidate.inviteCode === 'string' ? normalizeInviteCode(candidate.inviteCode) : '';

  if (!inviteCode) {
    throw new WorkspaceServiceError('Invite code is required.', 400);
  }

  return { inviteCode };
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

/**
 * Generates a human-shareable invite code while avoiding visually ambiguous
 * characters like `0`, `O`, `1`, and `I`.
 */
function defaultGenerateInviteCode() {
  const bytes = randomBytes(INVITE_CODE_LENGTH);

  return Array.from(bytes, (byte) => INVITE_CODE_ALPHABET[byte % INVITE_CODE_ALPHABET.length]).join('');
}

/**
 * Adapts the shared Mongoose workspace model to the persistence contract expected
 * by the workspace service so tests can provide lightweight in-memory stores.
 */
export function createMongooseWorkspaceStore(workspaceModel: WorkspaceModelLike = WorkspaceModel): WorkspaceStore {
  return {
    async createWorkspace(input: WorkspaceCreateInput) {
      const workspace = await workspaceModel.create({
        name: input.name,
        ownerId: input.ownerId,
        inviteCode: input.inviteCode,
        members: input.members.map((member) => ({
          userId: member.userId,
          role: member.role,
          joinedAt: new Date(member.joinedAt)
        }))
      });

      return toStoredWorkspace(workspace);
    },

    async listWorkspacesForUser(userId: string) {
      const workspaces = await workspaceModel.find({ 'members.userId': userId }).sort({ updatedAt: -1 }).exec();

      return workspaces.map(toStoredWorkspace);
    },

    async findByInviteCode(inviteCode: string) {
      const workspace = await workspaceModel.findOne({ inviteCode }).exec();

      return workspace ? toStoredWorkspace(workspace) : null;
    },

    async findWorkspaceById(workspaceId: string) {
      const workspace = await workspaceModel.findById(workspaceId).exec();

      return workspace ? toStoredWorkspace(workspace) : null;
    },

    async addMemberToWorkspace(workspaceId: string, member: WorkspaceMember) {
      const updatedWorkspace = await workspaceModel
        .findOneAndUpdate(
          {
            _id: workspaceId,
            'members.userId': { $ne: member.userId }
          },
          {
            $push: {
              members: {
                userId: member.userId,
                role: member.role,
                joinedAt: new Date(member.joinedAt)
              }
            }
          },
          { new: true }
        )
        .exec();

      if (updatedWorkspace) {
        return toStoredWorkspace(updatedWorkspace);
      }

      // A failed conditional update means either the workspace is missing or the
      // user was already present. Reloading lets join behave idempotently for
      // existing members while still surfacing a real 404 when the workspace is gone.
      const existingWorkspace = await workspaceModel.findById(workspaceId).exec();

      if (!existingWorkspace) {
        throw new WorkspaceServiceError('Workspace could not be found.', 404);
      }

      return toStoredWorkspace(existingWorkspace);
    }
  };
}

/**
 * Builds the workspace service used by the create/list/join workspace endpoints.
 *
 * Dependencies are injectable so the domain rules can be unit tested without a
 * live MongoDB connection or random invite-code generation.
 */
export function createWorkspaceService(options: {
  workspaceStore?: WorkspaceStore;
  generateInviteCode?: GenerateInviteCode;
  provisionDefaultChannel?: ProvisionDefaultChannel;
  now?: () => string;
} = {}): WorkspaceService {
  const workspaceStore = options.workspaceStore ?? createMongooseWorkspaceStore();
  const generateInviteCode = options.generateInviteCode ?? defaultGenerateInviteCode;
  const provisionDefaultChannel = options.provisionDefaultChannel ?? (async () => undefined);
  const now = options.now ?? (() => new Date().toISOString());

  return {
    async createWorkspaceForUser(user: AuthUser, input: unknown) {
      const parsed = parseCreateWorkspaceInput(input);
      const joinedAt = now();

      for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
        try {
          const workspace = await workspaceStore.createWorkspace({
            name: parsed.name,
            ownerId: user.id,
            // Owners are stored both as the top-level owner and as an owner-role
            // member so later authorization checks can use one membership model.
            inviteCode: normalizeInviteCode(generateInviteCode()),
            members: [
              {
                userId: user.id,
                role: 'owner',
                joinedAt
              }
            ]
          });

          await provisionDefaultChannel(workspace.id, user.id);

          return toWorkspaceSummary(workspace, user.id);
        } catch (error) {
          if (isDuplicateKeyError(error)) {
            // Extremely rare collisions are retried with a fresh code before the
            // service gives up and surfaces a 500 configuration/runtime failure.
            continue;
          }

          throw error;
        }
      }

      throw new WorkspaceServiceError('Unable to generate a unique workspace invite code.', 500);
    },

    async listWorkspacesForUser(user: AuthUser) {
      const workspaces = await workspaceStore.listWorkspacesForUser(user.id);

      return workspaces.map((workspace) => toWorkspaceSummary(workspace, user.id));
    },

    async joinWorkspaceForUser(user: AuthUser, input: unknown) {
      const parsed = parseJoinWorkspaceInput(input);
      const workspace = await workspaceStore.findByInviteCode(parsed.inviteCode);

      if (!workspace) {
        throw new WorkspaceServiceError('Workspace invite code was not recognized.', 404);
      }

      if (workspace.members.some((member) => member.userId === user.id)) {
        // Joining the same workspace twice should be safe for demos and multi-tab
        // flows, so existing membership simply returns the current summary.
        return toWorkspaceSummary(workspace, user.id);
      }

      const updatedWorkspace = await workspaceStore.addMemberToWorkspace(workspace.id, {
        userId: user.id,
        role: 'member',
        joinedAt: now()
      });

      return toWorkspaceSummary(updatedWorkspace, user.id);
    }
  };
}


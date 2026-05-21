import mongoose from 'mongoose';
import type { AuthUser } from './auth.js';
import { createMongooseWorkspaceStore, type StoredWorkspace, type WorkspaceStore } from './workspaces.js';

const DEFAULT_CHANNEL_NAME = 'general';

export type StoredChannel = {
  id: string;
  workspaceId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ChannelSummary = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ChannelStore = {
  createChannel: (input: { workspaceId: string; name: string; createdBy: string }) => Promise<StoredChannel>;
  listChannelsForWorkspace: (workspaceId: string) => Promise<StoredChannel[]>;
  findChannelById: (channelId: string) => Promise<StoredChannel | null>;
  findByWorkspaceAndName: (workspaceId: string, name: string) => Promise<StoredChannel | null>;
};

export type ChannelService = {
  listChannelsForUser: (user: AuthUser, workspaceId: string) => Promise<ChannelSummary[]>;
  createChannelForUser: (user: AuthUser, workspaceId: string, input: unknown) => Promise<ChannelSummary>;
  provisionDefaultChannelForWorkspace: (workspaceId: string, userId: string) => Promise<ChannelSummary>;
};

type WorkspaceAccessStore = Pick<WorkspaceStore, 'findWorkspaceById'>;

type ChannelDocumentLike = {
  _id: string | { toString: () => string };
  workspaceId: string;
  name: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type FindManyQueryLike = {
  sort: (sort: Record<string, 1 | -1>) => {
    exec: () => PromiseLike<ChannelDocumentLike[]>;
  };
};

type FindOneQueryLike = {
  exec: () => PromiseLike<ChannelDocumentLike | null>;
};

type ChannelModelLike = {
  find: (filter: { workspaceId: string }) => FindManyQueryLike;
  findById: (id: string) => FindOneQueryLike;
  findOne: (filter: { workspaceId: string; name: string }) => FindOneQueryLike;
  create: (input: { workspaceId: string; name: string; createdBy: string }) => PromiseLike<ChannelDocumentLike>;
};

const channelSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50
    },
    createdBy: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

channelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
channelSchema.index({ workspaceId: 1, createdAt: 1, name: 1 });

const ChannelModel =
  (mongoose.models.Channel as mongoose.Model<ChannelDocumentLike> | undefined) ??
  mongoose.model<ChannelDocumentLike>('Channel', channelSchema);

export class ChannelServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ChannelServiceError';
    this.statusCode = statusCode;
  }
}

function normalizeChannelName(value: string) {
  return value.trim().toLowerCase();
}

function toStoredChannel(document: ChannelDocumentLike): StoredChannel {
  return {
    id: typeof document._id === 'string' ? document._id : document._id.toString(),
    workspaceId: document.workspaceId,
    name: normalizeChannelName(document.name),
    createdBy: document.createdBy,
    createdAt: new Date(document.createdAt).toISOString(),
    updatedAt: new Date(document.updatedAt).toISOString()
  };
}

function toChannelSummary(channel: StoredChannel): ChannelSummary {
  return {
    id: channel.id,
    workspaceId: channel.workspaceId,
    name: channel.name,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt
  };
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

function parseWorkspaceId(workspaceId: string) {
  const normalized = workspaceId.trim();

  if (!normalized) {
    throw new ChannelServiceError('Workspace id is required.', 400);
  }

  return normalized;
}

function parseCreateChannelInput(input: unknown) {
  const candidate = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const name = typeof candidate.name === 'string' ? normalizeChannelName(candidate.name) : '';

  if (name.length < 2) {
    throw new ChannelServiceError('Channel name must be at least 2 characters long.', 400);
  }

  if (name.length > 50) {
    throw new ChannelServiceError('Channel name must be 50 characters or fewer.', 400);
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new ChannelServiceError('Channel name may only contain lowercase letters, numbers, and hyphens.', 400);
  }

  return { name };
}

function resolveWorkspaceMembership(workspace: StoredWorkspace, userId: string) {
  return workspace.members.find((member) => member.userId === userId) ?? null;
}

async function requireWorkspaceMembership(workspaceStore: WorkspaceAccessStore, userId: string, workspaceId: string) {
  const workspace = await workspaceStore.findWorkspaceById(parseWorkspaceId(workspaceId));

  if (!workspace) {
    throw new ChannelServiceError('Workspace could not be found.', 404);
  }

  const membership = resolveWorkspaceMembership(workspace, userId);

  if (!membership) {
    throw new ChannelServiceError('You do not have access to this workspace.', 403);
  }

  return { workspace, membership };
}

export function createMongooseChannelStore(channelModel: ChannelModelLike = ChannelModel): ChannelStore {
  return {
    async createChannel(input) {
      const channel = await channelModel.create({
        workspaceId: input.workspaceId,
        name: input.name,
        createdBy: input.createdBy
      });

      return toStoredChannel(channel);
    },

    async listChannelsForWorkspace(workspaceId: string) {
      const channels = await channelModel.find({ workspaceId }).sort({ createdAt: 1, name: 1 }).exec();

      return channels.map(toStoredChannel);
    },

    async findChannelById(channelId: string) {
      const channel = await channelModel.findById(channelId).exec();

      return channel ? toStoredChannel(channel) : null;
    },

    async findByWorkspaceAndName(workspaceId: string, name: string) {
      const channel = await channelModel.findOne({ workspaceId, name: normalizeChannelName(name) }).exec();

      return channel ? toStoredChannel(channel) : null;
    }
  };
}

export function createChannelService(options: {
  channelStore?: ChannelStore;
  workspaceStore?: WorkspaceAccessStore;
} = {}): ChannelService {
  const channelStore = options.channelStore ?? createMongooseChannelStore();
  const workspaceStore = options.workspaceStore ?? createMongooseWorkspaceStore();

  return {
    async listChannelsForUser(user: AuthUser, workspaceId: string) {
      const { workspace } = await requireWorkspaceMembership(workspaceStore, user.id, workspaceId);
      const channels = await channelStore.listChannelsForWorkspace(workspace.id);

      return channels.map(toChannelSummary);
    },

    async createChannelForUser(user: AuthUser, workspaceId: string, input: unknown) {
      const { workspace, membership } = await requireWorkspaceMembership(workspaceStore, user.id, workspaceId);

      if (membership.role !== 'owner') {
        throw new ChannelServiceError('Only workspace owners can create channels.', 403);
      }

      const parsed = parseCreateChannelInput(input);

      try {
        const channel = await channelStore.createChannel({
          workspaceId: workspace.id,
          name: parsed.name,
          createdBy: user.id
        });

        return toChannelSummary(channel);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new ChannelServiceError('A channel with that name already exists in this workspace.', 409);
        }

        throw error;
      }
    },

    async provisionDefaultChannelForWorkspace(workspaceId: string, userId: string) {
      const normalizedWorkspaceId = parseWorkspaceId(workspaceId);
      const existingChannel = await channelStore.findByWorkspaceAndName(normalizedWorkspaceId, DEFAULT_CHANNEL_NAME);

      if (existingChannel) {
        return toChannelSummary(existingChannel);
      }

      try {
        const channel = await channelStore.createChannel({
          workspaceId: normalizedWorkspaceId,
          name: DEFAULT_CHANNEL_NAME,
          createdBy: userId
        });

        return toChannelSummary(channel);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          const duplicateChannel = await channelStore.findByWorkspaceAndName(normalizedWorkspaceId, DEFAULT_CHANNEL_NAME);

          if (duplicateChannel) {
            return toChannelSummary(duplicateChannel);
          }
        }

        throw error;
      }
    }
  };
}



import mongoose from 'mongoose';
import { createMongooseUserStore, type AuthUser, type UserStore } from './auth.js';
import { createMongooseChannelStore } from './channels.js';
import { createMongooseWorkspaceStore, type WorkspaceStore } from './workspaces.js';

const RECENT_MESSAGE_LIMIT = 50;

export type MessageAuthor = {
  id: string;
  username: string;
  email: string;
};

export type StoredMessage = {
  id: string;
  workspaceId: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageSummary = {
  id: string;
  workspaceId: string;
  channelId: string;
  author: MessageAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageStore = {
  createMessage: (input: { workspaceId: string; channelId: string; authorId: string; content: string }) => Promise<StoredMessage>;
  listRecentMessagesForChannel: (channelId: string, limit: number) => Promise<StoredMessage[]>;
  findMessageById: (messageId: string) => Promise<StoredMessage | null>;
  updateMessage: (messageId: string, content: string) => Promise<StoredMessage | null>;
  deleteMessage: (messageId: string) => Promise<boolean>;
};

export type MessageService = {
  listMessagesForUser: (user: AuthUser, workspaceId: string, channelId: string) => Promise<MessageSummary[]>;
  createMessageForUser: (user: AuthUser, workspaceId: string, channelId: string, input: unknown) => Promise<MessageSummary>;
  editMessageForUser: (user: AuthUser, workspaceId: string, channelId: string, messageId: string, input: unknown) => Promise<MessageSummary>;
  deleteMessageForUser: (user: AuthUser, workspaceId: string, channelId: string, messageId: string) => Promise<void>;
  /**
   * Validates that the authenticated user has access to the specified workspace
   * and channel without fetching any message data. Used by socket handlers to
   * authorize room joins before allowing real-time event delivery.
   */
  checkChannelAccess: (user: AuthUser, workspaceId: string, channelId: string) => Promise<void>;
};

type WorkspaceAccessStore = Pick<WorkspaceStore, 'findWorkspaceById'>;
type ChannelAccessStore = {
  findChannelById: (channelId: string) => Promise<{ id: string; workspaceId: string } | null>;
};
type UserDirectoryStore = Pick<UserStore, 'findById'>;

type MessageDocumentLike = {
  _id: string | { toString: () => string };
  workspaceId: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type FindManyQueryLike = {
  sort: (sort: Record<string, 1 | -1>) => {
    limit: (value: number) => {
      exec: () => PromiseLike<MessageDocumentLike[]>;
    };
  };
};

type MessageModelLike = {
  find: (filter: { channelId: string }) => FindManyQueryLike;
  create: (input: { workspaceId: string; channelId: string; authorId: string; content: string }) => PromiseLike<MessageDocumentLike>;
  findById: (id: string) => PromiseLike<MessageDocumentLike | null>;
  findByIdAndUpdate: (
    id: string,
    update: object,
    options: { new: boolean; runValidators: boolean }
  ) => PromiseLike<MessageDocumentLike | null>;
  findByIdAndDelete: (id: string) => PromiseLike<MessageDocumentLike | null>;
};

const messageSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true
    },
    channelId: {
      type: String,
      required: true,
      index: true
    },
    authorId: {
      type: String,
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ workspaceId: 1, channelId: 1, createdAt: -1 });

const MessageModel =
  (mongoose.models.Message as mongoose.Model<MessageDocumentLike> | undefined) ??
  mongoose.model<MessageDocumentLike>('Message', messageSchema);

export class MessageServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'MessageServiceError';
    this.statusCode = statusCode;
  }
}

function parseWorkspaceId(workspaceId: string) {
  const normalized = workspaceId.trim();

  if (!normalized) {
    throw new MessageServiceError('Workspace id is required.', 400);
  }

  return normalized;
}

function parseChannelId(channelId: string) {
  const normalized = channelId.trim();

  if (!normalized) {
    throw new MessageServiceError('Channel id is required.', 400);
  }

  return normalized;
}

function parseCreateMessageInput(input: unknown) {
  const candidate = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const content = typeof candidate.content === 'string' ? candidate.content.trim() : '';

  if (!content) {
    throw new MessageServiceError('Message content is required.', 400);
  }

  if (content.length > 2000) {
    throw new MessageServiceError('Message content must be 2000 characters or fewer.', 400);
  }

  return { content };
}

function parseUpdateMessageInput(input: unknown) {
  return parseCreateMessageInput(input);
}

function toStoredMessage(document: MessageDocumentLike): StoredMessage {
  return {
    id: typeof document._id === 'string' ? document._id : document._id.toString(),
    workspaceId: document.workspaceId,
    channelId: document.channelId,
    authorId: document.authorId,
    content: document.content,
    createdAt: new Date(document.createdAt).toISOString(),
    updatedAt: new Date(document.updatedAt).toISOString()
  };
}

async function requireAuthorizedChannel(options: {
  workspaceStore: WorkspaceAccessStore;
  findChannelById: ChannelAccessStore['findChannelById'];
  userId: string;
  workspaceId: string;
  channelId: string;
}) {
  const workspaceId = parseWorkspaceId(options.workspaceId);
  const channelId = parseChannelId(options.channelId);
  const workspace = await options.workspaceStore.findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new MessageServiceError('Workspace could not be found.', 404);
  }

  if (!workspace.members.some((member) => member.userId === options.userId)) {
    throw new MessageServiceError('You do not have access to this workspace.', 403);
  }

  const channel = await options.findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspace.id) {
    throw new MessageServiceError('Channel could not be found in this workspace.', 404);
  }

  return { workspace, channel };
}

async function toMessageSummary(message: StoredMessage, userStore: UserDirectoryStore): Promise<MessageSummary> {
  const author = await userStore.findById(message.authorId);

  if (!author) {
    throw new MessageServiceError('Message author could not be resolved.', 500);
  }

  return {
    id: message.id,
    workspaceId: message.workspaceId,
    channelId: message.channelId,
    author: {
      id: author.id,
      username: author.username,
      email: author.email
    },
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
}

export function createMongooseMessageStore(messageModel: MessageModelLike = MessageModel): MessageStore {
  return {
    async createMessage(input) {
      const message = await messageModel.create(input);

      return toStoredMessage(message);
    },

    async listRecentMessagesForChannel(channelId: string, limit: number) {
      const messages = await messageModel.find({ channelId }).sort({ createdAt: -1 }).limit(limit).exec();

      return messages.map(toStoredMessage).reverse();
    },

    async findMessageById(messageId: string) {
      const message = await messageModel.findById(messageId);

      return message ? toStoredMessage(message) : null;
    },

    async updateMessage(messageId: string, content: string) {
      const updated = await messageModel.findByIdAndUpdate(
        messageId,
        { $set: { content } },
        { new: true, runValidators: true }
      );

      return updated ? toStoredMessage(updated) : null;
    },

    async deleteMessage(messageId: string) {
      const deleted = await messageModel.findByIdAndDelete(messageId);

      return deleted !== null;
    }
  };
}

export function createMessageService(options: {
  messageStore?: MessageStore;
  workspaceStore?: WorkspaceAccessStore;
  findChannelById?: ChannelAccessStore['findChannelById'];
  userStore?: UserDirectoryStore;
} = {}): MessageService {
  const messageStore = options.messageStore ?? createMongooseMessageStore();
  const workspaceStore = options.workspaceStore ?? createMongooseWorkspaceStore();
  const defaultChannelStore: ChannelAccessStore = {
    findChannelById: async (channelId: string) => createMongooseChannelStore().findChannelById(channelId)
  };
  const findChannelById = options.findChannelById ?? defaultChannelStore.findChannelById;
  const userStore = options.userStore ?? createMongooseUserStore();

  return {
    async listMessagesForUser(user: AuthUser, workspaceId: string, channelId: string) {
      await requireAuthorizedChannel({
        workspaceStore,
        findChannelById,
        userId: user.id,
        workspaceId,
        channelId
      });

      const messages = await messageStore.listRecentMessagesForChannel(parseChannelId(channelId), RECENT_MESSAGE_LIMIT);

      return Promise.all(messages.map((message) => toMessageSummary(message, userStore)));
    },

    async createMessageForUser(user: AuthUser, workspaceId: string, channelId: string, input: unknown) {
      const authorized = await requireAuthorizedChannel({
        workspaceStore,
        findChannelById,
        userId: user.id,
        workspaceId,
        channelId
      });
      const parsed = parseCreateMessageInput(input);
      const message = await messageStore.createMessage({
        workspaceId: authorized.workspace.id,
        channelId: authorized.channel.id,
        authorId: user.id,
        content: parsed.content
      });

      return toMessageSummary(message, userStore);
    },

    async checkChannelAccess(user: AuthUser, workspaceId: string, channelId: string) {
      await requireAuthorizedChannel({
        workspaceStore,
        findChannelById,
        userId: user.id,
        workspaceId,
        channelId
      });
    },

    async editMessageForUser(user: AuthUser, workspaceId: string, channelId: string, messageId: string, input: unknown) {
      await requireAuthorizedChannel({
        workspaceStore,
        findChannelById,
        userId: user.id,
        workspaceId,
        channelId
      });

      const parsed = parseUpdateMessageInput(input);
      const existing = await messageStore.findMessageById(messageId);

      if (!existing) {
        throw new MessageServiceError('Message could not be found.', 404);
      }

      if (existing.channelId !== parseChannelId(channelId)) {
        throw new MessageServiceError('Message does not belong to this channel.', 404);
      }

      if (existing.authorId !== user.id) {
        throw new MessageServiceError('You can only edit your own messages.', 403);
      }

      const updated = await messageStore.updateMessage(messageId, parsed.content);

      if (!updated) {
        throw new MessageServiceError('Message could not be updated.', 500);
      }

      return toMessageSummary(updated, userStore);
    },

    async deleteMessageForUser(user: AuthUser, workspaceId: string, channelId: string, messageId: string) {
      await requireAuthorizedChannel({
        workspaceStore,
        findChannelById,
        userId: user.id,
        workspaceId,
        channelId
      });

      const existing = await messageStore.findMessageById(messageId);

      if (!existing) {
        throw new MessageServiceError('Message could not be found.', 404);
      }

      if (existing.channelId !== parseChannelId(channelId)) {
        throw new MessageServiceError('Message does not belong to this channel.', 404);
      }

      if (existing.authorId !== user.id) {
        throw new MessageServiceError('You can only delete your own messages.', 403);
      }

      await messageStore.deleteMessage(messageId);
    }
  };
}


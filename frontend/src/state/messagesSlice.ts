import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MessageSummary } from '../services/messageApi';
import { clearCredentials, setCredentials } from './authSlice';

/**
 * A MessageSummary that may carry an `optimisticId` while the server has not
 * yet confirmed it.  Once confirmed (or failed) the optimisticId is cleared.
 * All code consuming plain `MessageSummary` still type-checks because the
 * extra field is optional.
 */
export type OptimisticMessageEntry = MessageSummary & {
  /** Temporary client-generated ID present only while the send is in flight. */
  optimisticId?: string;
};

export type MessagesState = {
  itemsByChannel: Record<string, OptimisticMessageEntry[]>;
  loadedChannelIds: string[];
  status: 'idle' | 'loading';
  error: string | null;
};

const initialState: MessagesState = {
  itemsByChannel: {},
  loadedChannelIds: [],
  status: 'idle',
  error: null
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<{ channelId: string; messages: MessageSummary[] }>) {
      state.itemsByChannel[action.payload.channelId] = action.payload.messages;
      if (!state.loadedChannelIds.includes(action.payload.channelId)) {
        state.loadedChannelIds.push(action.payload.channelId);
      }
      state.status = 'idle';
      state.error = null;
    },
    appendMessage(state, action: PayloadAction<MessageSummary>) {
      const items = state.itemsByChannel[action.payload.channelId] ?? [];
      // Deduplicate by ID — the socket broadcasts to all room members including
      // the sender, so a message created locally via socket may arrive as an
      // echo.  Checking by ID keeps the list consistent.
      const alreadyPresent = items.some((m) => m.id === action.payload.id);
      if (alreadyPresent) return;
      state.itemsByChannel[action.payload.channelId] = [...items, action.payload];
      if (!state.loadedChannelIds.includes(action.payload.channelId)) {
        state.loadedChannelIds.push(action.payload.channelId);
      }
      state.status = 'idle';
      state.error = null;
    },
    /**
     * Immediately insert an optimistic (unconfirmed) message so the sender
     * sees their own message without waiting for the round-trip.
     */
    addOptimisticMessage(state, action: PayloadAction<OptimisticMessageEntry>) {
      const { channelId, optimisticId } = action.payload;
      const items = state.itemsByChannel[channelId] ?? [];
      // Guard against accidental duplicate dispatches.
      if (optimisticId && items.some((m) => m.optimisticId === optimisticId)) return;
      state.itemsByChannel[channelId] = [...items, action.payload];
    },
    /**
     * Replace the pending optimistic entry with the server-confirmed message.
     * Called from the `message:send` ack (which fires *after* the
     * `message:new` broadcast in the current server implementation, so the
     * confirmed message may already be present in the list — in that case we
     * only remove the stale optimistic entry).
     */
    confirmOptimisticMessage(
      state,
      action: PayloadAction<{ tempId: string; confirmed: MessageSummary }>
    ) {
      const { tempId, confirmed } = action.payload;
      const items = state.itemsByChannel[confirmed.channelId] ?? [];
      // Remove the temp entry.
      const withoutTemp = items.filter((m) => m.optimisticId !== tempId);
      // Avoid duplicating the confirmed message if the broadcast already added it.
      const alreadyConfirmed = withoutTemp.some((m) => m.id === confirmed.id);
      state.itemsByChannel[confirmed.channelId] = alreadyConfirmed
        ? withoutTemp
        : [...withoutTemp, confirmed];
    },
    /**
     * Remove an optimistic entry whose send failed so the original input can
     * be corrected and re-sent by the user.
     */
    removeOptimisticMessage(
      state,
      action: PayloadAction<{ tempId: string; channelId: string }>
    ) {
      const { tempId, channelId } = action.payload;
      const items = state.itemsByChannel[channelId] ?? [];
      state.itemsByChannel[channelId] = items.filter((m) => m.optimisticId !== tempId);
    },
    /**
     * Replace an existing message with an updated version after the server
     * confirms an edit.  No-op if the message is not found in the list.
     */
    updateMessage(state, action: PayloadAction<MessageSummary>) {
      const { channelId, id } = action.payload;
      const items = state.itemsByChannel[channelId] ?? [];
      state.itemsByChannel[channelId] = items.map((m) =>
        m.id === id ? { ...action.payload } : m
      );
    },
    /**
     * Remove a message from local state after it has been deleted on the server.
     */
    removeMessage(state, action: PayloadAction<{ messageId: string; channelId: string }>) {
      const { messageId, channelId } = action.payload;
      const items = state.itemsByChannel[channelId] ?? [];
      state.itemsByChannel[channelId] = items.filter((m) => m.id !== messageId);
    },
    setMessagePending(state) {
      state.status = 'loading';
      state.error = null;
    },
    setMessageError(state, action: PayloadAction<string>) {
      state.status = 'idle';
      state.error = action.payload;
    },
    clearMessageError(state) {
      state.error = null;
    },
    clearMessages() {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setCredentials, () => initialState);
    builder.addCase(clearCredentials, () => initialState);
  }
});

export const {
  addOptimisticMessage,
  appendMessage,
  clearMessageError,
  clearMessages,
  confirmOptimisticMessage,
  removeOptimisticMessage,
  removeMessage,
  setMessageError,
  setMessagePending,
  setMessages,
  updateMessage
} = messagesSlice.actions;

export const messagesReducer = messagesSlice.reducer;


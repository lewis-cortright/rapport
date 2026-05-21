import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MessageSummary } from '../services/messageApi';
import { clearCredentials, setCredentials } from './authSlice';

export type MessagesState = {
  itemsByChannel: Record<string, MessageSummary[]>;
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
  appendMessage,
  clearMessageError,
  clearMessages,
  setMessageError,
  setMessagePending,
  setMessages
} = messagesSlice.actions;

export const messagesReducer = messagesSlice.reducer;


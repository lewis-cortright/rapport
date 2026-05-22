import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearCredentials, setCredentials } from './authSlice';

export type TypingState = {
  /** Maps channelId → sorted list of usernames currently typing. */
  typingByChannel: Record<string, string[]>;
};

const initialState: TypingState = {
  typingByChannel: {}
};

const typingSlice = createSlice({
  name: 'typing',
  initialState,
  reducers: {
    /**
     * Add or remove a username from the typing list for a channel.
     * Duplicate additions are ignored; removals are idempotent.
     */
    setUserTyping(
      state,
      action: PayloadAction<{ channelId: string; username: string; isTyping: boolean }>
    ) {
      const { channelId, username, isTyping } = action.payload;
      const current = state.typingByChannel[channelId] ?? [];

      if (isTyping) {
        if (!current.includes(username)) {
          state.typingByChannel[channelId] = [...current, username];
        }
      } else {
        state.typingByChannel[channelId] = current.filter((u) => u !== username);
      }
    },

    /** Remove all typing state for a channel (e.g. after leaving it). */
    clearTypingForChannel(state, action: PayloadAction<string>) {
      delete state.typingByChannel[action.payload];
    }
  },
  extraReducers: (builder) => {
    // Reset typing state on any auth state change so stale indicators never
    // persist across login / logout boundaries.
    builder.addCase(setCredentials, () => initialState);
    builder.addCase(clearCredentials, () => initialState);
  }
});

export const { setUserTyping, clearTypingForChannel } = typingSlice.actions;
export const typingReducer = typingSlice.reducer;


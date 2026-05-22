import { describe, expect, it } from 'vitest';
import { typingReducer, setUserTyping, clearTypingForChannel, type TypingState } from './typingSlice';

const emptyState: TypingState = { typingByChannel: {} };

describe('typingSlice', () => {
  describe('setUserTyping', () => {
    it('adds a username to the channel list when isTyping is true', () => {
      const next = typingReducer(emptyState, setUserTyping({ channelId: 'ch-1', username: 'alice', isTyping: true }));
      expect(next.typingByChannel['ch-1']).toEqual(['alice']);
    });

    it('does not duplicate a username already in the list', () => {
      const state: TypingState = { typingByChannel: { 'ch-1': ['alice'] } };
      const next = typingReducer(state, setUserTyping({ channelId: 'ch-1', username: 'alice', isTyping: true }));
      expect(next.typingByChannel['ch-1']).toEqual(['alice']);
    });

    it('adds a second user to an existing channel list', () => {
      const state: TypingState = { typingByChannel: { 'ch-1': ['alice'] } };
      const next = typingReducer(state, setUserTyping({ channelId: 'ch-1', username: 'bob', isTyping: true }));
      expect(next.typingByChannel['ch-1']).toEqual(['alice', 'bob']);
    });

    it('removes a username from the channel list when isTyping is false', () => {
      const state: TypingState = { typingByChannel: { 'ch-1': ['alice', 'bob'] } };
      const next = typingReducer(state, setUserTyping({ channelId: 'ch-1', username: 'alice', isTyping: false }));
      expect(next.typingByChannel['ch-1']).toEqual(['bob']);
    });

    it('is idempotent when removing a username not in the list', () => {
      const state: TypingState = { typingByChannel: { 'ch-1': ['bob'] } };
      const next = typingReducer(state, setUserTyping({ channelId: 'ch-1', username: 'alice', isTyping: false }));
      expect(next.typingByChannel['ch-1']).toEqual(['bob']);
    });

    it('handles different channels independently', () => {
      let state = typingReducer(emptyState, setUserTyping({ channelId: 'ch-1', username: 'alice', isTyping: true }));
      state = typingReducer(state, setUserTyping({ channelId: 'ch-2', username: 'bob', isTyping: true }));
      expect(state.typingByChannel['ch-1']).toEqual(['alice']);
      expect(state.typingByChannel['ch-2']).toEqual(['bob']);
    });
  });

  describe('clearTypingForChannel', () => {
    it('removes all typing state for the specified channel', () => {
      const state: TypingState = { typingByChannel: { 'ch-1': ['alice'], 'ch-2': ['bob'] } };
      const next = typingReducer(state, clearTypingForChannel('ch-1'));
      expect(next.typingByChannel['ch-1']).toBeUndefined();
      expect(next.typingByChannel['ch-2']).toEqual(['bob']);
    });

    it('is idempotent when the channel has no typing state', () => {
      const next = typingReducer(emptyState, clearTypingForChannel('ch-nonexistent'));
      expect(next.typingByChannel).toEqual({});
    });
  });
});


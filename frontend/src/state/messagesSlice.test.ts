import { describe, it, expect } from 'vitest';
import { messagesReducer, setMessages, appendMessage, addOptimisticMessage, confirmOptimisticMessage, removeOptimisticMessage, setMessagePending, setMessageError, clearMessageError, clearMessages } from './messagesSlice';
import type { MessagesState } from './messagesSlice';

const emptyState: MessagesState = {
  itemsByChannel: {},
  loadedChannelIds: [],
  status: 'idle',
  error: null
};

const msg = (id: string, channelId = 'ch-1') => ({
  id,
  channelId,
  workspaceId: 'ws-1',
  content: 'hi',
  author: { id: 'u-1', username: 'alice', email: 'alice@example.com' },
  createdAt: '2026-05-24T00:00:00.000Z',
  updatedAt: '2026-05-24T00:00:00.000Z'
});

describe('messagesReducer', () => {
  it('returns the initial state', () => {
    expect(messagesReducer(undefined, { type: '@@INIT' })).toEqual(emptyState);
  });

  it('setMessages loads messages and marks channel as loaded', () => {
    const state = messagesReducer(emptyState, setMessages({ channelId: 'ch-1', messages: [msg('m-1')] }));
    expect(state.itemsByChannel['ch-1']).toHaveLength(1);
    expect(state.loadedChannelIds).toContain('ch-1');
    expect(state.status).toBe('idle');
  });

  it('setMessages does not duplicate the channelId in loadedChannelIds', () => {
    const pre = messagesReducer(emptyState, setMessages({ channelId: 'ch-1', messages: [] }));
    const state = messagesReducer(pre, setMessages({ channelId: 'ch-1', messages: [msg('m-1')] }));
    expect(state.loadedChannelIds.filter((id) => id === 'ch-1')).toHaveLength(1);
  });

  it('appendMessage adds a new message and deduplicates by id', () => {
    const m = msg('m-1');
    const s1 = messagesReducer(emptyState, appendMessage(m));
    expect(s1.itemsByChannel['ch-1']).toHaveLength(1);
    // Duplicate is ignored
    const s2 = messagesReducer(s1, appendMessage(m));
    expect(s2.itemsByChannel['ch-1']).toHaveLength(1);
  });

  it('addOptimisticMessage inserts a pending entry keyed by optimisticId', () => {
    const entry = { ...msg('opt-1'), optimisticId: 'opt-1' };
    const state = messagesReducer(emptyState, addOptimisticMessage(entry));
    expect(state.itemsByChannel['ch-1']).toHaveLength(1);
    expect(state.itemsByChannel['ch-1'][0].optimisticId).toBe('opt-1');
  });

  it('addOptimisticMessage guards against duplicate optimisticId', () => {
    const entry = { ...msg('opt-1'), optimisticId: 'opt-1' };
    const s1 = messagesReducer(emptyState, addOptimisticMessage(entry));
    const s2 = messagesReducer(s1, addOptimisticMessage(entry));
    expect(s2.itemsByChannel['ch-1']).toHaveLength(1);
  });

  it('confirmOptimisticMessage replaces the temp entry with the confirmed message', () => {
    const entry = { ...msg('opt-1'), optimisticId: 'opt-1' };
    const s1 = messagesReducer(emptyState, addOptimisticMessage(entry));
    const confirmed = msg('real-1');
    const s2 = messagesReducer(s1, confirmOptimisticMessage({ tempId: 'opt-1', confirmed }));
    expect(s2.itemsByChannel['ch-1']).toHaveLength(1);
    expect(s2.itemsByChannel['ch-1'][0].id).toBe('real-1');
    expect(s2.itemsByChannel['ch-1'][0].optimisticId).toBeUndefined();
  });

  it('confirmOptimisticMessage does not duplicate if broadcast already added the message', () => {
    const entry = { ...msg('opt-1'), optimisticId: 'opt-1' };
    const confirmed = msg('real-1');
    // Add optimistic entry then simulate broadcast arriving before the ack
    const s1 = messagesReducer(emptyState, addOptimisticMessage(entry));
    const s2 = messagesReducer(s1, appendMessage(confirmed));
    const s3 = messagesReducer(s2, confirmOptimisticMessage({ tempId: 'opt-1', confirmed }));
    expect(s3.itemsByChannel['ch-1']).toHaveLength(1);
    expect(s3.itemsByChannel['ch-1'][0].id).toBe('real-1');
  });

  it('removeOptimisticMessage removes the pending entry', () => {
    const entry = { ...msg('opt-1'), optimisticId: 'opt-1' };
    const s1 = messagesReducer(emptyState, addOptimisticMessage(entry));
    const s2 = messagesReducer(s1, removeOptimisticMessage({ tempId: 'opt-1', channelId: 'ch-1' }));
    expect(s2.itemsByChannel['ch-1']).toHaveLength(0);
  });

  it('setMessagePending sets status to loading and clears error', () => {
    const withError = messagesReducer(emptyState, setMessageError('oops'));
    const state = messagesReducer(withError, setMessagePending());
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('setMessageError sets status to idle and stores the error', () => {
    const state = messagesReducer(emptyState, setMessageError('something went wrong'));
    expect(state.status).toBe('idle');
    expect(state.error).toBe('something went wrong');
  });

  it('clearMessageError removes the error without changing status', () => {
    const withError = messagesReducer(emptyState, setMessageError('oops'));
    const state = messagesReducer(withError, clearMessageError());
    expect(state.error).toBeNull();
  });

  it('clearMessages resets back to initial state', () => {
    const withData = messagesReducer(
      emptyState,
      setMessages({ channelId: 'ch-1', messages: [msg('m-1')] })
    );
    const state = messagesReducer(withData, clearMessages());
    expect(state).toEqual(emptyState);
  });
});


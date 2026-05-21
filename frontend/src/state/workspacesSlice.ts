import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearCredentials, setCredentials } from './authSlice';
import type { WorkspaceSummary } from '../services/workspaceApi';
import type { RootState } from './store';

export type WorkspacesState = {
  items: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  status: 'idle' | 'loading';
  error: string | null;
  hasLoaded: boolean;
};

const initialState: WorkspacesState = {
  items: [],
  activeWorkspaceId: null,
  status: 'idle',
  error: null,
  hasLoaded: false
};

const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setWorkspaces(state, action: PayloadAction<WorkspaceSummary[]>) {
      state.items = action.payload;
      state.status = 'idle';
      state.error = null;
      state.hasLoaded = true;

      if (!state.items.length) {
        state.activeWorkspaceId = null;

        return;
      }

      const activeStillExists = state.activeWorkspaceId
        ? state.items.some((workspace) => workspace.id === state.activeWorkspaceId)
        : false;

      state.activeWorkspaceId = activeStillExists ? state.activeWorkspaceId : state.items[0]?.id ?? null;
    },
    upsertWorkspace(state, action: PayloadAction<WorkspaceSummary>) {
      const existingIndex = state.items.findIndex((workspace) => workspace.id === action.payload.id);

      if (existingIndex === -1) {
        state.items.unshift(action.payload);
      } else {
        state.items[existingIndex] = action.payload;
      }

      state.status = 'idle';
      state.error = null;
      state.hasLoaded = true;
    },
    selectWorkspace(state, action: PayloadAction<string | null>) {
      if (action.payload === null) {
        state.activeWorkspaceId = null;

        return;
      }

      if (state.items.some((workspace) => workspace.id === action.payload)) {
        state.activeWorkspaceId = action.payload;
      }
    },
    setWorkspacePending(state) {
      state.status = 'loading';
      state.error = null;
    },
    setWorkspaceError(state, action: PayloadAction<string>) {
      state.status = 'idle';
      state.error = action.payload;
    },
    clearWorkspaceError(state) {
      state.error = null;
    },
    clearWorkspaces() {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setCredentials, () => initialState);
    builder.addCase(clearCredentials, () => initialState);
  }
});

export const {
  clearWorkspaceError,
  clearWorkspaces,
  selectWorkspace,
  setWorkspaceError,
  setWorkspacePending,
  setWorkspaces,
  upsertWorkspace
} = workspacesSlice.actions;

/**
 * Reducer backing the shared workspace slice.
 */
export const workspacesReducer = workspacesSlice.reducer;

/**
 * Selects the full workspace list shown in the sidebar.
 */
export function selectWorkspaceItems(state: RootState) {
  return state.workspaces.items;
}

/**
 * Selects the currently active workspace identifier.
 */
export function selectActiveWorkspaceId(state: RootState) {
  return state.workspaces.activeWorkspaceId;
}

/**
 * Selects the active workspace summary when one is available.
 */
export function selectActiveWorkspace(state: RootState) {
  return state.workspaces.items.find((workspace) => workspace.id === state.workspaces.activeWorkspaceId) ?? null;
}

/**
 * Selects whether a workspace request is currently in flight.
 */
export function selectWorkspaceStatus(state: RootState) {
  return state.workspaces.status;
}

/**
 * Selects the latest user-facing workspace error message.
 */
export function selectWorkspaceError(state: RootState) {
  return state.workspaces.error;
}

/**
 * Selects whether the initial workspace list has already been loaded.
 */
export function selectHasLoadedWorkspaces(state: RootState) {
  return state.workspaces.hasLoaded;
}


import { useCallback, useMemo } from 'react';
import { createWorkspace, fetchWorkspaces, joinWorkspace, type WorkspaceSummary } from '../services/workspaceApi';
import { selectToken } from './authSlice';
import {
  clearWorkspaceError,
  selectWorkspace,
  setWorkspaceError,
  setWorkspacePending,
  setWorkspaces,
  upsertWorkspace
} from './workspacesSlice';
import { useAppDispatch, useAppSelector } from './hooks';

type CreateWorkspaceInput = {
  name: string;
};

type JoinWorkspaceInput = {
  inviteCode: string;
};

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type WorkspacesContextValue = {
  items: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  hasLoaded: boolean;
  status: 'idle' | 'loading';
  error: string | null;
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<void>;
  joinWorkspace: (input: JoinWorkspaceInput) => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
  clearError: () => void;
};

/**
 * Exposes workspace sidebar state and workspace CRUD-style actions in a
 * component-friendly shape for the authenticated app shell.
 */
export function useWorkspaces(): WorkspacesContextValue {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const items = useAppSelector((state) => state.workspaces.items);
  const activeWorkspace = useAppSelector(
    (state) => state.workspaces.items.find((workspace) => workspace.id === state.workspaces.activeWorkspaceId) ?? null
  );
  const hasLoaded = useAppSelector((state) => state.workspaces.hasLoaded);
  const status = useAppSelector((state) => state.workspaces.status);
  const error = useAppSelector((state) => state.workspaces.error);

  const loadWorkspaces = useCallback(async () => {
    if (!token) {
      dispatch(setWorkspaces([]));

      return;
    }

    dispatch(setWorkspacePending());

    try {
      const workspaces = await fetchWorkspaces(token);
      dispatch(setWorkspaces(workspaces));
    } catch (nextError) {
      dispatch(setWorkspaceError(resolveErrorMessage(nextError, 'Unable to load workspaces.')));
      throw nextError;
    }
  }, [dispatch, token]);

  const createWorkspaceForUser = useCallback(
    async (input: CreateWorkspaceInput) => {
      if (!token) {
        const error = new Error('Authentication token is required.');
        dispatch(setWorkspaceError(error.message));
        throw error;
      }

      dispatch(setWorkspacePending());

      try {
        const workspace = await createWorkspace(input, token);
        dispatch(upsertWorkspace(workspace));
        dispatch(selectWorkspace(workspace.id));
      } catch (nextError) {
        dispatch(setWorkspaceError(resolveErrorMessage(nextError, 'Unable to create a workspace.')));
        throw nextError;
      }
    },
    [dispatch, token]
  );

  const joinWorkspaceForUser = useCallback(
    async (input: JoinWorkspaceInput) => {
      if (!token) {
        const error = new Error('Authentication token is required.');
        dispatch(setWorkspaceError(error.message));
        throw error;
      }

      dispatch(setWorkspacePending());

      try {
        const workspace = await joinWorkspace(input, token);
        dispatch(upsertWorkspace(workspace));
        dispatch(selectWorkspace(workspace.id));
      } catch (nextError) {
        dispatch(setWorkspaceError(resolveErrorMessage(nextError, 'Unable to join the workspace.')));
        throw nextError;
      }
    },
    [dispatch, token]
  );

  const selectWorkspaceById = useCallback(
    (workspaceId: string) => {
      dispatch(selectWorkspace(workspaceId));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearWorkspaceError());
  }, [dispatch]);

  return useMemo(
    () => ({
      items,
      activeWorkspace,
      hasLoaded,
      status,
      error,
      loadWorkspaces,
      createWorkspace: createWorkspaceForUser,
      joinWorkspace: joinWorkspaceForUser,
      selectWorkspace: selectWorkspaceById,
      clearError
    }),
    [activeWorkspace, clearError, createWorkspaceForUser, error, hasLoaded, items, joinWorkspaceForUser, loadWorkspaces, selectWorkspaceById, status]
  );
}


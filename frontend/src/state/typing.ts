import { useAppSelector } from './hooks';

const EMPTY_TYPING: string[] = [];

/**
 * Returns the list of usernames currently typing in the active channel.
 * Returns an empty array when no channel is selected or nobody is typing.
 */
export function useTyping(): { typingUsers: string[] } {
  const activeChannelId = useAppSelector((state: any) => {
    const activeWorkspaceId: string | null = state.workspaces.activeWorkspaceId;
    if (!activeWorkspaceId) return null;
    return (state.channels.activeChannelIdByWorkspace[activeWorkspaceId] as string | undefined) ?? null;
  });

  const typingUsers = useAppSelector((state: any) =>
    activeChannelId
      ? (state.typing.typingByChannel[activeChannelId] as string[] | undefined) ?? EMPTY_TYPING
      : EMPTY_TYPING
  );

  return { typingUsers };
}


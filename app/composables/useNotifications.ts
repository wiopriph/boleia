import type { NotificationRow } from '~/utils/notifications';

// In-app feed: pull on open, no realtime (spec section 7 keeps it to three subscriptions).
export function useNotifications() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();
  const unreadCount = useState<number>('notifications-unread', () => 0);

  async function refreshUnread() {
    if (!userId.value) {
      unreadCount.value = 0;

      return;
    }

    const { count } = await db.from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId.value)
      .eq('channel', 'inapp')
      .is('read_at', null);

    unreadCount.value = count ?? 0;
  }

  async function fetchRecent(): Promise<NotificationRow[]> {
    if (!userId.value) {
      return [];
    }

    const { data } = await db.from('notifications')
      .select('id, type, payload, read_at, created_at')
      .eq('user_id', userId.value)
      .eq('channel', 'inapp')
      .order('created_at', { ascending: false })
      .limit(50);

    return data ?? [];
  }

  async function markRead(ids: string[]) {
    if (!ids.length) {
      return;
    }

    await rpc('mark_notifications_read', { ids });
    await refreshUnread();
  }

  return { unreadCount, refreshUnread, fetchRecent, markRead };
}

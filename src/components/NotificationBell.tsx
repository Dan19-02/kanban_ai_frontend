import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '../api/client';
import type { AppNotification } from '../types';
import { timeAgo } from '../lib/time';
import { IconButton } from '../ui/Button';
import { Menu } from '../ui/Menu';

/** Bell in the top bar: unread count plus a list of recent mentions and assignments. */
export function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    api.notifications
      .list()
      .then(({ notifications, unread }) => {
        setItems(notifications);
        setUnread(unread);
      })
      .catch(() => {
        /* transient (offline or signed out): try again on the next tick */
      });
  }, []);

  // Initial fetch plus light polling so the count stays current across the app.
  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load]);

  const handleOpened = async () => {
    if (unread === 0) return;
    setUnread(0);
    try {
      await api.notifications.markAllRead();
    } catch {
      load(); // restore the true state if marking as read failed
    }
  };

  return (
    <Menu
      width="w-80"
      onOpenChange={(open) => {
        if (open) handleOpened();
        // Leave the unread dots visible while the list is open; clear them on close.
        else setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      }}
      button={(trigger) => (
        <IconButton {...trigger} label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'} className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red px-0.5 text-[0.625rem] leading-none font-semibold text-on-red tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </IconButton>
      )}
    >
      {(close) => (
        <>
          <p className="border-b border-rule px-3 pt-1.5 pb-2.5 font-serif text-[0.9375rem] font-semibold">Notifications</p>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-ink-2">
              Nothing yet. Mentions and tasks assigned to you will show up here.
            </p>
          ) : (
            <ul className="relative max-h-[60vh] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-rule last:border-b-0">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close();
                      if (n.boardId) navigate(`/board/${n.boardId}`);
                    }}
                    className="grid w-full grid-cols-[0.75rem_minmax(0,1fr)] gap-x-1.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-wash focus-visible:-outline-offset-2"
                  >
                    <span
                      aria-hidden
                      className={`mt-[0.4375rem] h-1.5 w-1.5 rounded-full ${n.read ? 'bg-transparent' : 'bg-red'}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-ink">
                        <span className="font-semibold">{n.actorName}</span>{' '}
                        {n.type === 'mention' ? 'mentioned you' : 'assigned you a task'}
                        {!n.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] text-ink-2">{n.text}</span>
                      <span className="mt-1 block text-xs text-ink-3">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Menu>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AtSign, ClipboardCheck } from 'lucide-react';
import { api } from '../api/client';
import type { AppNotification } from '../types';
import { timeAgo } from '../lib/time';

/** Bell in the header: unread badge + dropdown of recent mentions/assignments. */
export function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    api.notifications
      .list()
      .then(({ notifications, unread }) => {
        setItems(notifications);
        setUnread(unread);
      })
      .catch(() => {
        /* transient (offline / auth) — try again on the next tick */
      });
  }, []);

  // Initial fetch + light polling so the badge stays current across the app.
  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load]);

  const openMenu = async () => {
    setOpen(true);
    if (unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      try {
        await api.notifications.markAllRead();
      } catch {
        load(); // restore true state if the mark-read failed
      }
    }
  };

  const handleClick = (n: AppNotification) => {
    setOpen(false);
    if (n.boardId) navigate(`/board/${n.boardId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center text-center gap-2">
                <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">You're all caught up</p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'mention'
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {n.type === 'mention' ? <AtSign className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-sm text-slate-700 dark:text-slate-200 block">
                        <span className="font-semibold">{n.actorName}</span>{' '}
                        {n.type === 'mention' ? 'mentioned you' : 'assigned you a task'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 block mt-0.5">{n.text}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

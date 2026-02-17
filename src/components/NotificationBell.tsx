'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { m, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations('notifications');

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=20');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = data?.notifications?.filter((n: any) => !n.read).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); if (unreadCount > 0) markReadMutation.mutate(); }}
        className="relative p-2 rounded-xl hover:bg-bg-elevated transition-colors"
        aria-label={`${t('title')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <m.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto glass rounded-2xl shadow-2xl z-50 border border-white/[0.06]"
              role="dialog"
              aria-modal="true"
              aria-label={t('title')}
            >
              <div className="p-3 border-b border-white/[0.06] flex justify-between items-center">
                <span className="font-semibold text-sm">{t('title')}</span>
                {unreadCount > 0 && (
                  <button onClick={() => markReadMutation.mutate()} className="text-xs text-accent">
                    {t('markAllRead')}
                  </button>
                )}
              </div>
              <div className="divide-y divide-white/[0.04]">
                {data?.notifications?.length === 0 && (
                  <p className="p-4 text-center text-text-muted text-sm">{t('empty')}</p>
                )}
                {data?.notifications?.map((notif: any) => (
                  <div key={notif.id} className={`p-3 ${!notif.read ? 'bg-bg-elevated/50' : ''}`}>
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{notif.body}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

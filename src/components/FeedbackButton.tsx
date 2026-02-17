'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { m, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

function MessageIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
    </svg>
  );
}

function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const t = useTranslations('feedback');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, pageUrl: window.location.pathname }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      setSent(true);
      setMessage('');
      setTimeout(() => { setSent(false); setIsOpen(false); }, 2000);
    },
  });

  const typeLabels = { bug: t('bug'), suggestion: t('suggestion'), other: t('other') };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label={t('title')}
      >
        <MessageIcon size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
            onClick={() => setIsOpen(false)}
          >
            <m.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass border border-white/[0.06] rounded-2xl p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-title"
            >
              {sent ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2" aria-hidden="true">&#127881;</p>
                  <p className="font-semibold">{t('thanks')}</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 id="feedback-title" className="font-bold text-lg">{t('title')}</h3>
                    <button onClick={() => setIsOpen(false)} aria-label="Fermer">
                      <XIcon size={20} />
                    </button>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {(['bug', 'suggestion', 'other'] as const).map((t_type) => (
                      <button
                        key={t_type}
                        onClick={() => setType(t_type)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          type === t_type ? 'bg-accent text-bg-primary' : 'bg-bg-elevated text-text-secondary'
                        }`}
                      >
                        {typeLabels[t_type]}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('message')}
                    rows={4}
                    className="w-full bg-bg-elevated border border-white/[0.06] rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label={t('message')}
                  />

                  <button
                    onClick={() => mutation.mutate()}
                    disabled={message.length < 10 || mutation.isPending}
                    className="w-full mt-3 py-3 bg-accent text-bg-primary font-semibold rounded-xl disabled:opacity-50 transition-opacity"
                  >
                    {mutation.isPending ? t('sending') : t('send')}
                  </button>
                </>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

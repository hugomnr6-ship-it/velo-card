'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { m } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useSubscription, useBillingPortal } from '@/hooks/useSubscription';
import ProBadge from '@/components/ProBadge';
import ReferralCard from '@/components/ReferralCard';
import SharingConsentToggle from '@/components/SharingConsentToggle';

function GlobeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
}
function BellIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
}
function ShieldIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>;
}
function DatabaseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>;
}
function HelpIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>;
}
function CreditCardIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
}
function ChevronRight() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
}

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
        <span className="text-text-secondary">{icon}</span>
        <h2 className="text-sm font-bold tracking-wide text-text-secondary uppercase">{title}</h2>
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

function ToggleSetting({ label, description, defaultOn = true }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-bg-elevated'}`}
        role="switch"
        aria-checked={on}
        aria-label={label}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function ActionButton({ label, description, destructive, onClick }: { label: string; description?: string; destructive?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-bg-elevated/50 transition-colors">
      <div>
        <p className={`text-sm font-medium ${destructive ? 'text-red-400' : ''}`}>{label}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      <ChevronRight />
    </button>
  );
}

function LinkButton({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-bg-elevated/50 transition-colors">
      <p className="text-sm font-medium">{label}</p>
      <ChevronRight />
    </a>
  );
}

function SubscriptionSection() {
  const { data: subscription } = useSubscription();
  const billingPortal = useBillingPortal();

  return (
    <SettingsSection title="Abonnement" icon={<CreditCardIcon />}>
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white">Plan actuel</h3>
          <ProBadge />
        </div>

        {subscription?.isPro ? (
          <div>
            <p className="text-sm text-gray-300 mb-2">
              Plan : <strong className="text-indigo-400">{subscription.plan === 'pro_yearly' ? 'Pro Annuel' : 'Pro Mensuel'}</strong>
            </p>
            {subscription.cancelAtPeriodEnd && (
              <p className="text-amber-400 text-xs mb-2">
                Annulation prévue le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
              </p>
            )}
            <p className="text-text-muted text-xs mb-4">
              Prochaine facturation : {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
            </p>
            <button
              onClick={() => billingPortal.mutate()}
              className="px-4 py-2 bg-bg-elevated hover:bg-bg-elevated/80 rounded-xl text-sm transition"
            >
              Gérer la facturation
            </button>
          </div>
        ) : (
          <div>
            <p className="text-text-muted text-sm mb-4">Tu es sur le plan gratuit.</p>
            <a
              href="/pricing"
              className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition text-white"
            >
              Passer Pro &rarr;
            </a>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}

function PrivacySection() {
  const t = useTranslations('settings');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deauthing, setDeauthing] = useState(false);
  const [showDeauthConfirm, setShowDeauthConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/privacy/consent')
      .then(res => res.json())
      .then(data => {
        setConsent(data.sharing_consent ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDeauth = async () => {
    setDeauthing(true);
    try {
      const res = await fetch('/api/privacy/deauth', { method: 'POST' });
      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      }
    } finally {
      setDeauthing(false);
      setShowDeauthConfirm(false);
    }
  };

  return (
    <SettingsSection title={t('privacy')} icon={<ShieldIcon />}>
      <div className="px-4 py-3">
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-white/5" />
        ) : (
          <SharingConsentToggle initialConsent={consent} onConsentChange={setConsent} />
        )}
      </div>
      <div className="px-4 py-3 border-t border-white/[0.04]">
        {!showDeauthConfirm ? (
          <button
            onClick={() => setShowDeauthConfirm(true)}
            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Déconnecter Strava et supprimer mes données
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400">
              Toutes vos activités Strava seront supprimées et vous serez retiré(e) de tous les classements. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeauth}
                disabled={deauthing}
                className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {deauthing ? '...' : 'Confirmer la déconnexion'}
              </button>
              <button
                onClick={() => setShowDeauthConfirm(false)}
                className="px-4 py-2 bg-bg-elevated text-sm rounded-lg"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Read current locale from cookie
  const currentLocale = (typeof document !== 'undefined'
    ? document.cookie.split('; ').find(c => c.startsWith('locale='))?.split('=')[1]
    : 'fr') as 'fr' | 'en' || 'fr';

  const handleExport = async () => {
    const res = await fetch('/api/profile/export');
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'velocard-export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    const res = await fetch('/api/profile/delete', { method: 'DELETE' });
    if (res.ok) {
      await signOut({ callbackUrl: '/' });
    }
    setDeleting(false);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-8 pb-24 space-y-4"
    >
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      {/* Abonnement */}
      <SubscriptionSection />

      {/* Parrainage */}
      <ReferralCard />

      <SettingsSection title={t('language')} icon={<GlobeIcon />}>
        <div className="px-4 py-3">
          <LanguageSwitcher currentLocale={currentLocale} />
        </div>
      </SettingsSection>

      <SettingsSection title={t('notifications')} icon={<BellIcon />}>
        <ToggleSetting label={t('notifDuels')} description={t('notifDuelsDesc')} />
        <ToggleSetting label={t('notifMonday')} description={t('notifMondayDesc')} />
        <ToggleSetting label={t('notifBadges')} description={t('notifBadgesDesc')} />
        <ToggleSetting label={t('notifSocial')} description={t('notifSocialDesc')} />
      </SettingsSection>

      <PrivacySection />

      <SettingsSection title={t('myData')} icon={<DatabaseIcon />}>
        <ActionButton label={t('dataExport')} description={t('exportDesc')} onClick={handleExport} />
        <ActionButton label={t('deleteAccount')} description={t('deleteDesc')} destructive onClick={handleDelete} />
        {showDeleteConfirm && (
          <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/20">
            <p className="text-sm text-red-400 mb-2">{t('deleteConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {deleting ? '...' : t('confirm')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-bg-elevated text-sm rounded-lg"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title={t('help')} icon={<HelpIcon />}>
        <ActionButton label={t('feedback')} onClick={() => router.push('#feedback')} />
        <ActionButton label={t('reportBug')} onClick={() => router.push('#feedback')} />
        <LinkButton label={t('privacyPolicy')} href="/privacy" />
        <LinkButton label={t('termsOfService')} href="/terms" />
      </SettingsSection>

      <p className="text-center text-xs text-text-muted pt-4">VeloCard v1.0.0</p>
    </m.div>
  );
}

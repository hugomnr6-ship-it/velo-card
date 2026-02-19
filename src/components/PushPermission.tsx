"use client";

import { useState, useEffect } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-notifications";

export default function PushPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (permission === "denied" || !("Notification" in window)) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (permission === "granted") {
        await unsubscribeFromPush();
        setPermission("default");
      } else {
        const sub = await subscribeToPush();
        if (sub) setPermission("granted");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
      aria-label={permission === "granted" ? "Désactiver les notifications" : "Activer les notifications"}
    >
      {permission === "granted" ? "🔔 Notifications actives" : "🔕 Activer les notifications"}
    </button>
  );
}

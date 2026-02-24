"use client";

import ProPaywallModal from "@/components/ProPaywallModal";
import type { PRO_GATES } from "@/lib/pro-gates";

interface ProGateOverlayProps {
  feature: keyof typeof PRO_GATES;
  trigger?: string;
  onClose: () => void;
}

/**
 * Rétrocompatibilité — délègue au nouveau ProPaywallModal.
 * Les pages consommatrices (duels, quests, shop) rendent ce composant
 * conditionnellement, donc isOpen est toujours true ici.
 */
export default function ProGateOverlay({
  feature,
  trigger,
  onClose,
}: ProGateOverlayProps) {
  return (
    <ProPaywallModal
      isOpen={true}
      feature={feature}
      trigger={trigger}
      onClose={onClose}
    />
  );
}

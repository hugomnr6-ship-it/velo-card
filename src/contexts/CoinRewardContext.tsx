"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import CoinReward from "@/components/CoinReward";

/** Durée d'affichage de chaque bulle (ms) */
const DISPLAY_DURATION = 2000;
/** Délai entre deux bulles consécutives (ms) */
const QUEUE_DELAY = 400;

export interface CoinRewardItem {
  id: number;
  amount: number;
  source?: string;
}

interface CoinRewardContextValue {
  /** Affiche une bulle dorée "+N 🪙". Les appels sont mis en file d'attente. */
  showReward: (amount: number, source?: string) => void;
}

const CoinRewardContext = createContext<CoinRewardContextValue | null>(null);

let nextId = 0;

export function CoinRewardProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState<CoinRewardItem[]>([]);
  const queueRef = useRef<CoinRewardItem[]>([]);
  const processingRef = useRef(false);

  // Traite la file d'attente séquentiellement
  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    if (queueRef.current.length === 0) return;

    processingRef.current = true;
    const item = queueRef.current.shift()!;

    // Afficher la bulle
    setVisible((prev) => [...prev, item]);

    // Retirer après la durée d'affichage
    setTimeout(() => {
      setVisible((prev) => prev.filter((r) => r.id !== item.id));
    }, DISPLAY_DURATION);

    // Traiter le suivant après un court délai
    setTimeout(() => {
      processingRef.current = false;
      processQueue();
    }, DISPLAY_DURATION + QUEUE_DELAY);
  }, []);

  const showReward = useCallback(
    (amount: number, source?: string) => {
      if (amount <= 0) return;
      const item: CoinRewardItem = { id: nextId++, amount, source };
      queueRef.current.push(item);
      processQueue();
    },
    [processQueue]
  );

  return (
    <CoinRewardContext.Provider value={{ showReward }}>
      {children}
      <CoinReward rewards={visible} />
    </CoinRewardContext.Provider>
  );
}

export function useCoinReward() {
  const ctx = useContext(CoinRewardContext);
  if (!ctx)
    throw new Error("useCoinReward must be used within CoinRewardProvider");
  return ctx;
}

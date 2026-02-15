"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCheck, IconX, IconInfo } from "@/components/icons/VeloIcons";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`pointer-events-auto w-full max-w-sm rounded-xl border bg-[#111827]/95 px-4 py-3 text-sm backdrop-blur-md shadow-lg ${
                t.type === "success"
                  ? "border-green-500/30 text-green-400"
                  : t.type === "error"
                    ? "border-red-500/30 text-red-400"
                    : "border-white/[0.10] text-white/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex items-center">
                  {t.type === "success"
                    ? <IconCheck size={16} className="text-green-400" />
                    : t.type === "error"
                      ? <IconX size={16} className="text-red-400" />
                      : <IconInfo size={16} className="text-white/60" />}
                </span>
                <span>{t.message}</span>
              </div>
              {/* Auto-dismiss progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-b-xl ${
                  t.type === "success"
                    ? "bg-green-500/40"
                    : t.type === "error"
                      ? "bg-red-500/40"
                      : "bg-[#94A3B8]/40"
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

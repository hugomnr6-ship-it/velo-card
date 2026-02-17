// ═══════════════════════════════════════════════
// Structured Logging — Production-ready
// JSON en prod (parseable par Vercel Logs, Datadog)
// Format lisible en dev
// ═══════════════════════════════════════════════

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  // En production : JSON structuré
  if (process.env.NODE_ENV === "production") {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      JSON.stringify(entry)
    );
  } else {
    // En dev : format lisible
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `[${level.toUpperCase()}] ${message}`,
      context || ""
    );
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),

  /**
   * Timer helper pour mesurer la durée d'une opération.
   * Usage: const timer = logger.time("label"); ... timer.end({ extra: "ctx" });
   */
  time: (label: string) => {
    const start = Date.now();
    return {
      end: (ctx?: Record<string, unknown>) => {
        const duration = Date.now() - start;
        log("info", `${label} completed`, { ...ctx, durationMs: duration });
        return duration;
      },
    };
  },
};

/**
 * Minimal structured logger for server code.
 *
 * The codebase rule is no bare `console.log`, and every log must say what
 * failed, where, and why. This wraps `console` in a single place so route
 * handlers emit consistent, greppable JSON lines instead of ad-hoc strings —
 * and so swapping in a real transport later is a one-file change.
 */

type LogLevel = "info" | "warn" | "error";

interface LogFields {
  /** Where — the function or route, e.g. "GET /api/needs". */
  scope: string;
  /** What happened. */
  message: string;
  /** Why / context. Never put secrets or PII here. */
  meta?: Record<string, unknown>;
}

function emit(level: LogLevel, { scope, message, meta }: LogFields): void {
  const line = JSON.stringify({ level, scope, message, ...meta });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (fields: LogFields) => emit("info", fields),
  warn: (fields: LogFields) => emit("warn", fields),
  error: (fields: LogFields) => emit("error", fields),
};

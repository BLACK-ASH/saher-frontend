// lib/logger.ts
export function logError(error: unknown, context?: Record<string, any>) {
  const err = error instanceof Error ? error : new Error(String(error));

  // 👉 Replace this with Sentry later
  console.error("🚨 Error Logged:", {
    message: err.message,
    stack: err.stack,
    context,
  });

  // Example (future):
  // Sentry.captureException(err, { extra: context })
}

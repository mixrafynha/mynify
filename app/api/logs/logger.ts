type LogLevel = "info" | "warn" | "error";

export async function track(
  event: string,
  data?: Record<string, unknown>,
  level: LogLevel = "info"
) {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        level,
        data: data ?? {},
      }),
    });
  } catch {
    // Logging must never block the user flow.
  }
}

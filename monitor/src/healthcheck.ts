const PING_URL = process.env.HEALTHCHECK_PING_URL;

/**
 * Best-effort heartbeat for Healthchecks.io or Uptime Kuma Push.
 * Monitoring failures must never crash the monitor.
 */
export async function pingDeadManSwitch(options: {
  ok: boolean;
  latencyMs?: number;
  message?: string;
}): Promise<void> {
  if (!PING_URL) return;

  try {
    const url = new URL(PING_URL);
    const isUptimeKuma = url.pathname.includes("/api/push/");

    if (isUptimeKuma) {
      url.searchParams.set("status", options.ok ? "up" : "down");
      if (options.message) url.searchParams.set("msg", options.message.slice(0, 200));
      if (options.latencyMs !== undefined) {
        url.searchParams.set("ping", String(Math.round(options.latencyMs)));
      }
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Heartbeat endpoint returned HTTP ${response.status}`);
      return;
    }

    const target = options.ok
      ? url.toString()
      : `${url.toString().replace(/\\/$/, "")}/fail`;
    const response = await fetch(target, {
      method: "POST",
      body: options.message || `slot_latency=${options.latencyMs ?? 0}ms`,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Heartbeat endpoint returned HTTP ${response.status}`);
  } catch (error) {
    console.warn("[DeadManSwitch] Heartbeat delivery failed:", error);
  }
}

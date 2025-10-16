export function track(ev: string, data?: Record<string, unknown>) {
  try {
    console.debug("[telemetry]", ev, data ?? {});
  } catch {
    // Ignore telemetry errors
  }
}

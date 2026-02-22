export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = new URL("sw.js", import.meta.env.BASE_URL).toString();
    navigator.serviceWorker.register(swUrl).catch(() => {
      // Keep startup resilient if SW registration fails.
    });
  });
}

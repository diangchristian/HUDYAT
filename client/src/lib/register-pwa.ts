/** Static assets only. Auth, lessons and progress requests are never cached here. */
export function registerPwa() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js", {
    scope: import.meta.env.BASE_URL,
  }).catch(error => console.warn("HUDYAT offline assets could not be installed.", error));
}

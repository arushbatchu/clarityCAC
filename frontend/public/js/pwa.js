/**
 * pwa.ts
 * Makes Clarity installable on a phone's home screen and usable offline.
 * Android/desktop Chrome give us an install prompt event; iOS Safari doesn't,
 * so on iPhone we show the three Add to Home Screen steps instead.
 */
const DISMISS_KEY = "clarity-install-dismissed";
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
function dismissed() {
    try {
        return sessionStorage.getItem(DISMISS_KEY) === "1";
    }
    catch {
        return false;
    }
}
export function initPwa() {
    // Service workers only run over http(s), not when the file is opened directly.
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("sw.js").catch(err => console.warn("[Clarity] service worker failed", err));
        });
    }
    const banner = document.getElementById("install-banner");
    const iosModal = document.getElementById("ios-instructions");
    if (!banner || !iosModal)
        return;
    let deferred = null;
    const show = () => { if (!dismissed() && !isInstalled())
        banner.classList.add("show"); };
    const hide = () => banner.classList.remove("show");
    window.addEventListener("beforeinstallprompt", e => {
        e.preventDefault();
        deferred = e;
        setTimeout(show, 1500);
    });
    document.getElementById("install-accept")?.addEventListener("click", async () => {
        hide();
        if (deferred) {
            await deferred.prompt();
            await deferred.userChoice.catch(() => undefined);
            deferred = null;
        }
        else if (isIOS()) {
            iosModal.classList.add("show");
        }
    });
    document.getElementById("install-dismiss")?.addEventListener("click", () => {
        hide();
        try {
            sessionStorage.setItem(DISMISS_KEY, "1");
        }
        catch { /* ignore */ }
    });
    document.getElementById("ios-close")?.addEventListener("click", () => iosModal.classList.remove("show"));
    iosModal.addEventListener("click", e => { if (e.target === iosModal)
        iosModal.classList.remove("show"); });
    if (isIOS())
        setTimeout(show, 2000);
    window.addEventListener("appinstalled", hide);
}

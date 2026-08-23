"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISSED_KEY = "voxbil-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    if (isIos()) {
      // iOS Safari never fires beforeinstallprompt — show our own button
      // that explains the manual Share > Add to Home Screen steps.
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleClick() {
    if (isIos()) {
      setShowIosHelp(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-gray-900 text-white pl-4 pr-2 py-2.5 rounded-full shadow-lg">
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Download size={16} />
          Add to Home Screen
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 rounded-full hover:bg-white/10 text-white/70"
        >
          <X size={14} />
        </button>
      </div>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="bg-white w-full sm:max-w-sm sm:rounded-lg rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-3">Add Voxbil to your Home Screen</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                  1
                </span>
                <span className="flex items-center gap-1">
                  Tap the Share button <Share size={14} className="inline" /> in Safari's toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                  2
                </span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                  3
                </span>
                <span>Tap <strong>Add</strong> in the top right corner.</span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => {
                setShowIosHelp(false);
                dismiss();
              }}
              className="mt-5 w-full bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

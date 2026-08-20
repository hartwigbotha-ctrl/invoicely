"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a progressive enhancement — if this fails
        // (e.g. unsupported browser) the app still works fine.
      });
    }
  }, []);

  return null;
}

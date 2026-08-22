// Simple in-memory rate limiter for login attempts.
//
// This is process-local: fine for a single Railway instance (this app's
// current deployment), but would not share state across multiple instances
// if the app is ever scaled horizontally. If that happens, swap the Map
// below for a Redis/DB-backed counter — the checkRateLimit/recordFailedAttempt
// interface can stay the same.

type Bucket = {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // failed attempts are counted within this rolling window
const MAX_ATTEMPTS = 5; // after this many failures in the window, lock out
const LOCKOUT_MS = 15 * 60 * 1000; // how long a lockout lasts

// Periodically forget buckets that are old and not locked, so this Map
// doesn't grow forever on a long-running server.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) {
    const stillLocked = (b.lockedUntil ?? 0) > now;
    const withinWindow = now - b.firstAttempt < WINDOW_MS;
    if (!stillLocked && !withinWindow) buckets.delete(key);
  }
}, 10 * 60 * 1000);
cleanupTimer.unref?.();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (b?.lockedUntil && b.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((b.lockedUntil - now) / 1000) };
  }
  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.firstAttempt > WINDOW_MS) {
    b = { count: 0, firstAttempt: now };
  }
  b.count += 1;
  if (b.count >= MAX_ATTEMPTS) {
    b.lockedUntil = now + LOCKOUT_MS;
  }
  buckets.set(key, b);
}

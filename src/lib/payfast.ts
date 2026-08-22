import crypto from "crypto";

// PayFast integration for Invoicely's OWN subscription billing (what
// contractors pay us each month) — not to be confused with anything a
// business might one day want for collecting payment on their client
// invoices, which is a separate, unrelated feature.
//
// PayFast provides public sandbox test credentials that work without
// signing up for an account, so we can build and test the whole flow
// before Hartwig registers a real PayFast merchant account. Only the
// final go-live step needs real credentials (PAYFAST_MERCHANT_ID /
// PAYFAST_MERCHANT_KEY / PAYFAST_PASSPHRASE env vars on Railway).
const SANDBOX_MERCHANT_ID = "10000100";
const SANDBOX_MERCHANT_KEY = "46f0cd694581a";

function isSandbox() {
  // Defaults to sandbox unless explicitly told this is a live deployment,
  // so a fresh Railway deploy with no PayFast env vars set is safe by
  // default (test payments only) rather than silently doing nothing or
  // erroring — same reasoning as the mailer's dev fallback.
  return (process.env.PAYFAST_MODE || "sandbox").toLowerCase() !== "live";
}

function getMerchantId() {
  return process.env.PAYFAST_MERCHANT_ID || SANDBOX_MERCHANT_ID;
}

function getMerchantKey() {
  return process.env.PAYFAST_MERCHANT_KEY || SANDBOX_MERCHANT_KEY;
}

function getPassphrase() {
  // The sandbox test account has no passphrase configured; a live merchant
  // account should always have one set (PayFast strongly recommends it —
  // without it, ITN signatures are far easier to forge).
  return process.env.PAYFAST_PASSPHRASE || "";
}

export function getAppUrl(): string {
  return (process.env.APP_URL || "https://invoicely-production-cc8b.up.railway.app").replace(/\/$/, "");
}

function pfEncode(value: string): string {
  // PayFast's signature spec matches PHP's urlencode(): spaces become "+"
  // rather than "%20". encodeURIComponent already agrees with PHP on
  // everything else that matters here (uppercase hex escapes, unreserved
  // characters left alone).
  return encodeURIComponent(value).replace(/%20/g, "+");
}

/** Encodes fields into a PayFast-style "key=value&key=value" string, in
 * insertion order, using pfEncode — the same encoder used everywhere else
 * PayFast field values get put on the wire (query string or signature
 * base), so nothing can silently disagree with itself. Never includes the
 * passphrase — that's only ever mixed into the signature hash, never sent
 * as an actual field. */
function encodeFields(fields: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${key}=${pfEncode(String(value))}`);
  }
  return parts.join("&");
}

/** Builds the exact string PayFast expects to hash: encoded fields in
 * insertion order, with the passphrase appended last if one is set. This
 * is ONLY for computing/verifying the signature — never send this string
 * itself as the request body/query, since it would leak the passphrase. */
function buildSignatureBase(fields: Record<string, string>): string {
  let base = encodeFields(fields);
  const passphrase = getPassphrase();
  if (passphrase) {
    base += `&passphrase=${pfEncode(passphrase)}`;
  }
  return base;
}

function signFields(fields: Record<string, string>): string {
  return crypto.createHash("md5").update(buildSignatureBase(fields)).digest("hex");
}

export type SubscribeCheckoutArgs = {
  businessId: string;
  businessEmail: string;
  businessName: string;
  planName: string;
  amountMonthly: number;
  checkoutReference: string; // our subscriptions.checkoutReference — becomes m_payment_id
};

/** Builds the full PayFast "subscribe" redirect URL (GET query string —
 * PayFast accepts either a form POST or a signed query string; a query
 * string redirect is simplest from a Server Action). */
export function buildSubscribeUrl(args: SubscribeCheckoutArgs): string {
  const appUrl = getAppUrl();
  const amount = args.amountMonthly.toFixed(2);

  // Field order matters for the signature — it must match insertion order,
  // and PayFast's own docs list fields in roughly this order.
  const fields: Record<string, string> = {
    merchant_id: getMerchantId(),
    merchant_key: getMerchantKey(),
    return_url: `${appUrl}/billing/success`,
    cancel_url: `${appUrl}/billing/cancel`,
    notify_url: `${appUrl}/api/webhooks/payfast`,
    email_address: args.businessEmail,
    m_payment_id: args.checkoutReference,
    amount,
    item_name: `Invoicely ${args.planName} plan`,
    item_description: `Monthly Invoicely subscription — ${args.planName} plan`,
    custom_str1: args.businessId,
    custom_str2: args.planName,
    subscription_type: "1",
    billing_date: new Date().toISOString().slice(0, 10),
    recurring_amount: amount,
    frequency: "3", // monthly
    cycles: "0", // until cancelled
  };

  const signature = signFields(fields);
  // Build the query string with the same pfEncode used for the signature —
  // NOT URLSearchParams's built-in serializer, which encodes some
  // characters (e.g. ! ' ( ) *) differently than PHP's urlencode()/
  // PayFast's scheme. That encoder mismatch is exactly what caused a real
  // "signature does not match" error from PayFast in testing, even though
  // the signature math itself was correct. encodeFields() never includes
  // the passphrase itself (only buildSignatureBase does, for hashing).
  const query = encodeFields(fields) + `&signature=${signature}`;
  const base = isSandbox() ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process";
  return `${base}?${query}`;
}

/** Verifies an incoming ITN's signature against our own recomputed one.
 * PayFast sends `signature` as the last field; every other field
 * (in the order PayFast sent them) is used to recompute it. */
export function verifyItnSignature(fields: Record<string, string>): boolean {
  const { signature, ...rest } = fields;
  if (!signature) return false;
  return signFields(rest) === signature;
}

/** Server-to-server postback validation, as PayFast's ITN guide requires:
 * echo the exact received data back to PayFast and confirm it responds
 * "VALID". This catches spoofed requests that happen to have a correct
 * signature computed from a leaked/guessed passphrase, and is PayFast's
 * primary recommended defense (source-IP checking is the secondary one). */
export async function verifyItnWithPayfast(rawBody: string): Promise<boolean> {
  const base = isSandbox()
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    return text.trim() === "VALID";
  } catch (err) {
    console.error("[payfast] postback validation request failed", err);
    return false;
  }
}

// ---------- PayFast REST API (for cancelling a recurring subscription) ----------
// The checkout/ITN signature above uses insertion order; the REST API uses
// a different scheme — headers signed in alphabetical order. Both are per
// PayFast's own docs, they're just genuinely different endpoints with
// different rules.
function buildApiHeaders(): Record<string, string> {
  const merchantId = getMerchantId();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const passphrase = getPassphrase();

  const headerFields: Record<string, string> = {
    "merchant-id": merchantId,
    version: "v1",
    timestamp,
  };
  const sortedKeys = Object.keys(headerFields).sort();
  let base = sortedKeys.map((k) => `${k}=${pfEncode(headerFields[k])}`).join("&");
  if (passphrase) base += `&passphrase=${pfEncode(passphrase)}`;
  const signature = crypto.createHash("md5").update(base).digest("hex");

  return { ...headerFields, signature };
}

/** Cancels a PayFast recurring subscription by its token. Returns true on
 * success. Always test against the sandbox before relying on this in
 * production — PayFast's REST API auth is separate from the ITN signature
 * above and is worth confirming end-to-end. */
export async function cancelPayfastSubscription(token: string): Promise<boolean> {
  const base = isSandbox() ? "https://api.payfast.co.za" : "https://api.payfast.co.za";
  const url = `${base}/subscriptions/${encodeURIComponent(token)}/cancel${isSandbox() ? "?testing=true" : ""}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: buildApiHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[payfast] cancel subscription failed ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[payfast] cancel subscription request failed", err);
    return false;
  }
}

export { isSandbox as payfastIsSandbox };

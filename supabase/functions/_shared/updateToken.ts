// Short-lived HMAC token for the public profile-update flow.
// Payload = base64url(JSON({ pid, exp })); Signature = base64url(HMAC-SHA256(payload, secret)).

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function getSecret(): string {
  return Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "profile-update-fallback";
}

async function hmac(payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return new Uint8Array(sig);
}

export async function signUpdateToken(profileId: string, ttlSeconds = 20 * 60): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ pid: profileId, exp })));
  const sig = toBase64Url(await hmac(payload));
  return `${payload}.${sig}`;
}

export async function verifyUpdateToken(token: string): Promise<{ pid: string } | null> {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = toBase64Url(await hmac(payload));
    if (expected !== sig) return null;
    const json = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (!json?.pid || !json?.exp) return null;
    if (Math.floor(Date.now() / 1000) > json.exp) return null;
    return { pid: String(json.pid) };
  } catch {
    return null;
  }
}

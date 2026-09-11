const PIN_KEY = "openwall-parent-pin-v1";
const UNLOCK_KEY = "openwall-parent-unlock-v1";
const UNLOCK_MS = 15 * 60 * 1000;

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hasParentPin() {
  try { return Boolean(localStorage.getItem(PIN_KEY)); } catch { return false; }
}

export async function setParentPin(pin: string) {
  const normalized = pin.trim();
  if (!/^\d{4,6}$/.test(normalized)) throw new Error("PIN must be 4 to 6 digits.");
  localStorage.setItem(PIN_KEY, await digest(normalized));
  lockParentMode();
}

export async function unlockParentMode(pin: string) {
  const saved = localStorage.getItem(PIN_KEY);
  if (!saved || (await digest(pin.trim())) !== saved) return false;
  localStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_MS));
  return true;
}

export function isParentUnlocked() {
  try { return Number(localStorage.getItem(UNLOCK_KEY)) > Date.now(); } catch { return false; }
}

export function lockParentMode() {
  try { localStorage.removeItem(UNLOCK_KEY); } catch { /* device storage unavailable */ }
}

export function clearParentPin() {
  try { localStorage.removeItem(PIN_KEY); localStorage.removeItem(UNLOCK_KEY); } catch { /* device storage unavailable */ }
}

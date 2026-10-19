/**
 * Invite links look like https://<app>/join/AB7K2P.
 * The code is remembered for this browser tab so it survives the Google sign-in step,
 * then cleared once the person has joined (or dismissed it).
 */
const STORAGE_KEY = 'vk.pendingInvite';
const JOIN_PATH = /^\/join\/([A-Za-z0-9]{6})\/?$/;

export function readPendingInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(JOIN_PATH);
  if (match) {
    const code = match[1].toUpperCase();
    try {
      sessionStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage unavailable — the URL still carries the code */
    }
    return code;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInviteCode(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && JOIN_PATH.test(window.location.pathname)) {
    window.history.replaceState(null, '', '/');
  }
}

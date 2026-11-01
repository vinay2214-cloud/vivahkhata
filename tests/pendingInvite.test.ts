// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { clearPendingInviteCode, readPendingInviteCode } from '../src/lib/pendingInvite';
import { generateNameKey } from '../src/lib/names';

describe('invite links (/join/CODE)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('reads and remembers the code from the link so it survives Google sign-in', () => {
    window.history.replaceState(null, '', '/join/ab7k2p');
    expect(readPendingInviteCode()).toBe('AB7K2P');

    window.history.replaceState(null, '', '/'); // after the sign-in redirect
    expect(readPendingInviteCode()).toBe('AB7K2P');
  });

  it('ignores malformed links', () => {
    window.history.replaceState(null, '', '/join/AB<script>');
    expect(readPendingInviteCode()).toBeNull();
  });

  it('clears the code and tidies the address bar after joining', () => {
    window.history.replaceState(null, '', '/join/AB7K2P');
    readPendingInviteCode();
    clearPendingInviteCode();
    expect(readPendingInviteCode()).toBeNull();
    expect(window.location.pathname).toBe('/');
  });
});

describe('gift-giver name keys', () => {
  it('normalises spacing and case so duplicates are caught', () => {
    expect(generateNameKey('  Ramesh   GARU ')).toBe('ramesh garu');
  });
});

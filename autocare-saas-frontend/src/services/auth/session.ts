import type { AuthSession } from '@/types';
const SESSION_KEY = 'autocare.session';
export const sessionStore = { get(): AuthSession | null { if (typeof window === 'undefined') return null; const value = window.localStorage.getItem(SESSION_KEY); try { return value ? (JSON.parse(value) as AuthSession) : null; } catch { this.clear(); return null; } }, set(session: AuthSession): void { window.localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }, clear(): void { window.localStorage.removeItem(SESSION_KEY); } };

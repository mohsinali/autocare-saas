import { api } from '../api/client'; import type { AuthSession } from '@/types';
export interface LoginPayload { tenantSlug: string; email: string; password: string; }
export const authService = { async login(payload: LoginPayload): Promise<AuthSession> { return (await api.post<AuthSession>('/auth/login', payload)).data; } };

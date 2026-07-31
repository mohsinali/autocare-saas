import { UserRole } from '@prisma/client';
export interface AuthenticatedUser { id: string; tenantId: string; email: string; role: UserRole; }
export interface JwtPayload extends AuthenticatedUser { sub: string; }

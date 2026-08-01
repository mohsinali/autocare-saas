import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './auth.types';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}
  async register(dto: RegisterDto): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (existing) throw new ConflictException('Tenant slug is already in use');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({ data: { email: dto.email.toLowerCase(), passwordHash, firstName: dto.firstName, lastName: dto.lastName, tenant: { create: { name: dto.tenantName, slug: dto.tenantSlug, timezone: dto.timezone ?? 'UTC' } } } });
    return this.createSession(user);
  }
  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase(), tenant: { slug: dto.tenantSlug } } });
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.createSession(user);
  }
  private createSession(user: { id: string; tenantId: string; email: string; role: AuthenticatedUser['role'] }): { accessToken: string; user: AuthenticatedUser } {
    const principal: AuthenticatedUser = { id: user.id, tenantId: user.tenantId, email: user.email, role: user.role };
    return { user: principal, accessToken: this.jwt.sign({ sub: user.id, tenantId: user.tenantId, email: user.email, role: user.role }, { expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN') as never }) };
  }
}

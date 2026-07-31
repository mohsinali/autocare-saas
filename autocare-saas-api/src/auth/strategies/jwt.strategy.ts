import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, AuthenticatedUser } from '../auth.types';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.getOrThrow<string>('JWT_SECRET') }); }
  validate(payload: JwtPayload): AuthenticatedUser { if (!payload.sub || !payload.tenantId) throw new UnauthorizedException(); return { id: payload.sub, tenantId: payload.tenantId, email: payload.email, role: payload.role }; }
}

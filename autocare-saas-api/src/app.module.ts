import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServiceHistoryModule } from './service-history/service-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: Joi.object({ NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'), PORT: Joi.number().port().default(3000), DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(), JWT_SECRET: Joi.string().min(32).required(), JWT_EXPIRES_IN: Joi.string().default('15m'), LOG_LEVEL: Joi.string().default('info'), CORS_ORIGIN: Joi.string().optional() }) }),
    PrismaModule, AuthModule, CustomersModule, ServiceHistoryModule,
  ],
})
export class AppModule {}

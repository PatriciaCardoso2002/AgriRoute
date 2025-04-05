import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'src/clients/entities/client.entity';
import { ApiKeyStrategy } from './api-key.strategy';
import { ClientsService } from 'src/clients/clients.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'apiKey' }),
    TypeOrmModule.forFeature([Client]),
  ],
  providers: [AuthService, ApiKeyStrategy, ClientsService],
})
export class AuthModule {}

import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(private readonly authService: AuthService) {
    super({ header: 'api-key', prefix: '' }, false);
  }

  async validate(apiKey: string, done: (error: any, user?: any) => void) {
    console.log('🔐 ApiKeyStrategy called with key:', apiKey);  // <-- linha nova
  
    const isValid = await this.authService.validateApiKey(apiKey);
    if (!isValid) {
      return done(new UnauthorizedException('Invalid API key'), false);
    }
    return done(null, true);
  }
}
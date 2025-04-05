import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsModule } from './bookings/bookings.module';
// import { join } from 'path';
import { ClientsModule } from './clients/clients.module';
import { Client } from './clients/entities/client.entity';
import { Booking } from './bookings/entities/booking.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        logging: true,
        synchronize: true, // ?? 
        entities: [Client, Booking],
        // entities: [join(process.cwd(), 'dist/**/*.entity.js')],
      })

    }),
    BookingsModule,
    ClientsModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

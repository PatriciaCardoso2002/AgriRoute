import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BookingsModule } from './bookings/bookings.module';
import { ClientsModule } from './clients/clients.module';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const config = new DocumentBuilder()
    .setTitle('Booking Backend API')
    .setDescription('Documentação da API')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'Api-Key', in: 'header' }, 'Api-Key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);



  // Swagger configuration for Bookings API
  const bookingConfig = new DocumentBuilder()
    .setTitle('Booking API')
    .setDescription(
      'The booking API allows users to manage all the bookings for a given client using their api-key.',
    )
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'Api-Key', in: 'header' }, 'Api-Key')
    .build();

  const bookingDocument = SwaggerModule.createDocument(app, bookingConfig, {
    include: [BookingsModule],
  });



  // Swagger configuration for Clients API
  const clientConfig = new DocumentBuilder()
    .setTitle('Clients API')
    .setDescription(
      'The clients API allows managing all clients using the bookings service.',
    )
    .setVersion('1.0')
    .build();

  const clientDocument = SwaggerModule.createDocument(app, clientConfig, {
    include: [ClientsModule],
  });


  
  // Documentação separada por módulo
  SwaggerModule.setup('api/bookings', app, bookingDocument);
  SwaggerModule.setup('api/clients', app, clientDocument);

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

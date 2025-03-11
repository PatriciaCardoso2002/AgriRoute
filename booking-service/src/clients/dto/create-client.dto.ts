import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ default: 'Client name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

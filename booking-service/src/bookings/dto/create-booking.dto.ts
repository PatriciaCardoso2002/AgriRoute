import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiPropertyOptional({ default: 'The uuid of the booking' })
  @IsUUID()
  @IsOptional()
  bookingId: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'The date and time (ISO 8601 format) of the booking',
  })
  datetime: Date;

  @ApiProperty({ description: 'The duration (in seconds) of the booking' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ default: 'The description of the booking' })
  @IsString()
  description: string;
}


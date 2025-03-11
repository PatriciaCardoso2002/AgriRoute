import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Version } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';


@ApiSecurity('Api-Key')
@ApiTags('Booking')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private getApiKey(request: Request): string {
    const apikey = request.headers['api-key'];
    return Array.isArray(apikey) ? apikey.join(',') : apikey;
  }

  @Post()
  @Version('1')
  @UseGuards(AuthGuard('headerapikey'))
  @ApiOperation({
    summary: 'Add a new booking',
    description: 'Create a new booking',
  })
  @ApiResponse({
    status: 201,
    description: 'The booking has been successfully booked.',
    type: CreateBookingDto,
  })
  @ApiResponse({ status: 409, description: ' Scheduling conflict.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid API-KEY.' })
  @ApiBody({ type: CreateBookingDto })
  create(@Req() request: Request, @Body() data: CreateBookingDto) {
    const key = this.getApiKey(request);
    return this.bookingsService.create(key, data);
  }

  @Get()
  @Version('1')
  @UseGuards(AuthGuard('headerapikey'))
  @ApiOperation({
    summary: 'Retrieve bookings based on various criteria',
    description:
      'This endpoint allows retrieving bookings based on different criteria like month, year, date, or datetime range.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid API-KEY.' })
  @ApiQuery({
    name: 'month',
    type: 'number',
    required: false,
    description: 'The month number (1-12) to filter bookings.',
  })
  @ApiQuery({
    name: 'year',
    type: 'number',
    required: false,
    description: 'The year to filter bookings.',
  })
  @ApiQuery({
    name: 'date',
    type: 'string',
    required: false,
    description: 'The specific date (YYYY-MM-DD) to filter bookings.',
  })
  @ApiQuery({
    name: 'start',
    type: 'string',
    required: false,
    description:
      'The start datetime range (ISO 8601 format) to filter bookings.',
  })
  @ApiQuery({
    name: 'end',
    type: 'string',
    required: false,
    description: 'The end datetime range (ISO 8601 format) to filter bookings.',
  })
  findAll(
    @Req() request: Request,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('date') date?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const key = this.getApiKey(request);

    if ((month && year) || month || year) {
      // If month and year query parameters are provided, call a service method to fetch bookings for that month
      return this.bookingsService.findByMonthAndYear(key, month, year);
    } else if (date) {
      // If date query parameter is provided, call a service method to fetch bookings for that specific date
      return this.bookingsService.findByDate(key, date);
    } else if (start && end) {
      // If start and end datetime query parameters are provided, call a service method to fetch bookings within that datetime range
      return this.bookingsService.findByDatetimeRange(key, start, end);
    } else {
      // Otherwise, return all bookings
      return this.bookingsService.findAll(key);
    }
  }

  @Get('checkAvailability')
  @Version('1')
  @UseGuards(AuthGuard('headerapikey'))
  @ApiOperation({
    summary: 'Check if the booking is available',
    description:
      'This endpoint allows determining if a booking is available or not. It returns true if available and false otherwise',
  })
  @ApiQuery({
    name: 'datetime',
    type: 'string',
    required: true,
    description: 'The datetime (ISO 8601 format) of the booking.',
  })
  @ApiQuery({
    name: 'duration',
    type: 'number',
    required: true,
    description: 'The duration of the booking in seconds.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid API-KEY.' })
  checkAvailability(
    @Req() request: Request,
    @Query('datetime') datetime: string,
    @Query('duration') duration: number,
  ) {
    const key = this.getApiKey(request);
    return this.bookingsService.checkAvailability(
      key,
      new Date(datetime),
      duration,
    );
  }

  @Get('free-slots')
  @Version('1')
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid API-KEY.' })
  @UseGuards(AuthGuard('headerapikey'))
  @ApiOperation({
    summary: 'Get free booking slots',
    description:
      'This endpoint allows retrieving free slots based on a start datetime and end datetime.',
  })
  @ApiQuery({
    name: 'start',
    type: 'string',
    description: 'The start datetime range (ISO 8601 format).',
  })
  @ApiQuery({
    name: 'end',
    type: 'string',
    description: 'The end datetime range (ISO 8601 format).',
  })
  findFree(
    @Req() request: Request,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const key = this.getApiKey(request);
    return this.bookingsService.findFreeSlots(key, start, end);
  }

  @Get(':bookingId')
  @Version('1')
  @ApiResponse({ status: 404, description: 'The booking was not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid API-KEY.' })
  @UseGuards(AuthGuard('headerapikey'))
  @ApiOperation({
    summary: 'Get a booking by uuid',
    description:
      'This endpoint returns a booking information by his booking id.',
  })
  findOne(@Req() request: Request, @Param('bookingId') id: string) {
    const key = this.getApiKey(request);
    return this.bookingsService.findOne(key, id);
  }

  @Patch(':bookingId')
  @Version('1')
  @UseGuards(AuthGuard('headerapikey'))
  @ApiOperation({
    summary: 'Edit a booking by uuid',
    description: 'Update an existing booking by Id',
  })
  @ApiResponse({
    status: 200,
    description: 'The booking has been successfully edited.',
    type: CreateBookingDto,
  })
  @ApiResponse({ status: 409, description: ' Scheduling conflict.' })
  @ApiResponse({ status: 404, description: 'The booking id does not exist.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid API-KEY.' })
  update(
    @Req() request: Request,
    @Param('bookingId') id: string,
    @Body() data: UpdateBookingDto,
  ) {
    const key = this.getApiKey(request);
    return this.bookingsService.update(key, id, data);
  }

  @Delete(':bookingId')
  @Version('1')
  @ApiResponse({
    status: 200,
    description: 'Booking was deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'The booking id does not exist.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid API-KEY.' })
  @UseGuards(AuthGuard('headerapikey'))
  @ApiOperation({
    summary: 'Remove a booking by uuid',
    description: 'This endpoint removes a booking by his booking id.',
  })
  remove(@Req() request: Request, @Param('bookingId') id: string) {
    const key = this.getApiKey(request);
    return this.bookingsService.remove(key, id);
  }
}
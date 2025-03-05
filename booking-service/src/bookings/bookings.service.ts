import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    // private readonly clientsService: ClientsService,
  ) {}

  async create(createBookingDto: CreateBookingDto) { // (key: string, data: CreateBookingDto) {
    // const { bookingId, datetime, duration, description } = data;
    const booking = this.bookingRepository.create(createBookingDto);
    return await this.bookingRepository.save(booking);
  }

  async findAll() {
    return await this.bookingRepository.find();
  }

  async findOne(id: string) {
    return await this.bookingRepository.findOne({ where: { id } });
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {

    const booking = await this.findOne(id) ;
    if(!booking) {
      throw new NotFoundException();
    }

    Object.assign(booking, updateBookingDto);

    return await this.bookingRepository.save(booking);
  }

  async remove(id: string) {

    const booking = await this.findOne(id) ;
    if(!booking) {
      throw new NotFoundException();
    }
    return await this.bookingRepository.remove(booking);
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { generateApiKey } from '../../utils/generateApiKey';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';


@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(data: CreateClientDto): Promise<any> {
    const name = data.name;
    const apikey = generateApiKey();

    try {
      const client = this.clientRepository.create({ name, apikey });
      await this.clientRepository.save(client);

      return { apikey: apikey };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Sorry, something went wrong',
      };
    }
  }

  async findAll(): Promise<any> {
    try {
      const clients = this.clientRepository.find();
      return clients;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Sorry, something went wrong',
      };
    }
  }

  async findOne(id: string): Promise<any> {
    // Find Client
    try {
      const isClientExists = await this.clientRepository.find({
        where: { id: id },
      });

      if (isClientExists.length !== 0) {
        return isClientExists;
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Sorry, client id requested doesnt exist.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Sorry, something went wrong',
      };
    }
  }

  async findByKey(apiKey: string): Promise<any> {
    // Find Client
    try {
      const isClientExists = await this.clientRepository.findOne({
        where: { apikey: apiKey },
      });

      if (isClientExists) {
        return isClientExists;
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Sorry, apikey requested doesnt exist.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Sorry, something went wrong',
      };
    }
  }

  async update(id: string, data: UpdateClientDto) {
    try {
      const isClientExists = await this.clientRepository.find({
        where: { id: id },
      });

      if (isClientExists.length !== 0) {
        await this.clientRepository.update(id, data);
        return {
          statusCode: HttpStatus.OK,
          message: 'Client updated!',
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Sorry, client id requested doesnt exist.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Sorry, something went wrong',
      };
    }
  }

  async remove(id: string) {
    try {
      const isClientExists = await this.clientRepository.find({
        where: { id: id },
      });

      if (isClientExists.length !== 0) {
        // check if there inst any bookings from this id
        const isBookingExists = await this.clientRepository.find({
          relations: ['booking'],
          where: { id: id },
        });

        const bookingFound = isBookingExists[0].booking.length !== 0;

        if (bookingFound) {
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'Sorry, this client still has bookings.',
          };
        } else {
          await this.clientRepository.delete(id);
          return {
            statusCode: HttpStatus.OK,
            message: 'Client deleted!',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Sorry, client id requested doesnt exist.',
        };
      }
    } catch (error) {
      console.log(error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Sorry, something went wrong',
      };
    }
  }
}

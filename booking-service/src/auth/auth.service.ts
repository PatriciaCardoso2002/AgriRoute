import { Injectable } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class AuthService {
  constructor(private readonly clientsService: ClientsService) {}

  // Check if the api-key exists for a specific client
  async validateApiKey(apiKey: string): Promise<boolean> {
    //validateApiKey(apiKey: string): boolean {
    // console.log('\nAuth Service: ');
    // console.log('apiKey: ' + apiKey);
    // console.log('Auth - Validating api-key...');

    const clientExists = await this.clientsService.findByKey(apiKey);
    //console.log('Auth Service !!!!');
    //console.log(clientExists);
    let status404 = clientExists.statusCode === 404;
    //console.log(status404);
    if (!status404) {
      console.log('Valid !! ');
      return true;
    }

    return false;
  }
}
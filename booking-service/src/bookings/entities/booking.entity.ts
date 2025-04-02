import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Client } from 'src/clients/entities/client.entity';

@Entity({name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  datetime: Date;

  @Column({ type: 'int' })
  duration: number; //  seconds

  @Column({ type: 'varchar', length: 500})
  description: string;

  @ManyToOne(() => Client, (client) => client.booking)
  @JoinColumn({ name: 'clientId' })
  client: Client;
}

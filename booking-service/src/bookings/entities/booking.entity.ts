import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  datetime: Date;

  @Column({ type: 'int' })
  duration: number; //  seconds

  @Column({ type: 'varchar', length: 50 })
  description: string;

//   @ManyToOne(() => Client, (client) => client.booking)
//   @JoinColumn({ name: 'clientId' })
//   client: Client;
}

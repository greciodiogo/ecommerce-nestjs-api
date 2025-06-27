import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  slug?: string;

  @Column({ default: true })
  visible: boolean;

  @Column({ type: 'double precision', nullable: true })
  price?: number;

  @ManyToOne(() => Address, (address) => address.childAddresses, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  parentAddress?: Address;

  @OneToMany(() => Address, (address) => address.parentAddress, {
    onDelete: 'SET NULL',
  })
  childAddresses: Address[];
} 
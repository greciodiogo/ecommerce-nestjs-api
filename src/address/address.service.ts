import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './models/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { NotFoundError } from '../errors/not-found.error';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async getAddresses(): Promise<Address[]> {
    return this.addressRepository.find({
      relations: ['parentAddress'],
    });
  }

  async getAddress(id: number, children = true): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['parentAddress', ...(children ? ['childAddresses'] : [])],
    });
    if (!address) {
      throw new NotFoundError('address', 'id', id.toString());
    }
    return address;
  }

  async getAddressBySlug(slug: string, children = true): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { slug },
      relations: ['parentAddress', ...(children ? ['childAddresses'] : [])],
    });
    if (!address) {
      throw new NotFoundError('address', 'slug', slug);
    }
    return address;
  }

  async createAddress(addressData: CreateAddressDto): Promise<Address> {
    const address = new Address();
    Object.assign(address, addressData);
    if (addressData.parentAddressId) {
      await this.updateParentAddress(address, addressData.parentAddressId);
    }
    return this.addressRepository.save(address);
  }

  async updateAddress(
    id: number,
    addressData: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.getAddress(id, false);
    Object.assign(address, addressData);
    if (addressData.parentAddressId) {
      await this.updateParentAddress(address, addressData.parentAddressId);
    }
    return this.addressRepository.save(address);
  }

  private async updateParentAddress(
    address: Address,
    parentAddressId: number,
  ): Promise<boolean> {
    address.parentAddress = await this.getAddress(parentAddressId, false);
    return true;
  }

  async deleteAddress(id: number): Promise<boolean> {
    await this.getAddress(id, false);
    await this.addressRepository.delete({ id });
    return true;
  }
} 
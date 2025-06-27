import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Not, Repository } from 'typeorm';
import { User } from './models/user.entity';
import { UserUpdateDto } from './dto/user-update.dto';
import { NotFoundError } from '../errors/not-found.error';
import { ConflictError } from '../errors/conflict.error';
import { Role } from './models/role.enum';
// import { endOfWeek, startOfWeek } from 'src/sales/orders/orders.service';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async addUser(
    email: string,
    hashedPassword: string,
    firstName?: string,
    lastName?: string,
    role?: Role
  ): Promise<User> {
    try {
      const user = new User();
      user.email = email.trim().toLowerCase();
      user.password = hashedPassword;
      user.firstName = firstName;
      user.lastName = lastName;
      user.role = role !== undefined ? role : Role.Customer;
      const savedUser = await this.usersRepository.save(user);
      const { password, ...toReturn } = savedUser;
      return toReturn as User;
    } catch (error) {
      throw new ConflictError('user', 'email', email);
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email: ILike(email) },
    });
  }
  async findUsersByRole(role: Role): Promise<Array<User> | null> {
    return await this.usersRepository.find({
      where: { role },
    });
  }

  async findUserByRole(role: Role): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { role },
    });
  }

  async findUserToLogin(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email: ILike(email) },
      select: {
        password: true,
        firstName: true,
        email: true,
        id: true,
        role: true,
      },
    });
  }

  async findUserToSession(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      select: { email: true, firstName: true, id: true, role: true },
    });
  }

  async getUsers(roleFilter?: 'customers' | 'sales' | 'exclude-customers'): Promise<User[]> {
  const where: any = {};

  if (roleFilter === 'customers') {
    where.role = Role.Customer;
  } else if (roleFilter === 'sales') {
    where.role = Role.Sales;
  } else if (roleFilter === 'exclude-customers') {
    where.role = Not(Role.Customer);
  }

  return await this.usersRepository.find({
    where,
    order: { id: 'DESC' },
  });
}


  async getUser(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError('user', 'id', id.toString());
    }
    return user;
  }

  async updateUser(id: number, update: UserUpdateDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError('user', 'id', id.toString());
    }
    Object.assign(user, update);
    await this.usersRepository.save(user);
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundError('user', 'id', id.toString());
    }
    await this.usersRepository.delete({ id });
    return true;
  }

  async getNewUsersCount(
    period?: 'weekly' | 'monthly' | 'yearly',
  ): Promise<number> {
    const where: any = {};

    if (period) {
      where.registered = this.getDateRange(period);
    }
    return this.usersRepository.count({ where });
  }

  private getDateRange(period: 'weekly' | 'monthly' | 'yearly') {
    const today = new Date();
    if (period === 'weekly') {
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return Between(startOfWeek, endOfWeek);
    }
    if (period === 'monthly') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );
      endOfMonth.setHours(23, 59, 59, 999);
      return Between(startOfMonth, endOfMonth);
    }
    if (period === 'yearly') {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      return Between(startOfYear, endOfYear);
    }
  }
}

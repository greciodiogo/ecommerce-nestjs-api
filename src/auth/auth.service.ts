import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { User } from '../users/models/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../users/models/role.enum';
import { SendVerificationCodeDto } from './dto/verificationCode.dto';
import { CodesService } from './../codes/codes.service';
import { ConflictError } from '../errors/conflict.error';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private codesService: CodesService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.addAdminUser();
  }

  async addAdminUser(): Promise<void> {
    try {
      const user = await this.register({
        email: this.config.get('admin.email', ''),
        password: this.config.get('admin.password', ''),
      });
      await this.usersService.updateUser(user.id, { role: Role.Admin });
    } catch (e) {
      // do nothing
    }
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await argon2.hash(registerDto.password);
    return await this.usersService.addUser(
      registerDto.email,
      hashedPassword,
      registerDto.firstName,
      registerDto.lastName,
      registerDto.role
    );
  }

  async sendVerificationCode(codeDto: SendVerificationCodeDto): Promise<SendVerificationCodeDto> {
    // Check if user already exists
    const existingUser = await this.usersService.findUserByEmail(codeDto.email);
    if (existingUser) {
      throw new ConflictError('user', 'email', codeDto.email);
    }
    return await this.codesService.sendVerificationCode(codeDto.email);
  }

  async verifyCode(codeDto: SendVerificationCodeDto): Promise<SendVerificationCodeDto> {
    return await this.codesService.verifyCode(codeDto.email, codeDto.code);
  }

  async validateUser(loginDto: LoginDto): Promise<User | null> {
    const user = await this.usersService.findUserToLogin(loginDto.email);
    if (!user) {
      return null;
    }
    const passwordMatches = await argon2.verify(
      user.password,
      loginDto.password,
    );
    if (!passwordMatches) {
      return null;
    }
    const { password, ...toReturn } = user;
    return toReturn as User;
  }

  async googleLogin(idToken: string): Promise<User> {
    const client = new OAuth2Client();
    const googleClientId = this.config.get('google.clientId');
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error('No email in Google token');
    }
    let user = await this.usersService.findUserByEmail(payload.email);
    if (!user) {
      // Generate a random password for Google users
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await this.usersService.addUser(
        payload.email,
        await argon2.hash(randomPassword),
        payload.given_name,
        payload.family_name,
        Role.Customer
      );
    }
    return user;
  }
}

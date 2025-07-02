import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/models/user.entity';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { Request, Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  PickType,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { SendVerificationCodeDto } from './dto/verificationCode.dto';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from 'src/users/users.service';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService, 
      private usersService: UsersService) {}

  @Post('register')
  @ApiCreatedResponse({ type: User, description: 'Registered user' })
  @ApiBadRequestResponse({ description: 'Invalid register data' })
  @ApiConflictResponse({ description: 'User with given email already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @Post('send-verification-code')
  @ApiCreatedResponse({ type: SendVerificationCodeDto, description: 'Send Verification Code to User' })
  @ApiBadRequestResponse({ description: 'Invalid Email' })
  @ApiConflictResponse({ description: 'User with given email already exists' })
  async sendVerificationCode(@Body() codeDto: SendVerificationCodeDto): Promise<SendVerificationCodeDto> {
    return this.authService.sendVerificationCode(codeDto);
  }

  @Post('verify-code')
  @ApiCreatedResponse({ type: SendVerificationCodeDto, description: 'Send Verification Code to User' })
  @ApiBadRequestResponse({ description: 'Invalid Email' })
  @ApiConflictResponse({ description: 'User with given email does not exists' })
  async verifyCode(@Body() codeDto: SendVerificationCodeDto): Promise<SendVerificationCodeDto> {
   return this.authService.verifyCode(codeDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    type: PickType(User, ['id', 'firstName', 'email', 'role']),
    description: 'Logged in user',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Req() req: Request,
  ): Promise<Pick<User, 'id' | 'firstName' | 'email' | 'role'>> {
    return new Promise((resolve, reject) => {
      req.login(req.user, (err) => {
        if (err) return reject(err);
        resolve(req.user as User);
      });
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('logout')
  @ApiCreatedResponse({ description: 'User logged out' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  async logout(@Req() req: Request): Promise<void> {
    req.logOut(() => {
      req.session.cookie.maxAge = 0;
    });
  }

  @Post('google')
  async googleLogin(@Body('idToken') idToken: string, @Req() req: Request, @Res() res: Response) {
    try {
      // @ts-ignore: googleLogin is implemented in AuthService
      const user = await this.authService.googleLogin(idToken);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        return res.json({ message: 'Logged in with Google', user });
      });
    } catch (e) {
      return res.status(401).json({ message: 'Invalid Google token', error: e?.message });
    }
  }
}

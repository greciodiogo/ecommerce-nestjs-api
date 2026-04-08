import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'FCM device token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Device name', required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({ 
    description: 'Device type', 
    enum: ['web', 'android', 'ios', 'mobile'],
    default: 'mobile'
  })
  @IsOptional()
  @IsEnum(['web', 'android', 'ios', 'mobile'])
  deviceType?: string;
}

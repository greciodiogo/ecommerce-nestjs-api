import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class AnalyticsQueryDto {
  @ApiProperty({
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.WEEKLY,
    required: false,
  })
  @IsEnum(AnalyticsPeriod)
  @IsOptional()
  period?: AnalyticsPeriod = AnalyticsPeriod.WEEKLY;

  @ApiProperty({
    description: 'Start date (ISO 8601 format)',
    required: false,
    example: '2026-04-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date (ISO 8601 format)',
    required: false,
    example: '2026-05-06',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

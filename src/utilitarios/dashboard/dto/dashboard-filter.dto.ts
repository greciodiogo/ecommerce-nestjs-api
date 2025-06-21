import { IsOptional, IsString, IsIn } from 'class-validator';

export class DashboardFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(['weekly', 'monthly', 'yearly'])
  period?: 'weekly' | 'monthly' | 'yearly';
} 
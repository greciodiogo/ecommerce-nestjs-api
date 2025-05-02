import { ApiProperty } from '@nestjs/swagger';

export class DashboardState {
  @ApiProperty()
  confirmedToday: number;

  @ApiProperty()
  confirmedOrderWeek: number;

  @ApiProperty()
  completedDeliveriesWeek: number;

  @ApiProperty()
  newUsers: number;

  @ApiProperty()
  totalSales: number;

  @ApiProperty()
  lowStockProductsCount: number;
}

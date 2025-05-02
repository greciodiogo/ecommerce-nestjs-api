import { Controller, Get } from '@nestjs/common';
import { DashboardState } from './model/dashboard.model'; // Importando a interface
import { ApiOkResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOkResponse({ type: DashboardState, description: 'Dashboard data' })
  async getDashboard(): Promise<DashboardState> {
    return this.dashboardService.getDashboardData();
  }
}

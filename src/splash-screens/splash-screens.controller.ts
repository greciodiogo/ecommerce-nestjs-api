import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SplashScreensService } from './splash-screens.service';
import { SplashScreenCreateDto } from './dto/splash-screen-create.dto';
import { SplashScreenUpdateDto } from './dto/splash-screen-update.dto';
import { SplashScreen } from './models/splash-screen.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';

@ApiTags('splash-screens')
@Controller('splash-screens')
export class SplashScreensController {
  constructor(private splashScreensService: SplashScreensService) {}

  @Get()
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiOkResponse({ type: [SplashScreen], description: 'List of all splash screens' })
  async findAll() {
    return await this.splashScreensService.findAll();
  }

  @Get('active')
  @ApiOkResponse({ type: [SplashScreen], description: 'List of active splash screens' })
  async findActive() {
    return await this.splashScreensService.findActive();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Splash screen not found' })
  @ApiOkResponse({ type: SplashScreen, description: 'Splash screen with given id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.splashScreensService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiCreatedResponse({ type: SplashScreen, description: 'Splash screen created' })
  @ApiBadRequestResponse({ description: 'Invalid splash screen data' })
  async create(@Body() data: SplashScreenCreateDto) {
    return await this.splashScreensService.create(data);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Splash screen not found' })
  @ApiOkResponse({ type: SplashScreen, description: 'Splash screen updated' })
  @ApiBadRequestResponse({ description: 'Invalid splash screen data' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: SplashScreenUpdateDto,
  ) {
    return await this.splashScreensService.update(id, data);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Splash screen not found' })
  @ApiOkResponse({ description: 'Splash screen deleted' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.splashScreensService.remove(id);
  }

  @Put('reorder')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiOkResponse({ type: [SplashScreen], description: 'Splash screens reordered' })
  async reorder(@Body() body: { ids: number[] }) {
    return await this.splashScreensService.reorder(body.ids);
  }
}

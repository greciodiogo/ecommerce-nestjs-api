import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CodesService } from './codes.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Code } from './models/code.entity';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CodeUpdateDto } from './dto/code-update.dto';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('codes')
@Controller('codes')
@ApiUnauthorizedResponse({ description: 'Code is not logged in' })
export class CodesController {
  constructor(private readonly codesService: CodesService) {}

  @Get()
  // @Roles(Role.Admin)
  @ApiOkResponse({
    type: [Code],
    description: 'List of all codes',
  })
  // @ApiForbiddenResponse({ description: 'Code is not admin' })
  async getCodes(): Promise<Code[]> {
    return this.codesService.getCodes();
  }

  @Get('/:id')
  // @Roles(Role.Admin)
  @ApiOkResponse({
    type: Code,
    description: 'Code with given id',
  })
  // @ApiForbiddenResponse({ description: 'Code is not admin' })
  async getCode(@Param('id') id: number): Promise<Code> {
    return await this.codesService.getCode(id);
  }

  @Patch('/:id')
  // @Roles(Role.Admin)
  @ApiOkResponse({
    type: Code,
    description: 'Code successfully updated',
  })
  // @ApiForbiddenResponse({ description: 'Code is not admin' })
  @ApiNotFoundResponse({ description: 'Code not found' })
  @ApiBadRequestResponse({ description: 'Invalid update data' })
  async updateCode(
    @Param('id') id: number,
    @Body() update: CodeUpdateDto,
  ): Promise<Code> {
    return await this.codesService.updateCode(id, update);
  }

  @Delete('/:id')
  // @Roles(Role.Admin)
  @ApiOkResponse({
    description: 'Code successfully deleted',
  })
  // @ApiForbiddenResponse({ description: 'Code is not admin' })
  @ApiNotFoundResponse({ description: 'Code not found' })
  async deleteCode(@Param('id') id: number): Promise<void> {
    await this.codesService.deleteCode(id);
  }
}

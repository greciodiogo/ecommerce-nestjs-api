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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BannersService } from './banners.service';
import { BannerCreateDto } from './dto/banner-create.dto';
import { BannerUpdateDto } from './dto/banner-update.dto';
import { Banner } from './models/banner.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import { FileDTO } from '../local-files/upload.dto';

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ operationId: 'findAllBanners' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiOkResponse({ type: [Banner], description: 'List of all banners' })
  async findAll() {
    return await this.bannersService.findAll();
  }

  @Get('active')
  @ApiOperation({ operationId: 'findActiveBanners' })
  @ApiOkResponse({ type: [Banner], description: 'List of active banners' })
  async findActive() {
    return await this.bannersService.findActive();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @ApiOperation({ operationId: 'findOneBanner' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Banner not found' })
  @ApiOkResponse({ type: Banner, description: 'Banner with given id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.bannersService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiCreatedResponse({ type: Banner, description: 'Banner created' })
  @ApiBadRequestResponse({ description: 'Invalid banner data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        linkUrl: { type: 'string' },
        order: { type: 'number' },
        isActive: { type: 'boolean' },
        imagePt: { type: 'string', format: 'binary' },
        imageEn: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ operationId: 'createBanner' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imagePt', maxCount: 1 },
        { name: 'imageEn', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async create(
    @Body() data: BannerCreateDto,
    @UploadedFiles()
    files: {
      imagePt?: Express.Multer.File[];
      imageEn?: Express.Multer.File[];
    },
  ) {
    const imagePtFile = files?.imagePt?.[0];
    const imageEnFile = files?.imageEn?.[0];

    const imagePtDTO: FileDTO | undefined = imagePtFile
      ? {
          fieldname: imagePtFile.fieldname,
          originalname: imagePtFile.originalname,
          mimetype: imagePtFile.mimetype,
          buffer: imagePtFile.buffer,
          size: imagePtFile.size,
        }
      : undefined;

    const imageEnDTO: FileDTO | undefined = imageEnFile
      ? {
          fieldname: imageEnFile.fieldname,
          originalname: imageEnFile.originalname,
          mimetype: imageEnFile.mimetype,
          buffer: imageEnFile.buffer,
          size: imageEnFile.size,
        }
      : undefined;

    return await this.bannersService.create(data, imagePtDTO, imageEnDTO);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ operationId: 'updateBanner' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Banner not found' })
  @ApiOkResponse({ type: Banner, description: 'Banner updated' })
  @ApiBadRequestResponse({ description: 'Invalid banner data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        linkUrl: { type: 'string' },
        order: { type: 'number' },
        isActive: { type: 'boolean' },
        imagePt: { type: 'string', format: 'binary' },
        imageEn: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imagePt', maxCount: 1 },
        { name: 'imageEn', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: BannerUpdateDto,
    @UploadedFiles()
    files: {
      imagePt?: Express.Multer.File[];
      imageEn?: Express.Multer.File[];
    },
  ) {
    const imagePtFile = files?.imagePt?.[0];
    const imageEnFile = files?.imageEn?.[0];

    const imagePtDTO: FileDTO | undefined = imagePtFile
      ? {
          fieldname: imagePtFile.fieldname,
          originalname: imagePtFile.originalname,
          mimetype: imagePtFile.mimetype,
          buffer: imagePtFile.buffer,
          size: imagePtFile.size,
        }
      : undefined;

    const imageEnDTO: FileDTO | undefined = imageEnFile
      ? {
          fieldname: imageEnFile.fieldname,
          originalname: imageEnFile.originalname,
          mimetype: imageEnFile.mimetype,
          buffer: imageEnFile.buffer,
          size: imageEnFile.size,
        }
      : undefined;

    return await this.bannersService.update(id, data, imagePtDTO, imageEnDTO);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ operationId: 'removeBanner' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Banner not found' })
  @ApiOkResponse({ description: 'Banner deleted' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.bannersService.remove(id);
  }

  @Patch(':id/toggle')
  @Roles(Role.Admin)
  @ApiOperation({ operationId: 'toggleBannerActive' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Banner not found' })
  @ApiOkResponse({ type: Banner, description: 'Banner status toggled' })
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return await this.bannersService.toggleActive(id);
  }

  @Put('reorder')
  @Roles(Role.Admin)
  @ApiOperation({ operationId: 'reorderBanners' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiOkResponse({ type: [Banner], description: 'Banners reordered' })
  async reorder(@Body() body: { ids: number[] }) {
    return await this.bannersService.reorder(body.ids);
  }

  @Delete(':id/image/:lang')
  @Roles(Role.Admin)
  @ApiOperation({ operationId: 'deleteBannerImage' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Banner not found' })
  @ApiOkResponse({ type: Banner, description: 'Banner image deleted' })
  async deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('lang') lang: 'pt' | 'en',
  ) {
    return await this.bannersService.deleteImage(id, lang);
  }
}

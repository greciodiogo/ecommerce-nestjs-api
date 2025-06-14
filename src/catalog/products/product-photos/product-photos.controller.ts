import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseBoolPipe,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../users/models/role.enum';
import { Product } from '../models/product.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductPhotosService } from './product-photos.service';
import { fileBodySchema } from '../../../local-files/models/file-body.schema';
import { fileResponseSchema } from '../../../local-files/models/file-response.schema';
import { Response } from 'express';
import { FileDTO } from 'src/local-files/upload.dto';
import { memoryStorage } from 'multer';

@ApiTags('products')
@Controller('products/:id')
export class ProductPhotosController {
  constructor(private productPhotosService: ProductPhotosService) { }

  @Get('photos/:photoId')
  @ApiOkResponse({
    schema: fileResponseSchema,
    description: 'Product photo with given id',
  })
  @ApiProduces('image/*')
  @ApiNotFoundResponse({ description: 'Product photo not found' })
  async getProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @Query('thumbnail', ParseBoolPipe) thumbnail: boolean,
    @Res() res: Response
  ) {

    const result = await this.productPhotosService.getProductPhoto(
      id,
      photoId,
      thumbnail,
    );

    const fileBuffer = await result.arrayBuffer();
    const byteArray = new Uint8Array(fileBuffer);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline', // ou remova totalmente
      // 'Content-Disposition': `attachment; filename=${data.path}`,
    });

    res.send(Buffer.from(byteArray));
  }

  @Post('photos')
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiCreatedResponse({ type: Product, description: 'Product photo added' })
  @ApiBody({ schema: fileBodySchema })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // <- GARANTE o buffer disponível
    }),
  )
  async addProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File, // ← Tipo real
  ): Promise<Product> {
    const fileDTO: FileDTO = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    };
    return await this.productPhotosService.addProductPhoto(id, fileDTO);
  }


  @Delete('photos/:photoId')
  // @Roles(Role.Admin, Role.Manager, Role.Sales)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({ type: Product, description: 'Product photo deleted' })
  async deleteProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ): Promise<Product> {
    return await this.productPhotosService.deleteProductPhoto(id, photoId);
  }
}

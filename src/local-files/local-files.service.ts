import { Injectable, StreamableFile } from '@nestjs/common';
import Sharp from 'sharp';
import { SettingsService } from '../settings/settings.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import { FileDTO } from './upload.dto';
import sharp from 'sharp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalFilesService {
  private supabase: SupabaseClient;

  constructor(private settingsService: SettingsService, private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.key')!,
      { auth: { persistSession: false } }
    );
  }

  private getBucket() {
    return process.env.SUPABASE_BUCKET ?? 'uploads';
  }

  async getPhoto(path: string): Promise<Blob | null> {
    const { data, error } = await this.supabase.storage
      .from(this.getBucket())
      .download(path);

    if (error || !data) {
      console.error('Failed to download file:', error?.message);
      return null;
    }

    return data;
  }

  async savePhoto(file: FileDTO): Promise<{ path: string; mimeType: string }> {
    const extension = 'jpg';
    const safeName = file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-');
    const filePath = `uploads/${Date.now()}-${safeName}.${extension}`;

    // Convert to high-quality JPEG
    const jpegBuffer = await sharp(file.buffer)
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 100, mozjpeg: true })
      .rotate() // auto-rotate based on EXIF
      .toBuffer();

    const { error } = await this.supabase.storage
      .from(this.getBucket())
      .upload(filePath, jpegBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return { path: filePath, mimeType: 'image/jpeg' };
  }


  async createPhotoThumbnail(file: FileDTO): Promise<string> {
    const extension = 'jpg'; // Sempre jpg para a thumbnail
    const safeName = file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-');
    const thumbnailPath = `uploads/${Date.now()}-${safeName}-thumbnail.${extension}`;

    const size = Math.abs(
      parseInt(await this.settingsService.getSettingValueByName('Thumbnail size'))
    );

    // Gerar a thumbnail com Sharp diretamente da memória
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(size, size, {
        fit: 'contain',
        background: '#ffffff',
      })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    const { error } = await this.supabase.storage
      .from(this.getBucket())
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Thumbnail upload failed: ${error.message}`);
    }

    return thumbnailPath;
  }


  async createPhotoPlaceholder(file: FileDTO): Promise<string> {
    let extension = file.originalname.split('.').pop();
    const filePath = `originals/${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}.${extension}`;
    const { data, error } = await this.supabase
      .storage
      .from('uploads')
      .download(filePath);

    if (error || !data) throw error;

    const buffer = file.buffer;

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

}

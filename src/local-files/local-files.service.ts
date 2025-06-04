import { Injectable, StreamableFile } from '@nestjs/common';
import Sharp from 'sharp';
import { SettingsService } from '../settings/settings.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;

  constructor(private settingsService: SettingsService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );
  }

  private getBucket() {
    return process.env.SUPABASE_BUCKET ?? 'uploads';
  }

  async getPhoto(path: string): Promise<StreamableFile> {
    const { data, error } = await this.supabase
      .storage
      .from(this.getBucket())
      .download(path);

    if (error || !data) throw new Error('Image not found in Supabase');

    return new StreamableFile(data);
  }

  async savePhoto(file: Express.Multer.File): Promise<{ path: string; mimeType: string }> {
    const convertToJpeg = (await this.settingsService.getSettingValueByName(
      'Convert images to JPEG',
    )) === 'true';

    let buffer = file.buffer ?? (await Sharp(file.path).toBuffer());
    let mimetype = file.mimetype;
    let extension = file.originalname.split('.').pop();

    if (convertToJpeg) {
      buffer = await Sharp(buffer)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 95, mozjpeg: true })
        .toBuffer();
      mimetype = 'image/jpeg';
      extension = 'jpg';
    }

    const filePath = `originals/${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}.${extension}`;

    const { error } = await this.supabase
      .storage
      .from(this.getBucket())
      .upload(filePath, buffer, {
        contentType: mimetype,
      });

    if (error) throw error;

    return { path: filePath, mimeType: mimetype };
  }

  async createPhotoThumbnail(originalPath: string): Promise<string> {
    const size = Math.abs(
      parseInt(await this.settingsService.getSettingValueByName('Thumbnail size')),
    );

    const { data: originalStream, error } = await this.supabase
      .storage
      .from(this.getBucket())
      .download(originalPath);

    if (error || !originalStream) throw error;

    const buffer = await Sharp(await originalStream.arrayBuffer())
      .resize(size, size, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    const thumbnailPath = originalPath.replace('originals/', 'thumbnails/');

    const { error: uploadError } = await this.supabase
      .storage
      .from(this.getBucket())
      .upload(thumbnailPath, buffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;

    return thumbnailPath;
  }

  async createPhotoPlaceholder(originalPath: string): Promise<string> {
    const { data, error } = await this.supabase
      .storage
      .from(this.getBucket())
      .download(originalPath);

    if (error || !data) throw error;

    const buffer = await Sharp(await data.arrayBuffer())
      .resize(12, 12, { fit: 'contain', background: '#ffffff' })
      .toBuffer();

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
}

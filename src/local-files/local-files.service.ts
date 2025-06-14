import { Injectable, StreamableFile } from '@nestjs/common';
import Sharp from 'sharp';
import { SettingsService } from '../settings/settings.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import { FileDTO } from './upload.dto';
import sharp from 'sharp';

@Injectable()
export class LocalFilesService {
  private supabase: SupabaseClient;

  constructor(private settingsService: SettingsService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
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
    const extension = file.originalname.split('.').pop();
    const safeName = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '-');
    const filePath = `uploads/${Date.now()}-${safeName}.${extension}`;

    const uint8Array = new Uint8Array(file.buffer); // <- CONVERSÃO IMPORTANTE

    const { error } = await this.supabase.storage
      .from(this.getBucket())
      .upload(filePath, uint8Array, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return { path: filePath, mimeType: file.mimetype };
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
    const SUPABASE_URL = "https://vpqmfnykuikqgdtihwms.supabase.co"
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcW1mbnlrdWlrcWdkdGlod21zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODg3MDcxNCwiZXhwIjoyMDY0NDQ2NzE0fQ.J9od2wyAFOddI_33YbWuxmTV-YWqO5wq3dU7eaY7D7s"

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
      },
    });


    let extension = file.originalname.split('.').pop();
    const filePath = `originals/${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}.${extension}`;
    const { data, error } = await supabase
      .storage
      .from('uploads')
      .download(filePath);

    if (error || !data) throw error;

    const buffer = file.buffer;

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

}

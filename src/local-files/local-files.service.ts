import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FileDTO } from './upload.dto';
import sharp from 'sharp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalFilesService {
  private supabase: SupabaseClient;
  private logThrottle: Map<string, number> = new Map();
  private readonly LOG_THROTTLE_MS = 5000; // Log same error max once per 5 seconds

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

  private shouldLog(key: string): boolean {
    const now = Date.now();
    const lastLog = this.logThrottle.get(key);
    
    if (!lastLog || now - lastLog > this.LOG_THROTTLE_MS) {
      this.logThrottle.set(key, now);
      return true;
    }
    
    return false;
  }

  async getPhoto(path: string): Promise<Blob | null> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.getBucket())
          .download(path);

        if (error) {
          lastError = error;

          // Don't retry on 404 - file doesn't exist (silent return, no log)
          if (error.message?.toLowerCase().includes('not found') || 
              error.message?.toLowerCase().includes('404')) {
            return null; // Silent return for 404
          }
          
          // Only log non-404 errors if throttle allows
          if (this.shouldLog(`download-error-${path}`)) {
            console.warn(
              `Failed to download file: ${path} (attempt ${attempt}/${maxRetries}): ${error.message}`
            );
          }

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }

        if (!data) {
          if (this.shouldLog(`no-data-${path}`)) {
            console.error(`No data returned for file: ${path}`);
          }
          return null;
        }

        return data;
      } catch (err) {
        lastError = err;
        
        // Only log exceptions if throttle allows
        if (this.shouldLog(`exception-${path}`)) {
          console.error(
            `Exception downloading file: ${path} (attempt ${attempt}/${maxRetries}): ${err instanceof Error ? err.message : String(err)}`
          );
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // Final error log (only if not 404)
    const is404 = lastError?.message?.toLowerCase().includes('not found') || 
                  lastError?.message?.toLowerCase().includes('404');
    
    if (!is404) {
      console.error(
        `Failed to download file after ${maxRetries} attempts: ${path}`,
        lastError instanceof Error ? lastError.message : String(lastError)
      );
    }
    
    return null;
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

import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private isInitialized = false;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Parse Firebase service account from env
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccount) {
        this.logger.warn('FIREBASE_SERVICE_ACCOUNT not configured. Push notifications disabled.');
        return;
      }

      const credentials = JSON.parse(serviceAccount);

      // Initialize Firebase Admin only if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(credentials),
        });
        this.isInitialized = true;
        this.logger.log('Firebase Admin initialized successfully');
      } else {
        this.isInitialized = true;
        this.logger.log('Firebase Admin already initialized');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin:', error.message);
      this.isInitialized = false;
    }
  }

  async sendToDevice(token: string, notification: any): Promise<string | null> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return null;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        id: notification.id?.toString() || '',
        type: notification.type || '',
        relatedEntityId: notification.relatedEntityId?.toString() || '',
        actionUrl: notification.actionUrl || '',
      },
      token,
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent message to device: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Error sending message to device:`, error.message);
      
      // If token is invalid, return error code
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return 'INVALID_TOKEN';
      }
      
      throw error;
    }
  }

  async sendToMultipleDevices(tokens: string[], notification: any): Promise<any> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized. Skipping push notifications.');
      return null;
    }

    if (!tokens || tokens.length === 0) {
      this.logger.warn('No tokens provided for multiple devices');
      return null;
    }

    try {
      // Send to each device individually for better compatibility
      const results = await Promise.allSettled(
        tokens.map(token => this.sendToDevice(token, notification))
      );

      // Count successes and failures
      let successCount = 0;
      let failureCount = 0;
      const responses: any[] = [];

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value && result.value !== 'INVALID_TOKEN') {
          successCount++;
          responses.push({ success: true, messageId: result.value });
        } else {
          failureCount++;
          responses.push({ 
            success: false, 
            error: { 
              message: result.status === 'rejected' ? result.reason : 'Invalid token',
              code: result.status === 'fulfilled' && result.value === 'INVALID_TOKEN' 
                ? 'messaging/invalid-registration-token' 
                : 'unknown'
            }
          });
          
          if (result.status === 'rejected') {
            this.logger.warn(`Failed to send to token ${tokens[idx]}: ${result.reason}`);
          }
        }
      });

      this.logger.log(`Successfully sent ${successCount} of ${tokens.length} messages`);
      
      return {
        successCount,
        failureCount,
        responses
      };
    } catch (error) {
      this.logger.error('Error sending messages to multiple devices:', error.message);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }
}

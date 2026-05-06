import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { AnalyticsQueryDto, AnalyticsPeriod } from './dto/analytics-query.dto';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly packageName = 'co.ao.encontrar_mobile_app';
  private androidPublisher: any;
  private isConfigured = false;

  constructor() {
    this.initializeGooglePlayAPI();
  }

  /**
   * Initialize Google Play Console API
   */
  private async initializeGooglePlayAPI() {
    try {
      const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!keyFile) {
        this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set. Using mock data.');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: auth,
      });

      this.isConfigured = true;
      this.logger.log('Google Play Console API initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Play Console API:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Get app analytics data
   */
  async getAnalytics(query: AnalyticsQueryDto): Promise<AnalyticsResponseDto> {
    if (!this.isConfigured) {
      this.logger.warn('Using mock data - Google Play API not configured');
      return this.getMockAnalytics(query);
    }

    try {
      // Try to fetch real data from Google Play Console
      const realData = await this.getRealAnalytics(query);
      return realData;
    } catch (error) {
      this.logger.error('Failed to fetch real analytics, falling back to mock data:', error.message);
      return this.getMockAnalytics(query);
    }
  }

  /**
   * Fetch real analytics from Google Play Console
   */
  private async getRealAnalytics(query: AnalyticsQueryDto): Promise<AnalyticsResponseDto> {
    this.logger.log('Fetching real analytics from Google Play Console...');

    // Fetch reviews
    const reviewsResponse = await this.androidPublisher.reviews.list({
      packageName: this.packageName,
      maxResults: 100,
    });

    const reviews = reviewsResponse.data.reviews || [];
    
    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    
    reviews.forEach((review: any) => {
      const rating = review.comments?.[0]?.userComment?.starRating || 0;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
        totalRating += rating;
      }
    });

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Format recent reviews
    const recentReviews = reviews.slice(0, 10).map((review: any) => ({
      id: review.reviewId,
      author: review.authorName || 'Anonymous',
      rating: review.comments?.[0]?.userComment?.starRating || 0,
      comment: review.comments?.[0]?.userComment?.text || '',
      date: review.comments?.[0]?.userComment?.lastModified?.seconds 
        ? new Date(review.comments[0].userComment.lastModified.seconds * 1000).toISOString()
        : new Date().toISOString(),
      platform: 'android' as const,
    }));

    // For now, combine real reviews with mock data for other metrics
    // In production, you would fetch these from Firebase Analytics or other sources
    const mockData = this.getMockAnalytics(query);

    return {
      ...mockData,
      overview: {
        ...mockData.overview,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews.length,
      },
      ratings: {
        distribution: ratingDistribution,
        recentReviews,
      },
      dataSource: 'play-console',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Generate mock analytics data
   */
  private getMockAnalytics(query: AnalyticsQueryDto): AnalyticsResponseDto {
    const now = new Date();
    const daysInPeriod = this.getDaysInPeriod(query.period);

    // Generate download data by date
    const downloadsByDate = [];
    for (let i = daysInPeriod - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      downloadsByDate.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 100) + 50, // 50-150 downloads per day
      });
    }

    return {
      overview: {
        totalDownloads: 15420,
        dailyActiveUsers: 3240,
        monthlyActiveUsers: 8950,
        averageRating: 4.6,
        totalReviews: 1250,
        retentionD1: 0.65,
        retentionD7: 0.42,
        retentionD30: 0.28,
        growthPercentage: 12.5,
      },
      downloads: {
        android: 12340,
        ios: 3080,
        byDate: downloadsByDate,
        byCountry: [
          { country: 'Angola', count: 8500 },
          { country: 'Portugal', count: 3200 },
          { country: 'Brasil', count: 2100 },
          { country: 'Moçambique', count: 980 },
          { country: 'Outros', count: 640 },
        ],
      },
      ratings: {
        distribution: {
          5: 850,
          4: 280,
          3: 80,
          2: 25,
          1: 15,
        },
        recentReviews: [
          {
            id: '1',
            author: 'João Silva',
            rating: 5,
            comment: 'Excelente app! Muito fácil de usar.',
            date: new Date(Date.now() - 86400000).toISOString(),
            platform: 'android',
          },
          {
            id: '2',
            author: 'Maria Santos',
            rating: 4,
            comment: 'Bom app, mas poderia ter mais opções de pagamento.',
            date: new Date(Date.now() - 172800000).toISOString(),
            platform: 'android',
          },
          {
            id: '3',
            author: 'Pedro Costa',
            rating: 5,
            comment: 'Entregas rápidas e produtos de qualidade!',
            date: new Date(Date.now() - 259200000).toISOString(),
            platform: 'android',
          },
        ],
      },
      versions: {
        distribution: [
          { version: '1.1.6', percentage: 45.2, count: 6970 },
          { version: '1.1.5', percentage: 32.8, count: 5058 },
          { version: '1.1.4', percentage: 15.3, count: 2359 },
          { version: '1.1.3', percentage: 4.7, count: 725 },
          { version: '1.1.2', percentage: 2.0, count: 308 },
        ],
        latestVersion: '1.1.6',
        updateRate: 45.2,
      },
      dataSource: 'mock',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get number of days for a given period
   */
  private getDaysInPeriod(period: AnalyticsPeriod): number {
    switch (period) {
      case AnalyticsPeriod.DAILY:
        return 1;
      case AnalyticsPeriod.WEEKLY:
        return 7;
      case AnalyticsPeriod.MONTHLY:
        return 30;
      case AnalyticsPeriod.YEARLY:
        return 365;
      default:
        return 7;
    }
  }

  /**
   * Get app reviews from Google Play Console
   */
  async getReviews(maxResults: number = 50): Promise<any[]> {
    if (!this.isConfigured) {
      this.logger.warn('Google Play API not configured');
      return [];
    }

    try {
      const response = await this.androidPublisher.reviews.list({
        packageName: this.packageName,
        maxResults,
      });

      return response.data.reviews || [];
    } catch (error) {
      this.logger.error('Failed to fetch reviews:', error.message);
      return [];
    }
  }

  /**
   * Reply to a review
   */
  async replyToReview(reviewId: string, replyText: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Google Play API not configured');
      return false;
    }

    try {
      await this.androidPublisher.reviews.reply({
        packageName: this.packageName,
        reviewId,
        requestBody: {
          replyText,
        },
      });

      this.logger.log(`Successfully replied to review ${reviewId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to reply to review:', error.message);
      return false;
    }
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class OverviewMetrics {
  @ApiProperty({ description: 'Total downloads (Android + iOS)' })
  totalDownloads: number;

  @ApiProperty({ description: 'Daily active users' })
  dailyActiveUsers: number;

  @ApiProperty({ description: 'Monthly active users' })
  monthlyActiveUsers: number;

  @ApiProperty({ description: 'Average rating (1-5)' })
  averageRating: number;

  @ApiProperty({ description: 'Total number of reviews' })
  totalReviews: number;

  @ApiProperty({ description: 'Day 1 retention rate (0-1)' })
  retentionD1: number;

  @ApiProperty({ description: 'Day 7 retention rate (0-1)' })
  retentionD7: number;

  @ApiProperty({ description: 'Day 30 retention rate (0-1)' })
  retentionD30: number;

  @ApiProperty({ description: 'Growth percentage compared to previous period' })
  growthPercentage: number;
}

export class DownloadMetrics {
  @ApiProperty({ description: 'Android downloads' })
  android: number;

  @ApiProperty({ description: 'iOS downloads' })
  ios: number;

  @ApiProperty({ description: 'Downloads by date', type: [Object] })
  byDate: Array<{ date: string; count: number }>;

  @ApiProperty({ description: 'Downloads by country', type: [Object] })
  byCountry: Array<{ country: string; count: number }>;
}

export class RatingMetrics {
  @ApiProperty({ description: 'Rating distribution (1-5 stars)', type: Object })
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  @ApiProperty({ description: 'Recent reviews', type: [Object] })
  recentReviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
    platform: 'android' | 'ios';
  }>;
}

export class VersionMetrics {
  @ApiProperty({ description: 'Version distribution', type: [Object] })
  distribution: Array<{
    version: string;
    percentage: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Latest version' })
  latestVersion: string;

  @ApiProperty({ description: 'Update rate (percentage of users on latest version)' })
  updateRate: number;
}

export class AnalyticsResponseDto {
  @ApiProperty({ description: 'Overview metrics' })
  overview: OverviewMetrics;

  @ApiProperty({ description: 'Download metrics' })
  downloads: DownloadMetrics;

  @ApiProperty({ description: 'Rating metrics' })
  ratings: RatingMetrics;

  @ApiProperty({ description: 'Version metrics' })
  versions: VersionMetrics;

  @ApiProperty({ description: 'Data source (mock or real)' })
  dataSource: 'mock' | 'play-console' | 'firebase';

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: string;
}

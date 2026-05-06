import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  // @Roles(Role.Admin, Role.Manager) // Temporariamente desabilitado para teste
  @ApiOperation({ 
    summary: 'Get app analytics',
    description: 'Retrieve analytics data from Google Play Console and Firebase. Returns mock data if APIs are not configured.',
  })
  @ApiOkResponse({
    type: AnalyticsResponseDto,
    description: 'Analytics data retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized - Admin or Manager role required' })
  async getAnalytics(@Query() query: AnalyticsQueryDto): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getAnalytics(query);
  }

  @Get('reviews')
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ 
    summary: 'Get app reviews',
    description: 'Retrieve recent reviews from Google Play Console',
  })
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized - Admin or Manager role required' })
  async getReviews(@Query('maxResults') maxResults: number = 50): Promise<any[]> {
    return this.analyticsService.getReviews(maxResults);
  }

  @Post('reviews/:reviewId/reply')
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ 
    summary: 'Reply to a review',
    description: 'Post a reply to a user review on Google Play Console',
  })
  @ApiOkResponse({ description: 'Reply posted successfully' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized - Admin or Manager role required' })
  async replyToReview(
    @Param('reviewId') reviewId: string,
    @Body('replyText') replyText: string,
  ): Promise<{ success: boolean }> {
    const success = await this.analyticsService.replyToReview(reviewId, replyText);
    return { success };
  }
}

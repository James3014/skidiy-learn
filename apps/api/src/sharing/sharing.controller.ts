import { Body, Controller, Patch, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SharingService } from './sharing.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('sharing')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Roles('instructor')
  @Patch('details/:detailId/visibility')
  @ApiOperation({ summary: 'Update share visibility for a lesson record detail' })
  @ApiParam({ name: 'detailId', description: 'Lesson record detail ID' })
  async updateVisibility(
    @Param('detailId') detailId: string,
    @Body('visibility') visibility: 'private' | 'resort' | 'all',
    @CurrentUser('accountId') accountId: string
  ) {
    return this.sharingService.updateShareVisibility(detailId, accountId, visibility);
  }

  @Roles('instructor', 'admin')
  @Get('records')
  @ApiOperation({ summary: 'Query shared teaching records with filters' })
  @ApiQuery({ name: 'resortId', required: false, description: 'Filter by resort ID' })
  @ApiQuery({ name: 'sportType', required: false, enum: ['ski', 'snowboard'], description: 'Filter by sport type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results (default: 20)' })
  async querySharedRecords(
    @Query('resortId') resortId: string | undefined,
    @Query('sportType') sportType: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser('accountId') accountId: string
  ) {
    return this.sharingService.querySharedRecords(accountId, {
      resortId: resortId ? parseInt(resortId) : undefined,
      sportType: sportType as 'ski' | 'snowboard' | undefined,
      limit: limit ? parseInt(limit) : 20
    });
  }
}

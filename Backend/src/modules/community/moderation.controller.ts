import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminGuard, CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { AdminService } from './admin.service';
import { CommunityAccessService } from './community-access.service';
import {
  AccountStatusDto,
  AdminMembersQueryDto,
  AssignModeratorDto,
  AuditQueryDto,
  CategoryDto,
  CommunityAdminDto,
  CreateReportDto,
  ModerateContentDto,
  ReportsQueryDto,
  ResolveReportDto,
  RoleDto,
  VerificationDecisionDto,
} from './community.dto';
import { Community, CommunityMembership } from './community.entities';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ModerationService } from './moderation.service';

/** Signalements (tout membre) et file de modération (modérateurs de communauté, administrateurs). */
@Controller('community')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly access: CommunityAccessService,
    @InjectRepository(Community) private readonly communities: Repository<Community>,
    @InjectRepository(CommunityMembership) private readonly memberships: Repository<CommunityMembership>,
  ) {}

  @Post('reports')
  report(@CurrentUser() user: User, @Body() dto: CreateReportDto) {
    return this.moderation.report(user, dto);
  }

  /** Rôles de modération du membre (affichage des espaces Modération / Administration). */
  @Get('moderation/summary')
  async summary(@CurrentUser() user: User) {
    const moderated = await this.access.moderatedCommunityIds(user);
    const ids = moderated === 'all' ? [] : moderated;
    const communities =
      moderated === 'all'
        ? await this.communities.find({ order: { name: 'ASC' } })
        : ids.length
          ? await this.communities.find({ where: { id: In(ids) }, order: { name: 'ASC' } })
          : [];
    const pendingRequests = communities.length
      ? await this.memberships.count({ where: { community: { id: In(communities.map((c) => c.id)) }, status: 'pending' } })
      : 0;
    return {
      isAdmin: moderated === 'all',
      isModerator: moderated === 'all' || ids.length > 0,
      communities: communities.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
      pendingRequests,
    };
  }

  @Get('moderation/reports')
  queue(@CurrentUser() user: User, @Query() query: ReportsQueryDto) {
    return this.moderation.queue(user, query);
  }

  @Post('moderation/reports/:id/resolve')
  @HttpCode(200)
  resolve(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveReportDto) {
    return this.moderation.resolve(user, id, dto);
  }

  @Post('moderation/content')
  @HttpCode(200)
  moderate(@CurrentUser() user: User, @Body() dto: ModerateContentDto) {
    return this.moderation.moderateContent(user, dto);
  }
}

/** Administration de QIAO Community (rôle administrateur, vérifié côté serveur). */
@Controller('community/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('categories')
  categories() {
    return this.admin.categories();
  }

  @Put('categories/:kind')
  saveCategory(@CurrentUser() user: User, @Param('kind') kind: string, @Body() dto: CategoryDto) {
    return this.admin.saveCategory(user, kind === 'professional' ? 'professional' : 'community', dto);
  }

  @Delete('categories/:kind/:id')
  deleteCategory(@CurrentUser() user: User, @Param('kind') kind: string, @Param('id') id: string) {
    return this.admin.deleteCategory(user, kind === 'professional' ? 'professional' : 'community', id);
  }

  @Get('communities')
  communities(@CurrentUser() user: User) {
    return this.admin.listCommunities(user);
  }

  @Post('communities')
  createCommunity(@CurrentUser() user: User, @Body() dto: CommunityAdminDto) {
    return this.admin.createCommunity(user, dto);
  }

  @Patch('communities/:id')
  updateCommunity(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CommunityAdminDto) {
    return this.admin.updateCommunity(user, id, dto);
  }

  @Post('communities/:id/archive')
  @HttpCode(200)
  archive(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setCommunityStatus(user, id, 'archived');
  }

  @Post('communities/:id/restore')
  @HttpCode(200)
  restore(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setCommunityStatus(user, id, 'active');
  }

  @Delete('communities/:id')
  deleteCommunity(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteCommunity(user, id);
  }

  @Post('communities/:id/moderators')
  assignModerator(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignModeratorDto) {
    return this.admin.assignModerator(user, id, dto.userId);
  }

  @Delete('communities/:id/moderators/:userId')
  removeModerator(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.admin.removeModerator(user, id, userId);
  }

  @Get('members')
  members(@Query() query: AdminMembersQueryDto) {
    return this.admin.members(query);
  }

  @Patch('members/:id/status')
  setStatus(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AccountStatusDto) {
    return this.admin.setStatus(user, id, dto);
  }

  @Patch('members/:id/role')
  setRole(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RoleDto) {
    return this.admin.setRole(user, id, dto.role);
  }

  @Get('verifications')
  verifications(@Query('status') status?: string) {
    return this.admin.verifications(status ?? 'pending');
  }

  @Post('verifications/:userId')
  @HttpCode(200)
  decide(@CurrentUser() user: User, @Param('userId', ParseUUIDPipe) userId: string, @Body() dto: VerificationDecisionDto) {
    return this.admin.decideVerification(user, userId, dto);
  }

  @Get('audit')
  audit(@Query() query: AuditQueryDto) {
    return this.admin.auditLog(query);
  }

  @Get('analytics')
  analytics() {
    return this.admin.analytics();
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import {
  CommunitiesQueryDto,
  CommunityMembersQueryDto,
  CreateMatchRequestDto,
  ExpertProfileDto,
  ExpertsQueryDto,
  InviteMemberDto,
  JoinCommunityDto,
  MemberActionDto,
  MembersQueryDto,
  MembershipDecisionDto,
  NotificationPrefsDto,
  PrivacyDto,
  SearchQueryDto,
  SendMessageDto,
  StartConversationDto,
  UpdateMemberProfileDto,
  VerificationRequestDto,
} from './community.dto';
import { CommunitiesService } from './communities.service';
import { CommunityService } from './community.service';
import { MessagingService } from './messaging.service';
import { ProfilesService } from './profiles.service';

/** Accueil Community : statistiques, catégories, recommandations, activité, recherche, QIAO Connect. */
@Controller('community')
export class CommunityController {
  constructor(
    private readonly community: CommunityService,
    private readonly communities: CommunitiesService,
  ) {}

  @Get('stats')
  stats() {
    return this.community.stats();
  }

  @Get('categories')
  categories() {
    return this.communities.categoriesList();
  }

  @Get('recommendations')
  @UseGuards(OptionalJwtAuthGuard)
  recommendations(@CurrentUser() user: User | null) {
    return this.community.recommendations(user);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard)
  activity(@CurrentUser() user: User) {
    return this.community.recentActivity(user);
  }

  @Post('visit')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  visit(@CurrentUser() user: User) {
    return this.community.recordVisit(user);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  search(@Query() query: SearchQueryDto, @CurrentUser() user: User | null) {
    return this.community.search(query, user);
  }

  @Post('match-requests')
  @UseGuards(OptionalJwtAuthGuard)
  matchRequest(@Body() dto: CreateMatchRequestDto, @CurrentUser() user: User | null) {
    return this.community.createMatchRequest(dto, user);
  }
}

/** Répertoire des communautés, adhésions et gestion des membres par les modérateurs. */
@Controller('community/communities')
export class CommunitiesController {
  constructor(private readonly communities: CommunitiesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: CommunitiesQueryDto, @CurrentUser() user: User | null) {
    return this.communities.list(query, user);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  detail(@Param('slug') slug: string, @CurrentUser() user: User | null) {
    return this.communities.detail(slug, user);
  }

  @Post(':slug/join')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  join(@Param('slug') slug: string, @Body() dto: JoinCommunityDto, @CurrentUser() user: User) {
    return this.communities.join(slug, user, dto.message);
  }

  @Post(':slug/leave')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  leave(@Param('slug') slug: string, @CurrentUser() user: User) {
    return this.communities.leave(slug, user);
  }

  @Get(':slug/members')
  @UseGuards(OptionalJwtAuthGuard)
  members(@Param('slug') slug: string, @Query() query: CommunityMembersQueryDto, @CurrentUser() user: User | null) {
    return this.communities.members(slug, query, user);
  }

  @Post(':slug/requests/:membershipId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  decide(
    @Param('slug') slug: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: MembershipDecisionDto,
    @CurrentUser() user: User,
  ) {
    return this.communities.decide(slug, membershipId, dto.decision, user);
  }

  @Post(':slug/invitations')
  @UseGuards(JwtAuthGuard)
  invite(@Param('slug') slug: string, @Body() dto: InviteMemberDto, @CurrentUser() user: User) {
    return this.communities.invite(slug, dto, user);
  }

  @Post(':slug/members/:membershipId/action')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  memberAction(
    @Param('slug') slug: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: MemberActionDto,
    @CurrentUser() user: User,
  ) {
    return this.communities.memberAction(slug, membershipId, dto, user);
  }
}

/** Profils membres, annuaire des experts, suivis, blocages et paramètres du profil Community. */
@Controller('community')
export class MembersController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('members')
  @UseGuards(OptionalJwtAuthGuard)
  search(@Query() query: MembersQueryDto, @CurrentUser() user: User | null) {
    return this.profiles.searchMembers(query, user);
  }

  @Get('members/:handle')
  @UseGuards(OptionalJwtAuthGuard)
  profile(@Param('handle') handle: string, @CurrentUser() user: User | null) {
    return this.profiles.publicProfile(handle, user);
  }

  @Get('members/:handle/followers')
  @UseGuards(OptionalJwtAuthGuard)
  followers(@Param('handle') handle: string, @CurrentUser() user: User | null) {
    return this.profiles.listFollowers(handle, user);
  }

  @Post('members/:handle/follow')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  follow(@Param('handle') handle: string, @CurrentUser() user: User) {
    return this.profiles.toggleFollow(user, handle);
  }

  @Post('members/:handle/block')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  block(@Param('handle') handle: string, @CurrentUser() user: User) {
    return this.profiles.block(user, handle);
  }

  @Delete('members/:handle/block')
  @UseGuards(JwtAuthGuard)
  unblock(@Param('handle') handle: string, @CurrentUser() user: User) {
    return this.profiles.unblock(user, handle);
  }

  @Get('experts')
  @UseGuards(OptionalJwtAuthGuard)
  experts(@Query() query: ExpertsQueryDto, @CurrentUser() user: User | null) {
    return this.profiles.expertDirectory(query, user);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  myProfile(@CurrentUser() user: User) {
    return this.profiles.myProfile(user);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateMemberProfileDto) {
    return this.profiles.updateMyProfile(user, dto);
  }

  @Patch('me/privacy')
  @UseGuards(JwtAuthGuard)
  privacy(@CurrentUser() user: User, @Body() dto: PrivacyDto) {
    return this.profiles.updatePrivacy(user, dto);
  }

  @Patch('me/notification-prefs')
  @UseGuards(JwtAuthGuard)
  notificationPrefs(@CurrentUser() user: User, @Body() dto: NotificationPrefsDto) {
    return this.profiles.updateNotificationPrefs(user, dto);
  }

  @Put('me/expert')
  @UseGuards(JwtAuthGuard)
  expertProfile(@CurrentUser() user: User, @Body() dto: ExpertProfileDto) {
    return this.profiles.upsertExpertProfile(user, dto);
  }

  @Delete('me/expert')
  @UseGuards(JwtAuthGuard)
  removeExpertProfile(@CurrentUser() user: User) {
    return this.profiles.removeExpertProfile(user);
  }

  @Post('me/expert/verification')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  requestVerification(@CurrentUser() user: User, @Body() dto: VerificationRequestDto) {
    return this.profiles.requestVerification(user, dto);
  }

  @Get('me/following')
  @UseGuards(JwtAuthGuard)
  following(@CurrentUser() user: User) {
    return this.profiles.listFollowing(user);
  }
}

/** Messagerie privée (participants uniquement). */
@Controller('community/conversations')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.messaging.list(user);
  }

  @Get('unread')
  unread(@CurrentUser() user: User) {
    return this.messaging.unreadCount(user);
  }

  @Post()
  start(@CurrentUser() user: User, @Body() dto: StartConversationDto) {
    return this.messaging.start(user, dto);
  }

  @Get(':id')
  thread(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Query('before') before?: string) {
    return this.messaging.thread(user, id, before);
  }

  @Post(':id/messages')
  send(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SendMessageDto) {
    return this.messaging.send(user, id, dto.body);
  }

  @Post(':id/read')
  @HttpCode(200)
  read(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.messaging.markRead(user, id);
  }
}

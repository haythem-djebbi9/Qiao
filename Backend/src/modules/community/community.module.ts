import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../notifications/notification.entity';
import { AdminService } from './admin.service';
import { CommunitiesService } from './communities.service';
import { CommunityAccessService } from './community-access.service';
import { CommunityNotifier } from './community-notifier.service';
import {
  CommunitiesController,
  CommunityController,
  MembersController,
  MessagingController,
} from './community.controller';
import { COMMUNITY_ENTITIES } from './community.entities';
import { CommunityService } from './community.service';
import { MessagingService } from './messaging.service';
import { AdminController, ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { ProfilesService } from './profiles.service';

/**
 * QIAO Community : module indépendant d'Academy et des Services.
 * Il partage l'identité, l'authentification et les notifications de la plateforme,
 * mais garde ses propres règles (communautés, adhésions, publications, messagerie, modération).
 */
@Module({
  imports: [TypeOrmModule.forFeature([...COMMUNITY_ENTITIES, Notification])],
  controllers: [
    CommunityController,
    CommunitiesController,
    MembersController,
    PostsController,
    MessagingController,
    ModerationController,
    AdminController,
  ],
  providers: [
    CommunityAccessService,
    CommunityNotifier,
    ProfilesService,
    CommunitiesService,
    PostsService,
    MessagingService,
    ModerationService,
    AdminService,
    CommunityService,
  ],
  exports: [CommunityService, MessagingService],
})
export class CommunityModule {}

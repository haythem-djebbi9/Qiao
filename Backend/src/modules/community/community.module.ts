import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import {
  CommunityPost,
  Expert,
  ExpertConnection,
  MatchRequest,
  PostBookmark,
  PostComment,
  PostLike,
} from './community.entities';
import { CommunityService } from './community.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityPost, PostLike, PostBookmark, PostComment, Expert, ExpertConnection, MatchRequest]),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}

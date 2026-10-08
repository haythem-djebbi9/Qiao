import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { CreateCommentDto, CreateMatchRequestDto, CreatePostDto, PostsQueryDto } from './community.dto';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  posts(@Query() query: PostsQueryDto, @CurrentUser() user: User | null) {
    return this.communityService.listPosts(query, user);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(user, dto);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  like(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.communityService.toggleLike(user, id);
  }

  @Post('posts/:id/bookmark')
  @UseGuards(JwtAuthGuard)
  bookmark(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.communityService.toggleBookmark(user, id);
  }

  @Get('posts/:id/comments')
  comments(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityService.listComments(id);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateCommentDto) {
    return this.communityService.addComment(user, id, dto);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  bookmarks(@CurrentUser() user: User) {
    return this.communityService.listBookmarks(user);
  }

  @Get('experts')
  @UseGuards(OptionalJwtAuthGuard)
  experts(@CurrentUser() user: User | null) {
    return this.communityService.listExperts(user);
  }

  @Post('experts/:id/connect')
  @UseGuards(JwtAuthGuard)
  connect(@CurrentUser() user: User, @Param('id') id: string) {
    return this.communityService.toggleConnection(user, id);
  }

  @Post('match-requests')
  @UseGuards(OptionalJwtAuthGuard)
  matchRequest(@Body() dto: CreateMatchRequestDto, @CurrentUser() user: User | null) {
    return this.communityService.createMatchRequest(dto, user);
  }
}

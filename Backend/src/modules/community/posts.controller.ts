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
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import {
  CreateCommentDto,
  CreatePostDto,
  FeedQueryDto,
  QuestionStatusDto,
  UpdateCommentDto,
  UpdatePostDto,
} from './community.dto';
import { MAX_ATTACHMENT_SIZE, PostsService } from './posts.service';

/** Publications, questions, commentaires, réactions, favoris, suivi de discussion et pièces jointes. */
@Controller('community')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  feed(@Query() query: FeedQueryDto, @CurrentUser() user: User | null) {
    return this.posts.feed(query, user);
  }

  @Get('posts/drafts')
  @UseGuards(JwtAuthGuard)
  drafts(@CurrentUser() user: User) {
    return this.posts.drafts(user);
  }

  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User | null) {
    return this.posts.getPost(id, user);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.posts.create(user, dto);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto) {
    return this.posts.update(user, id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.remove(user, id);
  }

  @Post('posts/:id/status')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  questionStatus(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: QuestionStatusDto) {
    return this.posts.setQuestionStatus(user, id, dto);
  }

  @Post('posts/:id/like')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  like(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.toggleReaction(user, 'post', id);
  }

  @Post('posts/:id/bookmark')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  bookmark(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.toggleBookmark(user, id);
  }

  @Post('posts/:id/follow')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  follow(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.toggleFollowPost(user, id);
  }

  @Get('posts/:id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  comments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User | null) {
    return this.posts.listComments(id, user);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateCommentDto) {
    return this.posts.addComment(user, id, dto);
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  updateComment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCommentDto) {
    return this.posts.updateComment(user, id, dto.text);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  removeComment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.removeComment(user, id);
  }

  @Post('comments/:id/like')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  likeComment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.toggleReaction(user, 'comment', id);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  bookmarks(@CurrentUser() user: User) {
    return this.posts.listBookmarks(user);
  }

  @Post('uploads')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_ATTACHMENT_SIZE, files: 1 } }))
  upload(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.posts.upload(user, file);
  }

  @Get('attachments/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async attachment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User | null, @Res() res: Response) {
    const file = await this.posts.attachmentFile(id, user);
    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(file.path, (err) => {
      if (err && !res.headersSent) res.status(404).json({ statusCode: 404, message: 'Fichier introuvable.' });
    });
  }
}

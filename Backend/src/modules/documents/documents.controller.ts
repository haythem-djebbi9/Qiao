import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { CreateResourceRequestDto, DocumentsQueryDto } from './documents.dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@Query() query: DocumentsQueryDto) {
    return this.documentsService.list(query);
  }

  @Get('downloads/mine')
  @UseGuards(JwtAuthGuard)
  myDownloads(@CurrentUser() user: User) {
    return this.documentsService.listDownloadsForUser(user);
  }

  @Post('requests')
  @UseGuards(OptionalJwtAuthGuard)
  createRequest(@Body() dto: CreateResourceRequestDto, @CurrentUser() user: User | null) {
    return this.documentsService.createRequest(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post(':id/view')
  view(@Param('id') id: string) {
    return this.documentsService.registerView(id);
  }

  @Get(':id/download')
  @UseGuards(OptionalJwtAuthGuard)
  async download(@Param('id') id: string, @CurrentUser() user: User | null, @Res() res: Response) {
    const file = await this.documentsService.download(id, user);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.buffer.length,
    });
    res.send(file.buffer);
  }
}

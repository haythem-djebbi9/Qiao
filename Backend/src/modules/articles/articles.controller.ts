import { Controller, Get, NotFoundException, Param, Post, Query, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { isAllFilter, matchesQuery, normalize } from '../../common/text';
import { renderArticle } from '../documents/document-renderer';
import { Article } from './article.entity';

@Controller('articles')
export class ArticlesController {
  constructor(@InjectRepository(Article) private readonly articles: Repository<Article>) {}

  @Get()
  async list(
    @Query('placement') placement?: string,
    @Query('q') q?: string,
    @Query('country') country?: string,
    @Query('sector') sector?: string,
    @Query('type') type?: string,
  ) {
    const all = await this.articles.find({ order: { publishedAt: 'DESC' } });
    return all.filter(
      (article) =>
        (!placement || article.placements.includes(placement)) &&
        (isAllFilter(country) || (article.countries ?? []).some((c) => normalize(c) === normalize(country))) &&
        (isAllFilter(sector) || normalize(article.sector) === normalize(sector)) &&
        (isAllFilter(type) || normalize(article.analysisType) === normalize(type)) &&
        matchesQuery(q, article.title, article.summary, article.category, article.keyPoints),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const article = await this.articles.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    return article;
  }

  /** Comptabilise une lecture (ouverture de l'article). */
  @Post(':id/view')
  async view(@Param('id') id: string) {
    const article = await this.articles.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    article.viewsCount += 1;
    await this.articles.save(article);
    return { views: article.viewsCount };
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const article = await this.articles.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    const file = await renderArticle(article);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.buffer.length,
    });
    res.send(file.buffer);
  }
}

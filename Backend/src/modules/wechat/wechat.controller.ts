import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Query, RawBodyRequest, Req, Res, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional } from 'class-validator';
import { Request, Response } from 'express';
import { CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { WechatService } from './wechat.service';

class UpdateWechatLinkDto {
  @IsOptional()
  @IsBoolean()
  relayMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  relayAlerts?: boolean;
}

@Controller('wechat')
export class WechatController {
  constructor(private readonly wechat: WechatService) {}

  // --- Espace membre : liaison du compte WeChat -----------------------------------------------

  @Get('link')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: User) {
    return this.wechat.status(user);
  }

  @Post('link')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  createLink(@CurrentUser() user: User) {
    return this.wechat.createBindCode(user);
  }

  @Patch('link')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: User, @Body() dto: UpdateWechatLinkDto) {
    return this.wechat.updateSettings(user, dto);
  }

  @Delete('link')
  @UseGuards(JwtAuthGuard)
  unlink(@CurrentUser() user: User) {
    return this.wechat.unlink(user);
  }

  // --- Serveur de messages du compte officiel (URL à déclarer dans « 服务器配置 ») ------------------

  @Get('oa/callback')
  verify(@Query() query: Record<string, string>, @Res() res: Response) {
    res.type('text/plain').send(this.wechat.verifyEndpoint(query));
  }

  @Post('oa/callback')
  async receive(@Query() query: Record<string, string>, @Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const body = req.rawBody?.toString('utf8') ?? (typeof req.body === 'string' ? req.body : '');
    const reply = await this.wechat.handleCallback(query, body);
    res.status(200).type(reply === 'success' ? 'text/plain' : 'application/xml').send(reply);
  }
}

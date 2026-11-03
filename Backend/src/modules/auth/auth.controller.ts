import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClientContext, CurrentUser, JwtAuthGuard, SessionId } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  OAuthCompleteDto,
  OAuthExchangeDto,
  OAuthLinkExistingDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './auth.dto';
import { AuthService, RequestContext } from './auth.service';
import { OAUTH_NONCE_COOKIE, OAuthService } from './oauth.service';

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauth: OAuthService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @ClientContext() ctx: RequestContext) {
    return this.authService.register(dto, ctx);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @ClientContext() ctx: RequestContext) {
    return this.authService.login(dto, ctx);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  refresh(@CurrentUser() user: User, @SessionId() sessionId: string) {
    return this.authService.refresh(user, sessionId);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(@SessionId() sessionId: string) {
    return this.authService.logout(sessionId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.authService.me(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto, @SessionId() sessionId: string) {
    return this.authService.changePassword(user, dto, sessionId);
  }

  @Post('me/accept-terms')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  acceptTerms(@CurrentUser() user: User) {
    return this.authService.acceptTerms(user);
  }

  @Post('password/forgot')
  @HttpCode(200)
  forgot(@Body() dto: ForgotPasswordDto, @ClientContext() ctx: RequestContext) {
    return this.authService.forgotPassword(dto, ctx);
  }

  @Post('password/reset')
  @HttpCode(200)
  reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // --- Sessions ------------------------------------------------------------------

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  sessions(@CurrentUser() user: User, @SessionId() sessionId: string) {
    return this.authService.listSessions(user, sessionId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  revokeSession(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.authService.revokeSession(user, id);
  }

  @Post('sessions/revoke-others')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  revokeOthers(@CurrentUser() user: User, @SessionId() sessionId: string) {
    return this.authService.revokeOtherSessions(user, sessionId);
  }

  // --- Identités liées (WeChat, Facebook) -------------------------------------------

  @Get('identities')
  @UseGuards(JwtAuthGuard)
  identities(@CurrentUser() user: User) {
    return this.authService.listIdentities(user);
  }

  @Delete('identities/:id')
  @UseGuards(JwtAuthGuard)
  unlink(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.authService.unlinkIdentity(user, id);
  }

  @Get('providers')
  providers() {
    return this.oauth.providers();
  }

  @Post('oauth/:provider/link-ticket')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  linkTicket(@CurrentUser() user: User, @Param('provider') provider: string) {
    return this.oauth.createLinkTicket(user, provider);
  }

  @Get('oauth/:provider/start')
  async start(
    @Param('provider') provider: string,
    @Query('link') linkTicket: string | undefined,
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const { url, nonce } = await this.oauth.start(provider, { linkTicket, returnTo });
      res.cookie(OAUTH_NONCE_COOKIE, nonce, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60_000,
        path: '/api/auth/oauth',
      });
      res.redirect(url);
    } catch (err) {
      res.redirect(this.oauth.redirectWith(returnTo ?? '/', { oauth_error: (err as Error).message.includes('configurée') ? 'disabled' : 'provider' }));
    }
  }

  @Get('oauth/:provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query() query: { code?: string; state?: string; error?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const target = await this.oauth.callback(provider, query, readCookie(req, OAUTH_NONCE_COOKIE));
    res.clearCookie(OAUTH_NONCE_COOKIE, { path: '/api/auth/oauth' });
    res.redirect(target);
  }

  @Post('oauth/exchange')
  @HttpCode(200)
  exchange(@Body() dto: OAuthExchangeDto, @ClientContext() ctx: RequestContext) {
    return this.oauth.exchange(dto.code, ctx);
  }

  @Get('oauth/pending/:ticket')
  pending(@Param('ticket') ticket: string) {
    return this.oauth.pendingInfo(ticket);
  }

  @Post('oauth/complete')
  completeSignup(@Body() dto: OAuthCompleteDto, @ClientContext() ctx: RequestContext) {
    return this.oauth.completeSignup(dto, ctx);
  }

  @Post('oauth/link-existing')
  @HttpCode(200)
  linkExisting(@Body() dto: OAuthLinkExistingDto, @ClientContext() ctx: RequestContext) {
    return this.oauth.linkExisting(dto, ctx);
  }

  // --- Simulateur local des fournisseurs (OAUTH_MOCK=true) ---------------------------

  @Get('oauth/mock/:provider/authorize')
  mockPage(@Param('provider') provider: string, @Query('state') state: string, @Res() res: Response) {
    res.type('html').send(this.oauth.mockPage(provider, state ?? ''));
  }

  @Post('oauth/mock/:provider/authorize')
  mockAuthorize(@Param('provider') provider: string, @Body() body: Record<string, string>, @Res() res: Response) {
    res.redirect(this.oauth.mockAuthorize(provider, body));
  }
}

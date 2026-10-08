import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../../common/auth.guards';
import { User } from '../users/user.entity';
import { AcademyItemDto, CoursesQueryDto } from './academy.dto';
import { AcademyService } from './academy.service';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Get('domains')
  domains() {
    return this.academyService.listDomains();
  }

  @Get('domains/:id/courses')
  domainCourses(@Param('id') id: string) {
    return this.academyService.domainCourses(id);
  }

  @Get('courses')
  courses(@Query() query: CoursesQueryDto) {
    return this.academyService.listCourses(query);
  }

  @Get('paths')
  paths() {
    return this.academyService.listPaths();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  summary(@CurrentUser() user: User) {
    return this.academyService.summary(user);
  }

  @Post('favorites/:courseId')
  @UseGuards(JwtAuthGuard)
  toggleFavorite(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.academyService.toggleFavorite(user, courseId);
  }

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  cart(@CurrentUser() user: User) {
    return this.academyService.getCart(user);
  }

  @Post('cart')
  @UseGuards(JwtAuthGuard)
  addToCart(@CurrentUser() user: User, @Body() dto: AcademyItemDto) {
    return this.academyService.addToCart(user, dto);
  }

  @Delete('cart/:id')
  @UseGuards(JwtAuthGuard)
  removeFromCart(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.academyService.removeFromCart(user, id);
  }

  @Post('cart/checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: User) {
    return this.academyService.checkout(user);
  }

  @Post('enroll')
  @UseGuards(JwtAuthGuard)
  enroll(@CurrentUser() user: User, @Body() dto: AcademyItemDto) {
    return this.academyService.enroll(user, dto);
  }

  @Get('enrollments')
  @UseGuards(JwtAuthGuard)
  enrollments(@CurrentUser() user: User) {
    return this.academyService.listEnrollments(user);
  }
}

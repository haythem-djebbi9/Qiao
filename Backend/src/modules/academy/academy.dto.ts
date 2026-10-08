import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CoursesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsIn(['popular', 'new'])
  section?: 'popular' | 'new';
}

export class AcademyItemDto {
  @IsIn(['course', 'path'], { message: "Type d'élément invalide." })
  itemType: 'course' | 'path';

  @IsString()
  @MaxLength(80)
  itemId: string;
}

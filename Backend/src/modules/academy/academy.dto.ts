import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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

export class QuizAnswersDto {
  /** Index de la réponse choisie pour chaque question, dans l'ordre (-1 : sans réponse). */
  @IsArray()
  @ArrayMaxSize(30)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(-1, { each: true })
  answers: number[];
}

export class CheckoutDto {
  @IsOptional()
  @IsIn(['card', 'transfer'], { message: 'Mode de paiement invalide.' })
  method?: 'card' | 'transfer';
}

export class AcademyItemDto {
  @IsIn(['course', 'path'], { message: "Type d'élément invalide." })
  itemType: 'course' | 'path';

  @IsString()
  @MaxLength(80)
  itemId: string;
}

export class EnrollDto extends AcademyItemDto {
  @IsOptional()
  @IsIn(['card', 'transfer'], { message: 'Mode de paiement invalide.' })
  method?: 'card' | 'transfer';
}

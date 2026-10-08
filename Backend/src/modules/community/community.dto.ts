import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export const POST_CATEGORIES = ['Business', 'Questions', 'Offres', 'Actualités', 'À la une'] as const;
export const COMMUNITIES = ['business', 'trade', 'investment', 'students', 'expats', 'culture', 'tech'] as const;

export class PostsQueryDto {
  @IsOptional()
  @IsIn(['Tout', 'À la une', 'Questions', 'Offres', 'Actualités'])
  filter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn([...COMMUNITIES])
  community?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class CreatePostDto {
  @IsString()
  @Length(5, 2000, { message: 'Votre publication doit contenir entre 5 et 2000 caractères.' })
  content: string;

  @IsIn([...POST_CATEGORIES], { message: 'Catégorie invalide.' })
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;

  @IsOptional()
  @IsIn([...COMMUNITIES])
  community?: string;
}

export class CreateCommentDto {
  @IsString()
  @Length(1, 1000, { message: 'Votre commentaire est vide ou trop long.' })
  text: string;
}

export class CreateMatchRequestDto {
  @IsString()
  @Length(3, 120)
  profileType: string;

  @IsString()
  @Length(10, 2000, { message: 'Décrivez votre projet en quelques phrases (10 caractères minimum).' })
  description: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email?: string;
}

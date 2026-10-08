import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class CompaniesQueryDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  turnover?: string;

  @IsOptional()
  @IsIn(['toutes', 'chinoises', 'nord-africaines', 'startups', 'distributeurs', 'fabricants'])
  segment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsIn(['recent', 'rating', 'name'])
  sort?: 'recent' | 'rating' | 'name';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ContactCompanyDto {
  @IsString()
  @Length(2, 120, { message: 'Le nom complet est obligatoire.' })
  fullName: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  organization?: string;

  @IsString()
  @Length(10, 2000, { message: 'Présentez votre demande en quelques phrases (10 caractères minimum).' })
  message: string;
}

import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class DocumentsQueryDto {
  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  need?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(['recent', 'popular'])
  sort?: 'recent' | 'popular';

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  premium?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CreateResourceRequestDto {
  @IsOptional()
  @IsIn(['request', 'replay'])
  kind?: 'request' | 'replay';

  @IsString()
  @Length(3, 220, { message: 'Précisez la ressource souhaitée.' })
  title: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

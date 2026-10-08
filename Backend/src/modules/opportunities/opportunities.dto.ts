import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class OpportunitiesQueryDto {
  @IsOptional()
  @IsString()
  placement?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class ApplyOpportunityDto {
  @IsString()
  @Length(2, 120, { message: 'Le nom complet est obligatoire.' })
  fullName: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

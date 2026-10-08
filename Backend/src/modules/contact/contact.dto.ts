import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsObject, IsOptional, IsString, Length, MaxLength } from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => value === true || value === 'true' || value === 'on';

export class CreateContactDto {
  @IsIn(['home', 'contact-page', 'quote', 'simulator', 'sector', 'company', 'consultation'])
  source: 'home' | 'contact-page' | 'quote' | 'simulator' | 'sector' | 'company' | 'consultation';

  @IsString()
  @Length(2, 120, { message: 'Le nom complet est obligatoire.' })
  fullName: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sector?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @Length(5, 2000, { message: 'Le message doit contenir entre 5 et 2000 caractères.' })
  message: string;

  @Transform(toBoolean)
  @IsBoolean()
  consent: boolean;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsObject()
  context?: Record<string, unknown>;
}

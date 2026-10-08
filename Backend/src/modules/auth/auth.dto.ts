import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(2, 120, { message: 'Le nom doit contenir entre 2 et 120 caractères.' })
  fullName: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsIn(['enterprise', 'expert', 'individual'], { message: 'Type de profil invalide.' })
  accountType: 'enterprise' | 'expert' | 'individual';

  @IsIn(['china', 'north-africa'], { message: "Région d'origine invalide." })
  origin: 'china' | 'north-africa';
}

export class LoginDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Le mot de passe est obligatoire.' })
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsIn(['FR', 'ZH', 'AR', 'EN'], { message: 'Langue non prise en charge.' })
  language?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(100)
  newPassword: string;
}

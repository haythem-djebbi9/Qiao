import { Equals, IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUrl, Length, MaxLength, MinLength } from 'class-validator';

const ACCOUNT_TYPES = ['enterprise', 'expert', 'individual'] as const;
const ORIGINS = ['china', 'north-africa'] as const;

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

  @IsIn(ACCOUNT_TYPES, { message: 'Type de profil invalide.' })
  accountType: 'enterprise' | 'expert' | 'individual';

  @IsIn(ORIGINS, { message: "Région d'origine invalide." })
  origin: 'china' | 'north-africa';

  @IsBoolean()
  @Equals(true, { message: "Veuillez accepter les conditions d'utilisation et la politique de confidentialité." })
  acceptTerms: boolean;
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

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: "L'adresse de la photo doit commencer par https://." })
  @MaxLength(300)
  avatarUrl?: string;
}

export class ChangePasswordDto {
  /** Obligatoire si le compte possède déjà un mot de passe. */
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(100)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @Length(20, 200)
  token: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(100)
  password: string;
}

export class OAuthExchangeDto {
  @IsString()
  @Length(20, 200)
  code: string;
}

/** Création d'un nouveau compte QIAO à partir d'une identité WeChat/Facebook inconnue. */
export class OAuthCompleteDto {
  @IsString()
  @Length(20, 200)
  ticket: string;

  @IsString()
  @Length(2, 120, { message: 'Le nom doit contenir entre 2 et 120 caractères.' })
  fullName: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsIn(ACCOUNT_TYPES, { message: 'Type de profil invalide.' })
  accountType: 'enterprise' | 'expert' | 'individual';

  @IsIn(ORIGINS, { message: "Région d'origine invalide." })
  origin: 'china' | 'north-africa';

  @IsBoolean()
  @Equals(true, { message: "Veuillez accepter les conditions d'utilisation et la politique de confidentialité." })
  acceptTerms: boolean;
}

/** Liaison d'une identité WeChat/Facebook à un compte QIAO existant, après preuve du mot de passe. */
export class OAuthLinkExistingDto {
  @IsString()
  @Length(20, 200)
  ticket: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Le mot de passe est obligatoire.' })
  password: string;
}

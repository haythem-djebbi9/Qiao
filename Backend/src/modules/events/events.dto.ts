import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class EventsQueryDto {
  @IsOptional()
  @IsString()
  placement?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class RegisterEventDto {
  @IsString()
  @Length(2, 120, { message: 'Le nom complet est obligatoire.' })
  fullName: string;

  @IsEmail({}, { message: "L'adresse e-mail professionnelle est invalide." })
  email: string;

  @IsString()
  @Length(2, 200, { message: "Indiquez votre entreprise et votre rôle." })
  companyRole: string;
}

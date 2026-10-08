import { IsDateString, IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export const SPECIALTIES = ['sourcing', 'creation', 'juridique', 'academy', 'partenariat'] as const;
export const TIME_SLOTS = ['09:00', '10:00', '11:30', '14:00', '16:00', '17:30'] as const;

export class CreateAppointmentDto {
  @IsIn([...SPECIALTIES], { message: 'Domaine de consultation invalide.' })
  specialty: string;

  @IsDateString({}, { message: 'Date invalide.' })
  date: string;

  @IsIn([...TIME_SLOTS], { message: 'Créneau horaire invalide.' })
  time: string;

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
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}

export class AvailabilityQueryDto {
  @IsDateString({}, { message: 'Date invalide.' })
  date: string;

  @IsIn([...SPECIALTIES])
  specialty: string;
}

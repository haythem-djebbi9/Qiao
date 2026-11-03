import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EVENT_CATEGORY_KEYS,
  EVENT_FORMATS,
  EVENT_PLACEMENTS,
  EVENT_STATUSES,
  EventFormat,
  EventStatus,
  REGISTRATION_STATUSES,
  RegistrationStatus,
} from './event.entity';

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

// ============================================================================
// Administration
// ============================================================================

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'Date invalide (format AAAA-MM-JJ).';
/** Visuel de la bibliothèque QIAO (« asset:fichier.jpg ») ou lien https. */
const IMAGE_PATTERN = /^(asset:[\w.-]+|https:\/\/\S+)$/;
const IMAGE_MESSAGE = 'Image invalide : choisissez un visuel QIAO ou un lien https.';
const URL_PATTERN = /^https:\/\/\S+$/;

class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class EventDetailsDto {
  @IsString() @MaxLength(200) organizer: string;
  @IsString() @MaxLength(200) expectedAttendees: string;
  @IsString() @MaxLength(200) venue: string;
  @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(80, { each: true }) focusSectors: string[];
  @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(300, { each: true }) programHighlights: string[];
  @IsOptional() @IsString() @Matches(URL_PATTERN, { message: 'Site web : lien https attendu.' }) website?: string;
}

export class EventDto {
  @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(200) title: string;
  @IsString() @MinLength(2, { message: 'Type d’événement obligatoire (ex. Salon, Webinaire).' }) @MaxLength(40) category: string;
  @IsIn(EVENT_CATEGORY_KEYS, { message: 'Rubrique de la page Événements invalide.' }) categoryKey: string;
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE }) startDate: string;
  @IsOptional() @Matches(DATE_PATTERN, { message: DATE_MESSAGE }) endDate?: string | null;
  @IsString() @MinLength(2, { message: 'Horaires obligatoires.' }) @MaxLength(60) time: string;
  @IsIn(EVENT_FORMATS, { message: 'Format invalide.' }) format: EventFormat;
  @IsString() @MinLength(2, { message: 'Lieu obligatoire (ville, ou « En ligne »).' }) @MaxLength(120) location: string;
  @IsString() @MinLength(2, { message: 'Pays obligatoire.' }) @MaxLength(60) country: string;
  @IsOptional() @IsString() @Matches(URL_PATTERN, { message: 'Lien de connexion : lien https attendu.' }) @MaxLength(500) onlineUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(80) priceLabel?: string | null;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) @MaxLength(300) image?: string | null;
  @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(5000) description: string;
  @IsOptional() @ValidateNested() @Type(() => EventDetailsDto) details?: EventDetailsDto | null;
  @IsArray() @IsIn(EVENT_PLACEMENTS, { each: true, message: "Emplacement d'affichage invalide." }) placements: string[];
  @Type(() => Number) @IsInt({ message: 'Nombre de places invalide.' }) @Min(0) @Max(100000) capacity: number;
  @IsOptional() @IsBoolean() registrationOpen?: boolean;
}

export class UpdateEventDto {
  @IsOptional() @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(40) category?: string;
  @IsOptional() @IsIn(EVENT_CATEGORY_KEYS, { message: 'Rubrique de la page Événements invalide.' }) categoryKey?: string;
  @IsOptional() @Matches(DATE_PATTERN, { message: DATE_MESSAGE }) startDate?: string;
  @IsOptional() @Matches(DATE_PATTERN, { message: DATE_MESSAGE }) endDate?: string | null;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(60) time?: string;
  @IsOptional() @IsIn(EVENT_FORMATS, { message: 'Format invalide.' }) format?: EventFormat;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) location?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(60) country?: string;
  @IsOptional() @IsString() @Matches(URL_PATTERN, { message: 'Lien de connexion : lien https attendu.' }) @MaxLength(500) onlineUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(80) priceLabel?: string | null;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) @MaxLength(300) image?: string | null;
  @IsOptional() @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(5000) description?: string;
  @IsOptional() @ValidateNested() @Type(() => EventDetailsDto) details?: EventDetailsDto | null;
  @IsOptional() @IsArray() @IsIn(EVENT_PLACEMENTS, { each: true, message: "Emplacement d'affichage invalide." }) placements?: string[];
  @IsOptional() @Type(() => Number) @IsInt({ message: 'Nombre de places invalide.' }) @Min(0) @Max(100000) capacity?: number;
  @IsOptional() @IsBoolean() registrationOpen?: boolean;
}

export class EventStatusDto {
  @IsIn(EVENT_STATUSES, { message: 'Statut invalide.' })
  status: EventStatus;
}

export class AdminEventsQueryDto {
  @IsOptional() @IsIn(['all', ...EVENT_STATUSES]) status?: string;
  @IsOptional() @IsIn(['all', 'upcoming', 'past']) period?: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class RegistrationsQueryDto {
  @IsOptional() @IsIn(['all', ...REGISTRATION_STATUSES]) status?: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class AdminRegistrationDto extends RegisterEventDto {
  @IsOptional() @IsString() @MaxLength(500) adminNote?: string | null;
}

export class UpdateRegistrationDto {
  @IsOptional() @IsIn(REGISTRATION_STATUSES, { message: 'Statut invalide.' }) status?: RegistrationStatus;
  @IsOptional() @IsString() @MaxLength(500) adminNote?: string | null;
}

export class CheckInDto {
  @IsBoolean() present: boolean;
}

export class EventsAuditQueryDto extends PageQueryDto {
  @IsOptional() @IsString() @MaxLength(60) action?: string;
}

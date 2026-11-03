import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LESSON_TYPES, LessonType, PUBLICATION_STATUSES, PublicationStatus } from './academy.entities';

/** Domaines du catalogue de la page Academy (filtres). */
export const CATALOG_DOMAINS = ['business', 'commerce', 'investment', 'law', 'logistics', 'tech', 'languages', 'culture'];
export const COURSE_LEVELS = ['Débutant', 'Intermédiaire', 'Avancé / Dirigeant', 'Tous niveaux'];
export const COURSE_FORMATS = ['En ligne à son rythme', 'Masterclass live', 'Parcours certifiant'];
export const BADGE_COLORS = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600'];
export const DOMAIN_ICONS = ['Briefcase', 'Globe', 'Truck', 'Scale', 'Languages', 'TrendingUp', 'UserCheck'];

/** Image : lien https, image locale du site (« asset:… ») ou fichier téléversé (« academy-file:<uuid> »). */
const IMAGE_PATTERN = /^(https?:\/\/\S+|asset:[\w.-]+|academy-file:[0-9a-f-]{36})$/i;
const IMAGE_MESSAGE = "Image invalide : lien https, ou image téléversée.";

class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class StatusDto {
  @IsIn(PUBLICATION_STATUSES, { message: 'Statut invalide.' })
  status: PublicationStatus;
}

export class CourseDto {
  @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(200) title: string;
  @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(5000) description: string;
  @IsString() @MinLength(2) @MaxLength(120) instructor: string;
  @IsOptional() @IsString() @MaxLength(200) instructorRole?: string | null;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) instructorImg?: string | null;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) image?: string | null;
  @Type(() => Number) @IsInt({ message: 'Prix invalide.' }) @Min(0) @Max(100000) price: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) durationMinutes: number;
  /** Libellé affiché (« 6h 30m ») ; calculé depuis la durée s'il est vide. */
  @IsOptional() @IsString() @MaxLength(30) duration?: string | null;
  @IsIn(CATALOG_DOMAINS, { message: 'Domaine du catalogue invalide.' }) domain: string;
  @IsIn(COURSE_LEVELS, { message: 'Niveau invalide.' }) level: string;
  @IsIn(COURSE_FORMATS, { message: 'Format invalide.' }) format: string;
  @IsOptional() @IsString() @MaxLength(30) badge?: string | null;
  @IsOptional() @IsIn(BADGE_COLORS) badgeColor?: string | null;
  @IsOptional() @IsArray() @IsIn(['popular', 'new'], { each: true }) sections?: string[];
  @IsOptional() @IsString() @MaxLength(60) trainingDomainId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class UpdateCourseDto {
  @IsOptional() @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) instructor?: string;
  @IsOptional() @IsString() @MaxLength(200) instructorRole?: string | null;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) instructorImg?: string | null;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) image?: string | null;
  @IsOptional() @Type(() => Number) @IsInt({ message: 'Prix invalide.' }) @Min(0) @Max(100000) price?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) durationMinutes?: number;
  @IsOptional() @IsString() @MaxLength(30) duration?: string | null;
  @IsOptional() @IsIn(CATALOG_DOMAINS, { message: 'Domaine du catalogue invalide.' }) domain?: string;
  @IsOptional() @IsIn(COURSE_LEVELS, { message: 'Niveau invalide.' }) level?: string;
  @IsOptional() @IsIn(COURSE_FORMATS, { message: 'Format invalide.' }) format?: string;
  @IsOptional() @IsString() @MaxLength(30) badge?: string | null;
  @IsOptional() @IsIn(BADGE_COLORS) badgeColor?: string | null;
  @IsOptional() @IsArray() @IsIn(['popular', 'new'], { each: true }) sections?: string[];
  @IsOptional() @IsString() @MaxLength(60) trainingDomainId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class PathDto {
  @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(200) title: string;
  @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(3000) description: string;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) image?: string | null;
  @Type(() => Number) @IsInt({ message: 'Prix invalide.' }) @Min(0) @Max(100000) price: number;
  @IsString() @MinLength(1) @MaxLength(20) duration: string;
  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) courseIds: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class UpdatePathDto {
  @IsOptional() @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(3000) description?: string;
  @IsOptional() @IsString() @Matches(IMAGE_PATTERN, { message: IMAGE_MESSAGE }) image?: string | null;
  @IsOptional() @Type(() => Number) @IsInt({ message: 'Prix invalide.' }) @Min(0) @Max(100000) price?: number;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(20) duration?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) courseIds?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class DomainDto {
  @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(160) title: string;
  @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(1000) description: string;
  @IsIn(DOMAIN_ICONS, { message: 'Icône invalide.' }) iconName: string;
  @IsString() @MinLength(3) @MaxLength(200) featuredCourse: string;
  @IsString() @MinLength(1) @MaxLength(40) duration: string;
  @IsIn(['red', 'blue']) accentColor: 'red' | 'blue';
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) coursesCount: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class UpdateDomainDto {
  @IsOptional() @IsString() @MinLength(3, { message: 'Titre trop court.' }) @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MinLength(10, { message: 'Description trop courte (10 caractères minimum).' }) @MaxLength(1000) description?: string;
  @IsOptional() @IsIn(DOMAIN_ICONS, { message: 'Icône invalide.' }) iconName?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(200) featuredCourse?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(40) duration?: string;
  @IsOptional() @IsIn(['red', 'blue']) accentColor?: 'red' | 'blue';
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10000) coursesCount?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) sortOrder?: number;
}

export class PriceChangeDto {
  @IsIn(['course', 'path']) itemType: 'course' | 'path';
  @IsString() @MaxLength(80) itemId: string;
  @Type(() => Number) @IsInt({ message: 'Prix invalide.' }) @Min(0) @Max(100000) price: number;
}

export class PricesDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => PriceChangeDto) changes: PriceChangeDto[];
}

export class ModuleDto {
  @IsString() @MinLength(2, { message: 'Titre du module trop court.' }) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null;
}

export class UpdateModuleDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Titre du module trop court.' }) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null;
}

export class OrderDto {
  @IsArray() @ArrayMaxSize(500) @IsUUID('4', { each: true }) ids: string[];
}

export class QuizQuestionDto {
  @IsOptional() @IsString() @MaxLength(40) id?: string;
  @IsString() @MinLength(3, { message: 'Question trop courte.' }) @MaxLength(500) prompt: string;
  @IsArray()
  @ArrayMinSize(2, { message: 'Chaque question doit proposer au moins 2 réponses.' })
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MinLength(1, { each: true, message: 'Réponse vide.' })
  @MaxLength(300, { each: true })
  options: string[];
  @Type(() => Number) @IsInt() @Min(0) answer: number;
  @IsOptional() @IsString() @MaxLength(1000) explanation?: string | null;
}

export class QuizDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(100) passingScore: number;
  @IsArray()
  @ArrayMinSize(1, { message: 'Ajoutez au moins une question au quiz.' })
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}

export class LessonResourceDto {
  @IsOptional() @IsString() @MaxLength(40) id?: string;
  @IsIn(['file', 'link'], { message: 'Type de support invalide.' }) kind: 'file' | 'link';
  @IsString() @MinLength(1, { message: 'Donnez un titre à chaque support.' }) @MaxLength(200) title: string;
  @IsOptional() @IsUUID('4') fileId?: string;
  @IsOptional() @IsString() @Matches(/^https:\/\/\S+$/i, { message: 'Le lien du support doit commencer par https://.' }) @MaxLength(500) url?: string;
}

export class LessonDto {
  @IsString() @MinLength(2, { message: 'Titre de la leçon trop court.' }) @MaxLength(200) title: string;
  @IsIn(LESSON_TYPES, { message: 'Type de leçon invalide.' }) type: LessonType;
  @IsOptional() @IsString() @MaxLength(50000) content?: string | null;
  @IsOptional() @IsString() @MaxLength(500) videoUrl?: string | null;
  @IsOptional() @IsUUID('4') fileId?: string | null;
  @Type(() => Number) @IsInt() @Min(0) @Max(1440) durationMinutes: number;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @ValidateNested() @Type(() => QuizDto) quiz?: QuizDto | null;
  @IsOptional() @IsArray() @ArrayMaxSize(20, { message: '20 supports maximum par leçon.' }) @ValidateNested({ each: true }) @Type(() => LessonResourceDto) resources?: LessonResourceDto[];
}

export class UpdateLessonDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Titre de la leçon trop court.' }) @MaxLength(200) title?: string;
  @IsOptional() @IsIn(LESSON_TYPES, { message: 'Type de leçon invalide.' }) type?: LessonType;
  @IsOptional() @IsString() @MaxLength(50000) content?: string | null;
  @IsOptional() @IsString() @MaxLength(500) videoUrl?: string | null;
  @IsOptional() @IsUUID('4') fileId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1440) durationMinutes?: number;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @ValidateNested() @Type(() => QuizDto) quiz?: QuizDto | null;
  /** Déplacement vers un autre module de la même formation. */
  @IsOptional() @IsUUID('4') moduleId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20, { message: '20 supports maximum par leçon.' }) @ValidateNested({ each: true }) @Type(() => LessonResourceDto) resources?: LessonResourceDto[];
}

export class NoteDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(86400) seconds?: number | null;
  @IsString() @MinLength(1, { message: 'La note est vide.' }) @MaxLength(2000) text: string;
}

export class UpdateNoteDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(86400) seconds?: number | null;
  @IsOptional() @IsString() @MinLength(1, { message: 'La note est vide.' }) @MaxLength(2000) text?: string;
}

export class GrantEnrollmentDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' }) @MaxLength(200) email: string;
  @IsIn(['course', 'path']) itemType: 'course' | 'path';
  @IsString() @MaxLength(80) itemId: string;
}

export class AdminCoursesQueryDto {
  @IsOptional() @IsIn([...PUBLICATION_STATUSES, 'all']) status?: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class LearnersQueryDto extends PageQueryDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsIn(['course', 'path']) itemType?: 'course' | 'path';
  @IsOptional() @IsString() @MaxLength(80) itemId?: string;
  @IsOptional() @IsIn(['active', 'completed']) status?: 'active' | 'completed';
}

export class RevokeCertificateDto {
  @IsString()
  @MinLength(3, { message: 'Indiquez le motif de la révocation.' })
  @MaxLength(500, { message: 'Motif trop long (500 caractères maximum).' })
  reason: string;
}

export class AcademyAuditQueryDto extends PageQueryDto {
  @IsOptional() @IsString() @MaxLength(60) action?: string;
}

export class UploadQueryDto {
  @IsIn(['cover', 'lesson', 'resource'], { message: 'Usage du fichier invalide.' }) purpose: 'cover' | 'lesson' | 'resource';
}

export class AdminOrdersQueryDto extends PageQueryDto {
  @IsOptional() @IsIn(['all', 'pending', 'paid', 'cancelled']) status?: string;
  @IsOptional() @IsIn(['all', 'card', 'transfer', 'free']) method?: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class OrderDecisionDto {
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class BankDetailsDto {
  @IsOptional() @IsString() @MaxLength(120) beneficiary?: string;
  @IsOptional() @IsString() @MaxLength(120) bankName?: string;
  @IsOptional() @IsString() @MaxLength(40) rib?: string;
  @IsOptional() @IsString() @MaxLength(40) iban?: string;
  @IsOptional() @IsString() @MaxLength(20) bic?: string;
  @IsOptional() @IsString() @MaxLength(600) instructions?: string;
}

export class PaymentSettingsDto {
  /** Euros pour 1 TND (ex. 0.29) ; null désactive le paiement par carte. */
  @IsOptional() @Type(() => Number) @Min(0.01, { message: 'Taux trop faible.' }) @Max(10, { message: 'Taux trop élevé.' }) eurPerTnd?: number | null;
  @IsOptional() @ValidateNested() @Type(() => BankDetailsDto) bank?: BankDetailsDto;
}

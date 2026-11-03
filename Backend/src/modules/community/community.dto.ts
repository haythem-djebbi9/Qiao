import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { REPORT_REASONS } from './community.entities';

export const CONTENT_LANGUAGES = ['fr', 'ar', 'en', 'zh', 'other'] as const;
export const FEED_FILTERS = ['recent', 'popular', 'unanswered', 'questions', 'my-communities', 'following'] as const;
const FIELD_VISIBILITY = ['public', 'members', 'private'] as const;

class PageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// --- Communautés ---------------------------------------------------------------

export class CommunitiesQueryDto extends PageDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsIn(CONTENT_LANGUAGES)
  language?: string;

  @IsOptional()
  @IsIn(['all', 'joined', 'featured'])
  scope?: string;
}

export class JoinCommunityDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class MembershipDecisionDto {
  @IsIn(['approve', 'reject'])
  decision: 'approve' | 'reject';
}

export class InviteMemberDto {
  /** @identifiant ou e-mail exact du membre à inviter. */
  @IsString()
  @Length(2, 160)
  member: string;
}

export class MemberActionDto {
  @IsIn(['remove', 'ban', 'unban', 'promote', 'demote'])
  action: 'remove' | 'ban' | 'unban' | 'promote' | 'demote';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class CommunityMembersQueryDto extends PageDto {
  @IsOptional()
  @IsIn(['active', 'pending', 'invited', 'banned'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

// --- Publications ----------------------------------------------------------------

export class FeedQueryDto extends PageDto {
  @IsOptional()
  @IsIn(FEED_FILTERS)
  filter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** slug de la communauté */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  community?: string;

  @IsOptional()
  @IsIn(['post', 'question'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsIn(CONTENT_LANGUAGES)
  language?: string;

  @IsOptional()
  @IsIn(['open', 'answered', 'closed'])
  questionStatus?: string;

  /** @identifiant de l'auteur (publications d'un profil) */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  author?: string;

  /** Publications créées à partir de cette date (AAAA-MM-JJ). */
  @IsOptional()
  @IsDateString()
  from?: string;
}

export class CreatePostDto {
  @IsIn(['post', 'question'], { message: 'Type de contenu invalide.' })
  type: 'post' | 'question';

  @ValidateIf((dto: CreatePostDto) => dto.type === 'question' || !!dto.title)
  @IsString()
  @Length(8, 200, { message: 'Le titre doit contenir entre 8 et 200 caractères.' })
  title?: string;

  @IsString()
  @Length(5, 5000, { message: 'Le texte doit contenir entre 5 et 5000 caractères.' })
  content: string;

  /** id de la communauté (absent = fil général QIAO Community) */
  @IsOptional()
  @IsUUID('4', { message: 'Communauté invalide.' })
  communityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  professionalCategory?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: '5 tags maximum.' })
  @IsString({ each: true })
  @Length(2, 30, { each: true, message: 'Chaque tag doit contenir entre 2 et 30 caractères.' })
  tags?: string[];

  @IsOptional()
  @IsIn(CONTENT_LANGUAGES)
  language?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4, { message: '4 pièces jointes maximum.' })
  @IsUUID('4', { each: true })
  attachmentIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: '3 liens maximum.' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true, message: 'Lien invalide (http:// ou https:// requis).' })
  links?: string[];

  /** Enregistrer comme brouillon (visible uniquement par l'auteur). */
  @IsOptional()
  @IsBoolean()
  draft?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @Length(8, 200, { message: 'Le titre doit contenir entre 8 et 200 caractères.' })
  title?: string;

  @IsOptional()
  @IsString()
  @Length(5, 5000, { message: 'Le texte doit contenir entre 5 et 5000 caractères.' })
  content?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @Length(2, 30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  professionalCategory?: string;

  @IsOptional()
  @IsIn(CONTENT_LANGUAGES)
  language?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsUUID('4', { each: true })
  attachmentIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true, message: 'Lien invalide.' })
  links?: string[];

  /** Publier un brouillon. */
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class QuestionStatusDto {
  @IsIn(['open', 'answered', 'closed'])
  status: 'open' | 'answered' | 'closed';

  /** Réponse acceptée (statut « answered » uniquement). */
  @IsOptional()
  @IsUUID()
  acceptedCommentId?: string;
}

export class CreateCommentDto {
  @IsString()
  @Length(1, 2000, { message: 'Votre commentaire est vide ou trop long (2000 caractères maximum).' })
  text: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @Length(1, 2000, { message: 'Votre commentaire est vide ou trop long.' })
  text: string;
}

// --- Profils -------------------------------------------------------------------------

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsIn(CONTENT_LANGUAGES, { each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  sectors?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(2, 40, { each: true })
  interests?: string[];

  @IsOptional()
  @ValidateIf((dto: UpdateMemberProfileDto) => !!dto.avatarUrl)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: "L'adresse de la photo doit commencer par https://." })
  @MaxLength(300)
  avatarUrl?: string;

  @IsOptional()
  @Matches(/^[a-z0-9][a-z0-9-]{2,39}$/, { message: "L'identifiant doit contenir 3 à 40 caractères : lettres minuscules, chiffres et tirets." })
  handle?: string;
}

export class PrivacyDto {
  @IsOptional()
  @IsIn(['public', 'members'])
  profile?: 'public' | 'members';

  @IsOptional() @IsIn(FIELD_VISIBILITY) company?: 'public' | 'members' | 'private';
  @IsOptional() @IsIn(FIELD_VISIBILITY) location?: 'public' | 'members' | 'private';
  @IsOptional() @IsIn(FIELD_VISIBILITY) bio?: 'public' | 'members' | 'private';
  @IsOptional() @IsIn(FIELD_VISIBILITY) languages?: 'public' | 'members' | 'private';
  @IsOptional() @IsIn(FIELD_VISIBILITY) communities?: 'public' | 'members' | 'private';
  @IsOptional() @IsIn(FIELD_VISIBILITY) activity?: 'public' | 'members' | 'private';
  @IsOptional() @IsIn(FIELD_VISIBILITY) email?: 'public' | 'members' | 'private';

  @IsOptional()
  @IsIn(['everyone', 'connections', 'nobody'])
  messages?: 'everyone' | 'connections' | 'nobody';
}

export class NotificationPrefsDto {
  @IsObject()
  prefs: Record<string, boolean>;
}

export class ExpertProfileDto {
  @IsString()
  @Length(5, 160, { message: 'Le titre professionnel doit contenir entre 5 et 160 caractères.' })
  headline: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  biography?: string;

  @IsArray()
  @ArrayMaxSize(4, { message: '4 catégories professionnelles maximum.' })
  @IsString({ each: true })
  categories: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  countriesServed?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsIn(CONTENT_LANGUAGES, { each: true })
  languages?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience?: number;

  @IsOptional()
  @IsBoolean()
  listed?: boolean;
}

export class VerificationRequestDto {
  @IsString()
  @Length(20, 2000, { message: 'Décrivez vos justificatifs (numéro d’inscription au barreau, diplôme, références...) en 20 caractères minimum.' })
  evidence: string;
}

export class ExpertsQueryDto extends PageDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsString() @MaxLength(40) category?: string;
  @IsOptional() @IsString() @MaxLength(60) country?: string;
  @IsOptional() @IsIn(CONTENT_LANGUAGES) language?: string;
  @IsOptional() @IsString() @MaxLength(100) company?: string;
  @IsOptional() @IsIn(['verified', 'all']) verification?: string;
  /** slug d'une communauté */
  @IsOptional() @IsString() @MaxLength(80) community?: string;
}

export class MembersQueryDto extends PageDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsString() @MaxLength(60) country?: string;
  @IsOptional() @IsIn(CONTENT_LANGUAGES) language?: string;
  @IsOptional() @IsString() @MaxLength(40) sector?: string;
}

// --- Messagerie ------------------------------------------------------------------------

export class StartConversationDto {
  @IsUUID('4', { message: 'Destinataire invalide.' })
  recipientId: string;

  @IsString()
  @Length(1, 4000, { message: 'Votre message est vide ou trop long (4000 caractères maximum).' })
  body: string;

  /** Publication (question) ou profil à l'origine de la prise de contact. */
  @IsOptional()
  @IsIn(['post', 'profile'])
  contextType?: 'post' | 'profile';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contextId?: string;
}

export class SendMessageDto {
  @IsString()
  @Length(1, 4000, { message: 'Votre message est vide ou trop long (4000 caractères maximum).' })
  body: string;
}

// --- Modération -----------------------------------------------------------------------

export class CreateReportDto {
  @IsIn(['post', 'comment', 'user', 'message', 'community'])
  targetType: 'post' | 'comment' | 'user' | 'message' | 'community';

  @IsUUID('4', { message: 'Élément signalé invalide.' })
  targetId: string;

  @IsIn([...REPORT_REASONS], { message: 'Motif de signalement invalide.' })
  reason: (typeof REPORT_REASONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class ReportsQueryDto extends PageDto {
  @IsOptional()
  @IsIn(['open', 'new', 'under_review', 'action_taken', 'rejected', 'closed', 'all'])
  status?: string;

  @IsOptional()
  @IsIn(['post', 'comment', 'user', 'message', 'community'])
  targetType?: string;
}

export const MODERATION_ACTIONS = ['dismiss', 'review', 'hide', 'remove', 'restore', 'warn', 'ban', 'suspend', 'lock', 'unlock', 'escalate', 'close'] as const;

export class ResolveReportDto {
  @IsIn([...MODERATION_ACTIONS], { message: 'Action de modération invalide.' })
  action: (typeof MODERATION_ACTIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string;

  /** Durée de suspension du compte, en jours (action « suspend », administrateurs). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  suspensionDays?: number;
}

export class ModerateContentDto {
  @IsIn(['post', 'comment'])
  targetType: 'post' | 'comment';

  @IsUUID()
  targetId: string;

  @IsIn(['hide', 'remove', 'restore', 'lock', 'unlock'])
  action: 'hide' | 'remove' | 'restore' | 'lock' | 'unlock';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// --- Administration --------------------------------------------------------------------

export class CommunityAdminDto {
  @IsString()
  @Length(3, 120)
  name: string;

  @IsOptional()
  @Matches(/^[a-z0-9][a-z0-9-]{1,78}$/, { message: "L'adresse (slug) doit contenir des lettres minuscules, chiffres et tirets." })
  slug?: string;

  @IsString()
  @Length(10, 2000, { message: 'La description doit contenir entre 10 et 2000 caractères.' })
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  rules?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  categoryId?: string;

  @IsOptional()
  @ValidateIf((dto: CommunityAdminDto) => !!dto.coverImage)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: "L'image de couverture doit être une adresse https://." })
  coverImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;

  @IsArray()
  @ArrayMaxSize(5)
  @IsIn(CONTENT_LANGUAGES, { each: true })
  languages: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  scope?: string;

  @IsIn(['public', 'restricted', 'private'])
  visibility: 'public' | 'restricted' | 'private';

  @IsIn(['open', 'approval', 'invite'])
  membershipPolicy: 'open' | 'approval' | 'invite';

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

export class CategoryDto {
  @Matches(/^[a-z0-9][a-z0-9-]{1,38}$/, { message: 'Identifiant invalide (lettres minuscules, chiffres, tirets).' })
  id: string;

  @IsString()
  @Length(2, 80)
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AssignModeratorDto {
  @IsUUID()
  userId: string;
}

export class AdminMembersQueryDto extends PageDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsIn(['active', 'suspended']) status?: string;
  @IsOptional() @IsIn(['user', 'admin']) role?: string;
  @IsOptional() @IsIn(['none', 'pending', 'verified', 'rejected']) verification?: string;
}

export class AccountStatusDto {
  @IsIn(['active', 'suspended'])
  status: 'active' | 'suspended';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class RoleDto {
  @IsIn(['user', 'admin'])
  role: 'user' | 'admin';
}

export class VerificationDecisionDto {
  @IsIn(['verified', 'rejected', 'none'])
  decision: 'verified' | 'rejected' | 'none';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AuditQueryDto extends PageDto {
  @IsOptional() @IsString() @MaxLength(60) action?: string;
  @IsOptional() @IsString() @MaxLength(20) targetType?: string;
}

export class SearchQueryDto extends PageDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(['all', 'communities', 'posts', 'questions', 'members', 'experts'])
  type?: string;

  @IsOptional() @IsString() @MaxLength(80) community?: string;
  @IsOptional() @IsString() @MaxLength(40) category?: string;
  @IsOptional() @IsString() @MaxLength(60) country?: string;
  @IsOptional() @IsIn(CONTENT_LANGUAGES) language?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsIn(['open', 'answered', 'closed']) questionStatus?: string;
}

export class CreateMatchRequestDto {
  @IsString()
  @Length(3, 120)
  profileType: string;

  @IsString()
  @Length(10, 2000, { message: 'Décrivez votre projet en quelques phrases (10 caractères minimum).' })
  description: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email?: string;
}
